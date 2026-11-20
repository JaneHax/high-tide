// The traffic that fills the streets and the car Rico can take. Every car is welded primitives with four
// wheels, and every wheel reads its height from city.surfaceAt.
//
// The road graph cuts every segment at every crossing, because two roads that cross must share a node or
// a turning car teleports; a car's position then comes from the lane piece it is on, never from an
// integrated velocity.
import { CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, Vector3 } from 'three';
import { PALETTE, VEHICLES } from './config.js';
import { createRandom } from './random.js';
import { firstHit, merge, paint, tintedBox, unstick } from './geometry.js';

const BODY_MATERIAL = new MeshLambertMaterial({ vertexColors: true, flatShading: true });
const LAMP_MATERIAL = new MeshBasicMaterial({ vertexColors: true });

const GLASS = '#232a36';
const TRIM = '#191b22';

const TYPES = [
  ['sedan', 4.4, 1.86, 1.3, 0.8, 0.95, 1, [PALETTE.wallCream, PALETTE.wallTan, PALETTE.wallStone, PALETTE.sea]],
  ['coupe', 4.2, 1.84, 1.16, 1, 1.1, 1.1, [PALETTE.sirenRed, PALETTE.wallCream, PALETTE.sea]],
  ['van', 5.6, 2.05, 2.05, 0.62, 0.7, 0.8, [PALETTE.sea, PALETTE.wallTan, PALETTE.wallCream]],
  ['pickup', 5.1, 2, 1.66, 0.74, 0.85, 0.9, [PALETTE.wallTan, PALETTE.wallStone, PALETTE.roof]],
  ['taxi', 4.6, 1.9, 1.4, 0.78, 1, 1, [PALETTE.roadLineYellow]],
].map(([name, length, width, height, speed, accel, turn, colours]) => ({
  name,
  length,
  width,
  height,
  maxSpeed: VEHICLES.maxSpeed * speed,
  accel: VEHICLES.accel * accel,
  turnRate: VEHICLES.turnRate * turn,
  colours,
}));

