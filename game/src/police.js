// police.js — wanted stars, foot officers, cruisers, and the roadblock.
import * as THREE from 'three';
import { box, mat } from './geom.js';
import { clamp, rnd } from './util.js';

function makeOfficer() {
  const g = new THREE.Group();
  box(g, 0.7, 1.1, 0.4, 0x1a2a4a, 0, 0.95, 0);
  box(g, 0.5, 0.35, 0.4, 0xd9a066, 0, 1.7, 0);
  box(g, 0.55, 0.12, 0.45, 0x1a2a4a, 0, 1.95, 0);
  return g;
}
function makeCruiser() {
  const g = new THREE.Group();
  box(g, 2, 0.55, 4.4, 0x181818, 0, 0.45, 0);
  box(g, 1.8, 0.6, 2.4, 0xf2f2f2, 0, 0.95, -0.2);
  box(g, 1.6, 0.5, 1.2, 0x223344, 0, 1.35, -0.3);
  box(g, 0.9, 0.25, 0.5, 0x2244ff, -0.3, 1.7, -0.3, 0, { e: 0x2244ff });
  box(g, 0.9, 0.25, 0.5, 0xff2222, 0.3, 1.7, -0.3, 0, { e: 0xff2222 });
  return g;
}

export function createPolice(scene, S) {
  return { scene, officers: [], cruisers: [], roadblock: null, spawnT: 0 };
}

function spawnOfficer(sys, x, z) {
  const mesh = makeOfficer(); mesh.position.set(x, 0, z);
  sys.police.scene.add(mesh);
  sys.police.officers.push({ mesh, pos: mesh.position, speed: 5.5 });
}
function spawnCruiser(sys, x, z) {
  const mesh = makeCruiser(); mesh.position.set(x, 0, z);
  sys.police.scene.add(mesh);
  sys.police.cruisers.push({ mesh, pos: mesh.position, yaw: 0, speed: 0 });
}

export function addHeat(S, n) {
  S.heat = clamp(S.heat + n, 0, 100);
  const want = S.heat >= 85 ? 5 : S.heat >= 65 ? 4 : S.heat >= 45 ? 3 : S.heat >= 25 ? 2 : S.heat >= 8 ? 1 : 0;
  if (want !== S.stars) {
    S.stars = want;
    if (want > 0) sysToast(S, want);
  }
}
function sysToast(S, want) {
  if (S.sys) S.sys.hud.toast(want >= 3 ? 'AIR ONE is overhead — ' + want + ' stars!' : 'Wanted level ' + want + ' — police are coming');
}

export function updatePolice(dt, S, sys) {
  S.sys = sys;
  // Heat cools when the player stays out of trouble.
  if (S.heat > 0 && S.time - (S.lastCrime || 0) > 8) S.heat = Math.max(0, S.heat - dt * 2.2);
  const want = S.heat >= 85 ? 5 : S.heat >= 65 ? 4 : S.heat >= 45 ? 3 : S.heat >= 25 ? 2 : S.heat >= 8 ? 1 : 0;
  if (want !== S.stars) { S.stars = want; if (want > 0) sys.hud.toast(want >= 3 ? 'AIR ONE is overhead — ' + want + ' stars!' : 'Wanted level ' + want); }
  const P = S.player.pos;
  const wantOff = S.stars >= 1 ? Math.min(S.stars, 3) : 0;
  const wantCru = S.stars >= 2 ? Math.min(S.stars - 1, 3) : 0;
  // A rising wanted level brings the police at once, not on the next slow tick.
  if (S.stars > (S._prevStars || 0)) sys.police.spawnT = 0;
  S._prevStars = S.stars;
  sys.police.spawnT -= dt;
  if (sys.police.spawnT <= 0) {
    sys.police.spawnT = 1.2;
    while (sys.police.officers.length < wantOff) spawnOfficer(sys, P.x + rnd(-40, 40), P.z + rnd(-40, 40));
    while (sys.police.cruisers.length < wantCru) spawnCruiser(sys, P.x + rnd(-50, 50), P.z + rnd(-50, 50));
    while (sys.police.officers.length > wantOff) sys.police.scene.remove(sys.police.officers.pop().mesh);
    while (sys.police.cruisers.length > wantCru) sys.police.scene.remove(sys.police.cruisers.pop().mesh);
  }
  // Officers chase on foot; a touch costs health and a star.
  for (const o of sys.police.officers) {
    const dx = P.x - o.pos.x, dz = P.z - o.pos.z, d = Math.hypot(dx, dz) || 1;
    o.pos.x += (dx / d) * o.speed * dt; o.pos.z += (dz / d) * o.speed * dt;
    o.mesh.position.copy(o.pos); o.mesh.rotation.y = Math.atan2(dx, dz);
    if (d < 1.4 && S.health > 0 && !S.inCar && !S.inBoat) {
      S.health = Math.max(0, S.health - 12 * dt);
      if (S.health <= 0) sys.hud.toast('Busted! You wake up at the hospital — $200 gone');
      if (S.health <= 0) { S.health = 100; S.cash = Math.max(0, S.cash - 200); S.stars = 0; S.heat = 0; S.player.pos.set(0, 0, 40); }
    }
  }
  // Cruisers ram the player's car or chase on foot.
  for (const c of sys.police.cruisers) {
    const dx = P.x - c.pos.x, dz = P.z - c.pos.z, d = Math.hypot(dx, dz) || 1;
    const want = Math.atan2(dx, dz);
    let diff = want - c.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    c.yaw += clamp(diff, -2.2 * dt, 2.2 * dt);
    c.speed = clamp(c.speed + 14 * dt, 0, S.inCar ? 24 : 16);
    c.pos.x += Math.sin(c.yaw) * c.speed * dt;
    c.pos.z += Math.cos(c.yaw) * c.speed * dt;
    c.mesh.position.copy(c.pos); c.mesh.rotation.y = c.yaw;
    if (d < 3 && S.inCar) { S.inCar.speed *= 0.6; S.health = Math.max(0, S.health - 6 * dt); }
  }
  // Roadblock: two cruisers and two officers ahead of the player at 3+ stars.
  if (S.stars >= 3 && !sys.police.roadblock) {
    const ax = P.x + Math.sin(S.player.camYaw) * 22, az = P.z + Math.cos(S.player.camYaw) * 22;
    const rb = { cruisers: [], officers: [] };
    for (const [ox, oz] of [[-4, 0], [4, 0]]) {
      const m = makeCruiser(); m.position.set(ax + ox, 0, az + oz); m.rotation.y = S.player.camYaw;
      sys.police.scene.add(m); rb.cruisers.push(m);
    }
    for (const [ox, oz] of [[-2, 3], [2, 3]]) {
      const m = makeOfficer(); m.position.set(ax + ox, 0, az + oz);
      sys.police.scene.add(m); rb.officers.push(m);
    }
    sys.police.roadblock = rb;
    sys.hud.toast('Roadblock ahead — two cruisers, two officers');
  }
  if (S.stars < 3 && sys.police.roadblock) {
    for (const m of [...sys.police.roadblock.cruisers, ...sys.police.roadblock.officers]) sys.police.scene.remove(m);
    sys.police.roadblock = null;
  }
}
