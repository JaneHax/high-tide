// Rico on foot: six welded meshes, a circle that slides along the city's boxes, and a stride driven by
// the speed he is actually doing. The city owns the ground; this file keeps no height table.
import { Group, Mesh, MeshLambertMaterial, Vector3 } from 'three';
import { PALETTE, PLAYER, WORLD } from './config.js';
import { firstHit, merge, tintedBox, unstick } from './geometry.js';

const HIP = 0.86;
const SHOULDER = 0.5;
const HEAD = 0.74;
const SKIN = PALETTE.sand;
const SHIRT = PALETTE.sea;
const TROUSERS = PALETTE.asphalt;
const HAIR = PALETTE.roof;

const MATERIAL = new MeshLambertMaterial({ vertexColors: true, flatShading: true });

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

const POSES = {
  jump: [0.55, -0.35, -0.85, -0.85, -0.1],
  dead: [0.22, 0.12, 0.45, 0.3, 0.38],
};

export function createPlayer({ city, scene, spawn }) {
  const group = new Group(), body = part(torsoGeometry()), head = part(headGeometry());
  const armLeft = part(armGeometry()), armRight = part(armGeometry()), legLeft = part(legGeometry());
  const legRight = part(legGeometry());

  body.position.y = HIP;
  head.position.y = HEAD;
  armLeft.position.set(-0.31, SHOULDER, 0);
  armRight.position.set(0.31, SHOULDER, 0);
  legLeft.position.set(-0.13, HIP, 0);
  legRight.position.set(0.13, HIP, 0);

  body.add(head, armLeft, armRight);
  group.add(body, legLeft, legRight);
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
    colliders: city.colliders,
    update(dt, input, cameraYaw) {},
  };

  const from = new Vector3(), to = new Vector3();
  let grounded = true, stride = 0;

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
    const safe = Math.max(0, hit - 0.002 / length);
    player.position.x = from.x + dx * safe;
    player.position.z = from.z + dz * safe;
  }

  function pushOut() {
    const spot = unstick(player.position.x, player.position.z, PLAYER.radius, player.position.y + PLAYER.stepHeight, city.colliders);
    player.position.x = spot.x;
    player.position.z = spot.z;
  }

  function pose(dt) {
    const speed = player.speed, swing = 0.45 * Math.min(1.6, speed / PLAYER.walkSpeed);
    stride = (stride + speed * 2.2 * dt) % (Math.PI * 2);
    const angle = Math.sin(stride) * swing;

    const fixed = POSES[player.state];
    if (fixed) {
      [legLeft.rotation.x, legRight.rotation.x, armLeft.rotation.x, armRight.rotation.x, body.rotation.x] = fixed;
      return;
    }
    legLeft.rotation.x = angle;
    legRight.rotation.x = -angle;
    armLeft.rotation.x = -angle * 0.8;
    armRight.rotation.x = angle * 0.8;
    body.rotation.x = -0.16 * Math.min(1, speed / PLAYER.runSpeed);
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

    const floor = city.surfaceAt(player.position.x, player.position.z);
    if (player.position.y <= floor + 0.02 && player.velocity.y <= 0) {
      player.position.y = floor;
      player.velocity.y = 0;
      grounded = true;
    }

    const forward = (input.isDown('KeyW') ? 1 : 0) - (input.isDown('KeyS') ? 1 : 0);
    const strafe = (input.isDown('KeyD') ? 1 : 0) - (input.isDown('KeyA') ? 1 : 0);
    let wishX = 0, wishZ = 0;
    if (forward || strafe) {
      const sin = Math.sin(cameraYaw), cos = Math.cos(cameraYaw);
      wishX = -sin * forward + cos * strafe;
      wishZ = -cos * forward - sin * strafe;
      const length = Math.hypot(wishX, wishZ);
      wishX /= length;
      wishZ /= length;
    }

    const running = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    const top = running ? PLAYER.runSpeed : PLAYER.walkSpeed;
    const rate = wishX || wishZ ? PLAYER.acceleration : PLAYER.deceleration;
    const changeX = wishX * top - player.velocity.x, changeZ = wishZ * top - player.velocity.z;
    const change = Math.hypot(changeX, changeZ), step = rate * dt;
    if (change > step && change > 1e-6) {
      player.velocity.x += (changeX / change) * step;
      player.velocity.z += (changeZ / change) * step;
    } else {
      player.velocity.x = wishX * top;
      player.velocity.z = wishZ * top;
    }

    if (grounded && input.wasPressed('Space')) {
      player.velocity.y = PLAYER.jumpSpeed;
      grounded = false;
    }

    const startX = player.position.x, startZ = player.position.z;
    slide(player.velocity.x * dt, 0);
    slide(0, player.velocity.z * dt);
    pushOut();

    const here = city.surfaceAt(player.position.x, player.position.z);
    if (grounded) {
      if (here > player.position.y + PLAYER.stepHeight) {
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
      const facing = Math.atan2(-player.velocity.x, -player.velocity.z), turn = PLAYER.turnRate * dt;
      player.yaw += Math.max(-turn, Math.min(turn, wrap(facing - player.yaw)));
    }

    pose(dt);
    sync();
  };

  sync();
  return player;
}
