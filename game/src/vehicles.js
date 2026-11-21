// Cars: street traffic that loops the road grid, parked cars Rico can
// steal, and the car he is driving. Driving is simple arcade physics:
// accelerate, brake, steer, with a small speed bonus from reputation.
import * as THREE from 'three';
import { CAR, REP, PALETTE } from './config.js';
import { box, tube, place, groupAt } from './geometry.js';
import { makeRng, range, pick } from './random.js';

const CAR_COLORS = [0xc93c3c, 0x3c6ec9, 0xe0b93c, 0x4d9e6a, 0xd8d8d8, 0x2c2c34, 0x8a4dc9];

function buildCarMesh(color) {
  const car = new THREE.Group();
  const body = box(2.0, 0.75, 4.4, color);
  place(body, 0, 0.65, 0);
  car.add(body);
  const cabin = box(1.7, 0.65, 2.2, 0x1c2733);
  place(cabin, 0, 1.3, -0.2);
  car.add(cabin);
  const lightL = box(0.4, 0.2, 0.1, 0xfff2b0, { emissive: 0x554400 });
  place(lightL, -0.6, 0.7, 2.2);
  car.add(lightL);
  const lightR = box(0.4, 0.2, 0.1, 0xfff2b0, { emissive: 0x554400 });
  place(lightR, 0.6, 0.7, 2.2);
  car.add(lightR);
  for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const wheel = tube(0.42, 0.42, 0.3, 0x111111, {}, 10);
    wheel.rotation.z = Math.PI / 2;
    place(wheel, wx, 0.42, wz);
    car.add(wheel);
  }
  return car;
}

export function createVehicles(scene, city, player) {
  const rng = makeRng(777);
  const traffic = [];
  const parked = [];
  let driven = null;
  let boostLevel = 0;

  // Traffic: cars that loop one road, north-south or east-west.
  for (let i = 0; i < 12; i++) {
    const horizontal = rng() < 0.5;
    const road = pick(rng, horizontal ? city.roads.xRoads : city.roads.zRoads);
    const dir = rng() < 0.5 ? 1 : -1;
    const mesh = buildCarMesh(pick(rng, CAR_COLORS));
    scene.add(mesh);
    traffic.push({
      mesh, horizontal, road, dir,
      speed: range(rng, 8, 14),
      pos: range(rng, -180, 180),
      lane: dir > 0 ? 2.6 : -2.6,
    });
  }

  // Parked cars Rico can steal.
  for (const spawn of city.carSpawns) {
    const mesh = buildCarMesh(pick(rng, CAR_COLORS));
    place(mesh, spawn.x, 0, spawn.z, spawn.ry);
    scene.add(mesh);
    parked.push({ mesh, x: spawn.x, z: spawn.z, heading: spawn.ry, speed: 0, parked: true });
  }

  function nearestParked(maxDist) {
    const p = player.state.position;
    let best = null, bestD = maxDist;
    for (const c of parked) {
      if (!c.parked) continue;
      const d = Math.hypot(c.x - p.x, c.z - p.z);
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }

  function enterCar() {
    const c = nearestParked(CAR.enterRange);
    if (!c) return false;
    c.parked = false;
    driven = c;
    player.body.visible = false;
    return true;
  }

  function exitCar() {
    if (!driven) return;
    const p = player.state.position;
    p.set(driven.x + Math.sin(driven.heading + Math.PI / 2) * 2.2, city.surfaceAt(driven.x, driven.z), driven.z + Math.cos(driven.heading + Math.PI / 2) * 2.2);
    player.body.visible = true;
    driven.speed = 0;
    driven = null;
  }

  function setBoost(level) { boostLevel = level; }

  function topSpeed() {
    return CAR.maxSpeed * (1 + REP.speedBonus * boostLevel);
  }

  function update(dt, input) {
    // Traffic loops its road and wraps at the city edge.
    for (const t of traffic) {
      t.pos += t.dir * t.speed * dt;
      if (t.pos > 195) t.pos = -195;
      if (t.pos < -195) t.pos = 195;
      if (t.horizontal) {
        t.mesh.position.set(t.pos, 0, t.road + t.lane);
        t.mesh.rotation.y = t.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        t.mesh.position.set(t.road + t.lane, 0, t.pos);
        t.mesh.rotation.y = t.dir > 0 ? 0 : Math.PI;
      }
    }
    if (!driven) return;
    const axis = input.axis();
    const max = topSpeed();
    if (axis.y > 0) driven.speed = Math.min(max, driven.speed + CAR.accel * dt);
    else if (axis.y < 0) driven.speed = Math.max(-CAR.reverse, driven.speed - CAR.brake * dt);
    else driven.speed *= Math.max(0, 1 - dt * 1.4);
    if (Math.abs(driven.speed) > 0.4) {
      driven.heading += axis.x * CAR.turn * dt * Math.sign(driven.speed) * -1;
    }
    driven.x += Math.sin(driven.heading) * driven.speed * dt;
    driven.z += Math.cos(driven.heading) * driven.speed * dt;
    driven.x = Math.max(-196, Math.min(196, driven.x));
    driven.z = Math.max(-196, Math.min(205, driven.z));
    driven.mesh.position.set(driven.x, city.surfaceAt(driven.x, driven.z), driven.z);
    driven.mesh.rotation.y = driven.heading;
    const p = player.state.position;
    p.set(driven.x, driven.mesh.position.y, driven.z);
  }

  function spawnNearPlayer() {
    // A fresh car right beside Rico, for tests and for getting unstuck.
    const p = player.state.position;
    const mesh = buildCarMesh(pick(rng, CAR_COLORS));
    const x = p.x + 4, z = p.z + 2;
    place(mesh, x, 0, z, 0);
    scene.add(mesh);
    const c = { mesh, x, z, heading: 0, speed: 0, parked: true };
    parked.push(c);
    return c;
  }

  return {
    traffic, parked, update, enterCar, exitCar, setBoost, topSpeed, spawnNearPlayer,
    nearestParked,
    get drivenCar() { return driven; },
    get speedKmh() { return driven ? Math.abs(driven.speed) * 3.6 : 0; },
  };
}
