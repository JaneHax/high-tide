// polish.js — storm feedback, rain, wind, lamps, ambience, sound blips.
import * as THREE from 'three';
import { CFG } from './config.js';
import { clamp, lerp } from './util.js';

let audioCtx = null;
export function beep(freq, dur = 0.08) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = freq; o.type = 'square';
    g.gain.value = 0.04;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch { /* audio unavailable */ }
}

export function createPolish(scene, S) {
  const n = CFG.storm.rain;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 120;
    pos[i * 3 + 1] = Math.random() * 40;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 120;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xaaccee, size: 0.35, transparent: true, opacity: 0 }));
  rain.visible = false; rain.frustumCulled = false;
  scene.add(rain);
  return { rain, stormT: 0, stormOn: false, target: 0 };
}

export function updatePolish(dt, S, sys) {
  const P = sys.polish;
  P.stormT += dt;
  if (P.stormT > CFG.storm.cycle) {
    P.stormT = 0; P.stormOn = !P.stormOn;
    P.target = P.stormOn ? 1 : 0;
    sys.hud.toast(P.stormOn ? 'Storm rolling in off the sea — rain and wind' : 'Storm passing — the sun is back');
  }
  S.storm = clamp(S.storm + (P.target - S.storm) * dt * 0.5, 0, 1);
  // Rain follows the player, falls faster in the storm.
  const pos = P.rain.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let y = pos.getY(i) - dt * (18 + S.storm * 14);
    if (y < 0) y = 40;
    pos.setY(i, y);
    pos.setX(i, pos.getX(i) + dt * S.storm * 6);
  }
  pos.needsUpdate = true;
  P.rain.position.set(S.player.pos.x, 0, S.player.pos.z);
  P.rain.visible = S.storm > 0.25;
  P.rain.material.opacity = S.storm * 0.7;
  // Light dims and cools as the storm builds; lamps glow at dusk.
  const sun = sys.sun, hemi = sys.hemi;
  sun.intensity = lerp(2.6, 1.1, S.storm);
  sun.color.setHex(S.storm > 0.5 ? 0xc9c9d8 : 0xffb066);
  hemi.intensity = lerp(0.9, 0.55, S.storm);
  sys.scene.fog.color.setHex(S.storm > 0.5 ? 0x8a8a96 : 0xf2a56b);
  // Palms sway in the wind.
  for (const p of sys.city.palms) p.rotation.z = Math.sin(S.time * 1.5 + p.position.x) * 0.08 * (0.4 + S.storm);
  S.stormLevel = S.storm;
}
