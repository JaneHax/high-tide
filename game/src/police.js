// The police: heat and stars, cruisers that drive the city's grid, and officers who get out and shoot.
// Every line of fire is geometry.firstHit at chest height, so a wall stops a round the way it stops the
// camera's boom.
//
// The siren lights are a fixed pool built once and parked under the world: a PointLight added when a
// chase starts recompiles every lit shader in the scene and stutters the frame the player feels.
import { BoxGeometry, Color, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, PointLight, Vector3 } from 'three';
import { COMBAT, PALETTE, POLICE } from './config.js';
import { firstHit, merge, tintedBox } from './geometry.js';

const CHEST = 1.25;
const PLAYER_CHEST = 1.1;
const ROOF = 1.55;
const OFFICER_RADIUS = 0.42;
const CRUISER = { length: 4.9, width: 2.0, height: 1.5 };
const WHEEL = 0.36;

const RED_ON = new Color(PALETTE.sirenRed);
const BLUE_ON = new Color(PALETTE.sirenBlue);
const RED_OFF = new Color(PALETTE.sirenRed).multiplyScalar(0.22);
const BLUE_OFF = new Color(PALETTE.sirenBlue).multiplyScalar(0.22);

const SHELL_MATERIAL = new MeshLambertMaterial({ vertexColors: true, flatShading: true });

const SIDES = [-1, 1];

const SHELL_GEOMETRY = merge([
  tintedBox(CRUISER.width, 0.62, CRUISER.length, PALETTE.wallCream, 0, WHEEL + 0.31, 0),
  tintedBox(CRUISER.width * 1.01, 0.2, CRUISER.length * 0.66, PALETTE.sirenBlue, 0, WHEEL + 0.42, 0),
  tintedBox(CRUISER.width * 0.84, 0.5, CRUISER.length * 0.44, PALETTE.asphalt, 0, WHEEL + 0.84, CRUISER.length * 0.02),
  tintedBox(CRUISER.width * 0.8, 0.1, CRUISER.length * 0.42, PALETTE.wallCream, 0, WHEEL + 1.12, CRUISER.length * 0.02),
  ...SIDES.flatMap((s) => [
    tintedBox(CRUISER.width * 1.02, 0.24, 0.34, PALETTE.asphalt, 0, WHEEL + 0.16, s * (CRUISER.length / 2 - 0.16)),
    tintedBox(0.3, 0.72, 0.72, '#14151a', s * (CRUISER.width / 2 - 0.14), WHEEL, -CRUISER.length / 2 + 1.05),
    tintedBox(0.3, 0.72, 0.72, '#14151a', s * (CRUISER.width / 2 - 0.14), WHEEL, CRUISER.length / 2 - 1.05),
  ]),
]);

const OFFICER_GEOMETRY = merge([
  tintedBox(0.44, 0.5, 0.27, PALETTE.sirenBlue, 0, 1.13, 0),
  tintedBox(0.52, 0.14, 0.29, PALETTE.asphalt, 0, 1.36, 0),
  tintedBox(0.24, 0.26, 0.24, PALETTE.sand, 0, 1.6, 0),
  tintedBox(0.29, 0.09, 0.29, PALETTE.asphalt, 0, 1.76, 0),
  ...SIDES.flatMap((s) => [
    tintedBox(0.15, 0.34, 0.17, PALETTE.sirenBlue, s * 0.31, 1.19, 0),
    tintedBox(0.12, 0.28, 0.13, PALETTE.sand, s * 0.31, 0.88, 0),
    tintedBox(0.17, 0.72, 0.2, PALETTE.asphalt, s * 0.13, 0.36, 0),
  ]),
]);

const BAR_GEOMETRY = new BoxGeometry(0.34, 0.14, 0.9);

