// Rico, the player on foot. A simple two-tone figure: dark jacket, jeans,
// a cap. Walks with WASD relative to the camera, sprints with Shift,
// and turns to face the direction he moves.
import * as THREE from 'three';
import { PLAYER } from './config.js';
import { box, ball, place, groupAt } from './geometry.js';

export function createPlayer(scene, city) {
  const body = groupAt(-40, 0, 96);
  const torso = box(0.9, 1.0, 0.5, 0x2c3e50);
  place(torso, 0, 1.15, 0);
  body.add(torso);
  const head = ball(0.32, 0xd9a986);
  place(head, 0, 1.95, 0);
  body.add(head);
  const cap = box(0.6, 0.16, 0.6, 0xc93c3c);
  place(cap, 0, 2.2, 0);
  body.add(cap);
  const legL = box(0.32, 0.8, 0.36, 0x2e4a6a);
  place(legL, -0.24, 0.4, 0);
  body.add(legL);
  const legR = box(0.32, 0.8, 0.36, 0x2e4a6a);
  place(legR, 0.24, 0.4, 0);
  body.add(legR);
  const armL = box(0.26, 0.85, 0.3, 0x2c3e50);
  place(armL, -0.6, 1.15, 0);
  body.add(armL);
  const armR = box(0.26, 0.85, 0.3, 0x2c3e50);
  place(armR, 0.6, 1.15, 0);
  body.add(armR);
  scene.add(body);

  const state = {
    position: body.position,
    heading: 0,
    speed: 0,
    health: PLAYER.health,
    alive: true,
    onGround: true,
  };
  let walkPhase = 0;

  function clampToWorld(p) {
    p.x = Math.max(-WORLD_HALF(), Math.min(WORLD_HALF(), p.x));
    p.z = Math.max(-WORLD_HALF(), Math.min(206, p.z));
  }
  function WORLD_HALF() { return 198; }

  function update(dt, input, camYaw, driving, boating) {
    if (!state.alive || driving || boating) return;
    const axis = input.axis();
    if (axis.x === 0 && axis.y === 0) {
      state.speed = 0;
      return;
    }
    const target = input.sprint() ? PLAYER.sprint : PLAYER.walk;
    state.speed = target;
    // Movement is relative to the camera yaw.
    const sin = Math.sin(camYaw), cos = Math.cos(camYaw);
    let mx = axis.x * cos - axis.y * sin;
    let mz = axis.x * sin + axis.y * cos;
    const len = Math.hypot(mx, mz) || 1;
    mx /= len; mz /= len;
    const p = state.position;
    p.x += mx * target * dt;
    p.z += mz * target * dt;
    clampToWorld(p);
    p.y = city.surfaceAt(p.x, p.z);
    state.heading = Math.atan2(mx, mz);
    body.rotation.y = state.heading;
    // Little walk swing so he reads as moving, not sliding.
    walkPhase += dt * target * 1.6;
    const swing = Math.sin(walkPhase) * 0.35;
    legL.rotation.x = swing;
    legR.rotation.x = -swing;
    armL.rotation.x = -swing * 0.8;
    armR.rotation.x = swing * 0.8;
  }

  function damage(amount) {
    if (!state.alive) return;
    state.health = Math.max(0, state.health - amount);
    if (state.health <= 0) state.alive = false;
  }

  function heal(amount) {
    state.health = Math.min(PLAYER.health, state.health + amount);
  }

  function teleport(x, z) {
    state.position.set(x, city.surfaceAt(x, z), z);
  }

  return { body, state, update, damage, heal, teleport };
}
