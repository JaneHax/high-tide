import * as THREE from 'three';
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
export const TAU = Math.PI * 2;
export function angleDelta(a, b) {
const d = (b - a) % TAU; return d > Math.PI ? d - TAU : d < -Math.PI ? d + TAU : d; }
export function dampAngle(a, b, k, dt) { return a + angleDelta(a, b) * (1 - Math.exp(-k * dt)); }
export function mulberry32(seed) {
let s = seed >>> 0; return function () { s = (s + 0x6d2b79f5) >>> 0;
let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function canvasTexture(w, h, draw, repeat = null) {
const c = document.createElement('canvas'); c.width = w; c.height = h;
const g = c.getContext('2d'); draw(g, w, h);
const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); } return t; }
export function facadeTexture(seed = 1) {
const r = mulberry32(seed * 7919); return canvasTexture(256, 512, (g, w, h) => { g.fillStyle = seed % 2 ? '#d3c8b5' : '#c8c0b1'; g.fillRect(0, 0, w, h); g.fillStyle = '#b6aa96'; for (let y = 0; y < h; y += 64) g.fillRect(0, y, w, 3); for (let y = 18; y < h - 30; y += 64) { for (let x = 14; x < w - 20; x += 46) {
const lit = r() < 0.2; g.fillStyle = lit ? (r() < 0.5 ? '#ffd89a' : '#ffe9bd') : (seed % 3 === 0 ? '#2c4149' : '#31434b'); g.fillRect(x, y, 30, 34); g.fillStyle = lit ? '#fff0c8' : '#22343c'; g.fillRect(x + 2, y + 2, 26, 15); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 2, y + 2, 26, 3); } } if (seed % 2 === 0) { g.fillStyle = 'rgba(70,90,90,0.28)'; for (let y = 0; y < h; y += 128) g.fillRect(0, y, w, 8); } g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, 0, 7, h); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(w - 6, 0, 6, h); }); }
export function roadTexture() { return canvasTexture(256, 512, (g, w, h) => { g.fillStyle = '#2b2f33'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1800; i++) {
const v = 38 + Math.random() * 24;
g.fillStyle = `rgba(${v},${v},${v + 3},${0.2 + Math.random() * 0.3})`;
g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } g.fillStyle = 'rgba(235,225,198,0.72)'; g.fillRect(16, 0, 5, h); g.fillRect(w - 21, 0, 5, h); g.fillStyle = 'rgba(240,190,80,0.78)'; for (let y = 0; y < h; y += 96) g.fillRect(w / 2 - 3, y, 6, 52); g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, 0, w, 2); }, [1, 8]); }
export function concreteTexture() { return canvasTexture(256, 256, (g, w, h) => { g.fillStyle = '#b9ad98'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1200; i++) {
const v = 150 + Math.random() * 40;
g.fillStyle = `rgba(${v},${v - 8},${v - 22},${Math.random() * 0.25})`;
g.fillRect(Math.random() * w, Math.random() * h, 3, 3); } g.strokeStyle = 'rgba(90,80,68,0.25)'; g.lineWidth = 2; for (let i = 0; i <= w; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } }, [8, 8]); }
export function glowTexture() { return canvasTexture(128, 128, (g, w, h) => {
const grad = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.25, 'rgba(255,236,190,0.85)'); grad.addColorStop(0.6, 'rgba(255,190,120,0.25)'); grad.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = grad; g.fillRect(0, 0, w, h); }); }
export function cloudTexture(seed = 1) { return canvasTexture(256, 128, (g, w, h) => { g.clearRect(0, 0, w, h);
const rng = mulberry32(seed); for (let i = 0; i < 22; i++) {
const x = rng() * w;
const y = h * 0.35 + rng() * h * 0.35;
const r = 18 + rng() * 34;
const grad = g.createRadialGradient(x, y, 1, x, y, r); grad.addColorStop(0, 'rgba(255,255,255,0.55)'); grad.addColorStop(0.6, 'rgba(245,230,220,0.22)'); grad.addColorStop(1, 'rgba(240,220,210,0)'); g.fillStyle = grad; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } }); }
export function hazardTexture() { return canvasTexture(128, 128, (g, w, h) => { g.fillStyle = '#efe4cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#c94f3c'; for (let i = 0; i < 4; i++) { g.save(); g.translate(0, i * 32); g.transform(1, -0.6, 0, 1, 0, 0); g.fillRect(0, 0, w, 16); g.restore(); } }, [2, 1]); }
export function textTexture(text, opts = {}) {
const { width = 512, height = 128, bg = 'rgba(0,0,0,0)', color = '#ffdfae',
font = 'bold 62px "Arial Narrow", Arial, sans-serif', border = null, glow = '#ff7a52',
} = opts; return canvasTexture(width, height, (g, w, h) => { g.clearRect(0, 0, w, h); if (bg !== 'rgba(0,0,0,0)') { g.fillStyle = bg; g.fillRect(0, 0, w, h); } g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; if (glow) { g.shadowColor = glow; g.shadowBlur = 22; } g.fillStyle = color; g.fillText(text, w / 2, h / 2 + 2); g.shadowBlur = 0; if (border) { g.strokeStyle = border; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8); } }); }
export function mesh(geo, mat, x = 0, y = 0, z = 0) {
const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; }
export function box(w, h, d, mat, x = 0, y = 0, z = 0) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
export function plane(w, d, mat, x = 0, y = 0, z = 0) {
const m = mesh(new THREE.PlaneGeometry(w, d), mat, x, y, z); m.rotation.x = -Math.PI / 2; return m; }
export function formatMoney(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
export function formatTime(sec) {
const s = Math.max(0, Math.floor(sec));
return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
