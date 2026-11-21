// Puerto Sol: the city itself. A road grid, block buildings, a downtown of
// glass towers, a market square, a park, a beach, a promenade with lamps,
// a marina pier into the sea, and a breakwater. Everything is placed from
// one seeded random stream, so the layout is identical every run.
import * as THREE from 'three';
import { WORLD, SUN, PALETTE } from './config.js';
import { makeRng, range, pick } from './random.js';
import { box, slab, tube, ball, cone, place, groupAt, material } from './geometry.js';

const X_ROADS = [-160, -120, -80, -40, 0, 40, 80];
const Z_ROADS = [-160, -120, -80, -40, 0, 40, 80, 120, 160];

export function createCity(scene) {
  const rng = makeRng(20261121);
  const group = new THREE.Group();
  scene.add(group);

  // Ground: grass on land only, down to the shore; the sea is its own
  // plane south of the sand, so boats sit on water, not on grass.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.size * 2.2, 600),
    material(SUN.grass),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -180);
  ground.receiveShadow = true;
  group.add(ground);

  const sand = slab(WORLD.size, 0.1, 18, SUN.sand);
  place(sand, 0, 0.05, 112);
  group.add(sand);

  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 320),
    new THREE.MeshLambertMaterial({ color: SUN.sea, transparent: true, opacity: 0.94 }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -0.45, 280);
  group.add(sea);

  // Roads: dark strips with pale centre dashes.
  for (const z of X_ROADS) {
    group.add(place(slab(WORLD.size, 0.12, WORLD.roadWidth, SUN.asphalt), 0, 0.06, z));
    for (let x = -190; x < 190; x += 16) {
      group.add(place(slab(6, 0.02, 0.5, 0xf2e9c9), x, 0.13, z));
    }
  }
  for (const x of Z_ROADS) {
    group.add(place(slab(WORLD.roadWidth, 0.12, WORLD.size, SUN.asphalt), x, 0.06, -40));
    for (let z = -190; z < 90; z += 16) {
      group.add(place(slab(0.5, 0.02, 6, 0xf2e9c9), x, 0.13, z));
    }
  }

  // Buildings: one or two boxes per block, taller glass towers downtown.
  const blocks = [];
  for (let i = 0; i < Z_ROADS.length - 1; i++) {
    for (let j = 0; j < X_ROADS.length - 1; j++) {
      const x0 = Z_ROADS[i] + 8, x1 = Z_ROADS[i + 1] - 8;
      const z0 = X_ROADS[j] + 8, z1 = X_ROADS[j + 1] - 8;
      blocks.push({ x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 });
    }
  }
  const marketBlock = { x: -60, z: -40 };
  const parkBlock = { x: 80, z: -60 };
  for (const b of blocks) {
    if (b.cz > 88) continue; // promenade and beach stay open
    if (Math.abs(b.cx - marketBlock.x) < 24 && Math.abs(b.cz - marketBlock.z) < 24) continue;
    if (Math.abs(b.cx - parkBlock.x) < 24 && Math.abs(b.cz - parkBlock.z) < 24) continue;
    if (Math.abs(b.cx - 96) < 24 && Math.abs(b.cz - 56) < 24) continue; // garage lot
    const downtown = Math.abs(b.cx) < 60 && b.cz < -30 && b.cz > -130;
    const n = downtown ? 1 : (rng() < 0.55 ? 2 : 1);
    for (let k = 0; k < n; k++) {
      const w = range(rng, 12, 20), d = range(rng, 12, 20);
      const h = downtown ? range(rng, 42, 78) : range(rng, 8, 26);
      const x = b.cx + (n > 1 ? (k === 0 ? -7 : 7) : 0) + range(rng, -2, 2);
      const z = b.cz + range(rng, -3, 3);
      const color = downtown ? PALETTE.towerGlass : pick(rng, [PALETTE.buildingA, PALETTE.buildingB, PALETTE.buildingC]);
      const bld = box(w, h, d, color);
      place(bld, x, h / 2, z);
      group.add(bld);
      const roof = box(w * 0.7, 1.2, d * 0.7, PALETTE.roof);
      place(roof, x, h + 0.6, z);
      group.add(roof);
      if (downtown && rng() < 0.5) {
        const antenna = tube(0.25, 0.25, 9, 0x888888);
        place(antenna, x, h + 5, z);
        group.add(antenna);
      }
    }
  }

  // Market square: stalls with striped canopies and crates.
  const stallColors = [PALETTE.stallRed, PALETTE.stallGreen, PALETTE.stallYellow];
  for (let i = 0; i < 8; i++) {
    const sx = marketBlock.x - 18 + (i % 4) * 12;
    const sz = marketBlock.z - 8 + Math.floor(i / 4) * 16;
    const stall = groupAt(sx, 0, sz);
    stall.add(place(box(7, 1.1, 5, 0x8a6f5c), 0, 0.55, 0));
    const canopy = box(8, 0.3, 6, stallColors[i % 3]);
    place(canopy, 0, 3.1, 0);
    stall.add(canopy);
    for (const [px, pz] of [[-3.6, -2.6], [3.6, -2.6], [-3.6, 2.6], [3.6, 2.6]]) {
      stall.add(place(tube(0.09, 0.09, 3.1, 0x666666), px, 1.55, pz));
    }
    group.add(stall);
  }
  for (let i = 0; i < 10; i++) {
    group.add(place(box(1.4, 1.4, 1.4, 0x9a7d55), marketBlock.x + range(rng, -20, 20), 0.7, marketBlock.z + range(rng, -16, 16)));
  }

  // Park: trees, benches, a fountain ring.
  for (let i = 0; i < 14; i++) {
    const tx = parkBlock.x + range(rng, -20, 20);
    const tz = parkBlock.z + range(rng, -18, 18);
    group.add(place(tube(0.35, 0.5, 3.4, 0x6a4a2f), tx, 1.7, tz));
    const crown = ball(range(rng, 2.2, 3.4), PALETTE.tree);
    place(crown, tx, 4.6, tz);
    group.add(crown);
  }
  for (let i = 0; i < 4; i++) {
    group.add(place(box(3.4, 0.5, 1.1, 0x7a5c40), parkBlock.x - 12 + i * 8, 0.5, parkBlock.z + 12));
  }
  const fountain = tube(3.2, 3.6, 0.9, 0x9fb4c0, {}, 16);
  place(fountain, parkBlock.x, 0.45, parkBlock.z);
  group.add(fountain);
  const fountainWater = new THREE.Mesh(
    new THREE.CircleGeometry(2.9, 20),
    new THREE.MeshLambertMaterial({ color: 0x4d9ec9 }),
  );
  fountainWater.rotation.x = -Math.PI / 2;
  fountainWater.position.set(parkBlock.x, 0.95, parkBlock.z);
  group.add(fountainWater);

  // Promenade: lamps and palms along the shore road.
  for (let x = -180; x <= 180; x += 24) {
    group.add(place(tube(0.14, 0.2, 5.2, 0x2c2c34), x, 2.6, 98));
    const glow = ball(0.55, PALETTE.lamp, { emissive: 0xffd977 });
    place(glow, x, 5.5, 98);
    group.add(glow);
    const palm = groupAt(x + 12, 0, 104);
    palm.add(place(tube(0.3, 0.45, 6.5, 0x7a5c38), 0, 3.2, 0));
    const fronds = cone(2.6, 2.2, PALETTE.tree, {}, 8);
    place(fronds, 0, 7.2, 0);
    palm.add(fronds);
    group.add(palm);
  }

  // Marina pier: plank deck on posts, reaching south into the sea.
  const pier = groupAt(0, 0, 0);
  for (let z = WORLD.pierZ0; z < WORLD.pierZ1; z += 4) {
    pier.add(place(slab(16, 0.3, 4.2, 0x8a6a48), WORLD.pierX, WORLD.pierY, z));
  }
  for (let z = WORLD.pierZ0 + 4; z < WORLD.pierZ1; z += 16) {
    for (const px of [WORLD.pierX - 7, WORLD.pierX + 7]) {
      pier.add(place(tube(0.5, 0.6, 3.4, 0x5c4630), px, -0.8, z));
    }
  }
  for (let x = -46; x <= -34; x += 4) {
    pier.add(place(tube(0.12, 0.12, 1.1, 0xdddddd), x, 1.15, WORLD.pierZ1 - 2));
  }
  group.add(pier);

  // Breakwater: a line of rocks where the water turns deep.
  for (let x = -110; x <= 110; x += 9) {
    const rock = ball(range(rng, 2.4, 4), 0x7d7d84, {}, 7, 6);
    place(rock, x + range(rng, -2, 2), 0.4, 208 + range(rng, -3, 3));
    rock.scale.y = 0.55;
    group.add(rock);
  }

  // Shops on the harbour road: the first one is the robbery target.
  const shops = [];
  for (const sx of [-120, -20, 80]) {
    const shop = groupAt(sx, 0, 74);
    shop.add(place(box(14, 7, 10, pick(rng, [0xe0d0b0, 0xc9d8e0, 0xd8c9a0])), 0, 3.5, 0));
    const awning = box(15, 0.4, 4, pick(rng, [PALETTE.stallRed, PALETTE.stallGreen]));
    place(awning, 0, 4.6, 5.5);
    shop.add(awning);
    group.add(shop);
    shops.push({ x: sx, z: 80 });
  }

  // Garage lot: fenced rectangle with an open gate on the north side.
  const garageLot = { x: 96, z: 56, w: 30, d: 22 };
  const fenceMat = material(0x888888);
  for (let x = garageLot.x - 15; x <= garageLot.x + 15; x += 5) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), fenceMat);
    place(post, x, 1.1, garageLot.z - 11);
    group.add(post);
    const post2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), fenceMat);
    place(post2, x, 1.1, garageLot.z + 11);
    group.add(post2);
  }
  for (let z = garageLot.z - 11; z <= garageLot.z + 11; z += 5) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), fenceMat);
    place(post, garageLot.x - 15, 1.1, z);
    group.add(post);
    const post2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), fenceMat);
    place(post2, garageLot.x + 15, 1.1, z);
    group.add(post2);
  }
  const lotPad = slab(30, 0.14, 22, 0x55585f);
  place(lotPad, garageLot.x, 0.07, garageLot.z);
  group.add(lotPad);

  // Street-race posts near the garage.
  const racePosts = [
    { x: 72, z: 44 },
    { x: 96, z: 84 },
    { x: 122, z: 44 },
  ];
  for (const p of racePosts) {
    group.add(place(tube(0.3, 0.4, 3.6, PALETTE.accent), p.x, 1.8, p.z));
    const flag = box(1.6, 1.0, 0.1, 0x111111);
    place(flag, p.x + 0.9, 3.4, p.z);
    group.add(flag);
  }

  // Boat moorings beside the pier.
  const boatSpots = [
    { x: -56, z: 132 },
    { x: -24, z: 152 },
    { x: -56, z: 176 },
  ];

  // Job spawn points (walk targets) by area.
  const spawnPoints = [
    { x: -40, z: 190, kind: 'job', area: 'pier' },
    { x: 172, z: 102, kind: 'job', area: 'promenade' },
    { x: -60, z: -40, kind: 'job', area: 'park' },
    { x: 20, z: -100, kind: 'job', area: 'street' },
    { x: -140, z: -80, kind: 'job', area: 'street' },
    { x: 120, z: -120, kind: 'job', area: 'street' },
    { x: -100, z: 40, kind: 'job', area: 'street' },
    { x: 60, z: 20, kind: 'job', area: 'street' },
  ];

  // Parked cars the player can steal, lined up along roads.
  const carSpawns = [
    { x: -118, z: 6, ry: 0 }, { x: -78, z: -6, ry: Math.PI }, { x: 42, z: 46, ry: 0 },
    { x: 118, z: -34, ry: Math.PI }, { x: -38, z: -114, ry: 0 }, { x: 82, z: 86, ry: Math.PI },
    { x: -158, z: -74, ry: 0 }, { x: 162, z: 6, ry: Math.PI },
  ];

  function surfaceAt(x, z) {
    if (x > WORLD.pierX - 9 && x < WORLD.pierX + 9 && z > WORLD.pierZ0 && z < WORLD.pierZ1) {
      return WORLD.pierY;
    }
    return 0;
  }

  function isWater(x, z) {
    return z > WORLD.seaZ;
  }

  return {
    group, roads: { xRoads: X_ROADS, zRoads: Z_ROADS },
    spawnPoints, shops, boatSpots, carSpawns,
    garageLot, racePosts, surfaceAt, isWater,
  };
}
