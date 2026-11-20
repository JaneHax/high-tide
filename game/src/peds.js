// The crowd on the sidewalks. A walker knows one thing, the kerb ring of his block and the road he may
// step across at a corner, and that fills the streets without a path graph.
//
// Every body timer starts at zero and a reset puts it back to zero: undefined minus a step is NaN, and
// NaN never compares as past the limit, so the corpse would lie there for the rest of the session.
import { Mesh, MeshLambertMaterial, Vector3 } from 'three';
import { CITY, PALETTE, PEDS } from './config.js';
import { createRandom } from './random.js';
import { merge, tintedBox, unstick } from './geometry.js';

const HALF = CITY.blockSize / 2 - CITY.sidewalkWidth / 2;
const EDGE = HALF * 2;
const PERIMETER = EDGE * 4;
const PITCH = CITY.blockSize + CITY.roadWidth;
const CROSSING = PITCH - EDGE;

const HIP = 0.86;
const SKIN = [PALETTE.sand, PALETTE.wallTan, PALETTE.wallCream];
const SHIRTS = [
  PALETTE.sea,
  PALETTE.sirenRed,
  PALETTE.wallStone,
  PALETTE.roadLineYellow,
  PALETTE.grass,
  PALETTE.wallCream,
  PALETTE.wallTan,
];
const TROUSERS = [PALETTE.asphalt, PALETTE.roof, PALETTE.wallStone, PALETTE.sea];
const HAIR = [PALETTE.roof, PALETTE.asphalt, PALETTE.wallTan];
const VARIANTS = 7;

const MATERIAL = new MeshLambertMaterial({ vertexColors: true, flatShading: true });

const EDGE_DIR = [
  { x: 1, z: 0 },
  { x: 0, z: 1 },
  { x: -1, z: 0 },
  { x: 0, z: -1 },
];

function normalise(s) {
  const t = s % PERIMETER;
  return t < 0 ? t + PERIMETER : t;
}

function ringPoint(block, s) {
  const t = normalise(s), edge = Math.min(3, Math.floor(t / EDGE)), along = t - edge * EDGE, minX = block.x - HALF;
  const maxX = block.x + HALF, minZ = block.z - HALF, maxZ = block.z + HALF;
  if (edge === 0) return { x: minX + along, z: minZ };
  if (edge === 1) return { x: maxX, z: minZ + along };
  if (edge === 2) return { x: maxX - along, z: maxZ };
  return { x: minX, z: maxZ - along };
}

function ringS(block, x, z) {
  const minX = block.x - HALF, maxX = block.x + HALF, minZ = block.z - HALF, maxZ = block.z + HALF;
  const cx = Math.min(maxX, Math.max(minX, x)), cz = Math.min(maxZ, Math.max(minZ, z)), west = cx - minX;
  const east = maxX - cx, south = cz - minZ, north = maxZ - cz, least = Math.min(west, east, south, north);
  if (least === south) return west;
  if (least === east) return EDGE + south;
  if (least === north) return 2 * EDGE + east;
  return 3 * EDGE + north;
}

function nextCorner(s, dir) {
  if (dir > 0) {
    const k = Math.floor(s / EDGE + 1e-9);
    return Math.min(PERIMETER, (k + 1) * EDGE);
  }
  const k = Math.ceil(s / EDGE - 1e-9);
  return Math.max(0, (k - 1) * EDGE);
}

function ringHeading(block, s, dir) {
  const edge = Math.min(3, Math.floor(normalise(s) / EDGE)), d = EDGE_DIR[edge];
  return Math.atan2(-d.x * dir, -d.z * dir);
}

function centreKey(x, z) {
  return `${Math.round(x * 10)}:${Math.round(z * 10)}`;
}

function shellGeometry(skin, shirt, trousers, hair) {
  return merge([
    tintedBox(0.44, 0.5, 0.27, shirt, 0, HIP + 0.27, 0),
    tintedBox(0.52, 0.14, 0.29, shirt, 0, HIP + 0.5, 0),
    tintedBox(0.46, 0.1, 0.28, trousers, 0, HIP + 0.02, 0),
    tintedBox(0.15, 0.34, 0.17, shirt, -0.31, HIP + 0.33, 0),
    tintedBox(0.15, 0.34, 0.17, shirt, 0.31, HIP + 0.33, 0),
    tintedBox(0.12, 0.28, 0.13, skin, -0.31, HIP + 0.02, 0),
    tintedBox(0.12, 0.28, 0.13, skin, 0.31, HIP + 0.02, 0),
    tintedBox(0.24, 0.26, 0.24, skin, 0, HIP + 0.74, 0),
    tintedBox(0.26, 0.09, 0.26, hair, 0, HIP + 0.9, 0),
    tintedBox(0.2, 0.05, 0.03, PALETTE.asphalt, 0, HIP + 0.76, -0.12),
  ]);
}

