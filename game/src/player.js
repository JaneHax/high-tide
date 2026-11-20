// Rico on foot. Six welded meshes, one per moving part, so the whole figure costs six draws; a circle
// that slides along the city's boxes instead of catching on them; and a stride driven by the speed he
// is actually doing, because a leg swinging at a fixed rate is what makes a run look like a walk.
// The city owns the ground and the walls — this file asks surfaceAt and never keeps a height table.

import { Group, Mesh, MeshLambertMaterial, Vector3 } from 'three';
import { PALETTE, PLAYER, WORLD } from './config.js';
import { firstHit, merge, tintedBox } from './geometry.js';

const HIP = 0.86;
const SHOULDER = 0.5;
const HEAD = 0.74;
const SKIN = PALETTE.sand;
const SHIRT = PALETTE.sea;
const TROUSERS = PALETTE.asphalt;
const HAIR = PALETTE.roof;

// One material for every part: the colour lives in the vertices, so the six meshes are one look and
// one shader, and flat shading keeps Rico in the same low-poly language as the city.
const MATERIAL = new MeshLambertMaterial({ vertexColors: true, flatShading: true });

// Each part is built around its own joint, so a rotation at the mesh origin is the joint turning: the
// torso and arms hang from the hip and shoulder, the legs and arms run downward from y = 0.
function torsoGeometry() {
  return merge([
    tintedBox(0.44, 0.5, 0.27, SHIRT, 0, 0.27, 0),
    tintedBox(0.52, 0.14, 0.29, SHIRT, 0, 0.5, 0),
    tintedBox(0.46, 0.1, 0.28, HAIR, 0, 0.02, 0),
  ]);
}

function headGeometry() {
  return merge([
    tintedBox(0.24, 0.26, 0.24, SKIN, 0, 0, 0),
    tintedBox(0.26, 0.09, 0.26, HAIR, 0, 0.16, 0),
    tintedBox(0.2, 0.05, 0.03, PALETTE.asphalt, 0, 0.02, -0.12),
  ]);
}

function armGeometry() {
  return merge([
    tintedBox(0.15, 0.34, 0.17, SHIRT, 0, -0.17, 0),
    tintedBox(0.12, 0.28, 0.13, SKIN, 0, -0.46, 0),
    tintedBox(0.13, 0.1, 0.15, SKIN, 0, -0.65, 0),
  ]);
}

function legGeometry() {
  return merge([
    tintedBox(0.17, 0.72, 0.2, TROUSERS, 0, -0.36, 0),
    tintedBox(0.19, 0.14, 0.3, HAIR, 0, -0.79, -0.05),
  ]);
}

function part(geometry) {
  const mesh = new Mesh(geometry, MATERIAL);
  mesh.castShadow = true;
  return mesh;
}

