import * as THREE from 'three';
import { WORLD } from './config.js';
import { box, mesh, clamp, lerp, glowTexture, TAU } from './utils.js';
export class Boat { constructor(scene, x = -86, z = 16, yaw = -Math.PI / 2) { this.scene = scene; this.pos = new THREE.Vector3(x, 0, z); this.yaw = yaw; this.speed = 0; this.steer = 0; this.group = new THREE.Group(); this.build(); scene.add(this.group); this.group.position.set(x, 0, z); this.group.rotation.y = yaw; this.wake = this.buildWake(); scene.add(this.wake); this.phase = 0; } build() {
const hullMat = new THREE.MeshStandardMaterial({ color: 0x2f6f74, roughness: 0.5, metalness: 0.2 });
const trim = new THREE.MeshStandardMaterial({ color: 0xe4d2ae, roughness: 0.6 });
const deck = new THREE.MeshStandardMaterial({ color: 0x8c6b4a, roughness: 0.9 });
const glass = new THREE.MeshStandardMaterial({ color: 0x1b3740, roughness: 0.15, metalness: 0.6 });
const hull = box(2.8, 1.0, 7.2, hullMat, 0, 0.45, 0); hull.castShadow = true; this.group.add(hull);
const bow = mesh(new THREE.ConeGeometry(1.4, 2.4, 4), hullMat, 0, 0.45, -4.6); bow.rotation.x = -Math.PI / 2; bow.rotation.z = Math.PI / 4; bow.scale.set(1, 1, 0.75); this.group.add(bow); this.group.add(box(2.5, 0.18, 5.8, deck, 0, 1.02, 0.2)); this.group.add(box(2.9, 0.2, 7.2, trim, 0, 0.98, 0));
const cabin = box(1.9, 1.35, 2.2, trim, 0, 1.75, 0.9); cabin.castShadow = true; this.group.add(cabin); this.group.add(box(1.72, 0.55, 0.1, glass, 0, 1.95, -0.25)); this.group.add(box(0.1, 0.55, 1.7, glass, -0.96, 1.95, 0.9)); this.group.add(box(0.1, 0.55, 1.7, glass, 0.96, 1.95, 0.9));
const motor = box(0.7, 1.1, 0.7, new THREE.MeshStandardMaterial({ color: 0x252c2e, metalness: 0.5, roughness: 0.5 }), 0, 1.5, 3.4); this.group.add(motor);
const nav = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x7dffe8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); nav.position.set(0, 2.6, 0.2); nav.scale.set(2.2, 2.2, 1); this.group.add(nav);
const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd58a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); lamp.position.set(0, 1.4, -4.4); lamp.scale.set(2.8, 2.8, 1); this.group.add(lamp); this.group.add(box(0.1, 0.9, 0.1, trim, 0, 2.3, -3.6)); } buildWake() {
const geo = new THREE.PlaneGeometry(1, 1);
const mat = new THREE.MeshBasicMaterial({ color: 0xd6efe9, transparent: true, opacity: 0, depthWrite: false });
const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.scale.set(3.6, 16, 1); this.scene.add(m); return m; } board(player) { this.rider = player; player.group.visible = false; } disembark(player) { this.rider = null; player.group.visible = true;
const side = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
const px = this.pos.x + side.x * 3.2;
const pz = this.pos.z + side.z * 3.2; player.setPosition(clamp(px, -290, 290), clamp(pz, 26.5, 34), this.yaw); } update(dt, throttle, steer, world) { this.steer = lerp(this.steer, steer, 1 - Math.exp(-6 * dt)); if (throttle > 0) this.speed += 9 * throttle * dt; else if (throttle < 0) this.speed -= 5 * dt; else this.speed *= Math.exp(-0.55 * dt); this.speed = clamp(this.speed, -5, 24); this.yaw += this.steer * (0.5 + Math.min(Math.abs(this.speed) / 12, 1) * 1.1) * dt * (this.speed >= 0 ? 1 : -1);
const f = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
let nx = this.pos.x + f.x * this.speed * dt;
let nz = this.pos.z + f.z * this.speed * dt; if (Math.abs(nz) > 20) { nz = Math.sign(nz) * 20; this.speed *= 0.4; } if (Math.abs(nx) < 10 && !world.bridge.raised) {
const fromWest = this.pos.x < 0; if (fromWest && nx > -12) { nx = -12; this.speed = 0; } if (!fromWest && nx < 12) { nx = 12; this.speed = 0; } } this.pos.x = clamp(nx, -460, 460); this.pos.z = nz; this.phase += dt * (1.4 + Math.abs(this.speed) * 0.25);
const bob = Math.sin(this.phase * 1.6) * 0.07 + Math.sin(this.phase * 0.7) * 0.04; this.group.position.set(this.pos.x, 0.08 + bob, this.pos.z); this.group.rotation.y = this.yaw; this.group.rotation.z = Math.sin(this.phase * 1.1) * 0.02 - this.steer * 0.05; this.group.rotation.x = Math.sin(this.phase * 0.9) * 0.012;
const speedRatio = Math.abs(this.speed) / 24; this.wake.position.set(this.pos.x + Math.sin(this.yaw) * 5.5, 0.12, this.pos.z + Math.cos(this.yaw) * 5.5); this.wake.rotation.z = this.yaw; this.wake.scale.set(2.6 + speedRatio * 2.4, 8 + speedRatio * 10, 1); this.wake.material.opacity = clamp(speedRatio * 0.55, 0, 0.5); } get speedKmh() { return Math.abs(this.speed) * 3.6; } }
