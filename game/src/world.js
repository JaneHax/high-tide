import * as THREE from 'three';
import { WORLD, ROADS, PALETTE, LANDMARKS, SIDEWALK } from './config.js';
import { canvasTexture, facadeTexture, roadTexture, concreteTexture, cloudTexture, glowTexture,
textTexture, mesh, box, plane, mulberry32, clamp, lerp, TAU,
} from './utils.js';
const rng = mulberry32(0x50a1c0de);
function mergeColoredBoxes(items) {
const pos = [], nor = [], uv = [], col = [], idx = [];
let off = 0;
const c = new THREE.Color(); for (const it of items) {
const g = new THREE.BoxGeometry(it.w, it.h, it.d);
const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv; c.set(it.color); for (let i = 0; i < p.count; i++) { pos.push(p.getX(i) + it.x, p.getY(i) + it.y, p.getZ(i) + it.z);
const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i); nor.push(nx, ny, nz);
const s = it.uv ?? 3.2;
const us = (Math.abs(nx) > 0.5 ? it.d : it.w) / s;
const vs = (Math.abs(ny) > 0.5 ? it.d : it.h) / s; uv.push(u.getX(i) * us, u.getY(i) * vs); if (ny > 0.5) col.push(c.r * 0.55, c.g * 0.55, c.b * 0.58); else if (ny < -0.5) col.push(c.r * 0.3, c.g * 0.3, c.b * 0.3); else col.push(c.r, c.g, c.b); } for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + off); off += p.count; g.dispose(); }
const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeBoundingSphere(); return geo; }
function mergeBoxGeometry(geos) {
const pos = [], nor = [], uv = [], col = [], idx = [];
let off = 0; for (const { geo, color } of geos) {
const p = geo.attributes.position, n = geo.attributes.normal, u = geo.attributes.uv;
const c = new THREE.Color(color); for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u.getX(i), u.getY(i)); col.push(c.r, c.g, c.b); } for (let i = 0; i < geo.index.count; i++) idx.push(geo.index.getX(i) + off); off += p.count; geo.dispose(); }
const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); out.setIndex(idx); out.computeBoundingSphere(); return out; }
function roadQuad(road) {
const half = road.width / 2;
const a = road.from, b = road.to;
const p = [], u = [], n = [], idx = [];
const uvSpan = 24; if (road.axis === 'z') { p.push(road.pos - half, 0, a, road.pos + half, 0, a, road.pos + half, 0, b, road.pos - half, 0, b); u.push(0, a / uvSpan, 1, a / uvSpan, 1, b / uvSpan, 0, b / uvSpan); } else { p.push(a, 0, road.pos - half, a, 0, road.pos + half, b, 0, road.pos + half, b, 0, road.pos - half); u.push(0, a / uvSpan, 1, a / uvSpan, 1, b / uvSpan, 0, b / uvSpan); } for (let i = 0; i < 4; i++) n.push(0, 1, 0); idx.push(0, 2, 1, 0, 3, 2);
const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2)); geo.setIndex(idx); return geo; }
function stripTexture() { return canvasTexture(128, 128, (g, w, h) => { g.fillStyle = '#efe4cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#c94f3c'; for (let i = 0; i < 4; i++) { g.save(); g.translate(0, i * 32); g.transform(1, -0.6, 0, 1, 0, 0); g.fillRect(0, 0, w, 16); g.restore(); } }, [2, 1]); }
function tileTexture(base, grout, seed = 1) { return canvasTexture(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h);
const r = mulberry32(seed); g.strokeStyle = grout; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); } for (let i = 0; i < 400; i++) {
g.fillStyle = `rgba(255,255,255,${r() * 0.06})`;
g.fillRect(r() * w, r() * h, 3, 3); } }, [6, 6]); }
export class World { constructor(scene, opts = {}) { this.scene = scene; this.low = !!opts.low; this.colliders = []; this.lamps = []; this.time = 0; this.storm = 0; this.flash = 0; this.rain = null; this.buildStatic(); this.buildBridgeApproach(); this.buildTerminal(); this.buildMarket(); this.buildGarage(); this.buildDocks(); this.buildHarborLife(); this.buildSkyline(); this.buildSky(); this.buildWater(); this.buildRain(); } addCollider(minX, maxX, minZ, maxZ, tag = 'building') { this.colliders.push({ minX, maxX, minZ, maxZ, tag }); } addBoxCollider(x, z, w, d, tag) { this.addCollider(x - w / 2, x + w / 2, z - d / 2, z + d / 2, tag); } buildStatic() {
const scene = this.scene;
const groundMat = new THREE.MeshStandardMaterial({ map: concreteTexture(), roughness: 0.92, metalness: 0.02, color: 0xbdb19b });
const north = plane(700, 276, groundMat, 0, 0.3, -162); north.receiveShadow = true; scene.add(north);
const south = plane(700, 276, groundMat, 0, 0.3, 162); south.receiveShadow = true; scene.add(south);
const quayMat = new THREE.MeshStandardMaterial({ map: tileTexture('#a99f8d', 'rgba(70,64,55,0.35)', 4), roughness: 0.86, metalness: 0.03 }); for (const side of [-1, 1]) {
const q = box(680, 1.1, 8, quayMat, 0, 0.15, side * 27.5); q.receiveShadow = true; scene.add(q);
const edge = box(680, 0.35, 0.7, new THREE.MeshStandardMaterial({ color: 0xe3d7bf, roughness: 0.8 }), 0, 0.78, side * 23.6); scene.add(edge); }
const roadGeos = []; for (const r of ROADS) {
const g = roadQuad(r); roadGeos.push({ geo: g, color: 0xffffff }); }
const merged = mergeBoxGeometry(roadGeos);
const roadMat = new THREE.MeshStandardMaterial({ map: roadTexture(), vertexColors: true, roughness: 0.48, metalness: 0.18, color: 0xd8d4c8,
});
const roadMesh = new THREE.Mesh(merged, roadMat); roadMesh.position.y = 0.33; roadMesh.receiveShadow = true; scene.add(roadMesh); this.roadMesh = roadMesh;
const walkItems = [];
const walkColor = 0xc6baa4; for (const r of ROADS) { for (const s of [-1, 1]) {
const off = s * (r.width / 2 + SIDEWALK / 2); if (r.axis === 'z') { walkItems.push({ x: r.pos + off, y: 0.48, z: (r.from + r.to) / 2, w: SIDEWALK, h: 0.22, d: r.to - r.from, color: walkColor, uv: 4 }); } else { walkItems.push({ x: (r.from + r.to) / 2, y: 0.48, z: r.pos + off, w: r.to - r.from, h: 0.22, d: SIDEWALK, color: walkColor, uv: 4 }); } } }
const walkGeo = mergeColoredBoxes(walkItems);
const walkMat = new THREE.MeshStandardMaterial({ map: concreteTexture(), vertexColors: true, roughness: 0.9, color: 0xd6cbb4 });
const walkMesh = new THREE.Mesh(walkGeo, walkMat); walkMesh.receiveShadow = true; scene.add(walkMesh); this.buildBuildings(); this.buildPalms(); this.buildStreetFurniture(); } buildBuildings() {
const palette = [PALETTE.cream, PALETTE.sand, PALETTE.coral, PALETTE.teal, PALETTE.mint, PALETTE.sky, PALETTE.plum, PALETTE.gold, 0xe0cbb2, 0xbfae94];
const xEdges = [-300, -150, 0, 150, 300];
const zEdgesN = [-300, -232, -152, -74, -42, -24];
const zEdgesS = [24, 42, 76, 154, 234, 300];
const exclusions = Object.values(LANDMARKS).map((l) => ({ minX: (l.x ?? 0) - (l.w ?? 18) / 2 - 5, maxX: (l.x ?? 0) + (l.w ?? 18) / 2 + 5,
minZ: (l.z ?? 0) - (l.d ?? 18) / 2 - 5, maxZ: (l.z ?? 0) + (l.d ?? 18) / 2 + 5,
})); exclusions.push({ minX: -19, maxX: 19, minZ: -70, maxZ: 70 }); exclusions.push({ minX: 112, maxX: 300, minZ: -48, maxZ: -22 }); exclusions.push({ minX: -300, maxX: -30, minZ: 22, maxZ: 48 });
const lots = [];
const bands = [...zEdgesN.slice(0, -1).map((z, i) => [z, zEdgesN[i + 1]]), ...zEdgesS.slice(0, -1).map((z, i) => [z, zEdgesS[i + 1]])]; for (const [z0, z1] of bands) { for (let xi = 0; xi < 4; xi++) {
const x0 = xEdges[xi], x1 = xEdges[xi + 1];
const inset = 8.5;
const minX = x0 + (x0 === -300 ? 6 : inset);
const maxX = x1 - (x1 === 300 ? 6 : inset);
const minZ = z0 + (z0 === -300 || z0 === 300 ? 6 : inset);
const maxZ = z1 - (z1 === -300 || z1 === 300 ? 6 : inset); if (maxX - minX < 12 || maxZ - minZ < 12) continue;
const cols = Math.max(1, Math.round((maxX - minX) / 22));
const rows = Math.max(1, Math.round((maxZ - minZ) / 22));
const cw = (maxX - minX) / cols, cd = (maxZ - minZ) / rows; for (let cx = 0; cx < cols; cx++) { for (let cz = 0; cz < rows; cz++) {
const bx = minX + cw * (cx + 0.5), bz = minZ + cd * (cz + 0.5); if (rng() < 0.14) continue;
const bw = cw * (0.62 + rng() * 0.26);
const bd = cd * (0.62 + rng() * 0.26);
const rect = { minX: bx - bw / 2, maxX: bx + bw / 2, minZ: bz - bd / 2, maxZ: bz + bd / 2 }; if (exclusions.some((e) => rect.maxX > e.minX && rect.minX < e.maxX && rect.maxZ > e.minZ && rect.minZ < e.maxZ)) continue; lots.push({ bx, bz, bw, bd }); } } } }
const groups = [[], [], []];
const awnings = [0xc96b52, 0x3f7f78, 0xd9a63c, 0x7d5a6d, 0x4d8f8a]; for (const lot of lots) {
const { bx, bz, bw, bd } = lot;
const centerBias = 1 - clamp((Math.abs(bx) + Math.abs(bz)) / 430, 0, 1);
let h = 8 + rng() * 15 + centerBias * rng() * 44; if (rng() < 0.07) h += 26; h = Math.min(h, 78);
const color = palette[(rng() * palette.length) | 0];
const variant = (rng() * 3) | 0;
const items = groups[variant]; items.push({ x: bx, y: 0.5 + h / 2, z: bz, w: bw, h, d: bd, color }); this.addBoxCollider(bx, bz, bw, bd); items.push({ x: bx, y: 2.25, z: bz, w: bw + 0.18, h: 0.55, d: bd + 0.18, color: 0x223a40 });
const side = rng() < 0.5 ? 1 : -1;
const along = rng() < 0.6;
const awn = awnings[(rng() * awnings.length) | 0]; if (along) items.push({ x: bx, y: 3.6, z: bz + side * (bd / 2 + 0.7), w: bw * 0.78, h: 0.16, d: 1.5, color: awn }); else items.push({ x: bx + side * (bw / 2 + 0.7), y: 3.6, z: bz, w: 1.5, h: 0.16, d: bd * 0.78, color: awn }); if (h > 26) {
const rw = bw * (0.28 + rng() * 0.24), rd = bd * (0.28 + rng() * 0.24); items.push({ x: bx + (rng() - 0.5) * bw * 0.2, y: 0.5 + h + 2, z: bz + (rng() - 0.5) * bd * 0.2, w: rw, h: 4, d: rd, color: 0x8e8578 }); } } for (let i = 0; i < 3; i++) {
const geo = mergeColoredBoxes(groups[i]);
const tex = facadeTexture(i + 1);
const mat = new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 0.82, metalness: 0.08,
emissive: 0xffb067, emissiveMap: tex, emissiveIntensity: 0.18,
});
const meshB = new THREE.Mesh(geo, mat); meshB.castShadow = !this.low; meshB.receiveShadow = true; this.scene.add(meshB); if (i === 0) this.buildings = meshB; }
const signDefs = [
['HOTEL SOL', -28, 24, 18, 0xffc46a], ['CASA BRISA', 34, -46, 14, 0x8ee8df],
['DINER', -118, 54, 11, 0xff8a62], ['FARO', 156, -118, 16, 0xffd080],
['ANCLA', -168, -168, 13, 0x9fe0ff], ['TIENDA', 62, 116, 10, 0xffb0c8],
]; for (const [text, x, z, y, color] of signDefs) {
const tex2 = textTexture(text, { color: '#fff4dc', glow: '#' + new THREE.Color(color).getHexString(), font: 'bold 54px "Arial Narrow", Arial, sans-serif' });
const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex2, transparent: true, depthWrite: false })); sp.position.set(x, y, z); sp.scale.set(12, 3, 1); this.scene.add(sp); } } buildPalms() {
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7c6244, roughness: 0.95 });
const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7248, roughness: 0.85, side: THREE.DoubleSide });
const parts = [];
const trunk = new THREE.CylinderGeometry(0.16, 0.34, 7.2, 6); trunk.translate(0, 3.6, 0); parts.push({ geo: trunk, color: 0x7c6244 }); for (let i = 0; i < 8; i++) {
const f = new THREE.BoxGeometry(0.35, 0.08, 3.6); f.translate(0, 0, 1.8);
const a = (i / 8) * TAU; f.rotateX(-0.36 - (i % 3) * 0.12); f.rotateY(a); f.translate(0, 7.15, 0); parts.push({ geo: f, color: i % 2 ? 0x4c8352 : 0x356b41 }); }
const palmGeo = mergeBoxGeometry(parts);
const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, side: THREE.DoubleSide });
const positions = []; for (let x = -286; x <= 286; x += 21) { if (Math.abs(x) < 14) continue; if (x > 120 && x < 290) continue; if (x > -125 && x < -45) continue; positions.push([x, -33.5], [x, 33.5]); } for (let z = -286; z <= 286; z += 34) { if (Math.abs(z) < 34) continue; positions.push([-11.5, z], [11.5, z]); }
const inst = new THREE.InstancedMesh(palmGeo, mat, positions.length);
const m = new THREE.Matrix4();
const q = new THREE.Quaternion();
const s = new THREE.Vector3(); positions.forEach(([x, z], i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng() * TAU);
const sc = 0.75 + rng() * 0.4; s.set(sc, sc, sc); m.compose(new THREE.Vector3(x, 0.6, z), q, s); inst.setMatrixAt(i, m); }); inst.castShadow = true; this.scene.add(inst); this.palmInst = inst; this.palmPositions = positions; } buildStreetFurniture() {
const items = [];
const poleColor = 0x394348;
const lampColor = 0xffe0a0; for (const road of ROADS) { if (road.width < 10) continue;
const step = road.axis === 'z' ? 30 : 36; for (let t = road.from + 14; t < road.to - 10; t += step) { for (const side of [-1, 1]) {
const off = side * (road.width / 2 + 2.1);
const x = road.axis === 'z' ? road.pos + off : t;
const z = road.axis === 'z' ? t : road.pos + off; if (Math.abs(x) < 12 && Math.abs(z) < 60) continue; if (Math.abs(z) < 26) continue; if (x > -112 && x < -28 && z > 28 && z < 40) continue; if (Math.abs(x) < 14 && z > 38 && z < 104) continue; items.push({ x, y: 4.3, z, w: 0.16, h: 8.2, d: 0.16, color: poleColor, uv: 2 }); items.push({ x: x + (road.axis === 'z' ? side * 0.7 : 0), y: 8.3, z: z + (road.axis === 'x' ? side * 0.7 : 0), w: 1.5, h: 0.16, d: 0.16, color: poleColor, uv: 2 });
const lampX = road.axis === 'z' ? x + side * 1.35 : x;
const lampZ = road.axis === 'x' ? z + side * 1.35 : z; items.push({ x: lampX, y: 8.15, z: lampZ, w: 0.55, h: 0.2, d: 0.55, color: lampColor, uv: 2 }); this.lamps.push(new THREE.Vector3(lampX, 8.0, lampZ)); } } }
const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.4, emissive: 0x1a1a14, emissiveIntensity: 0.3 });
const m = new THREE.Mesh(mergeColoredBoxes(items), mat); m.castShadow = true; this.scene.add(m);
const glow = glowTexture();
const gmat = new THREE.SpriteMaterial({ map: glow, color: 0xffc978, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }); for (const p of this.lamps) {
const sp = new THREE.Sprite(gmat); sp.position.copy(p); sp.scale.set(3.4, 3.4, 1); this.scene.add(sp); }
const barrierMat = new THREE.MeshStandardMaterial({ map: stripTexture(), roughness: 0.7 }); for (const side of [-1, 1]) { for (const x of [-7.4, 0, 7.4]) {
const b = box(1.1, 0.9, 0.35, barrierMat, x, 1.0, side * 43.5); b.castShadow = true; this.scene.add(b); } } } buildBridgeApproach() {
const mat = new THREE.MeshStandardMaterial({ color: 0x34393b, roughness: 0.86, metalness: 0.08 }); for (const side of [-1, 1]) {
const ramp = box(16, 0.5, 20, mat, 0, 0.85, side * 35); ramp.rotation.x = side * -0.055; ramp.receiveShadow = true; this.scene.add(ramp); } }
buildTerminal() {
const L = LANDMARKS.terminal;
const g = new THREE.Group(); g.position.set(L.x, 0.55, L.z);
const cream = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.72 });
const trim = new THREE.MeshStandardMaterial({ color: 0xbf6d50, roughness: 0.6 });
const glass = new THREE.MeshStandardMaterial({ color: 0x244550, roughness: 0.18, metalness: 0.55, emissive: 0x1b3b45, emissiveIntensity: 0.45 });
const base = box(58, 13, 26, cream, 0, 6.5, 0); base.castShadow = true; base.receiveShadow = true; g.add(base);
const hall = box(40, 17, 20, cream, -4, 14, -2); hall.castShadow = true; g.add(hall);
const tower = box(13, 36, 13, cream, 16, 24, -3); tower.castShadow = true; g.add(tower);
const crown = box(15, 3, 15, trim, 16, 43.5, -3); g.add(crown);
const spire = box(1.4, 10, 1.4, trim, 16, 49.5, -3); g.add(spire);
const front = box(36, 8.5, 0.5, glass, -2, 6.2, 13.2); g.add(front);
const canopy = box(44, 0.6, 6, trim, -2, 11.2, 16); g.add(canopy);
const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture('PUERTO SOL', { color: '#ffe6b8', glow: '#ff7a52', font: 'bold 74px "Arial Narrow", Arial, sans-serif', width: 768 }),
transparent: true, depthWrite: false,
})); sign.position.set(-2, 19, 16.5); sign.scale.set(30, 5, 1); g.add(sign); this.scene.add(g); this.addBoxCollider(L.x, L.z, 60, 28, 'terminal'); this.addBoxCollider(L.x + 16, L.z - 3, 14, 14, 'tower'); this.terminal = g; } buildMarket() {
const L = LANDMARKS.market;
const g = new THREE.Group(); g.position.set(L.x, 0.55, L.z);
const wall = new THREE.MeshStandardMaterial({ color: 0x9a6a4d, roughness: 0.9 });
const roof = new THREE.MeshStandardMaterial({ color: 0x5d7777, roughness: 0.65, metalness: 0.25 });
const body = box(44, 7, 22, wall, 0, 3.5, 0); body.castShadow = true; body.receiveShadow = true; g.add(body);
const rf = box(48, 0.5, 26, roof, 0, 7.3, 0); rf.rotation.z = 0.02; g.add(rf);
const awnMat = new THREE.MeshStandardMaterial({ map: stripTexture(), roughness: 0.8 });
const neon = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture('MERCADO', { color: '#ffb2a0', glow: '#ff3f5f', font: 'bold 96px "Arial Narrow", Arial, sans-serif', width: 640 }),
transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
})); neon.position.set(0, 9.4, 12.2); neon.scale.set(28, 6, 1); g.add(neon);
const crateMat = new THREE.MeshStandardMaterial({ color: 0xb9844f, roughness: 0.9 }); this.addBoxCollider(L.x, L.z, 44, 22, 'market'); this.market = g; } buildGarage() {
const L = LANDMARKS.garage;
const g = new THREE.Group(); g.position.set(L.x, 0.55, L.z);
const wall = new THREE.MeshStandardMaterial({ color: 0x7f8179, roughness: 0.92 });
const b = box(28, 9, 22, wall, 0, 4.5, 0); b.castShadow = true; b.receiveShadow = true; g.add(b);
const door = box(9, 5.6, 0.4, new THREE.MeshStandardMaterial({ color: 0x3c4b4b, roughness: 0.6, metalness: 0.4 }), 4, 3.2, 11.1); g.add(door);
const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture('SOMBRA', { color: '#ffd6a1', glow: '#ff6b4a', font: 'bold 88px "Arial Narrow", Arial, sans-serif', width: 512 }),
transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
})); sign.position.set(-6, 7.3, 11.3); sign.scale.set(14, 3.4, 1); g.add(sign);
const stripe = new THREE.MeshStandardMaterial({ color: 0xd4694c, roughness: 0.7 }); for (let i = 0; i < 6; i++) g.add(box(28, 0.18, 0.2, stripe, 0, 0.9 + i * 1.3, 11.15));
const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffb070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); lamp.position.set(4, 6.4, 12); lamp.scale.set(6, 6, 1); g.add(lamp); this.scene.add(g); this.addBoxCollider(L.x, L.z, 28, 22, 'garage'); this.garage = g; } buildDocks() {
const craneMat = new THREE.MeshStandardMaterial({ color: 0xb75b45, roughness: 0.8 });
const craneMat2 = new THREE.MeshStandardMaterial({ color: 0x3f7472, roughness: 0.8 }); for (let i = 0; i < 3; i++) {
const x = 142 + i * 54;
const g = new THREE.Group(); g.position.set(x, 0.55, -32);
const legMat = i % 2 ? craneMat2 : craneMat; for (const dx of [-5, 5]) for (const dz of [-3, 3]) g.add(box(1.1, 38, 1.1, legMat, dx, 19, dz)); g.add(box(12, 1.6, 8, legMat, 0, 38, 0)); g.add(box(3.2, 3.2, 4, legMat, 0, 35, 0));
const boom = box(2.4, 1.6, 46, legMat, 0, 40, 16); g.add(boom); g.add(box(1.1, 13, 1.1, legMat, 0, 32, -16));
const light = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff5b3d, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); light.position.set(0, 41.2, 38); light.scale.set(3, 3, 1); g.add(light); this.scene.add(g); }
const contColors = [0xb04f3f, 0x3e7d7b, 0xc7a04a, 0x506b7a, 0x8a5a6d, 0x6f8a5e];
const contItems = []; for (let i = 0; i < 26; i++) {
const x = 124 + (i % 7) * 7.2;
const z = -28 + Math.floor(i / 7) * 6.2;
const stack = (i % 3) + 1; for (let s = 0; s < stack; s++) { contItems.push({ x, y: 1.6 + s * 2.6, z, w: 6.2, h: 2.5, d: 2.5, color: contColors[(i + s) % contColors.length], uv: 3 }); } }
const cm = new THREE.Mesh(mergeColoredBoxes(contItems), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.2 })); cm.castShadow = true; cm.receiveShadow = true; this.scene.add(cm); this.addBoxCollider(150, -26, 60, 14, 'containers');
const plankMat = new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.95 });
const postMat = new THREE.MeshStandardMaterial({ color: 0x54483b, roughness: 0.95 }); for (let i = 0; i < 3; i++) {
const x = -106 + i * 20;
const dock = box(4.2, 0.5, 22, plankMat, x, 0.8, 13); dock.receiveShadow = true; this.scene.add(dock); for (let z = 3; z <= 24; z += 6) { this.scene.add(box(0.35, 2.4, 0.35, postMat, x - 2.1, 0.5, z)); this.scene.add(box(0.35, 2.4, 0.35, postMat, x + 2.1, 0.5, z)); } }
const pier = box(18, 0.7, 10, plankMat, 252, 0.85, 34); this.scene.add(pier); this.addBoxCollider(252, 34, 18, 10, 'pier');
const buoyMat = new THREE.MeshStandardMaterial({ color: 0xd8c46a, roughness: 0.6, emissive: 0x5a4210, emissiveIntensity: 0.5 }); for (const x of [-80, 64]) {
const b = mesh(new THREE.CylinderGeometry(0.55, 0.8, 1.3, 8), buoyMat, x, 0.65, 0); this.scene.add(b);
const l = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffcf6a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); l.position.set(x, 1.6, 0); l.scale.set(3.4, 3.4, 1); this.scene.add(l); } } buildHarborLife() {
const propItems = []; for (let x = -270; x <= 270; x += 17) { if (Math.abs(x) < 16 || (x > 120 && x < 290)) continue; propItems.push({ x, y: 1.05, z: 26.1, w: 0.35, h: 0.9, d: 0.35, color: 0x2f3a3d, uv: 2 }); propItems.push({ x, y: 1.05, z: -26.1, w: 0.35, h: 0.9, d: 0.35, color: 0x2f3a3d, uv: 2 }); } for (const side of [-1, 1]) { for (let x = -296; x < 296; x += 4) { if (Math.abs(x) < 10 || (side > 0 && x > -132 && x < -38) || (side > 0 && x > 238 && x < 264)) continue; propItems.push({ x, y: 1.22, z: side * 24.2, w: 0.13, h: 1.15, d: 0.13, color: 0xd6cbb2, uv: 2 }); propItems.push({ x: x + 2, y: 1.72, z: side * 24.2, w: 4.1, h: 0.1, d: 0.1, color: 0x3f7f78, uv: 2 }); propItems.push({ x: x + 2, y: 1.38, z: side * 24.2, w: 4.1, h: 0.06, d: 0.06, color: 0xd6cbb2, uv: 2 }); } }
const pm = new THREE.Mesh(mergeColoredBoxes(propItems), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })); pm.castShadow = !this.low; this.scene.add(pm);
const archMat = new THREE.MeshStandardMaterial({ color: 0x3f7f78, roughness: 0.7, metalness: 0.25 }); this.scene.add(box(0.5, 8.5, 0.5, archMat, -101, 4.6, 29.5)); this.scene.add(box(0.5, 8.5, 0.5, archMat, -81, 4.6, 29.5)); this.scene.add(box(21, 0.6, 0.6, archMat, -91, 8.7, 29.5));
const marinaSign = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture('MARINA SOL', { color: '#ffe8b4', glow: '#ff7a52', font: 'bold 74px "Arial Narrow", Arial, sans-serif', width: 640 }),
transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
})); marinaSign.position.set(-91, 7.3, 29.6); marinaSign.scale.set(18, 4, 1); this.scene.add(marinaSign); } buildSkyline() {
const items = [];
const r = mulberry32(0x9a11);
const towers = [
[-44, -196, 24, 96, 0xd9c6a8], [22, -232, 28, 118, 0xc7a98b],
[-118, -176, 20, 82, 0xb9a68e], [96, -212, 26, 102, 0xd2b596],
[-188, -150, 18, 68, 0xbfae94], [152, -168, 22, 88, 0xcbb292],
]; for (const [x, z, w, h, color] of towers) { items.push({ x, y: 0.5 + h / 2, z, w, h, d: w * 0.8, color, uv: 3.2 }); items.push({ x, y: 0.5 + h + 3, z, w: w * 0.4, h: 6, d: w * 0.35, color: 0x8e8578, uv: 3.2 }); }
const towerMesh = new THREE.Mesh(mergeColoredBoxes(items), new THREE.MeshStandardMaterial({ map: facadeTexture(2), vertexColors: true, roughness: 0.85, metalness: 0.05,
emissive: 0xffb067, emissiveMap: facadeTexture(2), emissiveIntensity: 0.16,
})); this.scene.add(towerMesh);
const beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff4a3a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); beacon.position.set(22, 122, -232); beacon.scale.set(5, 5, 1); this.scene.add(beacon);
const skySign = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture('PUERTO SOL', { color: '#ffe8bc', glow: '#ff7a52', font: 'bold 58px "Arial Narrow", Arial, sans-serif', width: 640 }),
transparent: true, depthWrite: false,
})); skySign.position.set(22, 105, -218); skySign.scale.set(34, 6, 1); this.scene.add(skySign);
const islandMat = new THREE.MeshBasicMaterial({ color: 0x3e4c52, fog: true }); for (const [x, z, s] of [[520, 120, 90], [610, 40, 130], [470, 260, 70], [540, -200, 100]]) {
const island = mesh(new THREE.ConeGeometry(s, 26, 7), islandMat, x, 4, z); island.rotation.y = x; this.scene.add(island); }
const lighthouse = box(4, 24, 4, new THREE.MeshStandardMaterial({ color: 0xd9cbb3, emissive: 0x554422, emissiveIntensity: 0.4 }), 512, 12, 118); this.scene.add(lighthouse);
const lh = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffe9a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); lh.position.set(512, 26, 118); lh.scale.set(8, 8, 1); this.scene.add(lh); } buildSky() {
const skyGeo = new THREE.SphereGeometry(1400, 32, 16); this.skyUniforms = { uTop: { value: new THREE.Color(WORLD.skyTop) },
uHorizon: { value: new THREE.Color(WORLD.skyHorizon) },
uSun: { value: new THREE.Vector3(...WORLD.sunDir).normalize() },
uStorm: { value: 0 },
uTime: { value: 0 },
};
const skyMat = new THREE.ShaderMaterial({ uniforms: this.skyUniforms,
side: THREE.BackSide,
depthWrite: false,
fog: false,
vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
fragmentShader: `
varying vec3 vDir; uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSun; uniform float uStorm; uniform float uTime;
void main(){
float h = clamp(vDir.y * 1.6, 0.0, 1.0);
vec3 col = mix(uHorizon, uTop, pow(h, 0.72));
float d = max(dot(normalize(vDir), normalize(uSun)), 0.0);
col += vec3(1.0,0.55,0.26) * pow(d, 9.0) * 0.55;
col += vec3(1.0,0.72,0.42) * pow(d, 80.0) * 0.9;
float band = sin(vDir.y * 22.0 + uTime * 0.04 + vDir.x * 4.0) * 0.5 + 0.5;
col = mix(col, vec3(0.16,0.18,0.22), uStorm * (0.62 + band * 0.16));
gl_FragColor = vec4(col, 1.0);
}`,
});
const sky = new THREE.Mesh(skyGeo, skyMat); this.scene.add(sky); this.sky = sky;
const sunTex = glowTexture(); this.sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, color: 0xffd2a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
const sd = new THREE.Vector3(...WORLD.sunDir).normalize().multiplyScalar(900); this.sun.position.copy(sd); this.sun.scale.set(280, 280, 1); this.scene.add(this.sun); this.clouds = []; for (let i = 0; i < 16; i++) {
const t = cloudTexture(i + 3);
const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: i % 4 === 0 ? 0xb69a92 : 0xf3d9c8, transparent: true, opacity: 0.62, depthWrite: false }));
const a = rng() * TAU;
const dist = 500 + rng() * 500; sp.position.set(Math.cos(a) * dist, 130 + rng() * 130, Math.sin(a) * dist);
const sc = 220 + rng() * 260; sp.scale.set(sc, sc * 0.42, 1); this.scene.add(sp); sp.userData.base = sp.material.color.clone(); this.clouds.push(sp); } this.hemi = new THREE.HemisphereLight(0x9fb6c8, 0x54453c, 1.25); this.scene.add(this.hemi); this.sunLight = new THREE.DirectionalLight(0xffc08a, 2.4); this.sunLight.position.set(-90, 120, -100); this.sunLight.castShadow = true; this.sunLight.shadow.mapSize.set(this.low ? 1024 : 2048, this.low ? 1024 : 2048); this.sunLight.shadow.camera.near = 1; this.sunLight.shadow.camera.far = 420; this.sunLight.shadow.camera.left = -110; this.sunLight.shadow.camera.right = 110; this.sunLight.shadow.camera.top = 110; this.sunLight.shadow.camera.bottom = -110; this.sunLight.shadow.bias = -0.0007; this.scene.add(this.sunLight); this.scene.add(this.sunLight.target); this.scene.fog = new THREE.Fog(0xd3a184, 130, 760); this.scene.background = new THREE.Color(0xd3a184); } buildWater() { this.waterUniforms = { uTime: { value: 0 },
uStorm: { value: 0 },
uSun: { value: new THREE.Vector3(...WORLD.sunDir).normalize() },
uDeep: { value: new THREE.Color(0x143c48) },
uShallow: { value: new THREE.Color(0x2e7f86) },
};
const geo = new THREE.PlaneGeometry(1800, 1800, 120, 120);
const mat = new THREE.ShaderMaterial({ uniforms: this.waterUniforms,
transparent: false,
vertexShader: `
uniform float uTime; uniform float uStorm; varying vec3 vWorld; varying float vWave;
void main(){
vec3 p = position;
float w1 = sin(p.x * 0.055 + uTime * 0.9) * 0.28;
float w2 = sin(p.y * 0.083 - uTime * 0.7 + p.x * 0.02) * 0.22;
float w3 = sin((p.x + p.y) * 0.14 + uTime * 1.6) * 0.1;
p.z += (w1 + w2 + w3) * (1.0 + uStorm * 1.8);
vWave = w1 + w2;
vec4 wp = modelMatrix * vec4(p, 1.0);
vWorld = wp.xyz;
gl_Position = projectionMatrix * viewMatrix * wp;
}`,
fragmentShader: `
uniform float uTime; uniform float uStorm; uniform vec3 uSun; uniform vec3 uDeep; uniform vec3 uShallow;
varying vec3 vWorld; varying float vWave;
void main(){
vec3 v = normalize(cameraPosition - vWorld);
float fres = pow(1.0 - max(dot(v, vec3(0.0,1.0,0.0)), 0.0), 3.0);
float stripe = sin(vWorld.x * 0.12 + vWorld.z * 0.4 + uTime * 1.2 + vWave * 6.0) * 0.5 + 0.5;
float ripple = sin(vWorld.x * 0.55 - vWorld.z * 0.3 + uTime * 2.1) * 0.5 + 0.5;
vec3 col = mix(uDeep, uShallow, 0.3 + stripe * 0.24 + ripple * 0.08);
vec3 skyRef = mix(vec3(0.42,0.58,0.64), vec3(1.0,0.58,0.34), clamp(0.4 + vWorld.x * 0.0008, 0.0, 1.0));
col = mix(col, skyRef, fres * 0.58);
float spec = pow(max(dot(reflect(-normalize(uSun), vec3(0.0,1.0,0.0)), v), 0.0), 70.0);
col += vec3(1.0,0.76,0.5) * spec * (1.4 + stripe * 1.2);
float edge = smoothstep(17.0, 23.6, abs(vWorld.z));
float foam = edge * (0.28 + 0.3 * sin(vWorld.x * 0.8 + uTime * 2.4 + vWave * 8.0));
col += vec3(0.62,0.7,0.68) * clamp(foam, 0.0, 0.6);
col = mix(col, vec3(0.16,0.22,0.26), uStorm * 0.35);
gl_FragColor = vec4(col, 1.0);
}`,
});
const water = new THREE.Mesh(geo, mat); water.rotation.x = -Math.PI / 2; water.position.y = 0; this.scene.add(water); this.water = water; } buildRain() {
const count = this.low ? 1100 : 2600;
const pos = new Float32Array(count * 6); for (let i = 0; i < count; i++) {
const x = (Math.random() - 0.5) * 160;
const y = Math.random() * 60;
const z = (Math.random() - 0.5) * 160;
const j = i * 6; pos[j] = x; pos[j + 1] = y; pos[j + 2] = z; pos[j + 3] = x + 0.12; pos[j + 4] = y + 0.9; pos[j + 5] = z + 0.04; }
const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const mat = new THREE.LineBasicMaterial({ color: 0xcfe4ee, transparent: true, opacity: 0, depthWrite: false });
const rain = new THREE.LineSegments(geo, mat); rain.frustumCulled = false; this.scene.add(rain); this.rain = rain; this.rainPos = pos; } heightAt(x, z) {
const ax = Math.abs(x); if (ax < WORLD.bridgeHalfWidth) {
const az = Math.abs(z); if (az <= WORLD.bridgeSpan) return WORLD.deckY; if (az < BRIDGE_GATE_Z) {
const t = (BRIDGE_GATE_Z - az) / (BRIDGE_GATE_Z - WORLD.bridgeSpan); return lerp(0.35, WORLD.deckY, t); } } for (const r of ROADS) { if (r.axis === 'z') { if (z >= r.from && z <= r.to && Math.abs(x - r.pos) > r.width / 2 && Math.abs(x - r.pos) < r.width / 2 + SIDEWALK) return 0.59; } else if (x >= r.from && x <= r.to && Math.abs(z - r.pos) > r.width / 2 && Math.abs(z - r.pos) < r.width / 2 + SIDEWALK) return 0.59; } if (this.onDock(x, z)) return 1.08; return 0.35; } isOnBridge(x, z) { return Math.abs(x) < WORLD.bridgeHalfWidth && Math.abs(z) < BRIDGE_GATE_Z; } isWater(x, z) { if (this.onDock(x, z)) return false; return Math.abs(z) < WORLD.channelHalf && !this.isOnBridge(x, z); } onDock(x, z) { for (const dx of [-106, -86, -66]) { if (Math.abs(x - dx) < 2.1 && z > 2 && z < 24) return true; } return x > 243 && x < 261 && z > 29 && z < 39; } collide(x, z, r, filter) { for (const b of this.colliders) { if (filter && !filter(b)) continue;
const cx = clamp(x, b.minX, b.maxX);
const cz = clamp(z, b.minZ, b.maxZ);
const dx = x - cx, dz = z - cz;
const d2 = dx * dx + dz * dz; if (d2 < r * r && d2 > 0.000001) {
const d = Math.sqrt(d2); return { x: (dx / d) * (r - d), z: (dz / d) * (r - d) }; } } return null; } segmentBlocked(ax, az, bx, bz) { for (let i = 1; i < 9; i++) {
const t = i / 9;
const x = ax + (bx - ax) * t;
const z = az + (bz - az) * t; for (const b of this.colliders) { if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) return true; } } return false; } setStorm(v) { this.storm = clamp(v, 0, 1); this.skyUniforms.uStorm.value = this.storm; this.waterUniforms.uStorm.value = this.storm; this.rain.material.opacity = this.storm * 0.62; this.hemi.intensity = 1.25 - this.storm * 0.42; this.sunLight.intensity = 2.4 - this.storm * 1.1; this.scene.fog.color.setHex(this.storm > 0.5 ? 0x6f7278 : 0xd3a184); this.scene.fog.near = 130 - this.storm * 55; this.scene.fog.far = 760 - this.storm * 340; this.scene.background.copy(this.scene.fog.color); if (this.roadMesh) { this.roadMesh.material.roughness = 0.7 - this.storm * 0.35; this.roadMesh.material.metalness = 0.1 + this.storm * 0.25; } this.sun.material.opacity = 0.9 - this.storm * 0.72; if (!this.stormColor) this.stormColor = new THREE.Color(0x39424a); for (const c of this.clouds) { c.material.color.copy(c.userData.base).lerp(this.stormColor, this.storm * 0.8); c.material.opacity = 0.62 + this.storm * 0.2; } } lightning() { this.flash = 1; } update(dt, camera) { this.time += dt; this.skyUniforms.uTime.value = this.time; this.waterUniforms.uTime.value = this.time; for (const c of this.clouds) { c.position.x += dt * (1.2 + this.storm * 3.5); if (c.position.x > 1100) c.position.x = -1100; } if (camera) { this.sun.position.copy(camera.position).add(new THREE.Vector3(...WORLD.sunDir).normalize().multiplyScalar(900)); this.rain.position.set(camera.position.x, 0, camera.position.z); } if (this.rain.material.opacity > 0.01) {
const p = this.rainPos; for (let i = 0; i < p.length; i += 6) {
const dy = dt * (34 + this.storm * 26); p[i + 1] -= dy; p[i + 4] -= dy; p[i] -= dt * 5.2; p[i + 3] -= dt * 5.2; if (p[i + 1] < 0) {
const x = (Math.random() - 0.5) * 160;
const z = (Math.random() - 0.5) * 160;
const y = 55 + Math.random() * 15; p[i] = x; p[i + 1] = y; p[i + 2] = z; p[i + 3] = x + 0.12; p[i + 4] = y + 0.9; p[i + 5] = z + 0.04; } } this.rain.geometry.attributes.position.needsUpdate = true; } if (this.flash > 0) { this.flash = Math.max(0, this.flash - dt * 3.2); this.hemi.intensity = 1.25 - this.storm * 0.42 + this.flash * 2.6; } if (camera) {
const t = this.sunLight.target; t.position.set(camera.position.x, 0, camera.position.z); this.sunLight.position.set(camera.position.x - 80, 120, camera.position.z - 90); } } }
const BRIDGE_GATE_Z = 44;
