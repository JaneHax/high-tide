// vehicles.js — stealable cars, traffic, and driving.
import * as THREE from 'three';
import { box, mat } from './geom.js';
import { clamp, rnd, rndi, pick, dist2 } from './util.js';

const CAR_COLORS = [0xc23b2e, 0x2e6fc2, 0xe0b13c, 0x3f8a4a, 0x8a8a8a, 0xd8d8d8, 0x222222, 0x7a4a9a];

function makeCarMesh(color) {
  const g = new THREE.Group();
  box(g, 2, 0.55, 4.4, 0x181818, 0, 0.45, 0);
  box(g, 1.8, 0.6, 2.4, color, 0, 0.95, -0.2);
  box(g, 1.6, 0.5, 1.2, 0x223344, 0, 1.35, -0.3);
  box(g, 0.4, 0.4, 0.4, 0xffe9a8, -0.6, 0.7, 2.2, 0, { e: 0xffc860 });
  box(g, 0.4, 0.4, 0.4, 0xffe9a8, 0.6, 0.7, 2.2, 0, { e: 0xffc860 });
  const wgeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 10);
  const wm = mat(0x111111);
  for (const [x, z] of [[-0.95, 1.5], [0.95, 1.5], [-0.95, -1.5], [0.95, -1.5]]) {
    const w = new THREE.Mesh(wgeo, wm);
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.36, z); g.add(w);
  }
  return g;
}

export function createVehicles(scene, S) {
  const cars = [];
  const add = (x, z, color, parked) => {
    const mesh = makeCarMesh(color); mesh.position.set(x, 0, z); scene.add(mesh);
    const car = { mesh, pos: mesh.position, yaw: rnd(Math.PI * 2), speed: 0, color, parked, driver: null, route: null, routeI: 0, cargo: false };
    mesh.rotation.y = car.yaw; cars.push(car); return car;
  };
  // Parked cars along the roads.
  for (let i = 0; i < 14; i++) {
    const road = pick([-160, -120, -80, -40, 0, 40, 80, 120, 160]);
    const along = rnd(-150, 170);
    add(road + (Math.random() < 0.5 ? 5.5 : -5.5), along, pick(CAR_COLORS), true);
  }
  // Traffic cars on the grid.
  const traffic = [];
  for (let i = 0; i < 14; i++) {
    const c = add(pick([-160, -120, -80, -40, 0, 40, 80, 120, 160]), rnd(-120, 160), pick(CAR_COLORS), false);
    c.driver = 'traffic'; c.route = trafficRoute(); traffic.push(c);
  }
  return { cars, traffic };
}

function trafficRoute() {
  const pts = [];
  const xs = [-160, -120, -80, -40, 0, 40, 80, 120, 160];
  const zs = [-120, -80, -40, 0, 40, 80, 120, 160];
  let x = xs[rndi(0, 8)], z = zs[rndi(0, 8)];
  for (let i = 0; i < 6; i++) {
    if (i % 2 === 0) x = xs[rndi(0, 8)]; else z = zs[rndi(0, 8)];
    pts.push([x, z]);
  }
  return pts;
}

function nearestCar(S, sys, maxD) {
  let best = null, bd = maxD * maxD;
  for (const c of sys.vehicles.cars) {
    if (c.driver === 'traffic') continue;
    const d = dist2(S.player.pos.x, S.player.pos.z, c.pos.x, c.pos.z);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

export function tryEnterCar(S, sys) {
  const c = nearestCar(S, sys, 4);
  if (!c) return false;
  c.driver = 'player'; c.parked = false; S.inCar = c;
  sys.player.group.visible = false;
  sys.hud.toast('You took the ' + (c.cargo ? 'cargo car' : 'car') + ' — W/A/S/D to drive, F to leave');
  return true;
}

export function exitCar(S, sys) {
  const c = S.inCar; if (!c) return;
  c.driver = null; S.inCar = null;
  const P = sys.player;
  P.pos.set(c.pos.x + Math.sin(c.yaw + Math.PI / 2) * 2.5, 0, c.pos.z + Math.cos(c.yaw + Math.PI / 2) * 2.5);
  P.group.position.copy(P.pos); P.group.visible = true;
}

export function updateVehicles(dt, S, sys) {
  const inp = sys.input;
  const P = sys.player;
  // Player driving.
  if (S.inCar) {
    const c = S.inCar;
    const boost = 1 + 0.05 * S.repLevel;
    const maxSp = 26 * boost;
    let th = 0;
    if (inp.down('KeyW') || inp.down('ArrowUp')) th = 1;
    if (inp.down('KeyS') || inp.down('ArrowDown')) th = -0.6;
    if (inp.down('KeyA') || inp.down('ArrowLeft')) c.yaw += 1.9 * dt * (c.speed >= 0 ? 1 : -1) * clamp(Math.abs(c.speed) / 8, 0.2, 1);
    if (inp.down('KeyD') || inp.down('ArrowRight')) c.yaw -= 1.9 * dt * (c.speed >= 0 ? 1 : -1) * clamp(Math.abs(c.speed) / 8, 0.2, 1);
    c.speed = clamp(c.speed + th * 22 * dt, -10, maxSp);
    if (th === 0) c.speed *= Math.pow(0.4, dt);
    c.pos.x += Math.sin(c.yaw) * c.speed * dt;
    c.pos.z += Math.cos(c.yaw) * c.speed * dt;
    c.pos.x = clamp(c.pos.x, -195, 195); c.pos.z = clamp(c.pos.z, -225, 195);
    const [nx, nz] = sys.city.collide(c.pos.x, c.pos.z, 1.6);
    if (nx !== c.pos.x || nz !== c.pos.z) { c.speed *= 0.4; c.pos.x = nx; c.pos.z = nz; }
    c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.yaw;
    P.pos.copy(c.pos); P.camYaw = c.yaw;
    return;
  }
  // Traffic.
  for (const c of sys.vehicles.traffic) {
    const [tx, tz] = c.route[c.routeI];
    const dx = tx - c.pos.x, dz = tz - c.pos.z, d = Math.hypot(dx, dz);
    if (d < 3) { c.routeI = (c.routeI + 1) % c.route.length; continue; }
    const want = Math.atan2(dx, dz);
    let diff = want - c.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    c.yaw += clamp(diff, -1.6 * dt, 1.6 * dt);
    c.speed = 9;
    c.pos.x += Math.sin(c.yaw) * c.speed * dt;
    c.pos.z += Math.cos(c.yaw) * c.speed * dt;
    c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.yaw;
  }
  // F is handled centrally in main.js (enter/exit), so this module never consumes the edge.
}
