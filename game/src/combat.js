// The pistol, the health behind it and the rounds on the ground. One rule holds the file together: a
// round stops at the first wall, and that wall is found with geometry.firstHit against city.colliders —
// the same test the camera's boom and an officer's line of fire use. A bullet that passes through a
// building is the bug this arrangement exists to prevent, so the shot's reach is measured before any
// man is considered a target: a body past the wall is not behind a wall, he is out of the shot.

import { BoxGeometry, Mesh, MeshBasicMaterial, MeshLambertMaterial, Vector3 } from 'three';
import { COMBAT, PALETTE } from './config.js';
import { firstHit, merge, tintedBox } from './geometry.js';

// Where a round is aimed on a body. A man is not a point, and a shot that had to find his knees would
// read as a miss on someone standing in the open.
const CHEST = 1.05;
// The tracer starts past the near plane, so the muzzle flash is a flash and not the inside of the head.
const MUZZLE = 0.45;
const FLASH_SECONDS = 0.06;
const TRACER_SECONDS = 0.09;
const SPARK_SECONDS = 0.26;
const EFFECTS = 8;
const PICKUP_RISE = 0.3;
// Half a torso of slack around the line: the cone is narrow, but a body has width and the shot is not
// a laser pointed at his sternum.
const BODY_SLACK = 0.5;
const UP = new Vector3(0, 1, 0);

const AMMO_GEOMETRY = merge([
  tintedBox(0.34, 0.2, 0.26, '#4a5136', 0, 0.1, 0),
  tintedBox(0.36, 0.05, 0.28, PALETTE.roadLineYellow, 0, 0.22, 0),
  tintedBox(0.07, 0.06, 0.07, PALETTE.sun, 0, 0.26, 0),
]);
const AMMO_MATERIAL = new MeshLambertMaterial({ vertexColors: true, flatShading: true });
const EFFECT_GEOMETRY = new BoxGeometry(1, 1, 1);

function makePart(scene, colour, seconds) {
  const material = new MeshBasicMaterial({ color: colour, transparent: true, opacity: 1, depthWrite: false });
  const mesh = new Mesh(EFFECT_GEOMETRY, material);
  mesh.visible = false;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return { mesh, material, timer: 0, seconds };
}

