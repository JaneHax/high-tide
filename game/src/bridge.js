import * as THREE from 'three';
import { BRIDGE, WORLD } from './config.js';
import { box, mesh, glowTexture, textTexture, hazardTexture, clamp, TAU } from './utils.js';
const ease = (t) => t * t * (3 - 2 * t);
const std = (color, roughness = 0.8, metalness = 0.02) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const glow = (color, scale = 2.4) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.set(scale, scale, 1); return s; };
const label = (text, color, gc, width, px) => new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(text, { color, glow: gc, width, font: `bold ${px}px "Arial Narrow", Arial, sans-serif` }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
const put = (o, x, y, z, sx, sy) => { o.position.set(x, y, z); o.scale.set(sx, sy, 1); return o; };
export class Drawbridge { constructor(scene, world) { this.scene = scene; this.world = world; this.state = 'closed'; this.timer = 0; this.angle = 0; this.forced = false; this.group = new THREE.Group(); this.leaves = []; this.build(); scene.add(this.group); this.setGates(false); } build() {
const steel = std(0x6a7376, 0.55, 0.5), dark = std(0x2d3538, 0.7, 0.4), deckMat = std(0x2f3538, 0.86, 0.08);
const stripeMat = std(0xe0a83c, 0.6), concrete = std(0xc2b49a, 0.86), rust = std(0x9a533c, 0.72, 0.3), coral = std(0xc2684e, 0.7);
const HW = WORLD.bridgeHalfWidth, SPAN = WORLD.bridgeSpan, DY = WORLD.deckY, lane = std(0xd8d2c0, 0.8);
const hz = hazardTexture(); for (const side of [-1, 1]) {
const pivot = new THREE.Group(); pivot.position.set(0, DY, side * SPAN);
const dir = -side, mid = dir * SPAN / 2;
const deck = box(HW * 2, 0.55, SPAN, deckMat, 0, 0, mid); deck.castShadow = true; deck.receiveShadow = true; pivot.add(deck); for (const sx of [-1, 1]) {
const girder = box(0.55, 1.5, SPAN, rust, sx * (HW - 0.25), -0.6, mid); girder.castShadow = true; pivot.add(girder); for (let i = 0; i < 8; i++) pivot.add(box(0.6, 0.16, 1.4, i % 2 ? stripeMat : dark, sx * (HW - 0.25), -0.1, dir * (2.4 + i * 3.1)));
pivot.add(box(0.22, 1.0, SPAN, steel, sx * (HW - 0.35), 0.75, mid)); for (let i = 0; i < 7; i++) pivot.add(box(0.14, 0.8, 0.14, steel, sx * (HW - 0.35), 0.55, dir * (2 + i * 3.6))); } for (let i = 0; i < 6; i++) pivot.add(box(14.4, 0.35, 0.5, dark, 0, -0.55, dir * (3 + i * 4.4))); for (let i = 0; i < 8; i++) pivot.add(box(1.1, 0.06, 1.5, stripeMat, 0, 0.32, dir * (2.4 + i * 3.1))); pivot.add(box(0.3, 0.05, 25, stripeMat, 0, 0.34, dir * 12.5));
for (const sx of [-1, 1]) pivot.add(box(0.18, 0.05, 25, lane, sx * 6.7, 0.34, dir * 12.5));
const counter = box(7, 3.4, 5, concrete, 0, -2.2, -dir * 4.5); counter.castShadow = true; pivot.add(counter); pivot.add(box(7.2, 0.5, 5.2, coral, 0, -0.4, -dir * 4.5));
const hazardMat = new THREE.MeshBasicMaterial({ map: hz, transparent: true, opacity: 0.95, side: THREE.DoubleSide }); for (const [y, rx] of [[-0.34, Math.PI / 2], [0.32, -Math.PI / 2]]) {
const h = new THREE.Mesh(new THREE.PlaneGeometry(13, 3.2), hazardMat); h.position.set(0, y, dir * 20); h.rotation.x = rx; pivot.add(h); }
pivot.add(box(16, 0.5, 0.5, coral, 0, 0.05, dir * 25.9)); for (const sx of [-1, 1]) {
pivot.add(put(glow(0xff3a26), sx * 7.2, -0.25, dir * 24, 1, 1), put(glow(0xff3a26), sx * 7.2, 0.4, dir * 24, 1, 1)); }
this.group.add(pivot); this.leaves.push({ pivot, side, dir }); } for (const side of [-1, 1]) {
const zc = side * (SPAN + 3); for (const sx of [-1, 1]) {
const tower = box(3.8, 13, 5.8, concrete, sx * 10.8, DY + 5.6, zc); tower.castShadow = true; this.group.add(tower, box(4.3, 0.7, 6.4, coral, sx * 10.8, DY + 12.1, zc), box(4.2, 1.1, 6.2, dark, sx * 10.8, DY + 0.4, zc));
this.group.add(put(glow(0xff4433, 2.2), sx * 10.8, DY + 13.2, zc, 1, 1));
const tr = mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.7, 18), rust, sx * 8.6, DY + 0.1, side * SPAN); tr.rotation.z = Math.PI / 2; this.group.add(tr);
const tr2 = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.85, 12), stripeMat, sx * 8.6, DY + 0.1, side * SPAN); tr2.rotation.z = Math.PI / 2; this.group.add(tr2); }
const housing = box(4.2, 3.4, 5, dark, 10.8, DY + 1.6, side * (SPAN + 4.5)); housing.castShadow = true; const housing2 = housing.clone(); housing2.position.x = -10.8; this.group.add(housing, housing2); for (const sx of [-1, 1]) {
const brace = box(0.35, 6.5, 0.35, steel, sx * 9.4, DY + 8.2, side * (SPAN + 2.2)); brace.rotation.z = sx * 0.42; this.group.add(brace); }
this.group.add(put(label('PUENTE SOL', '#ffe2ae', '#ff7a52', 512, 62), 0, DY + 8.8, side * (SPAN + 0.1), 13, 2.8)); }
const gateMat = std(0xffffff, 0.7, 0.02); gateMat.map = hz;
const redMat = new THREE.MeshStandardMaterial({ color: 0xd94a35, emissive: 0x8a1c10, emissiveIntensity: 0.6 }); this.gates = []; for (const side of [-1, 1]) {
const pivot = new THREE.Group(); pivot.position.set(-8, 1.25, side * BRIDGE.gateZ);
pivot.add(box(16, 0.4, 0.35, gateMat, 8, 0, 0)); for (let i = 0; i < 7; i++) pivot.add(box(0.55, 0.45, 0.4, redMat, 1.6 + i * 2.1, 0, 0));
pivot.add(put(glow(0xffa03c, 2), 15.5, 0.2, 0, 1, 1)); pivot.rotation.z = -1.42; this.group.add(pivot, box(0.5, 2.6, 0.5, steel, -8, 1.3, side * BRIDGE.gateZ)); this.gates.push(pivot); }
const booth = new THREE.Group(); booth.position.set(17, 0.35, -36);
const b = box(4.4, 3.2, 3.4, concrete, 0, 1.6, 0); b.castShadow = true; booth.add(b, box(4.9, 0.3, 3.9, dark, 0, 3.35, 0), box(0.1, 1.1, 2.2, new THREE.MeshStandardMaterial({ color: 0xffca7a, emissive: 0xffa84f, emissiveIntensity: 0.9 }), -2.23, 2.1, 0));
booth.add(put(label('PUENTE', '#ffe0ac', '#ff6a45', 512, 72), 0, 4.4, 0, 6, 1.5)); this.scene.add(booth); this.booth = booth; this.world.addBoxCollider(17, -36, 4.4, 3.4, 'booth'); } setGates(open) { for (const g of this.gates) { g.rotation.z = open ? 0 : -1.42; } } requestOpen() { if (this.state === 'closed') { this.state = 'warning'; this.timer = 0; this.forced = true; } } requestClose() { if (this.state === 'open') { this.state = 'closing'; this.timer = 0; } } forceOpen() { if (this.state !== 'open' && this.state !== 'opening') { this.state = 'opening'; this.timer = 0; } } get passable() { return this.state === 'closed' && this.angle < 0.02; } get raised() { return this.angle > 0.9; } get statusText() { switch (this.state) {
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
// provenance: witnessed in the high-tide session
// high-tide round 16 authorship provenance
