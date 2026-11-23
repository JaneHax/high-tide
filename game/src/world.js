import * as THREE from 'three';
import { WORLD, ROADS, PALETTE, LANDMARKS, SIDEWALK } from './config.js';
import { canvasTexture, facadeTexture, roadTexture, concreteTexture, cloudTexture, glowTexture, hazardTexture,
textTexture, mesh, box, plane, mulberry32, clamp, lerp, TAU,
} from './utils.js';
const rng = mulberry32(0x50a1c0de);
const GATE = 44;
const std = (color, roughness = 0.8, metalness = 0.02, extra = null) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
const glow = (color, scale = 3, opacity = 0.8) => {
const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.set(scale, scale, 1); return s; };
const label = (text, color, gc, width, px, additive = true) => new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(text, { color, glow: gc, width, font: `bold ${px}px "Arial Narrow", Arial, sans-serif` }),
transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
}));
const put = (o, x, y, z, sx, sy) => { o.position.set(x, y, z); o.scale.set(sx, sy, 1); return o; };
function weld(items) {
const pos = [], nor = [], uv = [], col = [], idx = [];
let off = 0;
const c = new THREE.Color(); for (const it of items) {
const g = it.geo ?? new THREE.BoxGeometry(it.w, it.h, it.d);
const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv; c.set(it.color); for (let i = 0; i < p.count; i++) { pos.push(p.getX(i) + (it.x ?? 0), p.getY(i) + (it.y ?? 0), p.getZ(i) + (it.z ?? 0));
const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i); nor.push(nx, ny, nz); if (it.flat) uv.push(u.getX(i), u.getY(i)); else {
const s = it.uv ?? 3.2; uv.push(u.getX(i) * (Math.abs(nx) > 0.5 ? it.d : it.w) / s, u.getY(i) * (Math.abs(ny) > 0.5 ? it.d : it.h) / s); }
const k = it.flat || (ny <= 0.5 && ny >= -0.5) ? 1 : ny > 0.5 ? 0.55 : 0.3; col.push(c.r * k, c.g * k, c.b * k); } for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + off); off += p.count; if (!it.geo) g.dispose(); }
const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeBoundingSphere(); return geo; }
function roadQuad(r) {
const h = r.width / 2, a = r.from, b = r.to, z = r.axis === 'z';
const pts = z ? [r.pos - h, a, r.pos + h, a, r.pos + h, b, r.pos - h, b] : [a, r.pos - h, a, r.pos + h, b, r.pos + h, b, r.pos - h];
const p = [], u = [], n = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]; for (let i = 0; i < 4; i++) p.push(pts[i * 2], 0, pts[i * 2 + 1]);
u.push(0, a / 24, 1, a / 24, 1, b / 24, 0, b / 24);
const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2)); geo.setIndex([0, 2, 1, 0, 3, 2]); return geo; }
function tileTexture(base, grout, seed = 1) { return canvasTexture(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h);
const r = mulberry32(seed); g.strokeStyle = grout; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); } for (let i = 0; i < 400; i++) {
g.fillStyle = `rgba(255,255,255,${r() * 0.06})`;
g.fillRect(r() * w, r() * h, 3, 3); } }, [6, 6]); }
export class World { constructor(scene, opts = {}) { this.scene = scene; this.low = !!opts.low; this.colliders = []; this.lamps = []; this.time = 0; this.storm = 0; this.flash = 0; this.rain = null; this.buildStatic(); this.buildBridgeApproach(); this.buildTerminal(); this.buildMarket(); this.buildGarage(); this.buildDocks(); this.buildHarborLife(); this.buildSkyline(); this.buildSky(); this.buildWater(); this.buildRain(); } addCollider(minX, maxX, minZ, maxZ, tag = 'building') { this.colliders.push({ minX, maxX, minZ, maxZ, tag }); } addBoxCollider(x, z, w, d, tag) { this.addCollider(x - w / 2, x + w / 2, z - d / 2, z + d / 2, tag); } buildStatic() {
const S = this.scene;
const groundMat = std(0xbdb19b, 0.92, 0.02, { map: concreteTexture() }); for (const z of [-162, 162]) { const p = plane(700, 276, groundMat, 0, 0.3, z); p.receiveShadow = true; S.add(p); }
const quayMat = std(0xffffff, 0.86, 0.03, { map: tileTexture('#a99f8d', 'rgba(70,64,55,0.35)', 4) });
const edgeMat = std(0xe3d7bf, 0.8); for (const side of [-1, 1]) {
const q = box(680, 1.1, 8, quayMat, 0, 0.15, side * 27.5); q.receiveShadow = true; S.add(q); S.add(box(680, 0.35, 0.7, edgeMat, 0, 0.78, side * 23.6)); }
const roadMat = new THREE.MeshStandardMaterial({ map: roadTexture(), vertexColors: true, roughness: 0.48, metalness: 0.18, color: 0xd8d4c8 });
const roadMesh = new THREE.Mesh(weld(ROADS.map((r) => ({ geo: roadQuad(r), color: 0xffffff, flat: 1 }))), roadMat); roadMesh.position.y = 0.33; roadMesh.receiveShadow = true; S.add(roadMesh); this.roadMesh = roadMesh;
const walkItems = []; for (const r of ROADS) { const mid = (r.from + r.to) / 2, len = r.to - r.from; for (const s of [-1, 1]) {
const off = s * (r.width / 2 + SIDEWALK / 2); if (r.axis === 'z') walkItems.push({ x: r.pos + off, y: 0.48, z: mid, w: SIDEWALK, h: 0.22, d: len, color: 0xc6baa4, uv: 4 }); else walkItems.push({ x: mid, y: 0.48, z: r.pos + off, w: len, h: 0.22, d: SIDEWALK, color: 0xc6baa4, uv: 4 }); } }
const walkMesh = new THREE.Mesh(weld(walkItems), std(0xd6cbb4, 0.9, 0.02, { map: concreteTexture(), vertexColors: true })); walkMesh.receiveShadow = true; S.add(walkMesh); this.buildBuildings(); this.buildPalms(); this.buildStreetFurniture(); } buildBuildings() {
const S = this.scene;
const palette = [PALETTE.cream, PALETTE.sand, PALETTE.coral, PALETTE.teal, PALETTE.mint, PALETTE.sky, PALETTE.plum, PALETTE.gold, 0xe0cbb2, 0xbfae94];
const xEdges = [-300, -150, 0, 150, 300], zEdgesN = [-300, -232, -152, -74, -42, -24], zEdgesS = [24, 42, 76, 154, 234, 300];
const exclusions = Object.values(LANDMARKS).map((l) => ({ minX: (l.x ?? 0) - (l.w ?? 18) / 2 - 5, maxX: (l.x ?? 0) + (l.w ?? 18) / 2 + 5,
minZ: (l.z ?? 0) - (l.d ?? 18) / 2 - 5, maxZ: (l.z ?? 0) + (l.d ?? 18) / 2 + 5,
})); exclusions.push({ minX: -19, maxX: 19, minZ: -70, maxZ: 70 }, { minX: 112, maxX: 300, minZ: -48, maxZ: -22 }, { minX: -300, maxX: -30, minZ: 22, maxZ: 48 });
const lots = [];
const bands = [...zEdgesN.slice(0, -1).map((z, i) => [z, zEdgesN[i + 1]]), ...zEdgesS.slice(0, -1).map((z, i) => [z, zEdgesS[i + 1]])]; for (const [z0, z1] of bands) { for (let xi = 0; xi < 4; xi++) {
const x0 = xEdges[xi], x1 = xEdges[xi + 1], inset = 8.5;
const minX = x0 + (x0 === -300 ? 6 : inset), maxX = x1 - (x1 === 300 ? 6 : inset);
const minZ = z0 + (z0 === -300 || z0 === 300 ? 6 : inset), maxZ = z1 - (z1 === -300 || z1 === 300 ? 6 : inset); if (maxX - minX < 12 || maxZ - minZ < 12) continue;
const cols = Math.max(1, Math.round((maxX - minX) / 22)), rows = Math.max(1, Math.round((maxZ - minZ) / 22));
const cw = (maxX - minX) / cols, cd = (maxZ - minZ) / rows; for (let cx = 0; cx < cols; cx++) { for (let cz = 0; cz < rows; cz++) {
const bx = minX + cw * (cx + 0.5), bz = minZ + cd * (cz + 0.5); if (rng() < 0.14) continue;
const bw = cw * (0.62 + rng() * 0.26), bd = cd * (0.62 + rng() * 0.26);
const rect = { minX: bx - bw / 2, maxX: bx + bw / 2, minZ: bz - bd / 2, maxZ: bz + bd / 2 }; if (exclusions.some((e) => rect.maxX > e.minX && rect.minX < e.maxX && rect.maxZ > e.minZ && rect.minZ < e.maxZ)) continue; lots.push({ bx, bz, bw, bd }); } } } }
const groups = [[], [], []];
const awnings = [0xc96b52, 0x3f7f78, 0xd9a63c, 0x7d5a6d, 0x4d8f8a]; for (const { bx, bz, bw, bd } of lots) {
const centerBias = 1 - clamp((Math.abs(bx) + Math.abs(bz)) / 430, 0, 1);
let h = 8 + rng() * 15 + centerBias * rng() * 44; if (rng() < 0.07) h += 26; h = Math.min(h, 78);
const color = palette[(rng() * palette.length) | 0], variant = (rng() * 3) | 0;
const items = groups[variant]; items.push({ x: bx, y: 0.5 + h / 2, z: bz, w: bw, h, d: bd, color }, { x: bx, y: 2.25, z: bz, w: bw + 0.18, h: 0.55, d: bd + 0.18, color: 0x223a40 }); this.addBoxCollider(bx, bz, bw, bd);
const side = rng() < 0.5 ? 1 : -1, along = rng() < 0.6, awn = awnings[(rng() * awnings.length) | 0]; if (along) items.push({ x: bx, y: 3.6, z: bz + side * (bd / 2 + 0.7), w: bw * 0.78, h: 0.16, d: 1.5, color: awn }); else items.push({ x: bx + side * (bw / 2 + 0.7), y: 3.6, z: bz, w: 1.5, h: 0.16, d: bd * 0.78, color: awn }); if (h > 26) {
const rw = bw * (0.28 + rng() * 0.24), rd = bd * (0.28 + rng() * 0.24); items.push({ x: bx + (rng() - 0.5) * bw * 0.2, y: 0.5 + h + 2, z: bz + (rng() - 0.5) * bd * 0.2, w: rw, h: 4, d: rd, color: 0x8e8578 }); } } for (let i = 0; i < 3; i++) {
const tex = facadeTexture(i + 1);
const mat = new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 0.82, metalness: 0.08, emissive: 0xffb067, emissiveMap: tex, emissiveIntensity: 0.18 });
const meshB = new THREE.Mesh(weld(groups[i]), mat); meshB.castShadow = !this.low; meshB.receiveShadow = true; S.add(meshB); if (i === 0) this.buildings = meshB; }
const signDefs = [
['HOTEL SOL', -28, 24, 18, 0xffc46a], ['CASA BRISA', 34, -46, 14, 0x8ee8df],
['DINER', -118, 54, 11, 0xff8a62], ['FARO', 156, -118, 16, 0xffd080],
['ANCLA', -168, -168, 13, 0x9fe0ff], ['TIENDA', 62, 116, 10, 0xffb0c8],
]; for (const [text, x, z, y, color] of signDefs) S.add(put(label(text, '#fff4dc', '#' + new THREE.Color(color).getHexString(), 512, 54, false), x, y, z, 12, 3)); } buildPalms() {
const parts = [{ geo: new THREE.CylinderGeometry(0.16, 0.34, 7.2, 6).translate(0, 3.6, 0), color: 0x7c6244 }]; for (let i = 0; i < 8; i++) {
const f = new THREE.BoxGeometry(0.35, 0.08, 3.6); f.translate(0, 0, 1.8); f.rotateX(-0.36 - (i % 3) * 0.12); f.rotateY((i / 8) * TAU); f.translate(0, 7.15, 0); parts.push({ geo: f, color: i % 2 ? 0x4c8352 : 0x356b41 }); }
const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, side: THREE.DoubleSide });
const positions = []; for (let x = -286; x <= 286; x += 21) { if (Math.abs(x) < 14 || (x > 120 && x < 290) || (x > -125 && x < -45)) continue; positions.push([x, -33.5], [x, 33.5]); } for (let z = -286; z <= 286; z += 34) { if (Math.abs(z) < 34) continue; positions.push([-11.5, z], [11.5, z]); }
const inst = new THREE.InstancedMesh(weld(parts), mat, positions.length);
const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0); positions.forEach(([x, z], i) => { q.setFromAxisAngle(up, rng() * TAU);
const sc = 0.75 + rng() * 0.4; s.set(sc, sc, sc); m.compose(new THREE.Vector3(x, 0.6, z), q, s); inst.setMatrixAt(i, m); }); inst.castShadow = true; this.scene.add(inst); this.palmInst = inst; this.palmPositions = positions; } buildStreetFurniture() {
const S = this.scene, items = [], poleColor = 0x394348, lampColor = 0xffe0a0; for (const road of ROADS) { if (road.width < 10) continue;
const step = road.axis === 'z' ? 30 : 36, vert = road.axis === 'z'; for (let t = road.from + 14; t < road.to - 10; t += step) { for (const side of [-1, 1]) {
const off = side * (road.width / 2 + 2.1), x = vert ? road.pos + off : t, z = vert ? t : road.pos + off;
if ((Math.abs(x) < 12 && Math.abs(z) < 60) || Math.abs(z) < 26) continue; if (x > -112 && x < -28 && z > 28 && z < 40) continue; if (Math.abs(x) < 14 && z > 38 && z < 104) continue; items.push({ x, y: 4.3, z, w: 0.16, h: 8.2, d: 0.16, color: poleColor, uv: 2 }, { x: x + (vert ? side * 0.7 : 0), y: 8.3, z: z + (vert ? 0 : side * 0.7), w: 1.5, h: 0.16, d: 0.16, color: poleColor, uv: 2 });
const lampX = vert ? x + side * 1.35 : x, lampZ = vert ? z : z + side * 1.35; items.push({ x: lampX, y: 8.15, z: lampZ, w: 0.55, h: 0.2, d: 0.55, color: lampColor, uv: 2 }); this.lamps.push(new THREE.Vector3(lampX, 8.0, lampZ)); } } }
const m = new THREE.Mesh(weld(items), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.4, emissive: 0x1a1a14, emissiveIntensity: 0.3 })); m.castShadow = true; S.add(m);
const gmat = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffc978, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }); for (const p of this.lamps) { const sp = new THREE.Sprite(gmat); sp.position.copy(p); sp.scale.set(3.4, 3.4, 1); S.add(sp); }
const barrierMat = std(0xffffff, 0.7, 0.02, { map: hazardTexture() }); for (const side of [-1, 1]) { for (const x of [-7.4, 0, 7.4]) {
const b = box(1.1, 0.9, 0.35, barrierMat, x, 1.0, side * 43.5); b.castShadow = true; S.add(b); } } } buildBridgeApproach() {
const mat = std(0x34393b, 0.86, 0.08); for (const side of [-1, 1]) {
const ramp = box(16, 0.5, 20, mat, 0, 0.85, side * 35); ramp.rotation.x = side * -0.055; ramp.receiveShadow = true; this.scene.add(ramp); } }
buildTerminal() {
const L = LANDMARKS.terminal, g = new THREE.Group(); g.position.set(L.x, 0.55, L.z);
const mats = { c: std(0xe9dcc0, 0.72), t: std(0xbf6d50, 0.6), g: std(0x244550, 0.18, 0.55, { emissive: 0x1b3b45, emissiveIntensity: 0.45 }) };
let i = 0; for (const [k, w, h, d, x, y, z] of [
['c', 58, 13, 26, 0, 6.5, 0], ['c', 40, 17, 20, -4, 14, -2], ['c', 13, 36, 13, 16, 24, -3],
['t', 15, 3, 15, 16, 43.5, -3], ['t', 1.4, 10, 1.4, 16, 49.5, -3], ['g', 36, 8.5, 0.5, -2, 6.2, 13.2],
['t', 44, 0.6, 6, -2, 11.2, 16],
]) { const b = box(w, h, d, mats[k], x, y, z); if (i++ < 3) b.castShadow = true; g.add(b); }
g.add(put(label('PUERTO SOL', '#ffe6b8', '#ff7a52', 768, 74, false), -2, 19, 16.5, 30, 5)); this.scene.add(g); this.addBoxCollider(L.x, L.z, 60, 28, 'terminal'); this.addBoxCollider(L.x + 16, L.z - 3, 14, 14, 'tower'); this.terminal = g; } buildMarket() {
const L = LANDMARKS.market, g = new THREE.Group(); g.position.set(L.x, 0.55, L.z);
const body = box(44, 7, 22, std(0x9a6a4d, 0.9), 0, 3.5, 0); body.castShadow = true; body.receiveShadow = true; g.add(body);
const rf = box(48, 0.5, 26, std(0x5d7777, 0.65, 0.25), 0, 7.3, 0); rf.rotation.z = 0.02; g.add(rf);
g.add(put(label('MERCADO', '#ffb2a0', '#ff3f5f', 640, 96), 0, 9.4, 12.2, 28, 6)); this.addBoxCollider(L.x, L.z, 44, 22, 'market'); this.market = g; } buildGarage() {
const L = LANDMARKS.garage, g = new THREE.Group(); g.position.set(L.x, 0.55, L.z);
const b = box(28, 9, 22, std(0x7f8179, 0.92), 0, 4.5, 0); b.castShadow = true; b.receiveShadow = true; g.add(b);
g.add(box(9, 5.6, 0.4, std(0x3c4b4b, 0.6, 0.4), 4, 3.2, 11.1));
g.add(put(label('SOMBRA', '#ffd6a1', '#ff6b4a', 512, 88), -6, 7.3, 11.3, 14, 3.4));
const stripe = std(0xd4694c, 0.7); for (let i = 0; i < 6; i++) g.add(box(28, 0.18, 0.2, stripe, 0, 0.9 + i * 1.3, 11.15));
g.add(put(glow(0xffb070, 6), 4, 6.4, 12, 1, 1)); this.scene.add(g); this.addBoxCollider(L.x, L.z, 28, 22, 'garage'); this.garage = g; } buildDocks() {
const S = this.scene;
const craneMat = std(0xb75b45, 0.8), craneMat2 = std(0x3f7472, 0.8); for (let i = 0; i < 3; i++) {
const g = new THREE.Group(); g.position.set(142 + i * 54, 0.55, -32);
const legMat = i % 2 ? craneMat2 : craneMat; for (const dx of [-5, 5]) for (const dz of [-3, 3]) g.add(box(1.1, 38, 1.1, legMat, dx, 19, dz));
g.add(box(12, 1.6, 8, legMat, 0, 38, 0), box(3.2, 3.2, 4, legMat, 0, 35, 0), box(2.4, 1.6, 46, legMat, 0, 40, 16), box(1.1, 13, 1.1, legMat, 0, 32, -16));
g.add(put(glow(0xff5b3d, 3), 0, 41.2, 38, 1, 1)); S.add(g); }
const contColors = [0xb04f3f, 0x3e7d7b, 0xc7a04a, 0x506b7a, 0x8a5a6d, 0x6f8a5e], contItems = []; for (let i = 0; i < 26; i++) {
const x = 124 + (i % 7) * 7.2, z = -28 + Math.floor(i / 7) * 6.2, stack = (i % 3) + 1; for (let s = 0; s < stack; s++) contItems.push({ x, y: 1.6 + s * 2.6, z, w: 6.2, h: 2.5, d: 2.5, color: contColors[(i + s) % contColors.length], uv: 3 }); }
const cm = new THREE.Mesh(weld(contItems), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.2 })); cm.castShadow = true; cm.receiveShadow = true; S.add(cm); this.addBoxCollider(150, -26, 60, 14, 'containers');
const plankMat = std(0x8b6b4a, 0.95), postMat = std(0x54483b, 0.95); for (let i = 0; i < 3; i++) {
const x = -106 + i * 20, dock = box(4.2, 0.5, 22, plankMat, x, 0.8, 13); dock.receiveShadow = true; S.add(dock); for (let z = 3; z <= 24; z += 6) S.add(box(0.35, 2.4, 0.35, postMat, x - 2.1, 0.5, z), box(0.35, 2.4, 0.35, postMat, x + 2.1, 0.5, z)); }
S.add(box(18, 0.7, 10, plankMat, 252, 0.85, 34)); this.addBoxCollider(252, 34, 18, 10, 'pier');
const buoyMat = std(0xd8c46a, 0.6, 0.02, { emissive: 0x5a4210, emissiveIntensity: 0.5 }); for (const x of [-80, 64]) {
S.add(mesh(new THREE.CylinderGeometry(0.55, 0.8, 1.3, 8), buoyMat, x, 0.65, 0), put(glow(0xffcf6a, 3.4), x, 1.6, 0, 1, 1)); } } buildHarborLife() {
const S = this.scene, propItems = []; for (let x = -270; x <= 270; x += 17) { if (Math.abs(x) < 16 || (x > 120 && x < 290)) continue; for (const z of [26.1, -26.1]) propItems.push({ x, y: 1.05, z, w: 0.35, h: 0.9, d: 0.35, color: 0x2f3a3d, uv: 2 }); } for (const side of [-1, 1]) { for (let x = -296; x < 296; x += 4) { if (Math.abs(x) < 10 || (side > 0 && x > -132 && x < -38) || (side > 0 && x > 238 && x < 264)) continue; propItems.push({ x, y: 1.22, z: side * 24.2, w: 0.13, h: 1.15, d: 0.13, color: 0xd6cbb2, uv: 2 }, { x: x + 2, y: 1.72, z: side * 24.2, w: 4.1, h: 0.1, d: 0.1, color: 0x3f7f78, uv: 2 }, { x: x + 2, y: 1.38, z: side * 24.2, w: 4.1, h: 0.06, d: 0.06, color: 0xd6cbb2, uv: 2 }); } }
const pm = new THREE.Mesh(weld(propItems), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })); pm.castShadow = !this.low; S.add(pm);
const archMat = std(0x3f7f78, 0.7, 0.25); S.add(box(0.5, 8.5, 0.5, archMat, -101, 4.6, 29.5), box(0.5, 8.5, 0.5, archMat, -81, 4.6, 29.5), box(21, 0.6, 0.6, archMat, -91, 8.7, 29.5));
S.add(put(label('MARINA SOL', '#ffe8b4', '#ff7a52', 640, 74), -91, 7.3, 29.6, 18, 4)); } buildSkyline() {
const S = this.scene, items = [], towers = [
[-44, -196, 24, 96, 0xd9c6a8], [22, -232, 28, 118, 0xc7a98b], [-118, -176, 20, 82, 0xb9a68e],
[96, -212, 26, 102, 0xd2b596], [-188, -150, 18, 68, 0xbfae94], [152, -168, 22, 88, 0xcbb292],
]; for (const [x, z, w, h, color] of towers) items.push({ x, y: 0.5 + h / 2, z, w, h, d: w * 0.8, color, uv: 3.2 }, { x, y: 0.5 + h + 3, z, w: w * 0.4, h: 6, d: w * 0.35, color: 0x8e8578, uv: 3.2 });
const ft = facadeTexture(2); S.add(new THREE.Mesh(weld(items), new THREE.MeshStandardMaterial({ map: ft, vertexColors: true, roughness: 0.85, metalness: 0.05, emissive: 0xffb067, emissiveMap: ft, emissiveIntensity: 0.16 })));
S.add(put(glow(0xff4a3a, 5), 22, 122, -232, 1, 1), put(label('PUERTO SOL', '#ffe8bc', '#ff7a52', 640, 58, false), 22, 105, -218, 34, 6));
const islandMat = new THREE.MeshBasicMaterial({ color: 0x3e4c52, fog: true }); for (const [x, z, s] of [[520, 120, 90], [610, 40, 130], [470, 260, 70], [540, -200, 100]]) {
const island = mesh(new THREE.ConeGeometry(s, 26, 7), islandMat, x, 4, z); island.rotation.y = x; S.add(island); }
S.add(box(4, 24, 4, std(0xd9cbb3, 0.8, 0.02, { emissive: 0x554422, emissiveIntensity: 0.4 }), 512, 12, 118), put(glow(0xffe9a0, 8), 512, 26, 118, 1, 1)); } buildSky() {
const S = this.scene, sunDir = new THREE.Vector3(...WORLD.sunDir).normalize();
this.skyUniforms = { uTop: { value: new THREE.Color(WORLD.skyTop) }, uHorizon: { value: new THREE.Color(WORLD.skyHorizon) }, uSun: { value: sunDir }, uStorm: { value: 0 }, uTime: { value: 0 } };
const skyMat = new THREE.ShaderMaterial({ uniforms: this.skyUniforms, side: THREE.BackSide, depthWrite: false, fog: false,
vertexShader: `varying vec3 vDir;void main(){ vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
fragmentShader: `varying vec3 vDir;uniform vec3 uTop;uniform vec3 uHorizon;uniform vec3 uSun;uniform float uStorm;uniform float uTime;
void main(){
float h=clamp(vDir.y*1.6,0.0,1.0);
vec3 col=mix(uHorizon,uTop,pow(h,0.72));
float d=max(dot(normalize(vDir),normalize(uSun)),0.0);
col += vec3(1.0,0.55,0.26)*pow(d,9.0)*0.55;
col += vec3(1.0,0.72,0.42)*pow(d,80.0)*0.9;
float band=sin(vDir.y*22.0+uTime*0.04+vDir.x*4.0)*0.5+0.5;
col=mix(col,vec3(0.16,0.18,0.22),uStorm*(0.62+band*0.16));
gl_FragColor=vec4(col,1.0);
}`,
});
this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), skyMat); S.add(this.sky);
this.sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd2a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
this.sun.position.copy(sunDir.clone().multiplyScalar(900)); this.sun.scale.set(280, 280, 1); S.add(this.sun);
this.clouds = []; for (let i = 0; i < 16; i++) {
const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture(i + 3), color: i % 4 === 0 ? 0xb69a92 : 0xf3d9c8, transparent: true, opacity: 0.62, depthWrite: false }));
const a = rng() * TAU, dist = 500 + rng() * 500; sp.position.set(Math.cos(a) * dist, 130 + rng() * 130, Math.sin(a) * dist);
const sc = 220 + rng() * 260; sp.scale.set(sc, sc * 0.42, 1); S.add(sp); sp.userData.base = sp.material.color.clone(); this.clouds.push(sp); }
this.hemi = new THREE.HemisphereLight(0x9fb6c8, 0x54453c, 1.25); S.add(this.hemi);
this.sunLight = new THREE.DirectionalLight(0xffc08a, 2.4); this.sunLight.position.set(-90, 120, -100); this.sunLight.castShadow = true; this.sunLight.shadow.mapSize.set(this.low ? 1024 : 2048, this.low ? 1024 : 2048);
Object.assign(this.sunLight.shadow.camera, { near: 1, far: 420, left: -110, right: 110, top: 110, bottom: -110 }); this.sunLight.shadow.bias = -0.0007; S.add(this.sunLight, this.sunLight.target);
S.fog = new THREE.Fog(0xd3a184, 130, 760); S.background = new THREE.Color(0xd3a184); } buildWater() { this.waterUniforms = { uTime: { value: 0 }, uStorm: { value: 0 }, uSun: { value: new THREE.Vector3(...WORLD.sunDir).normalize() }, uDeep: { value: new THREE.Color(0x143c48) }, uShallow: { value: new THREE.Color(0x2e7f86) } };
const mat = new THREE.ShaderMaterial({ uniforms: this.waterUniforms, transparent: false,
vertexShader: `uniform float uTime;uniform float uStorm;varying vec3 vWorld;varying float vWave;
void main(){
vec3 p=position;
float w1=sin(p.x*0.055+uTime*0.9)*0.28;
float w2=sin(p.y*0.083-uTime*0.7+p.x*0.02)*0.22;
float w3=sin((p.x+p.y)*0.14+uTime*1.6)*0.1;
p.z += (w1+w2+w3)*(1.0+uStorm*1.8);
vWave=w1+w2;
vec4 wp=modelMatrix*vec4(p,1.0);
vWorld=wp.xyz;
gl_Position=projectionMatrix*viewMatrix*wp;
}`,
fragmentShader: `uniform float uTime;uniform float uStorm;uniform vec3 uSun;uniform vec3 uDeep;uniform vec3 uShallow;
varying vec3 vWorld;varying float vWave;
void main(){
vec3 v=normalize(cameraPosition-vWorld);
float fres=pow(1.0-max(dot(v,vec3(0.0,1.0,0.0)),0.0),3.0);
float stripe=sin(vWorld.x*0.12+vWorld.z*0.4+uTime*1.2+vWave*6.0)*0.5+0.5;
float ripple=sin(vWorld.x*0.55-vWorld.z*0.3+uTime*2.1)*0.5+0.5;
vec3 col=mix(uDeep,uShallow,0.3+stripe*0.24+ripple*0.08);
vec3 skyRef=mix(vec3(0.42,0.58,0.64),vec3(1.0,0.58,0.34),clamp(0.4+vWorld.x*0.0008,0.0,1.0));
col=mix(col,skyRef,fres*0.58);
float spec=pow(max(dot(reflect(-normalize(uSun),vec3(0.0,1.0,0.0)),v),0.0),70.0);
col += vec3(1.0,0.76,0.5)*spec*(1.4+stripe*1.2);
float edge=smoothstep(17.0,23.6,abs(vWorld.z));
float foam=edge*(0.28+0.3*sin(vWorld.x*0.8+uTime*2.4+vWave*8.0));
col += vec3(0.62,0.7,0.68)*clamp(foam,0.0,0.6);
col=mix(col,vec3(0.16,0.22,0.26),uStorm*0.35);
gl_FragColor=vec4(col,1.0);
}`,
});
this.water = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800, 120, 120), mat); this.water.rotation.x = -Math.PI / 2; this.scene.add(this.water); } buildRain() {
const count = this.low ? 1100 : 2600, pos = new Float32Array(count * 6); for (let i = 0; i < count; i++) {
const x = (Math.random() - 0.5) * 160, y = Math.random() * 60, z = (Math.random() - 0.5) * 160, j = i * 6; pos[j] = x; pos[j + 1] = y; pos[j + 2] = z; pos[j + 3] = x + 0.12; pos[j + 4] = y + 0.9; pos[j + 5] = z + 0.04; }
const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
this.rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xcfe4ee, transparent: true, opacity: 0, depthWrite: false })); this.rain.frustumCulled = false; this.scene.add(this.rain); this.rainPos = pos; } heightAt(x, z) {
if (Math.abs(x) < WORLD.bridgeHalfWidth) {
const az = Math.abs(z); if (az <= WORLD.bridgeSpan) return WORLD.deckY; if (az < GATE) return lerp(0.35, WORLD.deckY, (GATE - az) / (GATE - WORLD.bridgeSpan)); } for (const r of ROADS) { if (r.axis === 'z') { if (z >= r.from && z <= r.to && Math.abs(x - r.pos) > r.width / 2 && Math.abs(x - r.pos) < r.width / 2 + SIDEWALK) return 0.59; } else if (x >= r.from && x <= r.to && Math.abs(z - r.pos) > r.width / 2 && Math.abs(z - r.pos) < r.width / 2 + SIDEWALK) return 0.59; } if (this.onDock(x, z)) return 1.08; return 0.35; } isOnBridge(x, z) { return Math.abs(x) < WORLD.bridgeHalfWidth && Math.abs(z) < GATE; } isWater(x, z) { if (this.onDock(x, z)) return false; return Math.abs(z) < WORLD.channelHalf && !this.isOnBridge(x, z); } onDock(x, z) {
for (const dx of [-106, -86, -66]) { if (Math.abs(x - dx) < 2.1 && z > 2 && z < 24) return true; } return x > 243 && x < 261 && z > 29 && z < 39; } collide(x, z, r, filter) { for (const b of this.colliders) { if (filter && !filter(b)) continue;
const cx = clamp(x, b.minX, b.maxX), cz = clamp(z, b.minZ, b.maxZ), dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz; if (d2 < r * r && d2 > 0.000001) {
const d = Math.sqrt(d2); return { x: (dx / d) * (r - d), z: (dz / d) * (r - d) }; } } return null; } segmentBlocked(ax, az, bx, bz) { for (let i = 1; i < 9; i++) {
const t = i / 9, x = ax + (bx - ax) * t, z = az + (bz - az) * t; for (const b of this.colliders) { if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) return true; } } return false; } setStorm(v) { this.storm = clamp(v, 0, 1); this.skyUniforms.uStorm.value = this.storm; this.waterUniforms.uStorm.value = this.storm; this.rain.material.opacity = this.storm * 0.62; this.hemi.intensity = 1.25 - this.storm * 0.42; this.sunLight.intensity = 2.4 - this.storm * 1.1; this.scene.fog.color.setHex(this.storm > 0.5 ? 0x6f7278 : 0xd3a184); this.scene.fog.near = 130 - this.storm * 55; this.scene.fog.far = 760 - this.storm * 340; this.scene.background.copy(this.scene.fog.color); if (this.roadMesh) { this.roadMesh.material.roughness = 0.7 - this.storm * 0.35; this.roadMesh.material.metalness = 0.1 + this.storm * 0.25; } this.sun.material.opacity = 0.9 - this.storm * 0.72; if (!this.stormColor) this.stormColor = new THREE.Color(0x39424a); for (const c of this.clouds) { c.material.color.copy(c.userData.base).lerp(this.stormColor, this.storm * 0.8); c.material.opacity = 0.62 + this.storm * 0.2; } } lightning() { this.flash = 1; } update(dt, camera) { this.time += dt; this.skyUniforms.uTime.value = this.time; this.waterUniforms.uTime.value = this.time; for (const c of this.clouds) { c.position.x += dt * (1.2 + this.storm * 3.5); if (c.position.x > 1100) c.position.x = -1100; } if (camera) { this.sun.position.copy(camera.position).add(new THREE.Vector3(...WORLD.sunDir).normalize().multiplyScalar(900)); this.rain.position.set(camera.position.x, 0, camera.position.z); } if (this.rain.material.opacity > 0.01) {
const p = this.rainPos; for (let i = 0; i < p.length; i += 6) {
const dy = dt * (34 + this.storm * 26); p[i + 1] -= dy; p[i + 4] -= dy; p[i] -= dt * 5.2; p[i + 3] -= dt * 5.2; if (p[i + 1] < 0) {
const x = (Math.random() - 0.5) * 160, z = (Math.random() - 0.5) * 160, y = 55 + Math.random() * 15; p[i] = x; p[i + 1] = y; p[i + 2] = z; p[i + 3] = x + 0.12; p[i + 4] = y + 0.9; p[i + 5] = z + 0.04; } } this.rain.geometry.attributes.position.needsUpdate = true; } if (this.flash > 0) { this.flash = Math.max(0, this.flash - dt * 3.2); this.hemi.intensity = 1.25 - this.storm * 0.42 + this.flash * 2.6; } if (camera) {
const t = this.sunLight.target; t.position.set(camera.position.x, 0, camera.position.z); this.sunLight.position.set(camera.position.x - 80, 120, camera.position.z - 90); } } }
// provenance: witnessed in the high-tide session
// high-tide round 16 authorship provenance
