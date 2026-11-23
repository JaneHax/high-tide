// main.js — High Tide entry: wires every system, runs the loop, debug API.
import * as THREE from 'three';
import { CFG } from './config.js';
import { clamp, el, show } from './util.js';
import { buildCity } from './city.js';
import { createPlayer, updatePlayer, updateCamera } from './player.js';
import { createInput } from './input.js';
import { createVehicles, updateVehicles, tryEnterCar, exitCar } from './vehicles.js';
import { createBoats, updateBoats, tryBoardBoat, leaveBoat, startBoatRace } from './boats.js';
import { createPolice, updatePolice } from './police.js';
import { createHeli, updateHeli } from './heli.js';
import { createCombat, updateCombat } from './combat.js';
import { createMissions, updateMissions, startJob, clearJob, jobState } from './missions.js';
import { createGarage, updateGarage, storeCar, retrieveCar } from './garage.js';
import { createCollectibles, updateCollectibles } from './collect.js';
import { createPeds, updatePeds } from './peds.js';
import { createHUD, updateHUD, toast, setPrompt, renderJobPanel, setHold } from './hud.js';
import * as save from './save.js';
import { createBridge, updateBridge } from './bridge.js';
import { updateRadio, districtAt } from './radio.js';
import * as guide from './guide.js';
import * as atlas from './atlas.js';
import { createPolish, updatePolish, beep } from './polish.js';

const S = {
  started: false, paused: false, time: 0, cash: CFG.start.cash, rep: 0, repLevel: 0,
  stars: 0, heat: 0, health: CFG.start.health, lastCrime: -99, lastShot: -99,
  inCar: null, inBoat: null, job: null, jobsDone: {}, packages: [false, false, false, false, false],
  garage: { stored: null, bestRace: null }, weapons: { cur: 'pistol', owned: { pistol: true }, ammo: { pistol: 48 } },
  districts: { visited: new Set(), standing: {} }, district: 'Downtown', station: '',
  bridge: 'open', storm: 0, stormLevel: 0, atlas: {}, stats: {}, errors: [], camFix: null, guideOpen: false, atlasOpen: false,
};

const sys = { S };
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
el('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(CFG.sun.sky);
scene.fog = new THREE.Fog(CFG.sun.fog, 120, 420);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 900);
camera.position.set(0, 6, 60);
const sun = new THREE.DirectionalLight(CFG.sun.color, CFG.sun.intensity);
sun.position.set(...CFG.sun.pos); scene.add(sun);
const hemi = new THREE.HemisphereLight(0xffd9a0, 0x3a4a5a, 0.9); scene.add(hemi);
Object.assign(sys, { renderer, scene, camera, sun, hemi });

sys.city = buildCity(scene);
S.city = sys.city;
sys.player = createPlayer(scene, S);
S.player = sys.player;
sys.input = createInput(renderer.domElement);
sys.vehicles = createVehicles(scene, S);
sys.boats = createBoats(scene, S);
sys.police = createPolice(scene, S);
sys.heli = createHeli(scene, S);
sys.combat = createCombat(scene, S);
sys.missions = createMissions(scene, S);
sys.garage = createGarage(scene, S);
sys.collect = createCollectibles(scene, S);
sys.peds = createPeds(scene, S);
sys.bridge = createBridge(scene, S);
sys.polish = createPolish(scene, S);
sys.hud = { toast, updateHUD, renderJobPanel, setHold };
sys.save = save;
sys.guide = guide;
sys.atlas = atlas;
sys.radio = { districtAt };
createHUD(S, sys);

// Load the save, then apply it to the live state.
const saved = save.loadSave();
if (saved) { save.applySave(S, saved); sys.player.group.position.copy(S.player.pos); toast('Save loaded — welcome back to Puerto Sol'); }

