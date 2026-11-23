import * as THREE from 'three';
import { PLAYER } from './config.js';
import { box, mesh, clamp, dampAngle, lerp, TAU, rand, pick } from './utils.js';
const SKIN = [0xb97b55, 0x8c5a3c, 0xd6a077, 0x6d422c, 0xe0b48c];
const SHIRT = [0x3f7f78, 0xc96b52, 0xd9c9a8, 0x4b5d78, 0x8a5a6d, 0xd8a84e, 0x6f8a5e];
const PANTS = [0x2e3a40, 0x6b6153, 0x3d4f5c, 0x8a7a62, 0x243238];
const mat = (color, rough = 0.8) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.02 });
const limb = (w, h, d, material, x, y, z) => { const g = new THREE.Group(); const m = box(w, h, d, material, 0, -h / 2, 0); m.castShadow = true; g.add(m); g.position.set(x, y, z); return g; };
export function buildHumanoid(opts = {}) {
const skinMat = mat(opts.skin ?? pick(SKIN), 0.75), shirtMat = mat(opts.shirt ?? pick(SHIRT), 0.85), pantsMat = mat(opts.pants ?? pick(PANTS));
const cap = opts.cap ?? (Math.random() < 0.3);
const g = new THREE.Group();
const torso = box(0.62, 0.72, 0.36, shirtMat, 0, 1.2, 0); torso.castShadow = true;
const head = mesh(new THREE.SphereGeometry(0.21, 10, 8), skinMat, 0, 1.78, 0); head.castShadow = true;
g.add(torso, box(0.56, 0.22, 0.34, pantsMat, 0, 0.82, 0), head, box(0.4, 0.14, 0.38, mat(opts.hair ?? 0x2a211d, 0.95), 0, 1.94, 0.02)); if (cap) {
g.add(box(0.44, 0.14, 0.44, mat(opts.capColor ?? 0xb04a3a, 0.9), 0, 1.99, 0.02), box(0.4, 0.05, 0.26, mat(0x8f3c30, 0.9), 0, 1.95, -0.26)); }
const armL = limb(0.16, 0.62, 0.18, shirtMat, -0.43, 1.5, 0), armR = limb(0.16, 0.62, 0.18, shirtMat, 0.43, 1.5, 0);
armL.add(mesh(new THREE.SphereGeometry(0.085, 6, 5), skinMat, 0, -0.66, 0)); armR.add(mesh(new THREE.SphereGeometry(0.085, 6, 5), skinMat, 0, -0.66, 0)); g.add(armL, armR);
const legL = limb(0.2, 0.72, 0.22, pantsMat, -0.16, 0.8, 0), legR = limb(0.2, 0.72, 0.22, pantsMat, 0.16, 0.8, 0), shoeL = box(0.22, 0.12, 0.34, mat(0x1d2224, 0.9), 0, -0.74, -0.06);
legL.add(shoeL); legR.add(shoeL.clone()); g.add(legL, legR);
const contact = mesh(new THREE.CircleGeometry(0.42, 14), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }), 0, 0.012, 0); contact.rotation.x = -Math.PI / 2; contact.renderOrder = 2; g.add(contact); if (opts.jacket) {
const jm = mat(opts.jacket, 0.75); g.add(box(0.14, 0.5, 0.38, jm, -0.29, 1.34, 0), box(0.14, 0.5, 0.38, jm, 0.29, 1.34, 0), box(0.44, 0.1, 0.06, mat(0xe0c79a, 0.8), 0, 1.47, -0.19)); } if (opts.badge) { g.add(box(0.18, 0.12, 0.02, mat(0xe4c25a, 0.5), -0.2, 1.32, -0.19)); } return { group: g, armL, armR, legL, legR, head, torso, phase: Math.random() * TAU }; }
export function animateHumanoid(rig, phase, speed, aiming = false, dt = 0.016) {
const swing = Math.min(speed / 5, 1.5), s = Math.sin(phase) * 0.62 * swing, c = Math.cos(phase) * 0.62 * swing; rig.legL.rotation.x = s; rig.legR.rotation.x = -s; if (aiming) { rig.armR.rotation.x = -1.42; rig.armL.rotation.x = -1.2; rig.armR.rotation.y = 0.08; rig.armL.rotation.y = -0.24; } else { rig.armL.rotation.x = -s * 0.85; rig.armR.rotation.x = s * 0.85; rig.armL.rotation.y = 0; rig.armR.rotation.y = 0; } rig.group.position.y = Math.abs(Math.sin(phase * 2)) * 0.035 * swing; }
export class Player { constructor(scene) { this.scene = scene; this.rig = buildHumanoid({ skin: 0x9c6444, shirt: 0x2f7d74, pants: 0xd9c7a4, cap: true, capColor: 0xb24f3b, jacket: 0x1f4f4c }); this.group = this.rig.group; this.group.position.set(-54, 0.6, 36.5); scene.add(this.group);
const skinMat = new THREE.MeshStandardMaterial({ color: 0x9c6444, roughness: 0.75 });
const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xf0e6d4, roughness: 0.5 });
this.group.add(box(0.075, 0.1, 0.07, skinMat, 0, 1.755, -0.205), box(0.065, 0.035, 0.02, eyeWhite, -0.075, 1.825, -0.2), box(0.065, 0.035, 0.02, eyeWhite, 0.075, 1.825, -0.2),
box(0.22, 0.1, 0.05, new THREE.MeshStandardMaterial({ color: 0x2a1f1a, roughness: 0.95 }), 0, 1.67, -0.17), box(0.035, 0.42, 0.02, new THREE.MeshStandardMaterial({ color: 0xe0c79a, roughness: 0.8 }), 0, 1.2, -0.185),
box(0.07, 0.6, 0.04, new THREE.MeshStandardMaterial({ color: 0x7a5a3e, roughness: 0.9 }), 0.2, 1.28, 0.19));
this.pos = new THREE.Vector3(-54, 0, 36.5); this.yaw = Math.PI / 2; this.health = PLAYER.maxHealth; this.maxHealth = PLAYER.maxHealth; this.ammo = PLAYER.ammo; this.reserve = 96; this.reloading = 0; this.fireTimer = 0; this.aiming = false; this.speed = 0; this.phase = 0; this.alive = true; this.enterCooldown = 0; this.gun = this.buildGun(); this.group.add(this.gun); this.muzzle = new THREE.Object3D(); this.muzzle.position.set(0, 0, -0.72); this.gun.add(this.muzzle); } buildGun() {
const g = new THREE.Group(), metal = new THREE.MeshStandardMaterial({ color: 0x2c3235, roughness: 0.4, metalness: 0.7 }); g.add(box(0.1, 0.16, 0.62, metal, 0, 0, -0.22), box(0.08, 0.3, 0.12, metal, 0, -0.18, 0.02)); g.position.set(0.34, 1.18, -0.28); g.scale.setScalar(1.5); g.visible = false; return g; } setPosition(x, z, yaw = this.yaw) { this.pos.set(x, 0, z); this.yaw = yaw; this.group.position.set(x, 0.6, z); this.group.rotation.y = yaw; } update(dt, input, world, cameraYaw) { this.fireTimer = Math.max(0, this.fireTimer - dt); this.enterCooldown = Math.max(0, this.enterCooldown - dt); if (this.reloading > 0) { this.reloading -= dt; if (this.reloading <= 0) {
const need = PLAYER.ammo - this.ammo, take = Math.min(need, this.reserve); this.ammo += take; this.reserve -= take; } } this.aiming = input.aim;
let mx = 0, mz = 0; if (input.forward) mz -= 1; if (input.back) mz += 1; if (input.left) mx -= 1; if (input.right) mx += 1;
const moving = mx !== 0 || mz !== 0, run = input.run && !this.aiming, targetSpeed = moving ? (run ? PLAYER.runSpeed : PLAYER.walkSpeed) * (this.aiming ? 0.55 : 1) : 0; if (moving) {
const len = Math.hypot(mx, mz); mx /= len; mz /= len;
const sin = Math.sin(cameraYaw), cos = Math.cos(cameraYaw), wx = mx * cos + mz * sin, wz = -mx * sin + mz * cos; this.yaw = dampAngle(this.yaw, Math.atan2(-wx, -wz), 14, dt); } this.speed = lerp(this.speed, targetSpeed, 1 - Math.exp(-10 * dt)); if (this.speed > 0.05) {
const f = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
let nx = this.pos.x + f.x * this.speed * dt, nz = this.pos.z + f.z * this.speed * dt; if (world.isWater(nx, nz)) { nz = this.pos.z; nx = this.pos.x; }
const hit = world.collide(nx, nz, PLAYER.radius); if (hit) { nx += hit.x; nz += hit.z; } this.pos.x = clamp(nx, -296, 296); this.pos.z = clamp(nz, -296, 296); this.phase += dt * (run ? 12 : 8); } else { this.phase += dt * 1.5; }
const gy = world.heightAt(this.pos.x, this.pos.z); this.group.position.set(this.pos.x, gy + 0.01, this.pos.z); this.group.rotation.y = this.yaw; animateHumanoid(this.rig, this.phase, this.speed, this.aiming, dt); this.gun.visible = this.aiming; this.gun.position.set(0.34, 1.2, -0.3); this.gun.rotation.x = 0; if (this.aiming) this.rig.armR.rotation.x = -1.55; } get eyePosition() { return new THREE.Vector3(this.pos.x, this.group.position.y + 1.55, this.pos.z); } takeDamage(n) { if (!this.alive) return; this.health = Math.max(0, this.health - n); if (this.health <= 0) this.alive = false; } heal(n) { this.health = Math.min(this.maxHealth, this.health + n); } reload() { if (this.reloading > 0 || this.ammo >= PLAYER.ammo || this.reserve <= 0) return false; this.reloading = PLAYER.reload; return true; } canFire() { return this.ammo > 0 && this.fireTimer <= 0 && this.reloading <= 0; } consumeShot() { this.ammo--; this.fireTimer = PLAYER.fireRate; } }
const PED_PATHS = [];
const PED_HOTSPOTS = [
[-30, 38], [-72, 36], [-118, 36], [10, 36], [64, 36], [-30, 48],
[-54, 36], [-54, 49], [-54, 31], [-90, 48], [30, 48], [-30, -36], [46, -36], [-112, -48], [90, -36],
[0, 120], [-60, 120], [88, 94], [-112, -86], [150, 44], [-150, 44],
]; for (const [hx, hz] of PED_HOTSPOTS) { for (let k = 0; k < 2; k++) {
const axis = Math.abs(hz) > 60 || k === 0 ? 'x' : 'z';
const fixed = axis === 'x' ? hz + (k ? 3.2 : -3.2) : hx + (k ? 3.4 : -3.4);
const from = axis === 'x' ? hx - 22 : hz - 22, to = axis === 'x' ? hx + 22 : hz + 22; PED_PATHS.push({ axis, fixed, from, to, dir: Math.random() < 0.5 ? 1 : -1 }); } }
export class Crowd { constructor(scene, count = 38) { this.scene = scene; this.peds = []; for (let i = 0; i < count; i++) {
const rig = buildHumanoid({}); rig.group.scale.setScalar(0.94 + Math.random() * 0.12);
const path = PED_PATHS[i % PED_PATHS.length], start = rand(path.from, path.to);
const x = path.axis === 'z' ? path.fixed : start, z = path.axis === 'z' ? start : path.fixed; rig.group.position.set(x, 0.4, z); rig.group.rotation.y = path.axis === 'z' ? (path.dir > 0 ? Math.PI : 0) : (path.dir > 0 ? -Math.PI / 2 : Math.PI / 2); scene.add(rig.group); this.peds.push({ rig, path, t: start, dir: path.dir, speed: 0.9 + Math.random() * 0.7,
phase: Math.random() * TAU, flee: 0, dead: 0, alive: true, x, z, yaw: rig.group.rotation.y,
}); } } update(dt, playerPos, playerCar, wanted) { for (const p of this.peds) { if (!p.alive) { p.dead += dt; p.rig.group.rotation.z = Math.min(1.5, p.rig.group.rotation.z + dt * 3); if (p.dead > 24) p.rig.group.visible = false; continue; } p.phase += dt * 7; if (p.flee > 0) { p.flee -= dt;
const dx = p.x - playerPos.x, dz = p.z - playerPos.z, d = Math.hypot(dx, dz) || 1; p.x += (dx / d) * 4.2 * dt; p.z += (dz / d) * 4.2 * dt; p.yaw = Math.atan2(-dx, -dz); p.rig.group.rotation.y = p.yaw; animateHumanoid(p.rig, p.phase, 5.5, false, dt); } else { p.t += p.dir * p.speed * dt; if (p.t > p.path.to) { p.t = p.path.to; p.dir = -1; } if (p.t < p.path.from) { p.t = p.path.from; p.dir = 1; } p.x = p.path.axis === 'z' ? p.path.fixed : p.t; p.z = p.path.axis === 'z' ? p.t : p.path.fixed; p.yaw = p.path.axis === 'z' ? (p.dir > 0 ? Math.PI : 0) : (p.dir > 0 ? -Math.PI / 2 : Math.PI / 2); p.rig.group.rotation.y = p.yaw; animateHumanoid(p.rig, p.phase, p.speed, false, dt); }
p.rig.group.position.set(p.x, 0.59, p.z); if (playerCar) {
const d = Math.hypot(p.x - playerCar.pos.x, p.z - playerCar.pos.z); if (d < 2.1 && Math.abs(playerCar.speed) > 3) { p.alive = false; p.rig.group.rotation.z = 0.4; p.flee = 0; } } } } scareAt(x, z, radius = 30) { for (const p of this.peds) { if (!p.alive) continue; if (Math.hypot(p.x - x, p.z - z) < radius) p.flee = 6 + Math.random() * 4; } } nearestAlive(x, z, maxDist = 2.4) {
let best = null, bd = maxDist; for (const p of this.peds) { if (!p.alive) continue;
const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = p; } } return best; } }
// provenance: witnessed in the high-tide session
// high-tide round 16 authorship provenance