function legGeometry(trousers, hair) {
  return merge([
    tintedBox(0.17, 0.72, 0.2, trousers, 0, -0.36, 0),
    tintedBox(0.19, 0.14, 0.3, hair, 0, -0.79, -0.05),
  ]);
}

export function createPeds({ city, scene, seed, player }) {
  const rng = createRandom(seed), blocks = city.blocks, byCentre = new Map();
  for (const block of blocks) byCentre.set(centreKey(block.x, block.z), block);

  const variants = [];
  for (let i = 0; i < VARIANTS; i++) {
    const skin = rng.pick(SKIN), shirt = rng.pick(SHIRTS), trousers = rng.pick(TROUSERS), hair = rng.pick(HAIR);
    variants.push({ shell: shellGeometry(skin, shirt, trousers, hair), leg: legGeometry(trousers, hair) });
  }

  const list = [];
  let runOver = null;

  function slideOut(x, z) {
    return unstick(x, z, PEDS.radius, city.surfaceAt(x, z) + 0.3, city.colliders);
  }

  function nearestRing(block, x, z) {
    const s = ringS(block, x, z), point = ringPoint(block, s);
    return { x: point.x, z: point.z, s };
  }

  function blockDistance(block, x, z) {
    const point = ringPoint(block, ringS(block, x, z));
    return Math.hypot(point.x - x, point.z - z);
  }

  function nearBlocks() {
    const out = [];
    let best = null;
    for (const block of blocks) {
      const d = blockDistance(block, player.position.x, player.position.z);
      if (d <= PEDS.respawnDistance * 0.9) out.push({ block, d });
      if (!best || d < best.d) best = { block, d };
    }
    if (out.length === 0 && best) out.push(best);
    return out;
  }

  function reset(ped, block, s) {
    ped.block = block;
    ped.s = normalise(s);
    ped.dir = rng.chance(0.5) ? 1 : -1;
    ped.mode = 'ring';
    ped.state = 'walk';
    ped.health = 100;
    ped.timer = 0;
    ped.flee = 0;
    ped.crossBlock = null;
    ped.crossCooldown = 0;
    const point = ringPoint(block, ped.s);
    ped.position.x = point.x;
    ped.position.z = point.z;
    ped.position.y = city.surfaceAt(point.x, point.z);
    ped.heading = ringHeading(block, ped.s, ped.dir);
  }

  function crowded(x, z) {
    for (const other of list) {
      if (Math.hypot(other.position.x - x, other.position.z - z) < PEDS.radius * 3) return true;
    }
    return false;
  }

  function recycle(ped) {
    const near = nearBlocks(), block = near.length ? rng.pick(near).block : ped.block;
    for (let attempt = 0; attempt < 12; attempt++) {
      const s = rng.range(0, PERIMETER), point = ringPoint(block, s);
      if (Math.hypot(point.x - player.position.x, point.z - player.position.z) > PEDS.respawnDistance * 0.85) continue;
      if (crowded(point.x, point.z)) continue;
      reset(ped, block, s);
      return;
    }
    // Every draw that failed used to land on the same point, the ring corner nearest the player, so
    // five walkers could start inside each other; step along the kerb to the first free stretch.
    const spot = nearestRing(block, player.position.x, player.position.z);
    for (let step = 1; step < 48; step++) {
      const s = spot.s + step * PEDS.radius * 3;
      const point = ringPoint(block, s);
      if (crowded(point.x, point.z)) continue;
      reset(ped, block, s);
      return;
    }
    reset(ped, block, spot.s);
  }

  function revive(ped) {
    const spot = nearestRing(ped.block, ped.position.x, ped.position.z);
    ped.state = 'walk';
    ped.health = 100;
    ped.timer = 0;
    ped.flee = 0;
    ped.mode = 'ring';
    ped.s = spot.s;
    ped.position.x = spot.x;
    ped.position.z = spot.z;
    ped.heading = ringHeading(ped.block, ped.s, ped.dir);
  }

  function knockDown(ped, car) {
    ped.health = 0;
    ped.state = 'down';
    ped.mode = 'ring';
    ped.flee = 0;
    ped.timer = 0;
    ped.crossBlock = null;
    if (car && runOver) runOver(ped, car);
  }

  function beginCross(ped, corner) {
    const edge = ped.dir > 0 ? (corner + 3) % 4 : corner, d = EDGE_DIR[edge], dx = d.x * ped.dir;
    const dz = d.z * ped.dir, next = byCentre.get(centreKey(ped.block.x + dx * PITCH, ped.block.z + dz * PITCH));
    if (!next) return false;
    const point = ringPoint(ped.block, corner * EDGE);
    ped.mode = 'cross';
    ped.crossBlock = next;
    ped.crossX = point.x + dx * CROSSING;
    ped.crossZ = point.z + dz * CROSSING;
    ped.crossCooldown = PEDS.crossCooldown;
    ped.position.x = point.x;
    ped.position.z = point.z;
    ped.heading = Math.atan2(-dx, -dz);
    return true;
  }

  function arriveCross(ped) {
    ped.block = ped.crossBlock;
    ped.s = ringS(ped.block, ped.crossX, ped.crossZ);
    ped.mode = 'ring';
    ped.crossBlock = null;
    ped.position.x = ped.crossX;
    ped.position.z = ped.crossZ;
  }

  function walkRing(ped, dt) {
    let s = normalise(ped.s), left = PEDS.walkSpeed * dt, guard = 0;
    while (left > 1e-9 && guard++ < 4) {
      if (ped.dir < 0 && s <= 1e-9) s = PERIMETER;
      const corner = nextCorner(s, ped.dir), gap = Math.abs(corner - s);
      if (left < gap) {
        s += ped.dir * left;
        break;
      }
      s = corner;
      left -= gap;
      const k = Math.round(normalise(s) / EDGE) % 4;
      if (ped.crossCooldown <= 0 && rng.chance(PEDS.crossChance) && beginCross(ped, k)) return;
      s = normalise(s);
    }
    ped.s = normalise(s);
    const point = ringPoint(ped.block, ped.s), clear = slideOut(point.x, point.z);
    ped.position.x = clear.x;
    ped.position.z = clear.z;
    ped.heading = ringHeading(ped.block, ped.s, ped.dir);
  }

  function walkCross(ped, dt) {
    const dx = ped.crossX - ped.position.x, dz = ped.crossZ - ped.position.z, distance = Math.hypot(dx, dz);
    if (distance < 1e-3) {
      arriveCross(ped);
      return;
    }
    const step = Math.min(distance, PEDS.walkSpeed * dt);
    const clear = slideOut(ped.position.x + (dx / distance) * step, ped.position.z + (dz / distance) * step);
    ped.position.x = clear.x;
    ped.position.z = clear.z;
    ped.heading = Math.atan2(-dx, -dz);
    if (Math.hypot(ped.crossX - clear.x, ped.crossZ - clear.z) < 1e-3) arriveCross(ped);
  }

  function runFrom(ped, dt) {
    let dx = ped.position.x - ped.alarmX, dz = ped.position.z - ped.alarmZ, distance = Math.hypot(dx, dz);
    if (distance < 0.3) {
      dx = ped.fleeX;
      dz = ped.fleeZ;
      distance = 1;
    }
    const step = PEDS.fleeSpeed * dt;
    const clear = slideOut(ped.position.x + (dx / distance) * step, ped.position.z + (dz / distance) * step);
    ped.position.x = clear.x;
    ped.position.z = clear.z;
    ped.heading = Math.atan2(-dx, -dz);
  }

  function returnToBeat(ped, dt) {
    const spot = nearestRing(ped.block, ped.position.x, ped.position.z), dx = spot.x - ped.position.x;
    const dz = spot.z - ped.position.z, distance = Math.hypot(dx, dz);
    if (distance < 0.3) {
      ped.mode = 'ring';
      ped.s = spot.s;
      ped.position.x = spot.x;
      ped.position.z = spot.z;
      ped.heading = ringHeading(ped.block, ped.s, ped.dir);
      return;
    }
    const step = Math.min(distance, PEDS.walkSpeed * dt);
    const clear = slideOut(ped.position.x + (dx / distance) * step, ped.position.z + (dz / distance) * step);
    ped.position.x = clear.x;
    ped.position.z = clear.z;
    ped.heading = Math.atan2(-dx, -dz);
  }

  function scare(x, z, radius) {
    for (const ped of list) {
      if (ped.state === 'down') continue;
      const dx = ped.position.x - x, dz = ped.position.z - z, distance = Math.hypot(dx, dz);
      if (distance > radius) continue;
      ped.state = 'flee';
      ped.flee = PEDS.alarmSeconds;
      ped.alarmX = x;
      ped.alarmZ = z;
      if (distance > 0.3) {
        ped.fleeX = dx / distance;
        ped.fleeZ = dz / distance;
      } else {
        const angle = rng.range(0, Math.PI * 2);
        ped.fleeX = Math.sin(angle);
        ped.fleeZ = Math.cos(angle);
      }
    }
  }

  function sirenOn(car) {
    if (car.siren !== undefined) return Boolean(car.siren);
    if (car.sirenOn !== undefined) return Boolean(car.sirenOn);
    return true;
  }

  function carSize(car) {
    return {
      halfWidth: (car.spec ? car.spec.width : 1.9) * 0.5,
      halfLength: (car.spec ? car.spec.length : 4.6) * 0.5,
    };
  }

  function reaches(car, ped) {
    if (Math.abs(car.speed || 0) <= PEDS.runOverSpeed) return false;
    if (Math.abs(ped.position.y - car.position.y) > 1.2) return false;
    const sin = Math.sin(car.heading || 0), cos = Math.cos(car.heading || 0), dx = ped.position.x - car.position.x;
    const dz = ped.position.z - car.position.z, along = -sin * dx - cos * dz, across = cos * dx - sin * dz;
    const size = carSize(car);
    return Math.abs(along) <= size.halfLength + PEDS.radius && Math.abs(across) <= size.halfWidth + PEDS.radius;
  }

  function runDown(car) {
    if (!car || !car.position) return;
    for (const ped of list) {
      if (ped.state === 'down') continue;
      if (!reaches(car, ped)) continue;
      knockDown(ped, car);
    }
  }

  function place(ped, dt) {
    ped.position.y = city.surfaceAt(ped.position.x, ped.position.z);
    ped.mesh.position.copy(ped.position);
    if (ped.state === 'down') {
      ped.mesh.position.y += 0.2;
      ped.mesh.rotation.set(-Math.PI / 2, ped.heading, 0);
      ped.legLeft.rotation.x = 0;
      ped.legRight.rotation.x = 0;
      return;
    }
    ped.mesh.rotation.set(0, ped.heading, 0);
    ped.phase = (ped.phase + (ped.state === 'flee' ? PEDS.fleeSpeed : PEDS.walkSpeed) * 2.6 * dt) % (Math.PI * 2);
    const swing = Math.sin(ped.phase) * 0.5;
    ped.legLeft.rotation.x = swing;
    ped.legRight.rotation.x = -swing;
  }

  function update(dt, cars, policeCars) {
    if (!(dt > 0)) return;

    for (const car of policeCars || []) {
      if (!car || !car.position) continue;
      if (!sirenOn(car)) continue;
      scare(car.position.x, car.position.z, PEDS.alarmRadius * 0.5);
    }

    for (const ped of list) {
      if (ped.state === 'down') {
        ped.timer += dt;
        if (ped.timer < PEDS.bodySeconds) continue;
        revive(ped);
      }

      if (ped.health <= 0) {
        knockDown(ped, null);
        continue;
      }

      if (ped.state === 'flee') {
        ped.flee -= dt;
        if (ped.flee > 0) runFrom(ped, dt);
        else {
          ped.state = 'walk';
          ped.mode = 'return';
        }
      }

      if (ped.state === 'walk') {
        if (ped.mode === 'cross') walkCross(ped, dt);
        else if (ped.mode === 'return') returnToBeat(ped, dt);
        else walkRing(ped, dt);
      }

      if (ped.crossCooldown > 0) ped.crossCooldown -= dt;
    }

    for (const car of cars || []) runDown(car);
    for (const car of policeCars || []) runDown(car);

    for (const ped of list) {
      const far = Math.hypot(ped.position.x - player.position.x, ped.position.z - player.position.z);
      if (far > PEDS.respawnDistance) recycle(ped);
      place(ped, dt);
    }
  }

  for (let i = 0; i < PEDS.count; i++) {
    const variant = rng.pick(variants), mesh = new Mesh(variant.shell, MATERIAL);
    mesh.rotation.order = 'YXZ';
    mesh.castShadow = true;
    const legLeft = new Mesh(variant.leg, MATERIAL), legRight = new Mesh(variant.leg, MATERIAL);
    legLeft.position.set(-0.13, HIP, 0);
    legRight.position.set(0.13, HIP, 0);
    mesh.add(legLeft);
    mesh.add(legRight);
    scene.add(mesh);

    const ped = {
      position: new Vector3(),
      heading: 0,
      state: 'walk',
      health: 100,
      mesh,
      legLeft,
      legRight,
      block: blocks[0],
      s: 0,
      dir: 1,
      mode: 'ring',
      timer: 0,
      flee: 0,
      alarmX: 0,
      alarmZ: 0,
      fleeX: 0,
      fleeZ: 0,
      crossX: 0,
      crossZ: 0,
      crossBlock: null,
      crossCooldown: 0,
      phase: rng.range(0, Math.PI * 2),
    };
    recycle(ped);
    place(ped, 0);
    list.push(ped);
  }

  return {
    list,
    update,
    alarm(x, z) {
      scare(x, z, PEDS.alarmRadius);
    },
    onRunOver(fn) {
      runOver = fn;
    },
  };
}