function startGame() {
  if (S.started) { S.paused = false; show(el('start'), false); return; }
  S.started = true; S.paused = false;
  show(el('start'), false); show(el('hud'), true);
  toast('Puerto Sol, golden hour. Sombra is waiting — open the job panel.');
  beep(440, 0.12);
}
addEventListener('keydown', (e) => {
  if (e.code === 'Enter' && (!S.started || S.paused)) startGame();
  if (e.code === 'KeyP' && S.started) { S.paused = !S.paused; show(el('start'), S.paused); }
  if (e.code === 'KeyG' && S.started) guide.toggleGuide(S, sys);
  if (e.code === 'KeyH' && S.started) atlas.toggleAtlas(S, sys);
});
el('start').addEventListener('click', startGame);
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
addEventListener('error', (e) => { S.errors.push(String(e.message || e.error)); });

function contextPrompt() {
  const P = S.player.pos, inp = sys.input;
  if (!S.started || S.paused) return '';
  if (S.inCar) {
    const lot = sys.city.garageLot;
    if (Math.hypot(S.inCar.pos.x - lot[0], S.inCar.pos.z - lot[1]) < 12) return 'E — Store this car in the garage';
    return 'F — Leave the car';
  }
  if (S.inBoat) {
    const bp = sys.city.boatPost;
    if (!sys.boats.race && Math.hypot(S.inBoat.pos.x - bp[0], S.inBoat.pos.z - bp[1]) < 10) return 'E — Start the boat race ($1,000, 90s)';
    return 'F — Step off the boat';
  }
  const near = (x, z, r) => Math.hypot(P.x - x, P.z - z) < r;
  if (near(...sys.city.garageLot, 8) && S.garage.stored) return 'E — Get your car out of the garage';
  for (const p of sys.garage.posts) if (near(p.x, p.z, 4) && !sys.garage.race) return 'E — Start street race ($800, 60s)';
  if (S.job && S.job.kind === 'robbery' && near(...sys.city.shop, 4)) return 'HOLD E — Rob the till';
  if (S.job) return '';
  for (const car of sys.vehicles.cars) if (!car.driver && near(car.pos.x, car.pos.z, 4)) return 'F — Take the car';
  for (const b of sys.boats.boats) if (!b.driver && near(b.pos.x, b.pos.z, 4)) return 'F — Board the boat';
  return '';
}

function handleKeys(dt) {
  const inp = sys.input;
  if (inp.pressed('KeyF')) {
    if (S.inCar) exitCar(S, sys);
    else if (S.inBoat) leaveBoat(S, sys);
    else if (!tryEnterCar(S, sys)) tryBoardBoat(S, sys);
  }
  // E: only consume the edge when a context action applies here, so the
  // missions and garage updates still see the press otherwise.
  const lot = sys.city.garageLot;
  const eCtx = S.inCar
    ? Math.hypot(S.inCar.pos.x - lot[0], S.inCar.pos.z - lot[1]) < 12
    : S.inBoat
      ? Math.hypot(S.inBoat.pos.x - sys.city.boatPost[0], S.inBoat.pos.z - sys.city.boatPost[1]) < 10
      : Math.hypot(S.player.pos.x - lot[0], S.player.pos.z - lot[1]) < 8 && !!S.garage.stored;
  if (eCtx && inp.pressed('KeyE')) {
    if (S.inCar) storeCar(S, sys);
    else if (S.inBoat) startBoatRace(S, sys);
    else retrieveCar(S, sys);
  }
}

const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (S.started && !S.paused) {
    S.time += dt;
    handleKeys(dt);
    updatePlayer(dt, S, sys);
    updateVehicles(dt, S, sys);
    updateBoats(dt, S, sys);
    updatePolice(dt, S, sys);
    updateHeli(dt, S, sys);
    updateCombat(dt, S, sys);
    updateMissions(dt, S, sys);
    updateGarage(dt, S, sys);
    updateCollectibles(dt, S, sys);
    updatePeds(dt, S, sys);
    updateBridge(dt, S, sys);
    updateRadio(S, sys);
    updatePolish(dt, S, sys);
    updateCamera(dt, S, sys);
    setPrompt(contextPrompt());
    updateHUD(dt, S, sys);
  }
  sys.input.endFrame();
  renderer.render(scene, camera);
}
loop();

