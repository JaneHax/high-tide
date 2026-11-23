// player.js — Rico on foot, sprint, and the third-person camera.
import * as THREE from 'three';
import { box, mat } from './geom.js';
import { clamp } from './util.js';

export function createPlayer(scene, S) {
  const g = new THREE.Group(); scene.add(g);
  const body = box(g, 0.7, 1.1, 0.4, 0x2e5f8a, 0, 0.95, 0);
  box(g, 0.5, 0.4, 0.4, 0xd9a066, 0, 1.7, 0);
  const legL = box(g, 0.25, 0.7, 0.3, 0x2a2a30, -0.18, 0.35, 0);
  const legR = box(g, 0.25, 0.7, 0.3, 0x2a2a30, 0.18, 0.35, 0);
  const P = {
    group: g, body, legL, legR, pos: new THREE.Vector3(...S.city.spawn, 0),
    yaw: 0, camYaw: 0, camPitch: 0.32, speed: 0, walkPhase: 0, onGround: true,
  };
  g.position.copy(P.pos);
  return P;
}

export function updatePlayer(dt, S, sys) {
  const P = sys.player, inp = sys.input, city = sys.city;
  if (!S.started || S.paused || S.inCar || S.inBoat) return;
  const m = inp.consumeMouse();
  P.camYaw -= m.dx * 0.0032; P.camPitch = clamp(P.camPitch + m.dy * 0.0026, -0.15, 1.1);
  let fx = 0, fz = 0;
  if (inp.down('KeyW') || inp.down('ArrowUp')) fz -= 1;
  if (inp.down('KeyS') || inp.down('ArrowDown')) fz += 1;
  if (inp.down('KeyA') || inp.down('ArrowLeft')) fx -= 1;
  if (inp.down('KeyD') || inp.down('ArrowRight')) fx += 1;
  const sprint = inp.down('ShiftLeft') || inp.down('ShiftRight');
  const sp = sprint ? 9.5 : 5.2;
  const len = Math.hypot(fx, fz) || 1;
  const sy = Math.sin(P.camYaw), cy = Math.cos(P.camYaw);
  const vx = ((fx * cy - fz * sy) / len) * sp, vz = ((-fx * sy - fz * cy) / len) * sp;
  P.pos.x += vx * dt; P.pos.z += vz * dt;
  const moving = Math.abs(fx) + Math.abs(fz) > 0;
  if (moving) {
    P.yaw = Math.atan2(vx, vz);
    P.walkPhase += dt * (sprint ? 13 : 9);
    P.speed = sp;
  } else P.speed = 0;
  // Stay in the world and out of buildings.
  P.pos.x = clamp(P.pos.x, -195, 195); P.pos.z = clamp(P.pos.z, -225, 195);
  const [nx, nz] = city.collide(P.pos.x, P.pos.z, 0.6);
  P.pos.x = nx; P.pos.z = nz;
  P.group.position.set(P.pos.x, 0, P.pos.z);
  P.group.rotation.y = P.yaw;
  const swing = moving ? Math.sin(P.walkPhase) * 0.5 : 0;
  P.legL.rotation.x = swing; P.legR.rotation.x = -swing;
  P.body.position.y = 0.95 + (moving ? Math.abs(Math.sin(P.walkPhase)) * 0.06 : 0);
}

export function updateCamera(dt, S, sys) {
  const P = sys.player, cam = sys.camera;
  if (S.camFix) {
    cam.position.set(...S.camFix.pos);
    cam.lookAt(...S.camFix.look);
    return;
  }
  const target = S.inCar ? S.inCar.pos : S.inBoat ? S.inBoat.pos : P.pos;
  const dist = S.inCar ? 11 : S.inBoat ? 13 : 7.5;
  const h = S.inCar ? 4.2 : 4.5;
  const cy = S.inCar ? S.inCar.yaw : S.inBoat ? S.inBoat.yaw : P.camYaw;
  const tx = target.x - Math.sin(cy) * dist, tz = target.z - Math.cos(cy) * dist;
  const k = 1 - Math.pow(0.001, dt);
  cam.position.x += (tx - cam.position.x) * k;
  cam.position.y += (h - cam.position.y) * k;
  cam.position.z += (tz - cam.position.z) * k;
  cam.lookAt(target.x, target.y + 1.6, target.z);
}
