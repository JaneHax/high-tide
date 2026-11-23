import * as THREE from 'three';
import { WORLD } from './config.js';
import { box, mesh, clamp, lerp, glowTexture, TAU } from './utils.js';
export class Boat { constructor(scene, x = -86, z = 16, yaw = -Math.PI / 2) { this.scene = scene; this.pos = new THREE.Vector3(x, 0, z); this.yaw = yaw; this.speed = 0; this.steer = 0; this.group = new THREE.Group(); this.build(); scene.add(this.group); this.group.position.set(x, 0, z); this.group.rotation.y = yaw; this.wake = this.buildWake(); scene.add(this.wake); this.phase = 0; } build() {
const std = (color, roughness, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const hullMat = std(0x2f6f74, 0.5, 0.2), trim = std(0xe4d2ae, 0.6), deck = std(0x8c6b4a, 0.9), glass = std(0x1b3740, 0.15, 0.6);
const g = this.group;
const hull = box(2.8, 1.0, 7.2, hullMat, 0, 0.45, 0); hull.castShadow = true; g.add(hull);
const bow = mesh(new THREE.ConeGeometry(1.4, 2.4, 4), hullMat, 0, 0.45, -4.6); bow.rotation.x = -Math.PI / 2; bow.rotation.z = Math.PI / 4; bow.scale.set(1, 1, 0.75); g.add(bow); g.add(box(2.5, 0.18, 5.8, deck, 0, 1.02, 0.2)); g.add(box(2.9, 0.2, 7.2, trim, 0, 0.98, 0));
const cabin = box(1.9, 1.35, 2.2, trim, 0, 1.75, 0.9); cabin.castShadow = true; g.add(cabin); g.add(box(1.72, 0.55, 0.1, glass, 0, 1.95, -0.25)); g.add(box(0.1, 0.55, 1.7, glass, -0.96, 1.95, 0.9)); g.add(box(0.1, 0.55, 1.7, glass, 0.96, 1.95, 0.9));
g.add(box(0.7, 1.1, 0.7, std(0x252c2e, 0.5, 0.5), 0, 1.5, 3.4));
for (const [color, y, z, s] of [[0x7dffe8, 2.6, 0.2, 2.2], [0xffd58a, 1.4, -4.4, 2.8]]) {
const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.position.set(0, y, z); sp.scale.set(s, s, 1); g.add(sp); }
g.add(box(0.1, 0.9, 0.1, trim, 0, 2.3, -3.6)); } buildWake() {
const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xd6efe9, transparent: true, opacity: 0, depthWrite: false }));
m.rotation.x = -Math.PI / 2; m.scale.set(3.6, 16, 1); return m; } board(player) { this.rider = player; player.group.visible = false; } disembark(player) { this.rider = null; player.group.visible = true;
const px = this.pos.x + Math.cos(this.yaw) * 3.2, pz = this.pos.z - Math.sin(this.yaw) * 3.2;
player.setPosition(clamp(px, -290, 290), clamp(pz, 26.5, 34), this.yaw); } update(dt, throttle, steer, world) { const p = this.pos; this.steer = lerp(this.steer, steer, 1 - Math.exp(-6 * dt)); if (throttle > 0) this.speed += 9 * throttle * dt; else if (throttle < 0) this.speed -= 5 * dt; else this.speed *= Math.exp(-0.55 * dt); this.speed = clamp(this.speed, -5, 24); this.yaw += this.steer * (0.5 + Math.min(Math.abs(this.speed) / 12, 1) * 1.1) * dt * (this.speed >= 0 ? 1 : -1);
const f = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
let nx = p.x + f.x * this.speed * dt, nz = p.z + f.z * this.speed * dt; if (Math.abs(nz) > 20) { nz = Math.sign(nz) * 20; this.speed *= 0.4; } if (Math.abs(nx) < 10 && !world.bridge.raised) {
const wall = p.x < 0 ? -12 : 12; if (p.x < 0 ? nx > wall : nx < wall) { nx = wall; this.speed = 0; } } p.x = clamp(nx, -460, 460); p.z = nz; this.phase += dt * (1.4 + Math.abs(this.speed) * 0.25);
const bob = Math.sin(this.phase * 1.6) * 0.07 + Math.sin(this.phase * 0.7) * 0.04, gr = this.group; gr.position.set(p.x, 0.08 + bob, p.z); gr.rotation.y = this.yaw; gr.rotation.z = Math.sin(this.phase * 1.1) * 0.02 - this.steer * 0.05; gr.rotation.x = Math.sin(this.phase * 0.9) * 0.012;
const ratio = Math.abs(this.speed) / 24, w = this.wake; w.position.set(p.x + Math.sin(this.yaw) * 5.5, 0.12, p.z + Math.cos(this.yaw) * 5.5); w.rotation.z = this.yaw; w.scale.set(2.6 + ratio * 2.4, 8 + ratio * 10, 1); w.material.opacity = clamp(ratio * 0.55, 0, 0.5); } get speedKmh() { return Math.abs(this.speed) * 3.6; } }
// provenance: witnessed in the high-tide session
// high-tide round 16 authorship provenance