// Debug + staging API for the headless play-test and screenshots.
window.__ht = {
  S, sys, ready: true,
  debug: {
    state: () => ({
      cash: S.cash, rep: S.rep, repLevel: S.repLevel, stars: S.stars, heat: Math.round(S.heat), health: S.health,
      job: S.job ? { id: S.job.id, kind: S.job.kind, step: S.job.step, t: Math.round(S.job.t || 0) } : null,
      jobsDone: Object.keys(S.jobsDone), packages: S.packages.filter(Boolean).length,
      inCar: !!S.inCar, inBoat: !!S.inBoat, heli: sys.heli.active,
      roadblock: !!sys.police.roadblock, officers: sys.police.officers.length, cruisers: sys.police.cruisers.length,
      district: S.district, bridge: S.bridge, storm: +S.storm.toFixed(2),
      pos: [+S.player.pos.x.toFixed(1), +S.player.pos.z.toFixed(1)],
      errors: S.errors, started: S.started,
    }),
    start: () => startGame(),
    teleport: (x, z) => { S.player.pos.set(x, 0, z); S.player.group.position.copy(S.player.pos); if (S.inCar) { S.inCar.pos.set(x, 0, z); S.inCar.mesh.position.copy(S.inCar.pos); } },
    setStars: (n) => { S.heat = [0, 8, 25, 45, 65, 85][n] || 0; S.stars = n; S.lastCrime = S.time; },
    setCash: (n) => { S.cash = n; },
    setRep: (n) => { S.rep = n; },
    setHealth: (n) => { S.health = n; },
    setStorm: (v) => { S.storm = v; sys.polish.target = v; },
    setBridge: (s) => { S.bridge = s; sys.bridge.state = s; },
    startJob: (id) => startJob(S, sys, id),
    startBoatRace: () => startBoatRace(S, sys),
    jobStates: () => CFG.jobs.map((j) => ({ id: j.id, state: jobState(S, j) })),
    giveAmmo: () => { for (const id in S.weapons.ammo) S.weapons.ammo[id] = 999; },
    scene: (name) => {
      S.camFix = null; S.debugFreeze = false; S.heliY = 0;
      const H = sys.heli;
      if (name === 'cover') {
        clearJob(S, sys); startJob(S, sys, 'drop'); S.player.pos.set(40, 0, -195); S.player.group.position.copy(S.player.pos);
        window.__ht.debug.setStars(3);
        H.angle = -1.19; S.debugFreeze = true;
        S.camFix = { pos: [10, 22, -230], look: [40, 4, -150] };
        sys.heli.angle = 1.21;
      } else if (name === 'street') {
        window.__ht.debug.startJob('store');
        S.player.pos.set(-40, 0, 74); S.player.group.position.copy(S.player.pos);
        S.player.camYaw = Math.PI;
        if (S.job) S.job.holdT = 1.5;
        const car = sys.vehicles.cars[0];
        car.pos.set(-28, 0, 92); car.mesh.position.copy(car.pos); car.mesh.rotation.y = 0.5;
        S.camFix = { pos: [-34, 6, 44], look: [-40, 2, 80] };
      } else if (name === 'drive') {
        window.__ht.debug.startJob('sprint');
        const car = sys.vehicles.cars.find((c) => c.parked) || sys.vehicles.cars[0];
        car.parked = false; car.driver = 'player'; S.inCar = car;
        car.pos.set(-40, 0, -20); car.yaw = Math.atan2(-40, -20); car.speed = 18;
        car.mesh.position.copy(car.pos); car.mesh.rotation.y = car.yaw;
        S.player.group.visible = false;
        S.camFix = { pos: [-32, 4, -18], look: [-75, 1, -38] };
      } else if (name === 'chase') {
        const car = sys.vehicles.cars.find((c) => c.parked) || sys.vehicles.cars[0];
        car.parked = false; car.driver = 'player'; S.inCar = car;
        car.pos.set(0, 0, 60); car.yaw = 0; car.speed = 16;
        car.mesh.position.copy(car.pos); car.mesh.rotation.y = 0;
        S.player.group.visible = false;
        S.player.camYaw = 0;
        window.__ht.debug.setStars(5);
        H.angle = Math.PI / 2; S.debugFreeze = true; S.heliY = 20;
        S.camFix = { pos: [-8, 12, 36], look: [0, 2, 85] };
      }
      return true;
    },
    errors: () => S.errors,
    save: () => save.saveGame(S),
  },
};
