import * as THREE from 'three';
import { ROADS, WORLD } from './config.js';
import { Car } from './vehicles.js';
import { buildHumanoid, animateHumanoid } from './people.js';
import { box, mesh, clamp, lerp, dampAngle, angleDelta, glowTexture, rand, TAU } from './utils.js';
const std = (color, roughness = 0.8, metalness = 0.02) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const glow = (color, scale) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.set(scale, scale, 1); return s; };
export class Police { constructor(scene, world, audio) { this.scene = scene; this.world = world; this.audio = audio; this.stars = 0; this.cruisers = []; this.officers = []; this.tracers = []; this.evade = 0; this.spawnTimer = 0; this.chopper = null; this.block = null; this.buildOfficerPool(); } buildOfficerPool() { for (let i = 0; i < 8; i++) {
const rig = buildHumanoid({ shirt: 0x25445c, pants: 0x1d2a36, cap: true, capColor: 0x203a50, badge: true, skin: 0xb9815d }); rig.group.visible = false; rig.group.scale.setScalar(1.02); this.scene.add(rig.group); this.officers.push({ rig, active: false, alive: true, x: 0, z: 0, yaw: 0, phase: 0, shootTimer: 1 + Math.random(), health: 3, car: null, aim: 0 }); } } get level() { return this.stars; } addStar(n = 1, reason = '') { this.stars = clamp(this.stars + n, 0, 5); this.evade = 0; if (this.stars > 0 && this.audio) this.audio.policeRadio(); return this.stars; } setStars(n) { this.stars = clamp(n, 0, 5); this.evade = 0; } clear() { this.stars = 0; this.evade = 0; for (const c of this.cruisers) this.removeCruiser(c); this.cruisers.length = 0; this.clearBlock(); for (const o of this.officers) { o.active = false; o.rig.group.visible = false; } if (this.chopper) { this.scene.remove(this.chopper.group); this.chopper = null; } } clearBlock() { if (!this.block) return; for (const c of this.block.cars) this.removeCruiser(c); this.block = null; } spawnRoadblock(px, pz, yaw) {
const fx = px - Math.sin(yaw) * 46, fz = pz - Math.cos(yaw) * 46;
let road = null, bd = 24;
for (const r of ROADS) { const d = r.axis === 'x' ? Math.abs(fz - r.pos) : Math.abs(fx - r.pos);
if (d < bd && fx > r.from && fx < r.to && fz > r.from && fz < r.to) { bd = d; road = r; } } if (!road) return null;
const along = road.axis === 'x' ? clamp(fx, road.from + 14, road.to - 14) : clamp(fz, road.from + 14, road.to - 14);
const cars = [];
for (const s of [-2.6, 2.6]) {
const x = road.axis === 'x' ? along : road.pos + s, z = road.axis === 'x' ? road.pos + s : along;
const car = new Car(this.scene, 'police', x, z, road.axis === 'x' ? 0 : Math.PI / 2); car.stationary = true; car.ai = false; car.addHeadlight(); cars.push(car); }
this.deployOfficers(cars[0]); this.block = { cars }; return this.block; } spawnPoint(px, pz) {
const options = []; for (const r of ROADS) { if (r.axis === 'z' && Math.abs(r.pos) < 10) continue; for (let t = r.from + 20; t < r.to - 20; t += 34) {
const x = r.axis === 'z' ? r.pos + 3 : t, z = r.axis === 'z' ? t : r.pos + 3, d = Math.hypot(x - px, z - pz); if (d > 45 && d < 95 && Math.abs(z) > 30) options.push([x, z]); } } if (!options.length) return [px + 70, pz + 70]; return options[(Math.random() * options.length) | 0]; } spawnCruiser(px, pz) {
const [x, z] = this.spawnPoint(px, pz);
const car = new Car(this.scene, 'police', x, z, Math.atan2(-(px - x), -(pz - z))); car.ai = true; car.cruise = 30; car.addHeadlight(); this.cruisers.push(car); if (this.audio) this.audio.sirenStart(); return car; } removeCruiser(c) { this.scene.remove(c.mesh); if (c.spot) this.scene.remove(c.spot); for (const o of this.officers) if (o.car === c) { o.car = null; o.active = false; o.rig.group.visible = false; } } deployOfficers(car) {
let n = 0; for (const o of this.officers) { if (o.active) continue;
const side = n === 0 ? -1 : 1; o.active = true; o.alive = true; o.car = car; o.health = 3; o.x = car.pos.x + Math.cos(car.yaw) * side * 2.4; o.z = car.pos.z - Math.sin(car.yaw) * side * 2.4; o.yaw = car.yaw; o.shootTimer = 0.7 + n * 0.3; o.rig.group.visible = true; n++; if (n >= 2) break; } } buildChopper() {
const g = new THREE.Group(), dark = std(0x24343c, 0.5, 0.45), glass = std(0x1c313a, 0.1, 0.7);
g.add(box(2.6, 2.0, 5.4, dark, 0, 0, 0), box(2.2, 1.1, 1.6, glass, 0, 0.15, -2.4), box(0.6, 0.6, 6.5, dark, 0, 0.3, 5.2), box(0.16, 1.8, 1.1, dark, 0, 0.9, 7.6)); for (const sx of [-1, 1]) g.add(box(0.18, 0.3, 3.4, dark, sx * 1.5, -1.2, 0.4));
const rotor = new THREE.Group(); for (let i = 0; i < 4; i++) {
const b = box(0.22, 0.06, 6.4, std(0x333a3c, 0.7), 0, 0, 0); b.rotation.y = (i / 4) * TAU; rotor.add(b); } rotor.position.y = 1.35; g.add(rotor, box(0.08, 2.2, 0.2, dark, 0, 1.0, 8.2));
const beacon = glow(0xff3b30, 2.2); beacon.position.set(0, -1.0, 0); g.add(beacon);
const spot = new THREE.SpotLight(0xfff1cc, 260, 120, 0.28, 0.55, 1.1); spot.position.set(0, -1.2, -1);
const target = new THREE.Object3D(); target.position.set(0, -40, -10); g.add(spot, target); spot.target = target;
const cone = mesh(new THREE.ConeGeometry(7, 60, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }), 0, -30, 0); cone.rotation.x = Math.PI; g.add(cone); this.scene.add(g); this.chopper = { group: g, rotor, tailRotor: g.children[g.children.length - 1], spot, target, cone, beacon, angle: 0 }; return this.chopper; } addTracer(from, to, color = 0xffd7a0) {
const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
const line = new THREE.Line(geo, mat); this.scene.add(line); this.tracers.push({ line, life: 0.12 }); } update(dt, ctx) {
const { playerPos, playerOnFoot, playerCar, playerAlive, onDamage, heading = 0, notify } = ctx; for (let i = this.tracers.length - 1; i >= 0; i--) {
const t = this.tracers[i]; t.life -= dt; t.line.material.opacity = Math.max(0, t.life / 0.12) * 0.85; if (t.life <= 0) { this.scene.remove(t.line); t.line.geometry.dispose(); t.line.material.dispose(); this.tracers.splice(i, 1); } } if (this.block && this.stars < 3) this.clearBlock();
if (this.stars >= 3 && !this.block && this.spawnRoadblock(playerPos.x, playerPos.z, heading) && notify) notify('Roadblock ahead. Two cruisers across the lane.', 'warn');
if (this.stars <= 0) { for (const c of this.cruisers) this.removeCruiser(c); this.cruisers.length = 0; for (const o of this.officers) { o.active = false; o.rig.group.visible = false; } if (this.chopper) { this.scene.remove(this.chopper.group); this.chopper = null; } if (this.audio) this.audio.sirenStop(); return; } this.spawnTimer -= dt;
const targetCruisers = Math.min(this.stars, 4); if (this.cruisers.length < targetCruisers && this.spawnTimer <= 0) { this.spawnCruiser(playerPos.x, playerPos.z); this.spawnTimer = 3.5; } if (this.cruisers.length > targetCruisers + 1) {
const c = this.cruisers.pop(); this.removeCruiser(c); }
let nearest = Infinity; for (const car of this.cruisers) {
const dx = playerPos.x - car.pos.x, dz = playerPos.z - car.pos.z, dist = Math.hypot(dx, dz); nearest = Math.min(nearest, dist); if (dist > 240) {
const [x, z] = this.spawnPoint(playerPos.x, playerPos.z); car.place(x, z, Math.atan2(-(playerPos.x - x), -(playerPos.z - z))); continue; }
const desired = Math.atan2(-dx, -dz), diff = angleDelta(car.yaw, desired), steer = clamp(diff * 1.8, -1, 1), throttle = dist > 14 ? 1 : (dist > 9 ? 0.2 : 0); if (!car.stationary) { car.drive(dt, throttle, steer, false); car.braking = dist < 16; } car.updateVisual(dt);
const siren = car.mesh.userData.sirenLights; if (siren) {
const t = performance.now() * 0.006; siren[0].material.emissiveIntensity = Math.sin(t) > 0 ? 2.4 : 0.15; siren[1].material.emissiveIntensity = Math.sin(t) > 0 ? 0.15 : 2.4;
const sg = car.mesh.userData.sirenGlow; if (sg) { sg[0].material.opacity = Math.sin(t) > 0 ? 0.9 : 0.05; sg[1].material.opacity = Math.sin(t) > 0 ? 0.05 : 0.9; } } if (dist < 22 && playerOnFoot && !car.deployed) { car.deployed = true; this.deployOfficers(car); car.speed = 0; } } if (nearest < 100) this.evade = 0; else { this.evade += dt; if (this.evade > 26 && this.stars > 0) { this.stars--; this.evade = 0; if (this.audio) this.audio.evadeChime(); } } for (const o of this.officers) { if (!o.active) continue; if (!o.alive) { o.rig.group.rotation.z = Math.min(1.5, o.rig.group.rotation.z + dt * 3); continue; }
const dx = playerPos.x - o.x, dz = playerPos.z - o.z, d = Math.hypot(dx, dz); o.yaw = dampAngle(o.yaw, Math.atan2(-dx, -dz), 7, dt); if (d > 13) { o.x += (dx / d) * 2.6 * dt; o.z += (dz / d) * 2.6 * dt; o.phase += dt * 7; animateHumanoid(o.rig, o.phase, 3.4, false, dt); } else { animateHumanoid(o.rig, o.phase, 0, true, dt); }
const gy = this.world.heightAt(o.x, o.z); o.rig.group.position.set(o.x, gy + 0.01, o.z); o.rig.group.rotation.y = o.yaw; o.shootTimer -= dt; if (o.shootTimer <= 0 && d < 42 && playerAlive && !this.world.segmentBlocked(o.x, o.z, playerPos.x, playerPos.z)) { o.shootTimer = 0.85 + Math.random() * 0.9;
const from = new THREE.Vector3(o.x, gy + 1.5, o.z);
const to = new THREE.Vector3(playerPos.x + rand(-0.5, 0.5), 1.3, playerPos.z + rand(-0.5, 0.5)); this.addTracer(from, to, 0xffe0a8); if (this.audio) this.audio.gunshot(0.25); if (Math.random() < 0.55) onDamage(6 + Math.random() * 7); } } if (this.stars >= 4) { if (!this.chopper) this.buildChopper();
const ch = this.chopper; ch.angle += dt * 0.42;
const radius = 26, tx = playerPos.x + Math.cos(ch.angle) * radius, tz = playerPos.z + Math.sin(ch.angle) * radius; ch.group.position.x = lerp(ch.group.position.x, tx, 1 - Math.exp(-0.9 * dt)); ch.group.position.z = lerp(ch.group.position.z, tz, 1 - Math.exp(-0.9 * dt)); ch.group.position.y = lerp(ch.group.position.y, 34, 1 - Math.exp(-1.2 * dt)); ch.group.rotation.y = dampAngle(ch.group.rotation.y, Math.atan2(-(playerPos.x - ch.group.position.x), -(playerPos.z - ch.group.position.z)), 1.2, dt); ch.rotor.rotation.y += dt * 28; ch.tailRotor.rotation.x += dt * 34; ch.target.position.set(0, -30, -4); ch.beacon.material.opacity = Math.sin(performance.now() * 0.012) > 0 ? 1 : 0.15; if (this.stars >= 5) { ch.shootTimer = (ch.shootTimer ?? 1.5) - dt; if (ch.shootTimer <= 0 && playerAlive) { ch.shootTimer = 1.6;
const from = ch.group.position.clone(), to = new THREE.Vector3(playerPos.x, 1.2, playerPos.z); this.addTracer(from, to, 0xffd0a0); if (this.audio) this.audio.gunshot(0.2); onDamage(4); } } } else if (this.chopper) { this.scene.remove(this.chopper.group); this.chopper = null; } } hitTest(origin, dir, maxDist = 90) {
let best = null, bd = maxDist;
const ray = new THREE.Ray(origin, dir); for (const o of this.officers) { if (!o.active || !o.alive) continue;
const p = new THREE.Vector3(o.x, 1.1, o.z), dist = ray.distanceToPoint(p); if (dist < 0.8) {
const t = origin.distanceTo(p); if (t < bd) { bd = t; best = { type: 'officer', officer: o, point: p, dist: t }; } } } for (const c of [...this.cruisers, ...(this.block?.cars || [])]) {
const p = new THREE.Vector3(c.pos.x, 0.9, c.pos.z); if (ray.distanceToPoint(p) < 1.8) {
const t = origin.distanceTo(p); if (t < bd) { bd = t; best = { type: 'cruiser', car: c, point: p, dist: t }; } } } return best; } damageOfficer(o, amount = 1) { o.health -= amount; if (o.health <= 0) { o.alive = false; o.rig.group.rotation.z = 0.3; if (this.audio) this.audio.hitConfirm(); return true; } return false; } }
// provenance: witnessed in the high-tide session