function wrap(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function createPlayer({ city, scene, spawn }) {
  const group = new Group();
  const body = part(torsoGeometry());
  const head = part(headGeometry());
  const armLeft = part(armGeometry());
  const armRight = part(armGeometry());
  const legLeft = part(legGeometry());
  const legRight = part(legGeometry());

  body.position.y = HIP;
  head.position.y = HEAD;
  armLeft.position.set(-0.31, SHOULDER, 0);
  armRight.position.set(0.31, SHOULDER, 0);
  legLeft.position.set(-0.13, HIP, 0);
  legRight.position.set(0.13, HIP, 0);

  // The head and arms are the torso's children: when Rico leans into a run they lean with him instead
  // of sliding off his neck.
  body.add(head);
  body.add(armLeft);
  body.add(armRight);
  group.add(body);
  group.add(legLeft);
  group.add(legRight);
  scene.add(group);

  const player = {
    group,
    position: new Vector3(spawn.x, city.surfaceAt(spawn.x, spawn.z), spawn.z),
    velocity: new Vector3(),
    yaw: spawn.yaw,
    speed: 0,
    state: 'idle',
    radius: PLAYER.radius,
    height: PLAYER.height,
    // The follow camera is handed the player and nothing else, so the city's boxes travel with him.
    colliders: city.colliders,
    update(dt, input, cameraYaw) {},
  };

  const from = new Vector3();
  const to = new Vector3();
  let grounded = true;
  let stride = 0;

  // One axis at a time is what turns a stop into a slide: the axis that runs into the box is refused
  // and the other one still carries him along the face.
  function slide(dx, dz) {
    const length = Math.hypot(dx, dz);
    if (length < 1e-7) return;
    from.set(player.position.x, player.position.y + PLAYER.stepHeight, player.position.z);
    to.set(from.x + dx, from.y, from.z + dz);
    const hit = firstHit(from, to, city.colliders, PLAYER.radius);
    if (hit >= 1) {
      player.position.x = to.x;
      player.position.z = to.z;
      return;
    }
    // Stopping a hair short of the padded face keeps the next step from starting inside it.
    const safe = Math.max(0, hit - 0.002 / length);
    player.position.x = from.x + dx * safe;
    player.position.z = from.z + dz * safe;
  }

  // The ray test treats Rico as a point with a padding; this puts the circle back, so a body that is
  // already overlapping a box — a spawn, a teleport, a corner cut — is pushed out the short way.
  function pushOut() {
    const top = player.position.y + PLAYER.stepHeight;
    for (const collider of city.colliders) {
      if (collider.height <= top) continue;
      const x = player.position.x;
      const z = player.position.z;
      const minX = collider.minX - PLAYER.radius;
      const maxX = collider.maxX + PLAYER.radius;
      const minZ = collider.minZ - PLAYER.radius;
      const maxZ = collider.maxZ + PLAYER.radius;
      if (x <= minX || x >= maxX || z <= minZ || z >= maxZ) continue;
      const west = x - minX;
      const east = maxX - x;
      const south = z - minZ;
      const north = maxZ - z;
      const least = Math.min(west, east, south, north);
      if (least === west) player.position.x = minX;
      else if (least === east) player.position.x = maxX;
      else if (least === south) player.position.z = minZ;
      else player.position.z = maxZ;
    }
  }

  function pose(dt) {
    const speed = player.speed;
    // The swing follows the pace — 0.45 rad at a walk, 0.72 at a run — and the cycle rate grows with
    // the metres covered, so a run both swings wider and steps faster instead of striding in slow
    // motion. Both come from the speed he has, not from the key that was held.
    const swing = 0.45 * Math.min(1.6, speed / PLAYER.walkSpeed);
    stride = (stride + speed * 2.2 * dt) % (Math.PI * 2);
    const angle = Math.sin(stride) * swing;

    if (player.state === 'jump') {
      legLeft.rotation.x = 0.55;
      legRight.rotation.x = -0.35;
      armLeft.rotation.x = -0.85;
      armRight.rotation.x = -0.85;
      body.rotation.x = -0.1;
    } else if (player.state === 'dead') {
      legLeft.rotation.x = 0.22;
      legRight.rotation.x = 0.12;
      armLeft.rotation.x = 0.45;
      armRight.rotation.x = 0.3;
      body.rotation.x = 0.38;
    } else {
      legLeft.rotation.x = angle;
      legRight.rotation.x = -angle;
      armLeft.rotation.x = -angle * 0.8;
      armRight.rotation.x = angle * 0.8;
      body.rotation.x = -0.16 * Math.min(1, speed / PLAYER.runSpeed);
    }
  }

  function sync() {
    group.position.copy(player.position);
    group.rotation.y = player.yaw;
  }

  player.update = function update(dt, input, cameraYaw) {
    if (player.state === 'dead') {
      player.velocity.set(0, 0, 0);
      player.speed = 0;
      pose(dt);
      sync();
      return;
    }

    if (player.state === 'driving') {
      group.visible = false;
      sync();
      return;
    }

    group.visible = true;

    // Whoever moved him last — vehicles.exit, a respawn — may have put him down on different ground,
    // so the ground is re-read before anything is integrated.
    const floor = city.surfaceAt(player.position.x, player.position.z);
    if (player.position.y <= floor + 0.02 && player.velocity.y <= 0) {
      player.position.y = floor;
      player.velocity.y = 0;
      grounded = true;
    }

    const forward = (input.isDown('KeyW') ? 1 : 0) - (input.isDown('KeyS') ? 1 : 0);
    const strafe = (input.isDown('KeyD') ? 1 : 0) - (input.isDown('KeyA') ? 1 : 0);
    let wishX = 0;
    let wishZ = 0;
    if (forward || strafe) {
      const sin = Math.sin(cameraYaw);
      const cos = Math.cos(cameraYaw);
      wishX = -sin * forward + cos * strafe;
      wishZ = -cos * forward - sin * strafe;
      const length = Math.hypot(wishX, wishZ);
      wishX /= length;
      wishZ /= length;
    }

    const running = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    const top = running ? PLAYER.runSpeed : PLAYER.walkSpeed;
    const rate = wishX || wishZ ? PLAYER.acceleration : PLAYER.deceleration;
    const wantX = wishX * top;
    const wantZ = wishZ * top;
    const changeX = wantX - player.velocity.x;
    const changeZ = wantZ - player.velocity.z;
    const change = Math.hypot(changeX, changeZ);
    const step = rate * dt;
    if (change > step && change > 1e-6) {
      player.velocity.x += (changeX / change) * step;
      player.velocity.z += (changeZ / change) * step;
    } else {
      player.velocity.x = wantX;
      player.velocity.z = wantZ;
    }

    if (grounded && input.wasPressed('Space')) {
      player.velocity.y = PLAYER.jumpSpeed;
      grounded = false;
    }

    const startX = player.position.x;
    const startZ = player.position.z;
    slide(player.velocity.x * dt, 0);
    slide(0, player.velocity.z * dt);
    pushOut();

    const here = city.surfaceAt(player.position.x, player.position.z);
    if (grounded) {
      if (here > player.position.y + PLAYER.stepHeight) {
        // A riser taller than a step is a wall the colliders did not claim: refuse the move rather
        // than lift Rico onto it.
        player.position.x = startX;
        player.position.z = startZ;
        player.velocity.x = 0;
        player.velocity.z = 0;
      } else if (here >= player.position.y - PLAYER.stepHeight) {
        player.position.y = here;
      } else {
        grounded = false;
      }
    }

    if (!grounded) {
      player.velocity.y -= WORLD.gravity * dt;
      player.position.y += player.velocity.y * dt;
      const ground = city.surfaceAt(player.position.x, player.position.z);
      if (player.position.y <= ground && player.velocity.y <= 0) {
        player.position.y = ground;
        player.velocity.y = 0;
        grounded = true;
      }
    }

    player.speed = Math.hypot(player.velocity.x, player.velocity.z);
    if (!grounded) player.state = 'jump';
    else if (player.speed > PLAYER.runSpeed * 0.55) player.state = 'run';
    else if (player.speed > 0.15) player.state = 'walk';
    else player.state = 'idle';

    if (player.speed > 0.2) {
      const facing = Math.atan2(-player.velocity.x, -player.velocity.z);
      const turn = PLAYER.turnRate * dt;
      player.yaw += Math.max(-turn, Math.min(turn, wrap(facing - player.yaw)));
    }

    pose(dt);
    sync();
  };

  sync();
  return player;
}