function wrap(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function nearestOf(list, value) {
  let best = list[0], gap = Math.abs(value - best);
  for (const entry of list) {
    const distance = Math.abs(entry - value);
    if (distance < gap) {
      gap = distance;
      best = entry;
    }
  }
  return best;
}

function starsFor(heat) {
  if (!(heat > 0)) return 0;
  return Math.min(POLICE.maxStars, Math.floor(heat / POLICE.heatPerStar));
}

export function createPolice({ city, scene, player, combat }) {
  const cars = [], officers = [], lights = [], from = new Vector3(), to = new Vector3();
  let clock = 0, quiet = 0, dropCallback = null;

  const api = {
    cars,
    officers,
    heat: 0,
    stars: 0,
    escape: 0,
    seen: false,
    shots: 0,
    update,
    addHeat,
    clear,
    onDrop(fn) {
      dropCallback = typeof fn === 'function' ? fn : null;
    },
  };

  for (let i = 0; i < POLICE.carCount; i++) {
    const light = new PointLight(RED_ON, 0, 26, 2);
    light.position.set(0, -1000, 0);
    light.castShadow = false;
    scene.add(light);
    lights.push(light);
  }

  function clearLine(point, height, targetHeight) {
    from.set(point.x, point.y + height, point.z);
    to.set(player.position.x, player.position.y + targetHeight, player.position.z);
    return firstHit(from, to, city.colliders, 0) >= 1;
  }

  function canSee(point) {
    const dx = point.x - player.position.x, dz = point.z - player.position.z;
    if (dx * dx + dz * dz > POLICE.sightRange * POLICE.sightRange) return false;
    return clearLine(point, CHEST, PLAYER_CHEST);
  }

  function makeSiren() {
    const red = new MeshBasicMaterial({ color: PALETTE.sirenRed });
    const blue = new MeshBasicMaterial({ color: PALETTE.sirenBlue }), group = new Group();
    const left = new Mesh(BAR_GEOMETRY, red), right = new Mesh(BAR_GEOMETRY, blue);
    left.position.set(-0.22, ROOF, 0);
    right.position.set(0.22, ROOF, 0);
    group.add(left);
    group.add(right);
    return { group, materials: [red, blue] };
  }

  function spawnSpot() {
    const px = player.position.x, pz = player.position.z;
    let best = null, near = null;
    for (const x of city.roads.zRoads) {
      for (const z of city.roads.xRoads) {
        const distance = Math.hypot(x - px, z - pz);
        if (!near || distance < near.distance) near = { x, z, distance };
        if (distance < POLICE.spawnDistance * 0.55 || distance > POLICE.spawnDistance * 1.7) continue;
        const score = Math.abs(distance - POLICE.spawnDistance);
        if (!best || score < best.score) best = { x, z, score };
      }
    }
    // The promenade and the hills have no grid at their door, so the nearest junction is the answer there.
    best = best || near || { x: px + POLICE.spawnDistance, z: pz };
    if (cars.length) {
      const dx = px - best.x, dz = pz - best.z, span = Math.hypot(dx, dz) || 1, gap = cars.length * 7;
      return { x: best.x + (dx / span) * gap, z: best.z + (dz / span) * gap };
    }
    return { x: best.x, z: best.z };
  }

  function spawnCar() {
    const spot = spawnSpot(), body = new Group();
    body.rotation.order = 'YXZ';
    const shell = new Mesh(SHELL_GEOMETRY, SHELL_MATERIAL);
    shell.castShadow = true;
    body.add(shell);
    const lightbar = makeSiren();
    body.add(lightbar.group);
    scene.add(body);

    const car = {
      position: new Vector3(spot.x, city.surfaceAt(spot.x, spot.z), spot.z),
      heading: 0,
      speed: 0,
      body,
      lightbar,
      spec: { length: CRUISER.length, width: CRUISER.width, height: CRUISER.height, maxSpeed: POLICE.carSpeed, colour: PALETTE.wallCream },
      sirenOn: true,
      crew: POLICE.officersPerCar,
      retire: false,
      retireTarget: null,
      route: [],
      leg: 0,
      goal: null,
      lane: ((cars.length % 3) - 1) * 3.2,
    };
    car.heading = Math.atan2(-(player.position.x - spot.x), -(player.position.z - spot.z));
    body.position.copy(car.position);
    body.rotation.y = car.heading;
    cars.push(car);
    return car;
  }

  function dropCar(index) {
    const car = cars[index];
    scene.remove(car.body);
    for (const material of car.lightbar.materials) material.dispose();
    cars.splice(index, 1);
  }

  function addOfficer(x, z, heading) {
    const mesh = new Mesh(OFFICER_GEOMETRY, SHELL_MATERIAL);
    mesh.castShadow = true;
    const officer = {
      position: new Vector3(x, city.surfaceAt(x, z), z),
      heading,
      health: POLICE.officerHealth,
      mesh,
      cooldown: 0.35 + officers.length * 0.25,
      down: false,
      retire: false,
    };
    mesh.rotation.order = 'YXZ';
    mesh.position.copy(officer.position);
    mesh.rotation.y = heading;
    scene.add(mesh);
    officers.push(officer);
    return officer;
  }

  function dismount(car) {
    if (car.retire || car.crew <= 0 || api.stars < 2) return;
    const distance = Math.hypot(player.position.x - car.position.x, player.position.z - car.position.z);
    const parked = Math.abs(car.speed) < 0.3;
    if (distance > POLICE.dismountRange && !(parked && distance <= POLICE.sightRange)) return;
    const rightX = Math.cos(car.heading), rightZ = -Math.sin(car.heading);
    for (let i = 0; i < car.crew; i++) {
      const side = i % 2 === 0 ? 1 : -1, offset = side * (CRUISER.width / 2 + 0.9);
      addOfficer(car.position.x + rightX * offset, car.position.z + rightZ * offset, car.heading);
    }
    car.crew = 0;
  }

  function down(officer) {
    if (officer.down) return;
    officer.down = true;
    officer.health = 0;
    officer.mesh.position.copy(officer.position);
    officer.mesh.position.y += 0.2;
    officer.mesh.rotation.set(-Math.PI / 2, officer.heading, 0);
    if (dropCallback) dropCallback(officer.position.x, officer.position.z);
  }

  function stepOfficer(officer, dx, dz) {
    if (!dx && !dz) return false;
    from.set(officer.position.x, officer.position.y + 1, officer.position.z);
    to.set(officer.position.x + dx, officer.position.y + 1, officer.position.z + dz);
    if (firstHit(from, to, city.colliders, OFFICER_RADIUS) < 1) return false;
    officer.position.x = to.x;
    officer.position.z = to.z;
    officer.position.y = city.surfaceAt(officer.position.x, officer.position.z);
    return true;
  }

  function updateOfficer(officer, dt) {
    if (officer.health <= 0) {
      down(officer);
      return;
    }
    if (officer.down) return;

    officer.cooldown = Math.max(0, officer.cooldown - dt);
    const dx = player.position.x - officer.position.x, dz = player.position.z - officer.position.z;
    const distance = Math.hypot(dx, dz);

    if (officer.retire) {
      if (distance > 1e-3) {
        const step = POLICE.officerSpeed * dt, mx = -(dx / distance) * step, mz = -(dz / distance) * step;
        if (!stepOfficer(officer, mx, mz)) {
          if (!stepOfficer(officer, mx, 0)) stepOfficer(officer, 0, mz);
        }
        officer.heading = Math.atan2(-mx, -mz);
      }
      officer.mesh.position.copy(officer.position);
      officer.mesh.rotation.set(0, officer.heading, 0);
      return;
    }

    if (distance > POLICE.officerHoldRange && distance > 1e-3) {
      const step = Math.min(POLICE.officerSpeed * dt, distance - POLICE.officerHoldRange);
      const mx = (dx / distance) * step, mz = (dz / distance) * step;
      if (!stepOfficer(officer, mx, mz)) {
        if (!stepOfficer(officer, mx, 0)) stepOfficer(officer, 0, mz);
      }
      officer.heading = Math.atan2(-dx, -dz);
    }

    if (distance <= POLICE.officerShootRange && officer.cooldown <= 0 && clearLine(officer.position, CHEST, PLAYER_CHEST)) {
      officer.cooldown = POLICE.officerFireInterval;
      api.shots += 1;
      combat.damage(POLICE.officerDamage);
    }

    officer.mesh.position.copy(officer.position);
    officer.mesh.rotation.set(0, officer.heading, 0);
  }

  function planRoute(car, goalX, goalZ) {
    const sx = nearestOf(city.roads.zRoads, car.position.x), sz = nearestOf(city.roads.xRoads, car.position.z);
    const ex = nearestOf(city.roads.zRoads, goalX), ez = nearestOf(city.roads.xRoads, goalZ);
    const onVertical = Math.abs(car.position.x - sx) < Math.abs(car.position.z - sz);
    car.route = [];
    if (onVertical) {
      if (Math.abs(sz - ez) > 1) car.route.push({ x: sx, z: ez });
      if (Math.abs(sx - ex) > 1) car.route.push({ x: ex, z: ez });
    } else {
      if (Math.abs(sx - ex) > 1) car.route.push({ x: ex, z: sz });
      if (Math.abs(sz - ez) > 1) car.route.push({ x: ex, z: ez });
    }
    car.leg = 0;
  }

  function currentTarget(car) {
    while (car.leg < car.route.length) {
      const target = car.route[car.leg];
      if (Math.hypot(target.x - car.position.x, target.z - car.position.z) < 7) {
        car.leg += 1;
        continue;
      }
      return target;
    }
    car.route = [];
    return null;
  }

  function farthestJunction() {
    let best = null;
    for (const x of city.roads.zRoads) {
      for (const z of city.roads.xRoads) {
        const distance = Math.hypot(x - player.position.x, z - player.position.z);
        if (!best || distance > best.distance) best = { x, z, distance };
      }
    }
    return best || { x: 0, z: 0 };
  }

  function drive(car, dt) {
    const goalX = car.retire && car.retireTarget ? car.retireTarget.x : nearestOf(city.roads.zRoads, player.position.x);
    const goalZ = car.retire && car.retireTarget ? car.retireTarget.z : nearestOf(city.roads.xRoads, player.position.z);
    const toPlayer = Math.hypot(player.position.x - car.position.x, player.position.z - car.position.z);
    const atGoal = Math.hypot(goalX - car.position.x, goalZ - car.position.z) < 7;
    const holding = !car.retire && (toPlayer < POLICE.dismountRange || atGoal);

    const moved = !car.goal || Math.abs(car.goal.x - goalX) > 1 || Math.abs(car.goal.z - goalZ) > 1;
    if (holding) car.route = [];
    else if (car.route.length === 0 || moved) planRoute(car, goalX, goalZ);
    car.goal = { x: goalX, z: goalZ };

    const target = holding ? null : currentTarget(car);
    let wantedSpeed = 0;
    if (target) {
      const dx = target.x - car.position.x, dz = target.z - car.position.z, span = Math.hypot(dx, dz) || 1;
      const aimX = target.x - (dz / span) * car.lane, aimZ = target.z + (dx / span) * car.lane;
      const wanted = Math.atan2(-(aimX - car.position.x), -(aimZ - car.position.z));
      const error = Math.abs(wrap(wanted - car.heading));
      const turn = POLICE.carTurnRate * dt * (0.35 + Math.min(1, Math.abs(car.speed) / 8));
      car.heading += Math.max(-turn, Math.min(turn, wrap(wanted - car.heading)));
      wantedSpeed = POLICE.carSpeed * Math.max(0.28, 1 - error / Math.PI);
    }

    const rate = wantedSpeed > car.speed ? 8 : 16;
    car.speed += Math.max(-rate * dt, Math.min(rate * dt, wantedSpeed - car.speed));

    if (Math.abs(car.speed) > 1e-3) {
      const stepX = -Math.sin(car.heading) * car.speed * dt, stepZ = -Math.cos(car.heading) * car.speed * dt;
      from.set(car.position.x, car.position.y + 1, car.position.z);
      to.set(car.position.x + stepX, car.position.y + 1, car.position.z + stepZ);
      if (firstHit(from, to, city.colliders, CRUISER.width / 2) >= 1) {
        car.position.x = to.x;
        car.position.z = to.z;
      } else {
        car.speed = 0;
      }
    }

    car.position.y = city.surfaceAt(car.position.x, car.position.z);
    car.body.position.copy(car.position);
    car.body.rotation.y = car.heading;
  }

  function playerCanSee(point, height) {
    const dx = point.x - player.position.x, dz = point.z - player.position.z;
    if (dx * dx + dz * dz > POLICE.sightRange * POLICE.sightRange) return false;
    from.set(player.position.x, player.position.y + PLAYER_CHEST, player.position.z);
    to.set(point.x, point.y + height, point.z);
    return firstHit(from, to, city.colliders, 0) >= 1;
  }

  function retireSurplus() {
    let active = 0;
    for (const car of cars) if (!car.retire) active += 1;
    const allowed = Math.min(POLICE.carCount, api.stars);
    for (const car of cars) {
      if (active <= allowed) break;
      if (car.retire) continue;
      car.retire = true;
      car.crew = 0;
      car.sirenOn = false;
      car.route = [];
      car.retireTarget = farthestJunction();
      active -= 1;
    }
  }

  function retireCars() {
    for (let i = cars.length - 1; i >= 0; i--) {
      const car = cars[i];
      if (!car.retire) continue;
      const distance = Math.hypot(car.position.x - player.position.x, car.position.z - player.position.z);
      if (distance > POLICE.spawnDistance || !playerCanSee(car.position, CHEST)) dropCar(i);
    }
  }

  function retireOfficers() {
    for (let i = officers.length - 1; i >= 0; i--) {
      const officer = officers[i];
      if (officer.down || !officer.retire) continue;
      const distance = Math.hypot(officer.position.x - player.position.x, officer.position.z - player.position.z);
      if (distance > POLICE.spawnDistance || !playerCanSee(officer.position, CHEST)) {
        scene.remove(officer.mesh);
        officers.splice(i, 1);
      }
    }
  }

  function updateLights() {
    for (const light of lights) {
      light.intensity = 0;
      light.position.set(0, -1000, 0);
    }
    let slot = 0;
    for (const car of cars) {
      const materials = car.lightbar.materials, on = car.sirenOn && !car.retire;
      const flash = Math.sin(clock * 9 + slot) > 0;
      materials[0].color.copy(on && flash ? RED_ON : RED_OFF);
      materials[1].color.copy(on && !flash ? BLUE_ON : BLUE_OFF);
      if (!on || slot >= lights.length) continue;
      const light = lights[slot];
      slot += 1;
      light.position.set(car.position.x, car.position.y + ROOF + 0.35, car.position.z);
      light.color.copy(flash ? RED_ON : BLUE_ON);
      light.intensity = 5.5 + Math.abs(Math.sin(clock * 9)) * 3;
    }
  }

  function handleShot(report) {
    api.heat += POLICE.heatShot;
    quiet = 0;
    if (report.hit) api.heat += POLICE.heatShot;
    if (report.killed) api.heat += POLICE.heatKill;

    const a = report.from, b = report.to, dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const span = dx * dx + dy * dy + dz * dz;
    if (span > 1e-6) {
      let struck = null, nearest = Infinity;
      for (const officer of officers) {
        if (officer.down) continue;
        const px = officer.position.x - a.x, py = officer.position.y + CHEST - a.y, pz = officer.position.z - a.z;
        const t = Math.max(0, Math.min(1, (px * dx + py * dy + pz * dz) / span)), cx = px - dx * t;
        const cy = py - dy * t, cz = pz - dz * t;
        if (Math.sqrt(cx * cx + cy * cy + cz * cz) > OFFICER_RADIUS) continue;
        const along = t * Math.sqrt(span);
        if (along < nearest) {
          nearest = along;
          struck = officer;
        }
      }
      if (struck) {
        struck.health -= COMBAT.damage;
        if (struck.health <= 0) {
          down(struck);
          api.heat += POLICE.heatKill;
        } else {
          api.heat += POLICE.heatShot;
        }
      }
    }

    api.heat = Math.max(0, api.heat);
    api.stars = starsFor(api.heat);
    if (api.stars > 0 && api.escape <= 0) api.escape = POLICE.escapeSeconds;
  }

  combat.onFire(handleShot);

  function addHeat(n) {
    if (!(n > 0)) return;
    api.heat += n;
    api.stars = starsFor(api.heat);
    if (api.stars > 0 && api.escape <= 0) api.escape = POLICE.escapeSeconds;
    quiet = 0;
  }

  function callOff() {
    api.heat = 0;
    api.stars = 0;
    api.escape = 0;
    quiet = 0;
  }

  function update(dt) {
    if (!(dt > 0)) return;
    clock += dt;
    api.stars = starsFor(api.heat);

    let sighted = false;
    for (const officer of officers) {
      if (officer.down) continue;
      if (canSee(officer.position)) {
        sighted = true;
        break;
      }
    }
    if (!sighted) {
      for (const car of cars) {
        if (canSee(car.position)) {
          sighted = true;
          break;
        }
      }
    }
    api.seen = sighted;

    if (api.stars > 0) {
      if (sighted) {
        quiet = 0;
        api.escape = POLICE.escapeSeconds;
      } else {
        quiet += dt;
        api.escape = Math.max(0, api.escape - dt);
        if (quiet > POLICE.decayDelay) api.heat = Math.max(0, api.heat - POLICE.decayRate * dt);
        if (api.escape <= 0) callOff();
      }
    } else {
      api.escape = 0;
    }

    let active = 0;
    for (const car of cars) if (!car.retire) active += 1;
    const wanted = Math.min(POLICE.carCount, api.stars);
    while (active < wanted) {
      spawnCar();
      active += 1;
    }
    retireSurplus();

    const crewPaid = api.stars >= 2;
    for (const officer of officers) if (!officer.down) officer.retire = !crewPaid;

    for (const car of cars) drive(car, dt);
    for (const car of cars) dismount(car);
    for (const officer of officers) updateOfficer(officer, dt);
    retireCars();
    retireOfficers();
    updateLights();
  }

  function clear() {
    api.heat = 0;
    api.stars = 0;
    api.escape = 0;
    api.seen = false;
    api.shots = 0;
    quiet = 0;
    while (cars.length) dropCar(cars.length - 1);
    for (const officer of officers) scene.remove(officer.mesh);
    officers.length = 0;
    for (const light of lights) {
      light.intensity = 0;
      light.position.set(0, -1000, 0);
    }
  }

  return api;
}
