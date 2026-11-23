// city.js — Puerto Sol: coastal grid city built from compact data tables.
import * as THREE from 'three';
import { CFG } from './config.js';
import { box, cyl, flat, mat } from './geom.js';
import { rnd } from './util.js';

function mulberry(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTE = [0xd8c9a3, 0xc9a06a, 0x9fb4c7, 0xd98a7a, 0xa8b89a, 0xc7b299, 0x8fa3b8, 0xe0b56a, 0xb98a8a, 0x7fa88f];
const TOWER = [0x6a7f95, 0x8a7f8d, 0x5f7f8a, 0x9a8a6a];

export function buildCity(scene) {
  const g = new THREE.Group(); scene.add(g);
  const R = mulberry(20261123);
  const colliders = [];
  const lamps = [], palms = [];
  const solid = (x, z, w, d) => colliders.push({ x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2 });

  // Ground, sea, beach, promenade.
  flat(g, 420, 340, 0x8f8a80, 0, 20);                    // city ground
  flat(g, 420, 130, 0x2e7f9e, 0, -215);                  // sea
  flat(g, 420, 16, 0xe0cf9a, 0, -142);                   // beach sand
  flat(g, 420, 10, 0xb8a888, 0, -132);                   // promenade
  // Roads: grid lines every 40 units.
  for (let x = -160; x <= 160; x += 40) flat(g, 10, 330, 0x3c3c40, x, 15);
  for (let z = -120; z <= 160; z += 40) flat(g, 330, 10, 0x3c3c40, 0, z);
  // Road centre dashes.
  for (let x = -160; x <= 160; x += 40) for (let z = -110; z <= 150; z += 20) flat(g, 1, 4, 0xd8d8d8, x, z, 0.04);
  for (let z = -120; z <= 160; z += 40) for (let x = -150; x <= 150; x += 20) flat(g, 4, 1, 0xd8d8d8, x, z, 0.04);

  // Buildings: one per block, downtown towers taller.
  for (let bx = -160; bx < 160; bx += 40) {
    for (let bz = -120; bz < 160; bz += 40) {
      const cx = bx + 20, cz = bz + 20;
      if (Math.abs(cx + 80) < 25 && Math.abs(cz - 40) < 25) continue; // market square kept open
      if (Math.abs(cx + 120) < 25 && Math.abs(cz + 60) < 25) continue; // park kept open
      const downtown = cx >= -40 && cx <= 80 && cz >= -40 && cz <= 80;
      const n = downtown ? 1 : (R() < 0.5 ? 1 : 2);
      for (let i = 0; i < n; i++) {
        const w = downtown ? rnd(16, 22) : rnd(10, 16), d = downtown ? rnd(16, 22) : rnd(10, 16);
        const h = downtown ? rnd(26, 58) : rnd(6, 18);
        const x = cx + (n === 2 ? (i === 0 ? -8 : 8) : 0), z = cz + (n === 2 ? (i === 0 ? -6 : 6) : 0);
        const c = downtown ? TOWER[Math.floor(R() * TOWER.length)] : PALETTE[Math.floor(R() * PALETTE.length)];
        box(g, w, h, d, c, x, h / 2, z);
        box(g, w + 1, 0.8, d + 1, 0x5a5148, x, h + 0.4, z); // roof cap
        // Lit windows: warm emissive strip near the top.
        if (R() < 0.7) box(g, w * 0.7, 1.2, 0.2, 0xffd27a, x, h * 0.72, z + d / 2 + 0.05, 0, { e: 0xcc8822 });
        solid(x, z, w, d);
      }
    }
  }
  // Market square stalls.
  for (let i = 0; i < 6; i++) {
    const x = -100 + (i % 3) * 20, z = 25 + Math.floor(i / 3) * 22;
    box(g, 8, 3, 6, [0xd95f4b, 0x4b8ad9, 0xe0b13c][i % 3], x, 1.5, z);
    box(g, 9, 0.4, 7, 0xf2e8d5, x, 3.4, z);
  }
  // Park: trees, pond, bench.
  for (let i = 0; i < 14; i++) {
    const x = -140 + R() * 44, z = -80 + R() * 44;
    cyl(g, 0.3, 0.45, 3, 0x6a4a2a, x, 1.5, z, 6);
    const top = new THREE.Mesh(new THREE.SphereGeometry(rnd(2.2, 3.4), 8, 6), mat(0x4f8a4a));
    top.position.set(x, 4.4, z); g.add(top);
  }
  flat(g, 20, 12, 0x3f7fa8, -120, -60, 0.03); // pond
  // Promenade palms + lamps.
  for (let x = -160; x <= 160; x += 20) {
    const px = x + 6, pz = -128;
    cyl(g, 0.25, 0.4, 7, 0x7a5a34, px, 3.5, pz, 6);
    const top = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 6), mat(0x3f8a4a));
    top.position.set(px, 7.6, pz); g.add(top); palms.push(top);
    const lx = x - 6;
    cyl(g, 0.12, 0.12, 5, 0x2a2a2e, lx, 2.5, pz, 6);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), mat(0xffe9a8, { e: 0xffc860 }));
    head.position.set(lx, 5.2, pz); g.add(head); lamps.push(head);
  }
  // Pier at x=40 into the sea, marina docks, port office.
  flat(g, 8, 70, 0x8a6a44, 40, -180); // pier deck
  for (let z = -155; z >= -205; z -= 12) { cyl(g, 0.3, 0.3, 2.5, 0x5a4028, 35, -0.6, z, 6); cyl(g, 0.3, 0.3, 2.5, 0x5a4028, 45, -0.6, z, 6); }
  flat(g, 60, 8, 0x8a6a44, 120, -152); // marina dock
  flat(g, 40, 8, 0x8a6a44, 150, -168); // harbor dock
  box(g, 12, 7, 9, 0x7f8a99, 150, 3.5, -160); solid(150, -160, 12, 9); // port office
  box(g, 10, 6, 8, 0xc7b299, -40, 3, 80, 0, { e: 0x000000 }); solid(-40, 80, 10, 8); // corner store
  box(g, 6, 1.2, 1, 0xffd27a, -40, 6.4, 75.8, 0, { e: 0xcc8822 }); // store sign glow, street side
  // Safehouse + garage lot.
  box(g, 12, 8, 10, 0x9a6a7a, 120, 4, 120); solid(120, 120, 12, 10);
  flat(g, 30, 20, 0x555550, 60, 100, 0.03); // garage lot
  for (let i = 0; i < 3; i++) flat(g, 2, 12, 0xe8e8e8, 50 + i * 10, 100, 0.05);

  function collide(x, z, r) {
    for (const b of colliders) {
      const nx = Math.max(b.x0, Math.min(x, b.x1)), nz = Math.max(b.z0, Math.min(z, b.z1));
      const dx = x - nx, dz = z - nz, d2 = dx * dx + dz * dz;
      if (d2 < r * r && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        x = nx + (dx / d) * r; z = nz + (dz / d) * r;
      }
    }
    return [x, z];
  }
  return {
    group: g, colliders, collide, lamps, palms,
    spawn: [0, 0, 40], shop: [-40, 80], pierEnd: [40, -205], market: [-80, 40], park: [-120, -60],
    garageLot: [60, 100], racePosts: CFG.garage.posts, boatPost: CFG.boatRace.post,
    sombra: [150, -160], safehouse: [120, 120], bridgeAt: CFG.bridge.at,
  };
}
