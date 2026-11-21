import * as THREE from 'three';
import { VEHICLE_TYPES, WORLD } from './config.js';
import { box, mesh, clamp, lerp, dampAngle, glowTexture, TAU } from './utils.js';
const geoCache = new Map();
function cachedGeo(key, make) { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); }
function wheelGeo() { return cachedGeo('wheel', () => {
const g = new THREE.CylinderGeometry(0.37, 0.37, 0.26, 12); g.rotateZ(Math.PI / 2); return g; }); }
function lightSprite(color, scale = 1.5, opacity = 0.8) {
const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending,
})); sp.scale.set(scale, scale, 1); return sp; }
export function buildVehicle(typeKey, colorOverride = null) {
const spec = VEHICLE_TYPES[typeKey];
const g = new THREE.Group();
const color = colorOverride ?? spec.color;
const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.32 });
const accentMat = new THREE.MeshStandardMaterial({ color: spec.accent, roughness: 0.55, metalness: 0.2 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x1c3038, roughness: 0.12, metalness: 0.65 });
const tireMat = new THREE.MeshStandardMaterial({ color: 0x151718, roughness: 0.95 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0x8c9494, roughness: 0.4, metalness: 0.7 });
const L = spec.length, W = spec.width, H = spec.height;
const low = typeKey === 'muscle';
const chassisH = low ? 0.5 : 0.62;
const chassis = box(W, chassisH, L, bodyMat, 0, 0.55 + chassisH / 2, 0); chassis.castShadow = true; chassis.receiveShadow = true; g.add(chassis);
const lower = box(W * 0.96, 0.24, L * 0.98, new THREE.MeshStandardMaterial({ color: 0x242a2c, roughness: 0.8 }), 0, 0.48, 0); g.add(lower); if (typeKey === 'van' || typeKey === 'courier') {
const cargo = box(W * 0.94, H * 0.82, L * 0.7, bodyMat, 0, 0.9 + H * 0.4, L * 0.12); cargo.castShadow = true; g.add(cargo);
const cab = box(W * 0.9, H * 0.42, L * 0.24, bodyMat, 0, 1.25, -L * 0.34); g.add(cab); g.add(box(W * 0.82, H * 0.25, L * 0.2, glassMat, 0, 1.55, -L * 0.36)); g.add(box(W * 0.95, 0.16, L * 0.72, accentMat, 0, 1.55, L * 0.12)); if (typeKey === 'courier') {
const decal = new THREE.MeshBasicMaterial({ color: 0xf4e3bd }); g.add(box(W * 0.6, 0.5, 0.04, decal, 0, 1.75, L * 0.47)); } } else if (typeKey === 'pickup') {
const cab = box(W * 0.9, H * 0.55, L * 0.4, bodyMat, 0, 1.25, -L * 0.1); cab.castShadow = true; g.add(cab); g.add(box(W * 0.8, H * 0.28, L * 0.34, glassMat, 0, 1.52, -L * 0.1)); g.add(box(W * 0.9, 0.4, L * 0.4, bodyMat, 0, 1.0, L * 0.28)); g.add(box(W * 0.8, 0.2, L * 0.36, new THREE.MeshStandardMaterial({ color: 0x2a2d2b, roughness: 0.9 }), 0, 1.2, L * 0.28)); } else {
const cabin = box(W * 0.82, H * 0.44, L * (low ? 0.34 : 0.42), glassMat, 0, 1.02 + H * 0.2, L * 0.04); cabin.castShadow = true; g.add(cabin); g.add(box(W * 0.86, 0.14, L * (low ? 0.32 : 0.4), bodyMat, 0, 1.02 + H * 0.42, L * 0.04)); g.add(box(W * 0.9, 0.18, L * 0.3, bodyMat, 0, 0.96, -L * 0.3)); g.add(box(W * 0.9, 0.18, L * 0.2, bodyMat, 0, 0.96, L * 0.33)); } for (const sx of [-1, 1]) { for (const sz of [-1, 1]) {
const wx = sx * (W / 2 - 0.05);
const wz = sz * L * 0.31;
const w = new THREE.Mesh(wheelGeo(), tireMat); w.position.set(wx, 0.37, wz); w.castShadow = true; g.add(w);
const rim = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.28, 10), rimMat, wx, 0.37, wz); rim.rotation.z = Math.PI / 2; g.add(rim); } }
const headMat = new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffe0a0, emissiveIntensity: 1.4 });
const tailMat = new THREE.MeshStandardMaterial({ color: 0xff3b28, emissive: 0xff1e10, emissiveIntensity: 1.0 });
const heads = [], tails = []; for (const sx of [-1, 1]) {
const h = box(0.4, 0.18, 0.1, headMat, sx * W * 0.32, 0.82, -L / 2 - 0.02); g.add(h);
const t = box(0.42, 0.16, 0.1, tailMat, sx * W * 0.32, 0.85, L / 2 + 0.02); g.add(t); heads.push(h); tails.push(t); }
const headGlowL = lightSprite(0xffd9a0, 1.6, 0.55); headGlowL.position.set(-W * 0.32, 0.82, -L / 2 - 0.2);
const headGlowR = headGlowL.clone(); headGlowR.position.x = W * 0.32; g.add(headGlowL, headGlowR); if (typeKey === 'police') { g.add(box(W * 0.6, 0.16, 0.5, new THREE.MeshStandardMaterial({ color: 0x1c2428 }), 0, 1.62, 0.1));
const red = box(W * 0.26, 0.18, 0.34, new THREE.MeshStandardMaterial({ color: 0xff2d2d, emissive: 0xff1a1a, emissiveIntensity: 1.6 }), -W * 0.16, 1.75, 0.1);
const blue = box(W * 0.26, 0.18, 0.34, new THREE.MeshStandardMaterial({ color: 0x2e7dff, emissive: 0x1a5cff, emissiveIntensity: 1.6 }), W * 0.16, 1.75, 0.1); g.add(red, blue); g.userData.sirenLights = [red, blue];
const sg1 = lightSprite(0xff2d2d, 3.2, 0.8); sg1.position.set(-W * 0.16, 1.86, 0.1);
const sg2 = lightSprite(0x2e7dff, 3.2, 0.8); sg2.position.set(W * 0.16, 1.86, 0.1); g.add(sg1, sg2); g.userData.sirenGlow = [sg1, sg2]; g.add(box(W * 0.52, 0.16, 0.1, new THREE.MeshStandardMaterial({ color: 0x20384a }), 0, 0.8, -L / 2 - 0.05)); } g.userData.spec = spec; g.userData.wheels = []; for (const child of g.children) { if (child.geometry === wheelGeo()) g.userData.wheels.push(child); } g.userData.headlights = heads; g.userData.taillights = tails; g.userData.headGlow = [headGlowL, headGlowR]; return g; }
export class Car { constructor(scene, typeKey, x, z, yaw = 0, color = null) { this.scene = scene; this.typeKey = typeKey; this.spec = VEHICLE_TYPES[typeKey]; this.mesh = buildVehicle(typeKey, color); this.mesh.position.set(x, 0, z); this.mesh.rotation.y = yaw; scene.add(this.mesh); this.pos = new THREE.Vector3(x, 0, z); this.yaw = yaw; this.speed = 0; this.steer = 0; this.radius = Math.max(this.spec.width, 2.1) * 0.55; this.ai = false; this.braking = false; this.wheelSpin = 0; this.collisionCooldown = 0; this.name = this.spec.name; this.headlight = null; this.spot = null; } addHeadlight() { if (this.spot) return;
const s = new THREE.SpotLight(0xffd9a0, 18, 46, 0.42, 0.55, 1.2); s.position.set(0, 1.0, -this.spec.length / 2);
const t = new THREE.Object3D(); t.position.set(0, 0, -20); this.mesh.add(s, t); s.target = t; this.spot = s; } place(x, z, yaw) { this.pos.set(x, 0, z); this.yaw = yaw; this.speed = 0; this.mesh.position.set(x, 0, z); this.mesh.rotation.y = yaw; } forward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); } updateVisual(dt) {
const gy = this.scene.userData.world ? this.scene.userData.world.heightAt(this.pos.x, this.pos.z) : 0.35; this.mesh.position.x = this.pos.x; this.mesh.position.z = this.pos.z; this.mesh.position.y = gy; this.mesh.rotation.y = this.yaw; this.mesh.rotation.z = clamp(-this.steer * Math.min(Math.abs(this.speed) / 30, 1) * 0.06, -0.08, 0.08); this.wheelSpin += this.speed * dt * 2.4;
const wheels = this.mesh.userData.wheels; for (let i = 0; i < wheels.length; i++) { wheels[i].rotation.x = this.wheelSpin; if (i < 2) wheels[i].rotation.y = this.steer * 0.5; } for (const t of this.mesh.userData.taillights) { t.material.emissiveIntensity = this.braking ? 2.4 : 0.9; } if (this.spot) { this.spot.position.set(0, 1.0, -this.spec.length / 2); } } drive(dt, throttle, steer, handbrake) {
const spec = this.spec;
const max = spec.maxSpeed; this.steer = lerp(this.steer, steer, 1 - Math.exp(-9 * dt)); this.braking = false; if (throttle > 0) { this.speed += spec.accel * throttle * dt; } else if (throttle < 0) { this.speed += spec.accel * 1.2 * throttle * dt; this.braking = this.speed > 1; } else { this.speed *= Math.exp(-1.2 * dt); } if (handbrake) { this.speed *= Math.exp(-2.6 * dt); this.braking = true; } this.speed = clamp(this.speed, -max * 0.38, max);
const turn = this.steer * (0.65 + Math.min(Math.abs(this.speed) / 12, 1) * 1.15);
const dir = this.speed >= 0 ? 1 : -1; this.yaw += turn * dir * dt * 1.35;
const f = this.forward();
const nx = this.pos.x + f.x * this.speed * dt;
const nz = this.pos.z + f.z * this.speed * dt; this.moveTo(nx, nz, dt); } moveTo(nx, nz, dt) {
const world = this.scene.userData.world; if (world) { if (world.isWater(nx, nz)) { this.speed *= -0.15; return; }
const hit = world.collide(nx, nz, this.radius); if (hit) { nx += hit.x; nz += hit.z;
const f = this.forward();
const into = -(f.x * hit.x + f.z * hit.z) / (Math.hypot(hit.x, hit.z) || 1); this.speed *= into > 0.45 ? 0.55 : 0.94; } if (Math.abs(nx) < 8 && Math.abs(nz) < 44 && Math.abs(nz) > 26 && !world.bridge.passable) { this.speed *= 0.2; return; } } this.pos.x = nx; this.pos.z = nz; } distanceTo(x, z) { return Math.hypot(this.pos.x - x, this.pos.z - z); } }
const LANES = [
{ axis: 'z', lane: 4.2, dir: 1, from: -286, to: 286, bridge: true },
{ axis: 'z', lane: -4.2, dir: -1, from: 286, to: -286, bridge: true },
{ axis: 'x', lane: 44.5, dir: 1, from: -286, to: 286, bridge: false },
{ axis: 'x', lane: 39.5, dir: -1, from: 286, to: -286, bridge: false },
{ axis: 'x', lane: -44.5, dir: -1, from: -286, to: 286, bridge: false },
{ axis: 'x', lane: -39.5, dir: 1, from: 286, to: -286, bridge: false },
{ axis: 'x', lane: 78.5, dir: 1, from: -286, to: 286, bridge: false },
{ axis: 'x', lane: 73.5, dir: -1, from: 286, to: -286, bridge: false },
{ axis: 'x', lane: -76.5, dir: -1, from: -286, to: 286, bridge: false },
{ axis: 'x', lane: -71.5, dir: 1, from: 286, to: -286, bridge: false },
{ axis: 'x', lane: 156.5, dir: 1, from: -286, to: 286, bridge: false },
{ axis: 'x', lane: 151.5, dir: -1, from: 286, to: -286, bridge: false },
];
export class Traffic { constructor(scene, world, count = 22) { this.scene = scene; this.world = world; this.cars = []; this.laneCursor = 0;
const types = ['sedan', 'sedan', 'taxi', 'van', 'courier', 'pickup', 'muscle']; for (let i = 0; i < count; i++) {
const lane = LANES[i % LANES.length];
const t = (i / count) * (lane.to - lane.from) + lane.from;
const x = lane.axis === 'z' ? lane.lane : t;
const z = lane.axis === 'z' ? t : lane.lane;
const yaw = lane.axis === 'z' ? (lane.dir > 0 ? Math.PI : 0) : (lane.dir > 0 ? -Math.PI / 2 : Math.PI / 2);
const car = new Car(scene, types[i % types.length], x, z, yaw); car.ai = true; car.lane = lane; car.cruise = 12 + Math.random() * 9; car.mesh.traverse((o) => { if (o.isMesh) o.castShadow = true; }); this.cars.push(car); } this.parked = []; this.spawnParked(); } spawnParked() {
const spots = [
[-12, 62, Math.PI / 2], [12, -64, -Math.PI / 2], [26, 96, 0], [-32, 118, 0],
[128, 44, Math.PI], [-142, 44, Math.PI], [42, -96, Math.PI], [-58, -128, 0],
[188, -44, 0], [-198, 44, Math.PI], [96, 158, Math.PI / 2], [-118, 158, -Math.PI / 2],
[-56, 46.5, -Math.PI / 2], [-98, 46.5, -Math.PI / 2], [-20, 46.5, -Math.PI / 2],
[22, -46.5, Math.PI / 2], [72, -46.5, Math.PI / 2], [-124, -46.5, Math.PI / 2],
];
const types = ['sedan', 'pickup', 'muscle', 'van', 'taxi', 'courier']; spots.forEach(([x, z, yaw], i) => {
const car = new Car(this.scene, types[i % types.length], x, z, yaw); car.parked = true; car.mesh.traverse((o) => { if (o.isMesh) o.castShadow = true; }); this.parked.push(car); }); } remove(car) {
const i = this.cars.indexOf(car); if (i >= 0) this.cars.splice(i, 1);
const j = this.parked.indexOf(car); if (j >= 0) this.parked.splice(j, 1); } update(dt, player, playerCar) { for (const car of this.cars) {
const lane = car.lane;
const along = lane.axis === 'z' ? car.pos.z : car.pos.x;
let target = car.cruise; if (lane.bridge && Math.abs(car.pos.x) < 8) {
const approaching = lane.dir > 0 ? car.pos.z < -20 && car.pos.z > -52 : car.pos.z > 20 && car.pos.z < 52; if (approaching && !this.world.bridge.passable) target = 0; } if (playerCar && Math.abs(playerCar.pos.x - car.pos.x) < 5 && Math.abs(playerCar.pos.z - car.pos.z) < 10) {
const ahead = lane.axis === 'z' ? (playerCar.pos.z - car.pos.z) * lane.dir : (playerCar.pos.x - car.pos.x) * lane.dir; if (ahead > 0 && ahead < 9) target = Math.min(target, Math.max(0, (ahead - 3) * 3)); } car.speed = lerp(car.speed, target, 1 - Math.exp(-2.4 * dt));
const nx = lane.axis === 'z' ? car.pos.x : car.pos.x + lane.dir * car.speed * dt;
const nz = lane.axis === 'z' ? car.pos.z + lane.dir * car.speed * dt : car.pos.z; if (lane.axis === 'z') { if ((lane.dir > 0 && nz > lane.to) || (lane.dir < 0 && nz < lane.to)) { car.pos.z = lane.from; car.pos.x = lane.lane; } else car.pos.z = nz; } else { if ((lane.dir > 0 && nx > lane.to) || (lane.dir < 0 && nx < lane.to)) { car.pos.x = lane.from; car.pos.z = lane.lane; } else car.pos.x = nx; } if (lane.bridge && !this.world.bridge.passable) { if (lane.dir > 0 && car.pos.z > -44 && car.pos.z < -26) car.pos.z = -44; if (lane.dir < 0 && car.pos.z < 44 && car.pos.z > 26) car.pos.z = 44; } car.updateVisual(dt); } for (const car of this.parked) { if (car === playerCar) continue; car.updateVisual(dt); } } }
