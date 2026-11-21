// High Tide — the entry module. Builds the renderer, the golden-hour
// light, and every system, then runs the frame loop and wires the
// controls together: F takes a car or a boat, E does what the prompt
// says, Enter starts and resumes, and the number keys switch weapons.
import * as THREE from 'three';
import { SUN, WORLD, SAVE_KEY } from './config.js';
import { createCity } from './city.js';
import { createPlayer } from './player.js';
import { createVehicles } from './vehicles.js';
import { createPolice } from './police.js';
import { createAir } from './air.js';
import { createCombat } from './combat.js';
import { createMissions } from './missions.js';
import { createGarage } from './garage.js';
import { createBoats } from './boats.js';
import { createPeds } from './peds.js';
import { createHud } from './hud.js';
import { createInput } from './input.js';
import { createLifecycle } from './lifecycle.js';
import { createCamera } from './camera.js';

const params = new URLSearchParams(location.search);
const MANUAL = params.has('manual');
const FRESH = params.has('fresh');
if (FRESH) {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* no storage */ }
}

const canvas = document.getElementById('game');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (err) {
  document.getElementById('overlay-text').textContent = 'WebGL is not available in this browser.';
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(SUN.skyLow);
scene.fog = new THREE.Fog(SUN.fog, 190, 720);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1200);

const hemi = new THREE.HemisphereLight(SUN.skyTop, 0x8a6f4d, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(SUN.color, SUN.intensity);
const sunDir = new THREE.Vector3(
  Math.cos(SUN.azimuth) * Math.cos(SUN.elevation),
  Math.sin(SUN.elevation),
  Math.sin(SUN.azimuth) * Math.cos(SUN.elevation),
);
sun.position.copy(sunDir).multiplyScalar(320);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -230;
sun.shadow.camera.right = 230;
sun.shadow.camera.top = 230;
sun.shadow.camera.bottom = -230;
sun.shadow.camera.far = 800;
sun.shadow.bias = -0.0006;
scene.add(sun);
scene.add(sun.target);

const input = createInput(canvas);
const city = createCity(scene);
const player = createPlayer(scene, city);
const vehicles = createVehicles(scene, city, player);
const police = createPolice(scene, city, player);
const air = createAir(scene, player);
const peds = createPeds(scene, city);
const combat = createCombat(scene, camera, player, police, peds);
const boats = createBoats(scene, city, player);
const hud = createHud(document, city);
const lifecycle = createLifecycle(document);
const cam = createCamera(camera);

const missions = createMissions({ scene, city, player, vehicles, police, boats, hud, garage: null });
const garage = createGarage(scene, city, player, vehicles, missions);

// A saved game restores cash, reputation, the stored car and race times.
const save = garage.loadSave();
if (save) garage.applySave(save);
if (!save) missions.start();

const game = {
  scene, camera, renderer, city, player, vehicles, police, air,
  combat, missions, garage, boats, peds, hud, input, lifecycle, cam,
  prompt: '',
};
game.helpers = {
  teleport(x, z) {
    const c = vehicles.drivenCar;
    if (c) {
      c.x = x; c.z = z;
      c.mesh.position.set(x, city.surfaceAt(x, z), z);
    }
    player.teleport(x, z);
    cam.snap(player.state.position);
  },
  setRep(n) {
    missions.state.rep = n;
    missions.addRep(0);
  },
  setStars(n) { police.setStars(n); },
  spawnCar() { return vehicles.spawnNearPlayer(); },
  jumpTo(i) { missions.jumpTo(i); },
  startGame() { lifecycle.start(); },
};
window.__tide = game;

function computePrompt() {
  const g = garage.prompt();
  if (g) return g;
  if (!vehicles.drivenCar && !boats.boarded) {
    if (boats.nearestBoat(4.5)) return 'Board the boat';
    if (vehicles.nearestParked(3.5)) return 'Take the car';
  }
  const job = missions.current;
  if (job && job.type === 'rob' && missions.state.active) {
    const s = city.shops[0];
    const p = player.state.position;
    if (Math.hypot(p.x - s.x, p.z - s.z) < 7) {
      return missions.state.robHold > 0
        ? `Robbing… ${missions.state.robHold.toFixed(1)}s / 3s`
        : 'Hold E to rob the shop';
    }
  }
  if (job && job.type === 'race' && missions.state.active && !vehicles.drivenCar) {
    return 'Golden Mile needs a car. Take one with F.';
  }
  return '';
}

function stepF() {
  if (boats.boarded) { boats.leave(); return; }
  if (vehicles.drivenCar) { vehicles.exitCar(); return; }
  if (boats.board()) return;
  vehicles.enterCar();
}

function stepE() {
  const g = garage.prompt();
  if (!g) return;
  if (g === 'Store car in garage') { garage.storeCar(); hud.toast('Car stored in the garage.'); return; }
  if (g === 'Retrieve stored car') { garage.retrieveCar(); hud.toast('Car retrieved from the garage.'); return; }
  if (g === 'Start street race') {
    if (garage.startRace()) hud.toast('Street race! Three checkpoints, sixty seconds.');
  }
}

const clock = new THREE.Clock();
let booted = false;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  lifecycle.update(input, missions.state.done);
  if (lifecycle.playing) {
    const driving = !!vehicles.drivenCar;
    const boating = !!boats.boarded;
    player.update(dt, input, cam.yaw, driving, boating);
    vehicles.update(dt, input);
    boats.update(dt, input);
    if (input.wasPressed('KeyF')) stepF();
    if (input.wasPressed('KeyE')) stepE();
    combat.update(dt, input, missions.state.level);
    missions.update(dt, input);
    garage.update(dt);
    const spotter = air.active && police.stars >= 4;
    police.update(dt, spotter);
    air.update(dt, police.stars);
    peds.update(dt, player.state.position, police.stars, combat.lastShotAt);
    game.prompt = computePrompt();
    const follow = player.state.position;
    cam.setDistance(driving ? 14 : boating ? 16 : 11);
    cam.update(dt, input, follow, 2.2);
    hud.update(dt, game);
    if (!booted) {
      booted = true;
      window.__tide.booted = true;
      window.__tide.triangles = () => renderer.info.render.triangles;
    }
  } else {
    cam.update(dt, input, player.state.position, 2.2);
  }
  renderer.render(scene, camera);
  input.endFrame();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

lifecycle.showMenu();
if (MANUAL) lifecycle.start();
cam.snap(player.state.position);
frame();