export function createCombat({ scene, player, camera, peds, city }) {
  const state = { health: COMBAT.health, dead: false, ammo: COMBAT.magSize, reserve: COMBAT.ammoReserve };

  const listeners = [];
  const drops = [];
  const effects = [];
  let cooldown = 0;
  let clock = 0;
  let effectCursor = 0;

  // Spread needs a stream of small numbers and the world-shaping rule keeps Math.random out of the
  // game, so the pistol carries its own xorshift: same shots in the same order on every run.
  let noise = 0x2545f491;
  function scatter() {
    noise ^= noise << 13;
    noise >>>= 0;
    noise ^= noise >>> 17;
    noise ^= noise << 5;
    noise >>>= 0;
    return (noise / 4294967296) * 2 - 1;
  }

  for (let i = 0; i < EFFECTS; i++) {
    effects.push({
      flash: makePart(scene, PALETTE.sun, FLASH_SECONDS),
      tracer: makePart(scene, PALETTE.roadLineYellow, TRACER_SECONDS),
      spark: makePart(scene, PALETTE.sun, SPARK_SECONDS),
    });
  }

  const from = new Vector3();
  const to = new Vector3();
  const end = new Vector3();
  const dir = new Vector3();
  const right = new Vector3();
  const lift = new Vector3();
  const body = new Vector3();
  const muzzle = new Vector3();

  function fade(part, dt) {
    if (part.timer <= 0) return;
    part.timer = Math.max(0, part.timer - dt);
    if (part.timer <= 0) {
      part.mesh.visible = false;
      return;
    }
    part.material.opacity = part.timer / part.seconds;
  }

  function flashAndTrace(start, finish, direction) {
    const entry = effects[effectCursor % EFFECTS];
    effectCursor += 1;

    muzzle.copy(start).addScaledVector(direction, MUZZLE);

    entry.flash.mesh.position.copy(muzzle);
    entry.flash.mesh.scale.setScalar(0.17 + Math.abs(scatter()) * 0.05);
    entry.flash.mesh.visible = true;
    entry.flash.material.opacity = 1;
    entry.flash.timer = entry.flash.seconds;

    const span = Math.max(0.05, muzzle.distanceTo(finish));
    entry.tracer.mesh.position.copy(muzzle).add(finish).multiplyScalar(0.5);
    entry.tracer.mesh.lookAt(finish);
    entry.tracer.mesh.scale.set(0.035, 0.035, span);
    entry.tracer.mesh.visible = true;
    entry.tracer.material.opacity = 1;
    entry.tracer.timer = entry.tracer.seconds;

    entry.spark.mesh.position.copy(finish);
    entry.spark.mesh.scale.setScalar(0.18);
    entry.spark.mesh.visible = true;
    entry.spark.material.opacity = 1;
    entry.spark.timer = entry.spark.seconds;
  }

  // The nearest man standing in the cone, and only inside the reach the wall left. The order matters:
  // testing the men first and the wall second is how a round ends up killing somebody indoors.
  function targetInCone(reach) {
    let target = null;
    let nearest = Infinity;
    for (const ped of peds.list) {
      if (!ped || ped.state === 'down' || ped.health <= 0) continue;
      body.set(ped.position.x - from.x, ped.position.y + CHEST - from.y, ped.position.z - from.z);
      const along = body.dot(dir);
      if (along <= MUZZLE || along > reach) continue;
      const lateral = Math.sqrt(Math.max(0, body.lengthSq() - along * along));
      if (lateral > BODY_SLACK + along * COMBAT.cone) continue;
      if (along < nearest) {
        nearest = along;
        target = ped;
      }
    }
    return { target, distance: nearest };
  }

  function shoot() {
    // A man holding a wheel is not holding a pistol: the gun is stowed until he is out of the car.
    if (state.dead || player.state === 'driving') return false;
    if (state.ammo <= 0 || cooldown > 0) return false;

    state.ammo -= 1;
    cooldown = COMBAT.fireInterval;

    dir.set(0, 0, -1).applyQuaternion(camera.quaternion);
    right.crossVectors(dir, UP).normalize();
    lift.crossVectors(right, dir).normalize();
    dir.addScaledVector(right, scatter() * COMBAT.spread).addScaledVector(lift, scatter() * COMBAT.spread).normalize();

    from.copy(camera.position);
    to.copy(from).addScaledVector(dir, COMBAT.range);
    const reach = COMBAT.range * firstHit(from, to, city.colliders, 0);

    const shot = targetInCone(reach);
    end.copy(from).addScaledVector(dir, reach);

    let hit = false;
    let killed = false;
    if (shot.target) {
      hit = true;
      shot.target.health -= COMBAT.damage;
      killed = shot.target.health <= 0;
      end.copy(from).addScaledVector(dir, shot.distance);
    }

    flashAndTrace(from, end, dir);
    peds.alarm(player.position.x, player.position.z);

    const report = { hit, killed, from: muzzle.clone(), to: end.clone() };
    for (const fn of listeners) fn(report);
    return true;
  }

  function reload() {
    if (state.dead) return 0;
    const load = Math.min(COMBAT.magSize - state.ammo, state.reserve);
    if (load <= 0) return 0;
    state.ammo += load;
    state.reserve -= load;
    return load;
  }

  function damage(amount) {
    if (state.dead || !(amount > 0)) return;
    state.health = Math.max(0, state.health - amount);
    if (state.health <= 0) state.dead = true;
  }

  function revive() {
    state.health = COMBAT.reviveHealth;
    state.dead = false;
    state.ammo = COMBAT.magSize;
    state.reserve = COMBAT.ammoReserve;
  }

  function removeDrop(index) {
    scene.remove(drops[index].mesh);
    drops.splice(index, 1);
  }

  // The player's only resupply. The oldest box goes when the street is already littered, so a long
  // fight leaves a handful of pickups instead of a trail of them all session.
  function dropAmmo(x, z) {
    while (drops.length >= COMBAT.maxDrops) removeDrop(0);
    const mesh = new Mesh(AMMO_GEOMETRY, AMMO_MATERIAL);
    mesh.castShadow = true;
    const ground = city.surfaceAt(x, z);
    mesh.position.set(x, ground + PICKUP_RISE, z);
    scene.add(mesh);
    drops.push({ x, z, ground, mesh, spin: 0 });
  }

  function update(dt) {
    if (dt > 0) {
      cooldown = Math.max(0, cooldown - dt);
      clock += dt;
    }

    for (const entry of effects) {
      fade(entry.flash, dt);
      fade(entry.tracer, dt);
      fade(entry.spark, dt);
    }

    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i];
      drop.spin += dt * 2.2;
      drop.mesh.rotation.y = drop.spin;
      drop.mesh.position.y = drop.ground + PICKUP_RISE + Math.sin(clock * 3 + drop.x) * 0.07;
      const dx = player.position.x - drop.x;
      const dz = player.position.z - drop.z;
      if (Math.hypot(dx, dz) > COMBAT.dropReach) continue;
      if (Math.abs(player.position.y - drop.ground) > 1.6) continue;
      state.reserve += COMBAT.magSize;
      removeDrop(i);
    }
  }

  return {
    state,
    update,
    shoot,
    reload,
    damage,
    revive,
    onFire(fn) {
      if (typeof fn === 'function') listeners.push(fn);
    },
    dropAmmo,
  };
}