function wrap(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function approach(value, target, step) {
  if (value < target) return Math.min(target, value + step);
  return Math.max(target, value - step);
}

function headingOf(dx, dz) {
  return Math.atan2(-dx, -dz);
}

function buildGraph(segments) {
  const nodes = [], edges = [], lanes = [], lanesByNode = [], keys = new Map();

  const nodeAt = (x, z) => {
    const key = `${Math.round(x * 50)}:${Math.round(z * 50)}`;
    let id = keys.get(key);
    if (id === undefined) {
      id = nodes.length;
      nodes.push({ x, z });
      lanesByNode.push([]);
      keys.set(key, id);
    }
    return id;
  };

  const addLane = (from, to, x1, z1, x2, z2, offset) => {
    const length = Math.hypot(x2 - x1, z2 - z1);
    if (length < 1e-6) return;
    const dirX = (x2 - x1) / length, dirZ = (z2 - z1) / length, rightX = -dirZ, rightZ = dirX;
    const lane = {
      from,
      to,
      x1: x1 + rightX * offset,
      z1: z1 + rightZ * offset,
      x2: x2 + rightX * offset,
      z2: z2 + rightZ * offset,
      dirX,
      dirZ,
      length,
      heading: headingOf(dirX, dirZ),
    };
    lanes.push(lane);
    lanesByNode[from].push(lane);
  };

  for (const segment of segments) {
    const dx = segment.x2 - segment.x1, dz = segment.z2 - segment.z1, length = Math.hypot(dx, dz);
    if (length < 1e-6) continue;
    const cuts = [0, 1];
    for (const other of segments) {
      if (other === segment) continue;
      const ox = other.x2 - other.x1, oz = other.z2 - other.z1, denom = dx * oz - dz * ox;
      if (Math.abs(denom) < 1e-9) continue;
      const t = ((other.x1 - segment.x1) * oz - (other.z1 - segment.z1) * ox) / denom;
      const u = ((other.x1 - segment.x1) * dz - (other.z1 - segment.z1) * dx) / denom;
      if (t > 1e-5 && t < 1 - 1e-5 && u > -1e-5 && u < 1 + 1e-5) cuts.push(t);
    }
    cuts.sort((a, b) => a - b);

    const offset = segment.width / 4;
    let previous = null;
    for (const t of cuts) {
      if (previous !== null && t - previous.t < 1e-5) continue;
      const x = segment.x1 + dx * t, z = segment.z1 + dz * t, id = nodeAt(x, z);
      if (previous !== null && previous.id !== id) {
        edges.push({ a: previous.id, b: id, length: Math.hypot(x - previous.x, z - previous.z) });
        addLane(previous.id, id, previous.x, previous.z, x, z, offset);
        addLane(id, previous.id, x, z, previous.x, previous.z, offset);
      }
      previous = { id, x, z, t };
    }
  }

  return { nodes, edges, lanes, lanesByNode };
}

function shellGeometry(spec) {
  const radius = VEHICLES.wheelRadius, bodyHeight = (spec.height - radius) * 0.52;
  const cabinHeight = (spec.height - radius) * 0.48, cabinZ = spec.length * 0.03;
  const parts = [
    tintedBox(spec.width, bodyHeight, spec.length, spec.colour, 0, radius + bodyHeight / 2, 0),
    tintedBox(spec.width * 0.86, cabinHeight, spec.length * 0.46, GLASS, 0, radius + bodyHeight + cabinHeight / 2, cabinZ),
    tintedBox(spec.width * 0.8, 0.1, spec.length * 0.4, spec.colour, 0, radius + bodyHeight + cabinHeight + 0.03, cabinZ),
    tintedBox(spec.width * 0.9, 0.12, spec.length * 0.9, TRIM, 0, radius - 0.02, 0),
  ];
  for (const side of [-1, 1]) {
    parts.push(tintedBox(spec.width * 1.02, 0.22, 0.3, TRIM, 0, radius + 0.12, side * (spec.length / 2 - 0.12)));
  }
  return merge(parts);
}

function lampGeometry(spec) {
  const radius = VEHICLES.wheelRadius, y = radius + (spec.height - radius) * 0.42, x = spec.width / 2 - 0.3;
  const parts = [];
  for (const side of [-1, 1]) {
    parts.push(tintedBox(0.36, 0.16, 0.08, PALETTE.sun, side * x, y, -spec.length / 2 + 0.02));
    parts.push(tintedBox(0.34, 0.14, 0.08, PALETTE.sirenRed, side * x, y, spec.length / 2 - 0.02));
  }
  return merge(parts);
}

function wheelGeometry() {
  const geometry = new CylinderGeometry(VEHICLES.wheelRadius, VEHICLES.wheelRadius, 0.26, 10);
  paint(geometry, '#14151a');
  geometry.rotateZ(Math.PI / 2);
  return geometry;
}

function wheelSpots(spec) {
  const x = spec.width / 2 - 0.12, z = spec.length / 2 - 1;
  return [[-x, -z], [x, -z], [-x, z], [x, z]];
}

let sharedWheel = null;

export function createVehicles({ city, scene, seed, player }) {
  const rng = createRandom(seed), graph = buildGraph(city.roads.segments), lanes = graph.lanes;
  const lanesByNode = graph.lanesByNode;

  const cars = [], meshes = new Map();
  let driven = null, hitCallback = null, trafficView = [], viewDirty = true;

  function meshesFor(spec) {
    const key = `${spec.name}:${spec.colour}`;
    let entry = meshes.get(key);
    if (!entry) {
      if (!sharedWheel) sharedWheel = wheelGeometry();
      entry = { shell: shellGeometry(spec), lamps: lampGeometry(spec), wheel: sharedWheel };
      meshes.set(key, entry);
    }
    return entry;
  }

  function addCar(spec) {
    const parts = meshesFor(spec), body = new Group();
    body.rotation.order = 'YXZ';

    const shell = new Mesh(parts.shell, BODY_MATERIAL);
    shell.castShadow = true;
    body.add(shell);

    const wheels = [];
    for (const [x, z] of wheelSpots(spec)) {
      const wheel = new Mesh(parts.wheel, BODY_MATERIAL);
      wheel.position.set(x, VEHICLES.wheelRadius, z);
      wheel.castShadow = true;
      body.add(wheel);
      wheels.push(wheel);
    }

    const lamps = new Mesh(parts.lamps, LAMP_MATERIAL);
    body.add(lamps);

    scene.add(body);

    const car = {
      position: new Vector3(0, 0, 0),
      heading: 0,
      speed: 0,
      limit: spec.maxSpeed,
      spec,
      body,
      stolen: false,
      wheels,
      lane: null,
      piece: null,
      along: 0,
      travel: 0,
      cruise: 0,
      pending: null,
      pushX: 0,
      pushZ: 0,
      still: 0,
      cooldown: 0,
      ai: true,
    };
    cars.push(car);
    return car;
  }

  function lanePiece(lane) {
    return { x1: lane.x1, z1: lane.z1, x2: lane.x2, z2: lane.z2, length: lane.length, heading: lane.heading, lane };
  }

  function placeOnLane(car, lane, along) {
    car.lane = lane;
    car.piece = lanePiece(lane);
    car.along = Math.max(0, Math.min(lane.length, along));
    car.pending = null;
    car.pushX = 0;
    car.pushZ = 0;
    car.heading = lane.heading;
    car.travel = lane.heading;
    const t = lane.length > 1e-6 ? car.along / lane.length : 0;
    car.position.x = lane.x1 + (lane.x2 - lane.x1) * t;
    car.position.z = lane.z1 + (lane.z2 - lane.z1) * t;
  }

  function syncPiece(car) {
    const piece = car.piece, t = piece.length > 1e-6 ? car.along / piece.length : 0;
    car.position.x = piece.x1 + (piece.x2 - piece.x1) * t + car.pushX;
    car.position.z = piece.z1 + (piece.z2 - piece.z1) * t + car.pushZ;
  }

  function beginLane(car, lane, fromX, fromZ) {
    const gap = Math.hypot(lane.x1 - fromX, lane.z1 - fromZ);
    if (gap > 0.08) {
      car.lane = null;
      car.pending = lane;
      car.piece = {
        x1: fromX,
        z1: fromZ,
        x2: lane.x1,
        z2: lane.z1,
        length: gap,
        heading: headingOf((lane.x1 - fromX) / gap, (lane.z1 - fromZ) / gap),
        lane: null,
      };
      car.along = 0;
      return;
    }
    car.lane = lane;
    car.pending = null;
    car.piece = lanePiece(lane);
    car.along = 0;
  }

  function chooseLane(car, node) {
    const options = lanesByNode[node];
    if (!options || options.length === 0) return null;
    const came = car.lane ? car.lane.from : -1;
    const usable = options.filter((lane) => !(lane.to === came) || options.length === 1);
    const pool = usable.length > 0 ? usable : options;
    if (pool.length === 1) return pool[0];
    let total = 0;
    const weights = pool.map((lane) => {
      const straight = Math.abs(wrap(lane.heading - car.heading)) < 0.4, weight = straight ? 3 : 1;
      total += weight;
      return weight;
    });
    let roll = rng.next() * total;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function advance(car, distance) {
    let remaining = distance, guard = 0;
    while (remaining > 1e-5 && guard++ < 8) {
      const left = car.piece.length - car.along;
      if (remaining < left) {
        car.along += remaining;
        break;
      }
      remaining -= left;
      const endX = car.piece.x2, endZ = car.piece.z2;
      car.along = car.piece.length;
      if (car.piece.lane) {
        const next = chooseLane(car, car.piece.lane.to);
        if (!next) break;
        beginLane(car, next, endX, endZ);
      } else if (car.pending) {
        beginLane(car, car.pending, endX, endZ);
      } else {
        break;
      }
    }
    syncPiece(car);
  }

  function nearestLane(x, z, heading) {
    let best = null;
    for (const lane of lanes) {
      const dx = lane.x2 - lane.x1, dz = lane.z2 - lane.z1, length2 = dx * dx + dz * dz;
      if (length2 < 1e-9) continue;
      let t = ((x - lane.x1) * dx + (z - lane.z1) * dz) / length2;
      t = Math.max(0.02, Math.min(0.98, t));
      const px = lane.x1 + dx * t, pz = lane.z1 + dz * t;
      const cost = Math.hypot(x - px, z - pz) + Math.abs(wrap(lane.heading - heading)) * 2;
      if (!best || cost < best.cost) best = { lane, t, cost };
    }
    return best;
  }

  function snapToLane(car) {
    const spot = nearestLane(car.position.x, car.position.z, car.heading);
    if (spot) placeOnLane(car, spot.lane, spot.t * spot.lane.length);
  }

  function clearAt(x, z, clearance, ignore) {
    for (const other of cars) {
      if (other === ignore) continue;
      if (Math.hypot(other.position.x - x, other.position.z - z) < clearance) return false;
    }
    return true;
  }

  function putOnNetwork(car, clearance) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const lane = lanes[rng.intRange(0, lanes.length - 1)], along = rng.range(1.5, Math.max(2, lane.length - 1.5));
      const t = along / lane.length, x = lane.x1 + (lane.x2 - lane.x1) * t, z = lane.z1 + (lane.z2 - lane.z1) * t;
      if (!clearAt(x, z, clearance, car)) continue;
      placeOnLane(car, lane, along);
      return true;
    }
    return false;
  }

  for (let i = 0; i < VEHICLES.count * 2; i++) {
    const type = rng.pick(TYPES);
    const { colours, ...base } = type;
    const spec = { ...base, colour: rng.pick(colours) }, car = addCar(spec);
    car.cruise = spec.maxSpeed * rng.range(VEHICLES.cruiseMin, VEHICLES.cruiseMax);
    car.limit = car.cruise;
    car.speed = car.cruise * 0.7;
    if (!putOnNetwork(car, VEHICLES.spawnClearance)) placeOnLane(car, lanes[0], 2);
    car.still = 0;
  }

  function carAhead(car) {
    const fx = -Math.sin(car.heading), fz = -Math.cos(car.heading), rx = Math.cos(car.heading);
    const rz = -Math.sin(car.heading);
    let best = null;
    for (const other of cars) {
      if (other === car || !other.spec) continue;
      const dx = other.position.x - car.position.x, dz = other.position.z - car.position.z;
      const ahead = dx * fx + dz * fz;
      if (ahead <= 0) continue;
      const lateral = Math.abs(dx * rx + dz * rz);
      if (lateral > (car.spec.width + other.spec.width) * 0.5 + 0.3) continue;
      const gap = ahead - (car.spec.length + other.spec.length) * 0.5;
      if (gap > 16) continue;
      if (!best || gap < best.gap) best = { gap, speed: other.speed, lane: other.lane };
    }
    return best;
  }

  function junctionBusy(car, x, z) {
    for (const other of cars) {
      if (other === car) continue;
      if (other.lane === car.lane) continue;
      if (Math.hypot(other.position.x - x, other.position.z - z) < 8) return true;
    }
    return false;
  }

  function driveTraffic(car, dt) {
    let target = car.cruise;
    const ahead = carAhead(car);
    if (ahead) {
      if (ahead.gap <= 3) target = 0;
      else target = Math.min(target, ahead.speed + (ahead.gap - 3) * 0.9);
    }
    const left = car.piece.length - car.along;
    if (left < 11 && junctionBusy(car, car.piece.x2, car.piece.z2)) target = Math.min(target, 5);

    const rate = target > car.speed ? car.spec.accel : VEHICLES.brake;
    car.speed = approach(car.speed, Math.max(0, target), rate * dt);
    car.limit = car.cruise;
    advance(car, car.speed * dt);

    const turn = Math.min(6, Math.max(1.6, Math.abs(car.speed) * 0.45)) * dt;
    car.heading += Math.max(-turn, Math.min(turn, wrap(car.piece.heading - car.heading)));

    const decay = Math.max(0, 1 - 2.2 * dt);
    car.pushX *= decay;
    car.pushZ *= decay;
    if (car.cooldown > 0) car.cooldown -= dt;

    const queued = ahead && car.lane && ahead.lane === car.lane;
    if (car.speed < 0.5 && !queued) car.still += dt;
    else car.still = 0;
    if (car.still > VEHICLES.stuckSeconds) {
      car.still = 0;
      putOnNetwork(car, VEHICLES.spawnClearance);
    }
  }

  function drivePlayerCar(car, dt, input) {
    const spec = car.spec, throttle = input ? input.isDown('KeyW') : false;
    const brake = input ? input.isDown('KeyS') : false;
    const steer = (input && input.isDown('KeyA') ? 1 : 0) - (input && input.isDown('KeyD') ? 1 : 0);
    const handbrake = input ? input.isDown('Space') : false;

    car.limit = spec.maxSpeed;

    if (handbrake) {
      car.speed = approach(car.speed, 0, VEHICLES.brake * 0.35 * dt);
    } else if (throttle) {
      car.speed = Math.min(spec.maxSpeed, car.speed + spec.accel * dt);
    } else if (brake) {
      if (car.speed > 0.1) car.speed = Math.max(0, car.speed - VEHICLES.brake * dt);
      else car.speed = Math.max(-VEHICLES.reverseMax, car.speed - spec.accel * 0.6 * dt);
    } else {
      car.speed = approach(car.speed, 0, VEHICLES.friction * dt);
    }

    const bite = Math.min(1, Math.abs(car.speed) / 3);
    const grip = 1 - 0.55 * Math.min(1, Math.abs(car.speed) / spec.maxSpeed);
    const rate = spec.turnRate * grip * bite * (handbrake ? 1.7 : 1) * Math.sign(car.speed || 1);
    car.heading = wrap(car.heading + steer * rate * dt);

    const follow = (handbrake ? VEHICLES.handbrakeGrip : VEHICLES.grip) * dt;
    car.travel += Math.max(-follow, Math.min(follow, wrap(car.heading - car.travel)));

    const dirX = -Math.sin(car.travel), dirZ = -Math.cos(car.travel), stepX = dirX * car.speed * dt;
    const stepZ = dirZ * car.speed * dt;
    if (stepX !== 0 || stepZ !== 0) {
      from.set(car.position.x, car.position.y + 0.7, car.position.z);
      to.set(from.x + stepX, from.y, from.z + stepZ);
      const hit = firstHit(from, to, city.colliders, spec.width * 0.45);
      if (hit < 1) {
        car.position.x = from.x + stepX * Math.max(0, hit - 0.01);
        car.position.z = from.z + stepZ * Math.max(0, hit - 0.01);
        car.speed = 0;
      } else {
        car.position.x = to.x;
        car.position.z = to.z;
      }
    }
    if (car.cooldown > 0) car.cooldown -= dt;
  }

  function boxOverlap(a, b) {
    const sa = Math.sin(a.heading), ca = Math.cos(a.heading), sb = Math.sin(b.heading), cb = Math.cos(b.heading);
    const axes = [
      [-sa, -ca],
      [ca, -sa],
      [-sb, -cb],
      [cb, -sb],
    ];
    const dx = b.position.x - a.position.x, dz = b.position.z - a.position.z;
    let smallest = null;
    const out = [];
    for (const axis of axes) {
      const ax = axis[0], az = axis[1];
      const ra = (a.spec.length / 2) * Math.abs(-sa * ax + -ca * az) + (a.spec.width / 2) * Math.abs(ca * ax + -sa * az);
      const rb = (b.spec.length / 2) * Math.abs(-sb * ax + -cb * az) + (b.spec.width / 2) * Math.abs(cb * ax + -sb * az);
      const distance = dx * ax + dz * az, depth = ra + rb - Math.abs(distance);
      if (depth <= 0) return null;
      const side = distance < 0 ? -1 : 1, hit = { depth, nx: ax * side, nz: az * side };
      out.push(hit);
      if (!smallest || depth < smallest.depth) smallest = hit;
    }
    return { axes: out, smallest };
  }

  function pushAxis(hit, vx, vz) {
    const speed = Math.hypot(vx, vz);
    if (speed < 0.5) return hit.smallest;
    let best = hit.smallest, bestDot = -Infinity;
    for (const axis of hit.axes) {
      const dot = (axis.nx * vx + axis.nz * vz) / speed;
      if (dot > bestDot) {
        bestDot = dot;
        best = axis;
      }
    }
    return best;
  }

  function shove(car, dx, dz) {
    car.position.x += dx;
    car.position.z += dz;
    if (car.ai) {
      car.pushX += dx;
      car.pushZ += dz;
    }
  }

  function resolveCollisions() {
    for (let i = 0; i < cars.length; i++) {
      const a = cars[i];
      if (!a.spec) continue;
      for (let j = i + 1; j < cars.length; j++) {
        const b = cars[j];
        if (!b.spec) continue;
        const reach = (a.spec.length + b.spec.length) * 0.5, dx = b.position.x - a.position.x;
        const dz = b.position.z - a.position.z;
        if (dx * dx + dz * dz > reach * reach) continue;
        const hit = boxOverlap(a, b);
        if (!hit) continue;
        const vx = -Math.sin(a.heading) * a.speed + Math.sin(b.heading) * b.speed;
        const vz = -Math.cos(a.heading) * a.speed + Math.cos(b.heading) * b.speed, axis = pushAxis(hit, vx, vz);
        const closing = Math.max(0, vx * axis.nx + vz * axis.nz);
        if (a === driven || b === driven) {
          const winner = a === driven ? a : b, other = a === driven ? b : a, side = a === driven ? 1 : -1;
          shove(other, axis.nx * side * (axis.depth + 0.02), axis.nz * side * (axis.depth + 0.02));
          winner.speed *= 0.55;
          other.speed *= 0.35;
          if (hitCallback && other.cooldown <= 0) {
            other.cooldown = 0.3;
            hitCallback(other, closing);
          }
        } else {
          shove(a, -axis.nx * axis.depth * 0.5, -axis.nz * axis.depth * 0.5);
          shove(b, axis.nx * axis.depth * 0.5, axis.nz * axis.depth * 0.5);
          a.speed *= 0.7;
          b.speed *= 0.7;
        }
      }
    }
  }

  function keepOffWalls(car) {
    const spot = unstick(car.position.x, car.position.z, car.spec.width * 0.5, car.position.y + 0.5, city.colliders);
    if (spot.x !== car.position.x || spot.z !== car.position.z) car.speed = 0;
    car.position.x = spot.x;
    car.position.z = spot.z;
  }

  function sitOnGround(car, dt) {
    const spec = car.spec, s = Math.sin(car.heading), c = Math.cos(car.heading), fx = -s, fz = -c, rx = c, rz = -s;
    const half = spec.length * 0.36, side = spec.width * 0.42, x = car.position.x, z = car.position.z;
    const fl = city.surfaceAt(x + fx * half - rx * side, z + fz * half - rz * side);
    const fr = city.surfaceAt(x + fx * half + rx * side, z + fz * half + rz * side);
    const rl = city.surfaceAt(x - fx * half - rx * side, z - fz * half - rz * side);
    const rr = city.surfaceAt(x - fx * half + rx * side, z - fz * half + rz * side);
    car.position.y = (fl + fr + rl + rr) / 4;

    const pitch = Math.max(-0.22, Math.min(0.22, Math.atan2((fl + fr) / 2 - (rl + rr) / 2, half * 2)));
    const roll = Math.max(-0.22, Math.min(0.22, Math.atan2((fr + rr) / 2 - (fl + rl) / 2, side * 2)));
    car.body.position.copy(car.position);
    car.body.rotation.set(pitch, car.heading, roll);

    const spin = (car.speed * dt) / VEHICLES.wheelRadius;
    for (const wheel of car.wheels) wheel.rotation.x -= spin;
  }

  const from = new Vector3(), to = new Vector3();

  function blockedAt(x, z) {
    const ground = city.surfaceAt(x, z);
    for (const collider of city.colliders) {
      if (collider.height <= ground + 0.3) continue;
      if (x > collider.minX - 0.5 && x < collider.maxX + 0.5 && z > collider.minZ - 0.5 && z < collider.maxZ + 0.5) return true;
    }
    return false;
  }

  function nearest(point, reach) {
    let best = null, bestDistance = reach;
    for (const car of cars) {
      const distance = Math.hypot(car.position.x - point.x, car.position.z - point.z);
      if (distance <= bestDistance) {
        bestDistance = distance;
        best = car;
      }
    }
    return best;
  }

  function enter() {
    if (driven) return null;
    const car = nearest(player.position, VEHICLES.enterReach);
    if (!car) return null;
    car.stolen = true;
    car.speed = 0;
    car.travel = car.heading;
    car.limit = car.spec.maxSpeed;
    car.pushX = 0;
    car.pushZ = 0;
    car.ai = false;
    driven = car;
    viewDirty = true;
    player.state = 'driving';
    player.velocity.set(0, 0, 0);
    player.position.copy(car.position);
    player.yaw = car.heading;
    return car;
  }

  function exit() {
    if (!driven) return null;
    const car = driven;
    car.speed = 0;
    car.travel = car.heading;
    driven = null;
    viewDirty = true;
    car.ai = true;
    snapToLane(car);
    sitOnGround(car, 0);

    const s = Math.sin(car.heading), c = Math.cos(car.heading), side = car.spec.width / 2 + 0.9;
    const behind = car.spec.length / 2 + 0.9;
    const spots = [
      [car.position.x + c * side, car.position.z - s * side],
      [car.position.x - c * side, car.position.z + s * side],
      [car.position.x + s * behind, car.position.z + c * behind],
      [car.position.x - s * behind, car.position.z - c * behind],
    ];
    let spot = spots[0];
    for (const candidate of spots) {
      if (!blockedAt(candidate[0], candidate[1])) {
        spot = candidate;
        break;
      }
    }
    player.position.set(spot[0], city.surfaceAt(spot[0], spot[1]), spot[1]);
    player.velocity.set(0, 0, 0);
    player.state = 'idle';
    return car;
  }

  function update(dt, input, onFoot) {
    if (!(dt > 0)) return;
    if (driven) drivePlayerCar(driven, dt, input);
    for (const car of cars) {
      if (car === driven || !car.ai) continue;
      driveTraffic(car, dt);
    }
    resolveCollisions();
    for (const car of cars) {
      if (!car.spec) continue;
      keepOffWalls(car);
      sitOnGround(car, dt);
    }
    if (driven) {
      player.position.copy(driven.position);
      player.yaw = driven.heading;
    }
  }

  const vehicles = {
    cars,
    get traffic() {
      if (viewDirty) {
        trafficView = cars.filter((car) => car !== driven);
        viewDirty = false;
      }
      return trafficView;
    },
    get drivenCar() {
      return driven;
    },
    update,
    enter,
    exit,
    nearest,
    onHit(fn) {
      hitCallback = fn;
    },
    roads: graph,
  };

  for (const car of cars) {
    sitOnGround(car, 0);
  }

  return vehicles;
}
