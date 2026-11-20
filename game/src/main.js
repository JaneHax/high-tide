// HIGH TIDE's frame: the renderer, the sun and the sky, the build order the modules need, and the
// fixed-step loop that decides whether the other nine behave like a game. Every listener in the game
// is added here, because input.js is the one module allowed to read the keyboard and the mouse;
// everything else is told what happened by a callback registered below.

import * as THREE from 'three';
import { CAMERA, PALETTE, POLICE, WORLD } from './config.js';
import { buildPuertoSol } from './city.js';
import { createInput } from './input.js';
import { createPlayer } from './player.js';
import { createChaseCamera, createFollowCamera } from './camera.js';
import { createVehicles } from './vehicles.js';
import { createPeds } from './peds.js';
import { createCombat } from './combat.js';
import { createPolice } from './police.js';
import { createMissions } from './missions.js';
import { createHud } from './hud.js';
import { createLifecycle } from './lifecycle.js';

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && params.get('seed') !== null ? seedParam : 1;
const manual = params.get('manual') === '1';
const fresh = params.get('fresh') === '1';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(PALETTE.fog, WORLD.fog.near, WORLD.fog.far);
scene.background = new THREE.Color(PALETTE.fog);

const camera = new THREE.PerspectiveCamera(
  CAMERA.fov,
  window.innerWidth / window.innerHeight,
  CAMERA.near,
  CAMERA.far,
);

// The sun's direction is a unit vector toward it, so the light, the sky's disc and the shadow camera
// all agree about where the last of the light is coming from.
const sunDirection = new THREE.Vector3(
  Math.cos(WORLD.sunElevation) * Math.sin(WORLD.sunAzimuth),
  Math.sin(WORLD.sunElevation),
  Math.cos(WORLD.sunElevation) * Math.cos(WORLD.sunAzimuth),
).normalize();

const sun = new THREE.DirectionalLight(PALETTE.sun, WORLD.sunIntensity);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.06;
sun.shadow.camera.left = -WORLD.shadowExtent;
sun.shadow.camera.right = WORLD.shadowExtent;
sun.shadow.camera.top = WORLD.shadowExtent;
sun.shadow.camera.bottom = -WORLD.shadowExtent;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = WORLD.sunDistance + WORLD.shadowExtent * 2;
sun.shadow.camera.updateProjectionMatrix();
scene.add(sun);
scene.add(sun.target);

// The shadow camera's own axes, and one texel of its map, so the map can be moved in whole texels.
const lightRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), sunDirection).normalize();
const lightUp = new THREE.Vector3().crossVectors(sunDirection, lightRight).normalize();
const TEXEL = (WORLD.shadowExtent * 2) / 2048;
const focus = new THREE.Vector3();

function aimSun(at) {
  // Rounded to whole texels: a shadow camera that follows the player continuously slides every shadow
  // edge a fraction of a texel per frame, which reads as crawling along the street as he walks.
  const right = Math.round(at.dot(lightRight) / TEXEL) * TEXEL;
  const up = Math.round(at.dot(lightUp) / TEXEL) * TEXEL;
  focus
    .copy(lightRight)
    .multiplyScalar(right)
    .addScaledVector(lightUp, up)
    .addScaledVector(sunDirection, at.dot(sunDirection));
  sun.target.position.copy(focus);
  sun.position.copy(focus).addScaledVector(sunDirection, WORLD.sunDistance);
  sun.target.updateMatrixWorld();
}

