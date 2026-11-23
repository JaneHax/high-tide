// peds.js — pedestrians wandering the sidewalks, in varied colours.
import * as THREE from 'three';
import { box } from './geom.js';
import { rnd, pick } from './util.js';

const SHIRTS = [0xd95f4b, 0x4b8ad9, 0xe0b13c, 0x3f8a4a, 0x8a5a9a, 0xf2f2f2, 0x222222, 0xd98a7a, 0x5f9e8a];

export function createPeds(scene, S) {
  const walkers = [];
  for (let i = 0; i < 24; i++) {
    const g = new THREE.Group();
    const c = pick(SHIRTS);
    box(g, 0.65, 1.05, 0.38, c, 0, 0.9, 0);
    box(g, 0.45, 0.38, 0.38, 0xd9a066, 0, 1.62, 0);
    const legL = box(g, 0.22, 0.65, 0.28, 0x2a2a30, -0.16, 0.32, 0);
    const legR = box(g, 0.22, 0.65, 0.28, 0x2a2a30, 0.16, 0.32, 0);
    const x = rnd(-170, 170), z = rnd(-120, 170);
    g.position.set(x, 0, z);
    scene.add(g);
    walkers.push({ mesh: g, pos: g.position, legL, legR, tx: x, tz: z, speed: rnd(1.2, 2.2), phase: rnd(6), flee: 0 });
  }
  return { scene, walkers };
}

export function updatePeds(dt, S, sys) {
  const P = S.player.pos;
  for (const w of sys.peds.walkers) {
    const dx = w.tx - w.pos.x, dz = w.tz - w.pos.z, d = Math.hypot(dx, dz);
    if (d < 1.5) { w.tx = rnd(-170, 170); w.tz = rnd(-120, 170); }
    // Flee from gunfire or a speeding car.
    const pd = Math.hypot(P.x - w.pos.x, P.z - w.pos.z);
    if (pd < 8 && (S.lastShot && S.time - S.lastShot < 1)) w.flee = 2;
    const sp = w.flee > 0 ? 5 : w.speed;
    if (w.flee > 0) w.flee -= dt;
    w.pos.x += (dx / (d || 1)) * sp * dt;
    w.pos.z += (dz / (d || 1)) * sp * dt;
    w.phase += dt * sp * 2;
    w.mesh.position.copy(w.pos);
    w.mesh.rotation.y = Math.atan2(dx, dz);
    w.legL.rotation.x = Math.sin(w.phase) * 0.5;
    w.legR.rotation.x = -Math.sin(w.phase) * 0.5;
  }
}
