// Pedestrians: people strolling the sidewalks and the promenade. They
// wander between waypoints, and when the wanted level is high or shots
// ring out nearby they run away from the trouble.
import * as THREE from 'three';
import { box, ball, place, groupAt } from './geometry.js';
import { makeRng, range, pick } from './random.js';

const SHIRTS = [0xd95050, 0x4d9e6a, 0x3c6ec9, 0xe0b93c, 0x8a4dc9, 0xd8d8d8, 0x2c8a8a];
const PANTS = [0x2e4a6a, 0x3c3c46, 0x6a4a2f, 0x4a4a4a];

export function createPeds(scene, city) {
  const rng = makeRng(4242);
  const walkers = [];

  function buildPed() {
    const g = groupAt(0, 0, 0);
    const shirt = pick(rng, SHIRTS);
    const pants = pick(rng, PANTS);
    const torso = box(0.8, 0.9, 0.45, shirt);
    place(torso, 0, 1.1, 0);
    g.add(torso);
    const head = ball(0.3, pick(rng, [0xd9a986, 0x8a5c38, 0xe8c9a0]));
    place(head, 0, 1.85, 0);
    g.add(head);
    const legL = box(0.3, 0.75, 0.32, pants);
    place(legL, -0.22, 0.38, 0);
    g.add(legL);
    const legR = box(0.3, 0.75, 0.32, pants);
    place(legR, 0.22, 0.38, 0);
    g.add(legR);
    return g;
  }

  function newTarget(w) {
    // A random point on a sidewalk near a road, or on the promenade.
    if (rng() < 0.25) return { x: range(rng, -180, 180), z: 102 };
    const road = pick(rng, city.roads.xRoads);
    return { x: range(rng, -180, 180), z: road + (rng() < 0.5 ? 7 : -7) };
  }

  for (let i = 0; i < 24; i++) {
    const mesh = buildPed();
    const start = newTarget(mesh);
    place(mesh, start.x, 0, start.z);
    scene.add(mesh);
    walkers.push({
      mesh, target: newTarget(mesh), speed: range(rng, 1.2, 2.2),
      fleeing: false, phase: rng() * 6,
    });
  }

  function update(dt, playerPos, stars, shotsAt) {
    for (const w of walkers) {
      const p = w.mesh.position;
      const toPlayer = Math.hypot(p.x - playerPos.x, p.z - playerPos.z);
      let run = stars >= 3 && toPlayer < 30;
      if (shotsAt && Math.hypot(p.x - shotsAt.x, p.z - shotsAt.z) < 26) run = true;
      if (run) {
        // Run directly away from the player.
        const dx = p.x - playerPos.x, dz = p.z - playerPos.z;
        const len = Math.hypot(dx, dz) || 1;
        p.x += (dx / len) * 5.5 * dt;
        p.z += (dz / len) * 5.5 * dt;
        w.mesh.rotation.y = Math.atan2(dx, dz);
      } else {
        const dx = w.target.x - p.x, dz = w.target.z - p.z;
        const d = Math.hypot(dx, dz);
        if (d < 1.5) {
          w.target = newTarget(w);
        } else {
          p.x += (dx / d) * w.speed * dt;
          p.z += (dz / d) * w.speed * dt;
          w.mesh.rotation.y = Math.atan2(dx, dz);
        }
      }
      p.x = Math.max(-196, Math.min(196, p.x));
      p.z = Math.max(-196, Math.min(118, p.z));
      p.y = city.surfaceAt(p.x, p.z);
      w.phase += dt * (run ? 9 : 4);
      const swing = Math.sin(w.phase) * 0.4;
      w.mesh.children[2].rotation.x = swing;
      w.mesh.children[3].rotation.x = -swing;
    }
  }

  return { walkers, update };
}