// A dusk dome: warm at the horizon, cold overhead, with the sun's disc and its glow burned into the
// same gradient so the light in the sky is the light casting the shadows.
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(WORLD.fog.far + 60, 32, 20),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      skyWarm: { value: new THREE.Color(PALETTE.skyWarm) },
      skyCool: { value: new THREE.Color(PALETTE.skyCool) },
      sunColour: { value: new THREE.Color(PALETTE.sun) },
      sunDirection: { value: sunDirection.clone() },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 skyWarm;
      uniform vec3 skyCool;
      uniform vec3 sunColour;
      uniform vec3 sunDirection;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float height = clamp(d.y, -1.0, 1.0);
        vec3 colour = mix(skyWarm, skyCool, smoothstep(0.0, 0.6, height));
        colour = mix(colour, skyWarm * 0.55, smoothstep(0.0, -0.3, height));
        float sun = max(0.0, dot(d, normalize(sunDirection)));
        float disc = smoothstep(0.9976, 0.9993, sun);
        float glow = pow(sun, 60.0) * 0.6 + pow(sun, 8.0) * 0.14;
        gl_FragColor = vec4(colour + sunColour * (disc * 1.4 + glow), 1.0);
      }
    `,
  }),
);
sky.frustumCulled = false;
sky.renderOrder = -1;
scene.add(sky);

scene.add(new THREE.HemisphereLight(PALETTE.skyCool, PALETTE.wallTan, WORLD.ambient));

const city = buildPuertoSol(seed);
scene.add(city.group);

const spawnPoint = city.spawnPoints.find((point) => point.kind === 'player') ?? city.spawnPoints[0];
const player = createPlayer({ city, scene, spawn: spawnPoint });
const followCamera = createFollowCamera({ camera, player });
const chaseCamera = createChaseCamera({ camera, city });
const vehicles = createVehicles({ city, scene, seed, player });
const peds = createPeds({ city, scene, seed, player });
const combat = createCombat({ scene, player, camera, peds, city });
const police = createPolice({ city, scene, player, combat });

// missions needs a hud to toast through and the hud needs the missions it reads, so missions is given
// a stand-in that forwards to the real HUD once it exists: neither factory is built on a null.
let hud = null;
const hudBridge = {
  toast(text) {
    if (hud) hud.toast(text);
  },
};
const missions = createMissions({ city, scene, player, vehicles, police, hud: hudBridge });
hud = createHud({ missions, combat, police, vehicles, player });

const lifecycle = createLifecycle({ player, vehicles, police, combat, spawn: spawnPoint, followCamera });
const input = createInput(canvas);

input.onGesture(() => hud.unlockAudio());

// A crash is heard whenever the player's car is in one — vehicles only reports contacts it is part of.
vehicles.onHit(() => hud.sound('crash'));

// Traffic knocks people over on its own all day; only the car under the player's hands is his crime.
peds.onRunOver((ped, car) => {
  if (car && car === vehicles.drivenCar) police.addHeat(POLICE.heatKill);
});

// The officer's rounds are the player's resupply, and the spot he fell on is where the box lies.
police.onDrop((x, z) => combat.dropAmmo(x, z));

// The pistol is heard here rather than in the police module, which only counts what it costs.
combat.onFire(() => hud.sound('shot'));

const SAVE_KEY = `high-tide.save.v1.${seed}`;
let savedCash = 0;

function saveProgress() {
  const state = missions.state;
  const payload = {
    cash: state.cash,
    job: state.job,
    objective: state.objective,
    done: state.done,
    paid: state.paid,
  };
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    // A window with storage denied still plays; it just cannot remember the run.
  }
}

function loadProgress() {
  try {
    if (fresh) {
      window.localStorage.removeItem(SAVE_KEY);
      return null;
    }
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    return saved && typeof saved === 'object' ? saved : null;
  } catch {
    return null;
  }
}

const saved = loadProgress();
if (saved) {
  missions.state.cash = Number(saved.cash) || 0;
  missions.state.job = Math.min(missions.jobs.length - 1, Math.max(0, Math.round(Number(saved.job) || 0)));
  missions.state.objective = Math.max(0, Math.round(Number(saved.objective) || 0));
  missions.state.done = saved.done === true;
  missions.state.paid = saved.paid === true;
  savedCash = missions.state.cash;
}

const finished = Boolean(saved && saved.done === true);
// A run that has already paid the fifth job opens on the card that says so, and a harness that drives
// the loop by hand opens on the game itself: there is nobody there to click a title card away.
hud.mode = finished ? 'complete' : manual ? 'play' : 'title';
if (hud.mode === 'play') missions.start();

// What a frozen player's input looks like: the dead slice still runs the city, the traffic and the
// sea, but nobody in it is driving, walking or shooting.
const FROZEN = {
  isDown: () => false,
  wasPressed: () => false,
  mouse: { left: false, dx: 0, dy: 0 },
  yawDelta: 0,
  requestLock() {},
  endFrame() {},
  onGesture() {},
};

let triggerHeld = false;
let settle = 0;

function begin() {
  if (hud.mode !== 'title') return;
  hud.mode = 'play';
  // The click that begins the game is also a press of the trigger, and it must not be the first shot.
  triggerHeld = true;
  input.requestLock();
  missions.start();
}

function pause() {
  if (hud.mode !== 'play' && hud.mode !== 'dead') return;
  saveProgress();
  hud.mode = 'paused';
  // The Escape that paused the game also released the pointer, and input reports that release as a
  // second Escape; without a settle the game would resume on the press that paused it.
  settle = 0.3;
}

function resume() {
  if (hud.mode !== 'paused') return;
  hud.mode = lifecycle.wasDead ? 'dead' : 'play';
  triggerHeld = true;
  input.requestLock();
}

function step(dt = WORLD.step) {
  if (!(dt > 0)) return;
  // In a hand-driven run the harness's step is the frame, so the HUD is given the same clock.
  if (manual) frameDt = dt;
  if (hud.mode === 'paused' || hud.mode === 'title' || hud.mode === 'complete') {
    if (manual) input.endFrame();
    return;
  }

  lifecycle.update(dt);
  hud.mode = lifecycle.wasDead ? 'dead' : 'play';

  const live = lifecycle.wasDead ? FROZEN : input;
  const health = combat.state.health;
  const rounds = police.shots;

  if (live === input) {
    // A press counts once, and a paused game never reaches here, so neither key can fire twice.
    if (input.wasPressed('KeyR')) combat.reload();
    if (input.wasPressed('KeyF')) {
      if (vehicles.drivenCar) {
        vehicles.exit();
        followCamera.snap(player);
      } else {
        const car = vehicles.enter();
        if (car) {
          // Taking a stranger's car is a crime, and only this file can charge it: police is given no
          // handle on vehicles.
          police.addHeat(POLICE.heatCrime);
          chaseCamera.reset(car);
        }
      }
    }
    if (input.mouse.left && !triggerHeld) combat.shoot();
    if (!input.mouse.left) triggerHeld = false;
  }

  if (vehicles.drivenCar) chaseCamera.update(dt, live, vehicles.drivenCar);
  else followCamera.update(dt, live, player);

  player.update(dt, live, followCamera.yaw);
  vehicles.update(dt, live, player.state !== 'driving');
  peds.update(dt, vehicles.traffic, police.cars);
  combat.update(dt);
  police.update(dt);
  missions.update(dt);
  city.tick(dt);
  aimSun(player.position);

  // The HUD is told what it cannot see for itself.
  if (combat.state.health < health) hud.sound('hit');
  if (police.shots > rounds) hud.sound('shot');

  // A job is paid inside missions.next, so the run is written the step the cash moves rather than at
  // the next pause: a closed tab after a payout must not cost the player the job.
  if (missions.state.cash > savedCash) {
    savedCash = missions.state.cash;
    saveProgress();
  }
  if (missions.state.done && hud.mode === 'play') {
    hud.mode = 'complete';
    saveProgress();
  }

  if (manual) input.endFrame();
}

function render() {
  // The HUD is a view of the frame, not of each slice: one update per paint, so a harness that drives
  // step() and render() by hand sees the same panels a player does.
  hud.update(frameDt, { input, camera, renderer });
  aimSun(player.position);
  sky.position.copy(camera.position);
  renderer.render(scene, camera);
}

let accumulator = 0;
let frameDt = 0;
let last = performance.now();

function frame(now) {
  const dt = Math.max(0, (now - last) / 1000);
  last = now;
  frameDt = dt;
  settle = Math.max(0, settle - dt);

  if (settle <= 0 && input.wasPressed('Escape')) {
    if (hud.mode === 'play' || hud.mode === 'dead') pause();
    else if (hud.mode === 'paused') resume();
  }

  // A frame longer than a quarter second is a stall, not time the game owes: replaying it would try
  // to simulate a minute of city in one step after a tab has been asleep.
  if (dt <= 0.25) {
    accumulator += dt;
    let slices = 0;
    while (accumulator >= WORLD.step && slices < 8) {
      step(WORLD.step);
      accumulator -= WORLD.step;
      slices += 1;
    }
    if (slices === 8) accumulator = 0;
  } else {
    accumulator = 0;
  }

  render();
  input.endFrame();
  requestAnimationFrame(frame);
}

// The first click after a pause only takes the pointer back: resume() sets the trigger guard, so the
// press that resumes is never a shot.
window.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  if (hud.mode === 'title') begin();
  else if (hud.mode === 'paused') resume();
});

document.addEventListener('visibilitychange', () => {
  // A game that runs unseen kills a player who never saw the frame.
  if (document.hidden) pause();
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

aimSun(player.position);
render();
if (!manual) requestAnimationFrame(frame);

const game = {
  THREE,
  scene,
  renderer,
  camera,
  city,
  player,
  followCamera,
  chaseCamera,
  input,
  vehicles,
  peds,
  combat,
  police,
  missions,
  hud,
  step,
  render,
};

Object.defineProperties(game, {
  traffic: { get: () => vehicles.traffic, enumerable: true },
  drivenCar: { get: () => vehicles.drivenCar, enumerable: true },
  mode: { get: () => hud.mode, enumerable: true },
});

window.game = game;
