export class GameAudio { constructor() { this.ctx = null; this.muted = false; this.engineGain = null; this.engineOsc = null; this.engineOsc2 = null; this.siren = null; this.rainGain = null; this.ambientGain = null; } init() { if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.55; this.master.connect(this.ctx.destination); this.buildAmbient(); this.buildEngine(); this.buildRain(); } get t() { return this.ctx ? this.ctx.currentTime : 0; } noiseBuffer(seconds = 1) {
const len = Math.floor(this.ctx.sampleRate * seconds);
const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; return buf; } noise(dur, type, freq, vol, q = 1, loop = false) {
const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuffer(dur); src.loop = loop;
const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
const g = this.ctx.createGain(); g.gain.value = vol; if (!loop) g.gain.exponentialRampToValueAtTime(0.001, this.t + dur * 0.9); src.connect(f).connect(g).connect(this.master); src.start(); return g; } buildAmbient() { this.noise(4, 'lowpass', 420, 0.12, 1, true); } buildEngine() {
const g = this.ctx.createGain(); g.gain.value = 0;
const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
const o1 = this.ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 48;
const o2 = this.ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 96;
const g2 = this.ctx.createGain(); g2.gain.value = 0.35; o1.connect(lp); o2.connect(g2).connect(lp); lp.connect(g).connect(this.master); o1.start(); o2.start(); this.engineGain = g; this.engineOsc = o1; this.engineOsc2 = o2; this.engineFilter = lp; } buildRain() { this.rainGain = this.noise(4, 'highpass', 1200, 0, 1, true); } setEngine(speedRatio, active, kind = 'car') { if (!this.ctx || !this.engineGain) return;
const t = this.t;
const base = kind === 'boat' ? 34 : 46;
const target = active ? 0.09 + speedRatio * 0.16 : 0; this.engineGain.gain.setTargetAtTime(target, t, 0.12); this.engineOsc.frequency.setTargetAtTime(base + speedRatio * 70, t, 0.1); this.engineOsc2.frequency.setTargetAtTime((base + speedRatio * 70) * 2.01, t, 0.1); this.engineFilter.frequency.setTargetAtTime(220 + speedRatio * 700, t, 0.1); } sirenStart() { if (!this.ctx || this.siren) return;
const o = this.ctx.createOscillator(); o.type = 'sine';
const g = this.ctx.createGain(); g.gain.value = 0; o.connect(g).connect(this.master); o.start(); this.siren = { o, g }; g.gain.setTargetAtTime(0.035, this.t, 0.5); } sirenStop() { if (!this.ctx || !this.siren) return;
const s = this.siren; s.g.gain.setTargetAtTime(0, this.t, 0.2); setTimeout(() => { try { s.o.stop(); } catch (e) {} }, 600); this.siren = null; } updateSiren() { if (!this.ctx || !this.siren) return;
const t = this.t;
const high = Math.sin(t * 5.2) > 0; this.siren.o.frequency.setTargetAtTime(high ? 920 : 660, t, 0.02); } setRain(v) { if (!this.ctx || !this.rainGain) return; this.rainGain.gain.setTargetAtTime(v * 0.14, this.t, 0.8); } blip(freq = 620, dur = 0.08, type = 'sine', vol = 0.12) { if (!this.ctx) return;
const o = this.ctx.createOscillator();
const g = this.ctx.createGain(); o.type = type; o.frequency.value = freq; g.gain.value = vol; g.gain.exponentialRampToValueAtTime(0.0001, this.t + dur); o.connect(g).connect(this.master); o.start(); o.stop(this.t + dur); } ui() { this.blip(520, 0.05, 'triangle', 0.1); } missionChime() { if (!this.ctx) return;
[523, 659, 784, 1046].forEach((f, i) => { setTimeout(() => this.blip(f, 0.28, 'triangle', 0.12), i * 110); }); } cash() { if (!this.ctx) return; this.blip(880, 0.08, 'square', 0.08); setTimeout(() => this.blip(1320, 0.12, 'square', 0.07), 70); } evadeChime() { this.blip(320, 0.18, 'sine', 0.08); } hitConfirm() { this.blip(1200, 0.05, 'square', 0.07); } gunshot(vol = 0.4) { if (!this.ctx) return; this.noise(0.18, 'lowpass', 1800, vol); } thunder() { if (!this.ctx) return; this.noise(2.4, 'lowpass', 180, 0.22); } policeRadio() { if (!this.ctx) return; this.noise(0.5, 'bandpass', 1800, 0.09, 1.4); setTimeout(() => this.blip(760, 0.1, 'square', 0.06), 220); } crash() { if (!this.ctx) return; this.noise(0.3, 'lowpass', 600, 0.3); } toggleMute() { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : 0.55; return this.muted; } }
