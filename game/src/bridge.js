import * as THREE from 'three';
import { BRIDGE, WORLD } from './config.js';
import { box, mesh, glowTexture, textTexture, hazardTexture, clamp, TAU } from './utils.js';
const ease = (t) => t * t * (3 - 2 * t);
export class Drawbridge { constructor(scene, world) { this.scene = scene; this.world = world; this.state = 'closed'; this.timer = 0; this.angle = 0; this.forced = false; this.group = new THREE.Group(); this.leaves = []; this.build(); scene.add(this.group); this.setGates(false); } build() {
const steel = new THREE.MeshStandardMaterial({ color: 0x6a7376, roughness: 0.55, metalness: 0.5 });
const dark = new THREE.MeshStandardMaterial({ color: 0x2d3538, roughness: 0.7, metalness: 0.4 });
const deckMat = new THREE.MeshStandardMaterial({ color: 0x2f3538, roughness: 0.86, metalness: 0.08 });
const stripeMat = new THREE.MeshStandardMaterial({ color: 0xe0a83c, roughness: 0.6 });
const concrete = new THREE.MeshStandardMaterial({ color: 0xc2b49a, roughness: 0.86 });
const rust = new THREE.MeshStandardMaterial({ color: 0x9a533c, roughness: 0.72, metalness: 0.3 });
const coral = new THREE.MeshStandardMaterial({ color: 0xc2684e, roughness: 0.7 }); for (const side of [-1, 1]) {
const pivot = new THREE.Group(); pivot.position.set(0, WORLD.deckY, side * WORLD.bridgeSpan);
const dir = -side;
const deck = box(WORLD.bridgeHalfWidth * 2, 0.55, WORLD.bridgeSpan, deckMat, 0, 0, dir * WORLD.bridgeSpan / 2); deck.castShadow = true; deck.receiveShadow = true; pivot.add(deck); for (const sx of [-1, 1]) {
const girder = box(0.55, 1.5, WORLD.bridgeSpan, rust, sx * (WORLD.bridgeHalfWidth - 0.25), -0.6, dir * WORLD.bridgeSpan / 2); girder.castShadow = true; pivot.add(girder); for (let i = 0; i < 8; i++) { pivot.add(box(0.6, 0.16, 1.4, i % 2 ? stripeMat : dark, sx * (WORLD.bridgeHalfWidth - 0.25), -0.1, dir * (2.4 + i * 3.1))); }
const rail = box(0.22, 1.0, WORLD.bridgeSpan, steel, sx * (WORLD.bridgeHalfWidth - 0.35), 0.75, dir * WORLD.bridgeSpan / 2); pivot.add(rail); for (let i = 0; i < 7; i++) { pivot.add(box(0.14, 0.8, 0.14, steel, sx * (WORLD.bridgeHalfWidth - 0.35), 0.55, dir * (2 + i * 3.6))); } } for (let i = 0; i < 6; i++) { pivot.add(box(14.4, 0.35, 0.5, dark, 0, -0.55, dir * (3 + i * 4.4))); } for (let i = 0; i < 8; i++) { pivot.add(box(1.1, 0.06, 1.5, stripeMat, 0, 0.32, dir * (2.4 + i * 3.1))); } pivot.add(box(0.3, 0.05, 25, stripeMat, 0, 0.34, dir * 12.5)); pivot.add(box(0.18, 0.05, 25, new THREE.MeshStandardMaterial({ color: 0xd8d2c0, roughness: 0.8 }), -6.7, 0.34, dir * 12.5)); pivot.add(box(0.18, 0.05, 25, new THREE.MeshStandardMaterial({ color: 0xd8d2c0, roughness: 0.8 }), 6.7, 0.34, dir * 12.5));
const counter = box(7, 3.4, 5, concrete, 0, -2.2, -dir * 4.5); counter.castShadow = true; pivot.add(counter); pivot.add(box(7.2, 0.5, 5.2, coral, 0, -0.4, -dir * 4.5));
const hazardMat = new THREE.MeshBasicMaterial({ map: hazardTexture(), transparent: true, opacity: 0.95, side: THREE.DoubleSide });
const hazard = new THREE.Mesh(new THREE.PlaneGeometry(13, 3.2), hazardMat); hazard.position.set(0, -0.34, dir * 20); hazard.rotation.x = Math.PI / 2; pivot.add(hazard);
const hazardTop = new THREE.Mesh(new THREE.PlaneGeometry(13, 3.2), hazardMat); hazardTop.position.set(0, 0.32, dir * 20); hazardTop.rotation.x = -Math.PI / 2; pivot.add(hazardTop);
const tip = box(16, 0.5, 0.5, coral, 0, 0.05, dir * 25.9); pivot.add(tip); for (const sx of [-1, 1]) {
const warn = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff3a26, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); warn.position.set(sx * 7.2, -0.25, dir * 24); warn.scale.set(2.4, 2.4, 1); pivot.add(warn);
const warn2 = warn.clone(); warn2.position.y = 0.4; pivot.add(warn2); } pivot.rotation.x = 0; this.group.add(pivot); this.leaves.push({ pivot, side, dir }); } for (const side of [-1, 1]) { for (const sx of [-1, 1]) {
const tower = box(3.8, 13, 5.8, concrete, sx * 10.8, WORLD.deckY + 5.6, side * (WORLD.bridgeSpan + 3)); tower.castShadow = true; this.group.add(tower); this.group.add(box(4.3, 0.7, 6.4, coral, sx * 10.8, WORLD.deckY + 12.1, side * (WORLD.bridgeSpan + 3))); this.group.add(box(4.2, 1.1, 6.2, dark, sx * 10.8, WORLD.deckY + 0.4, side * (WORLD.bridgeSpan + 3)));
const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff4433, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); lamp.position.set(sx * 10.8, WORLD.deckY + 13.2, side * (WORLD.bridgeSpan + 3)); lamp.scale.set(2.2, 2.2, 1); this.group.add(lamp);
const trunnion = mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.7, 18), rust, sx * 8.6, WORLD.deckY + 0.1, side * WORLD.bridgeSpan); trunnion.rotation.z = Math.PI / 2; this.group.add(trunnion);
const trunnion2 = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.85, 12), stripeMat, sx * 8.6, WORLD.deckY + 0.1, side * WORLD.bridgeSpan); trunnion2.rotation.z = Math.PI / 2; this.group.add(trunnion2); }
const housing = box(4.2, 3.4, 5, dark, 0, WORLD.deckY + 1.6, side * (WORLD.bridgeSpan + 4.5)); housing.castShadow = true; housing.position.x = 10.8; this.group.add(housing);
const housing2 = housing.clone(); housing2.position.x = -10.8; this.group.add(housing2);
const braceMat = steel; for (const sx of [-1, 1]) {
const brace = box(0.35, 6.5, 0.35, braceMat, sx * 9.4, WORLD.deckY + 8.2, side * (WORLD.bridgeSpan + 2.2)); brace.rotation.z = sx * 0.42; this.group.add(brace); }
const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture('PUENTE SOL', { color: '#ffe2ae', glow: '#ff7a52', font: 'bold 62px "Arial Narrow", Arial, sans-serif', width: 512 }),
transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
})); sign.position.set(0, WORLD.deckY + 8.8, side * (WORLD.bridgeSpan + 0.1)); sign.scale.set(13, 2.8, 1); this.group.add(sign); }
const gateMat = new THREE.MeshStandardMaterial({ map: hazardTexture(), roughness: 0.7 });
const redMat = new THREE.MeshStandardMaterial({ color: 0xd94a35, emissive: 0x8a1c10, emissiveIntensity: 0.6 }); this.gates = []; for (const side of [-1, 1]) {
const pivot = new THREE.Group(); pivot.position.set(-8, 1.25, side * BRIDGE.gateZ);
const arm = box(16, 0.4, 0.35, gateMat, 8, 0, 0); pivot.add(arm); for (let i = 0; i < 7; i++) pivot.add(box(0.55, 0.45, 0.4, redMat, 1.6 + i * 2.1, 0, 0));
const tip = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffa03c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); tip.position.set(15.5, 0.2, 0); tip.scale.set(2, 2, 1); pivot.add(tip); pivot.rotation.z = -1.42; this.group.add(pivot);
const post = box(0.5, 2.6, 0.5, steel, -8, 1.3, side * BRIDGE.gateZ); this.group.add(post); this.gates.push(pivot); }
const booth = new THREE.Group(); booth.position.set(17, 0.35, -36);
const b = box(4.4, 3.2, 3.4, concrete, 0, 1.6, 0); b.castShadow = true; booth.add(b); booth.add(box(4.9, 0.3, 3.9, dark, 0, 3.35, 0));
const win = box(0.1, 1.1, 2.2, new THREE.MeshStandardMaterial({ color: 0xffca7a, emissive: 0xffa84f, emissiveIntensity: 0.9 }), -2.23, 2.1, 0); booth.add(win);
const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture('PUENTE', { color: '#ffe0ac', glow: '#ff6a45', font: 'bold 72px "Arial Narrow", Arial, sans-serif', width: 512 }),
transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
})); sign.position.set(0, 4.4, 0); sign.scale.set(6, 1.5, 1); booth.add(sign); this.scene.add(booth); this.booth = booth; this.world.addBoxCollider(17, -36, 4.4, 3.4, 'booth'); } setGates(open) { for (const g of this.gates) { g.rotation.z = open ? 0 : -1.42; } } requestOpen() { if (this.state === 'closed') { this.state = 'warning'; this.timer = 0; this.forced = true; } } requestClose() { if (this.state === 'open') { this.state = 'closing'; this.timer = 0; } } forceOpen() { if (this.state !== 'open' && this.state !== 'opening') { this.state = 'opening'; this.timer = 0; } } get passable() { return this.state === 'closed' && this.angle < 0.02; } get raised() { return this.angle > 0.9; } get statusText() { switch (this.state) {
case 'closed': return 'DECK LOWERED';
case 'warning': return 'CLEAR THE SPAN';
case 'opening': return 'RAISING';
case 'open': return 'CHANNEL OPEN';
case 'closing': return 'LOWERING';
default: return ''; } } get secondsLeft() { switch (this.state) {
case 'closed': return Math.max(0, BRIDGE.closedHold - this.timer);
case 'open': return Math.max(0, BRIDGE.openHold - this.timer);
case 'warning': return Math.max(0, BRIDGE.warningTime - this.timer);
default: return 0; } } update(dt) { this.timer += dt; if (this.state === 'closed') { if (this.timer >= BRIDGE.closedHold) { this.state = 'warning'; this.timer = 0; this.setGates(true); } } else if (this.state === 'warning') { if (this.timer >= BRIDGE.warningTime) { this.state = 'opening'; this.timer = 0; this.forced = false; } } else if (this.state === 'opening') {
const t = clamp(this.timer / BRIDGE.openTime, 0, 1); this.angle = ease(t) * BRIDGE.maxAngle; if (t >= 1) { this.state = 'open'; this.timer = 0; } } else if (this.state === 'open') { this.angle = BRIDGE.maxAngle; if (this.timer >= BRIDGE.openHold && !this.forced) { this.state = 'closing'; this.timer = 0; } } else if (this.state === 'closing') {
const t = clamp(this.timer / BRIDGE.closeTime, 0, 1); this.angle = (1 - ease(t)) * BRIDGE.maxAngle; if (t >= 1) { this.state = 'closed'; this.timer = 0; this.angle = 0; this.setGates(false); } } for (const l of this.leaves) { l.pivot.rotation.x = l.side * this.angle; } } }
