// combat.js — four weapons, shooting, tracers, heat.
import * as THREE from 'three';
import { CFG } from './config.js';
import { clamp, rnd } from './util.js';
import { addHeat } from './police.js';
import { beep } from './polish.js';

export function createCombat(scene, S) {
  const tracers = [];
  const geo = new THREE.BufferGeometry();
  const mat = new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 12; i++) {
    const line = new THREE.Line(geo, mat);
    line.visible = false; line.frustumCulled = false;
    scene.add(line); tracers.push({ line, t: 0 });
  }
  return { tracers, cooldown: 0, muzzle: 0 };
}

function unlockCheck(S, sys) {
  for (const [id, w] of Object.entries(CFG.weapons)) {
    if (!S.weapons.owned[id] && S.rep >= w.rep) {
      S.weapons.owned[id] = true; S.weapons.ammo[id] = w.startAmmo;
      sys.hud.toast('New weapon unlocked: ' + w.name + ' (rep ' + w.rep + ')');
    }
  }
}

export function switchWeapon(S, sys, id) {
  if (!S.weapons.owned[id]) { sys.hud.toast('Locked — needs rep ' + CFG.weapons[id].rep); return; }
  S.weapons.cur = id;
  sys.hud.toast(CFG.weapons[id].name + ' ready');
}

export function cycleWeapon(S, sys) {
  const ids = Object.keys(CFG.weapons).filter((id) => S.weapons.owned[id]);
  const i = ids.indexOf(S.weapons.cur);
  switchWeapon(S, sys, ids[(i + 1) % ids.length]);
}

export function fire(S, sys) {
  const C = sys.combat;
  if (C.cooldown > 0 || !S.started || S.paused) return false;
  const w = CFG.weapons[S.weapons.cur];
  if ((S.weapons.ammo[S.weapons.cur] || 0) <= 0) { sys.hud.toast('Out of ammo — ' + w.name); C.cooldown = 0.4; return false; }
  S.weapons.ammo[S.weapons.cur]--;
  C.cooldown = w.rate; C.muzzle = 0.06;
  const P = sys.player, cam = sys.camera;
  const from = new THREE.Vector3().copy(P.pos); from.y += 1.5;
  const dir = new THREE.Vector3();
  cam.getWorldDirection(dir);
  let hitAny = false;
  for (let p = 0; p < w.pellets; p++) {
    const d = dir.clone();
    d.x += rnd(-w.spread, w.spread); d.y += rnd(-w.spread, w.spread); d.z += rnd(-w.spread, w.spread);
    d.normalize();
    const end = from.clone().addScaledVector(d, w.range);
    // Hit test vs officers and peds: closest one near the ray.
    for (const list of [sys.police.officers, sys.peds.walkers]) {
      for (const u of list) {
        const to = new THREE.Vector3(u.pos.x - from.x, 1 - from.y, u.pos.z - from.z);
        const along = to.dot(d);
        if (along < 0 || along > w.range) continue;
        const perp = to.clone().addScaledVector(d, -along).length();
        if (perp < 1.2) {
          if (list === sys.police.officers) { sys.police.scene.remove(u.mesh); sys.police.officers.splice(sys.police.officers.indexOf(u), 1); }
          else { sys.peds.scene.remove(u.mesh); sys.peds.walkers.splice(sys.peds.walkers.indexOf(u), 1); }
          S.stats.kills = (S.stats.kills || 0) + 1;
          hitAny = true;
        }
      }
    }
    const tr = C.tracers.find((t) => !t.line.visible);
    if (tr) {
      tr.line.geometry = new THREE.BufferGeometry().setFromPoints([from, end]);
      tr.line.visible = true; tr.t = 0.08;
    }
  }
  S.lastCrime = S.time; S.lastShot = S.time;
  addHeat(S, w.heat);
  if (hitAny) sys.hud.toast('Hit!');
  beep(180 + Math.random() * 60, 0.06);
  return true;
}

export function updateCombat(dt, S, sys) {
  const C = sys.combat;
  C.cooldown = Math.max(0, C.cooldown - dt);
  C.muzzle = Math.max(0, C.muzzle - dt);
  for (const t of C.tracers) {
    if (t.line.visible) { t.t -= dt; if (t.t <= 0) t.line.visible = false; }
  }
  unlockCheck(S, sys);
  if (sys.input.pressed('Digit1')) switchWeapon(S, sys, 'pistol');
  if (sys.input.pressed('Digit2')) switchWeapon(S, sys, 'shotgun');
  if (sys.input.pressed('Digit3')) switchWeapon(S, sys, 'smg');
  if (sys.input.pressed('Digit4')) switchWeapon(S, sys, 'rifle');
  if (sys.input.pressed('KeyQ')) cycleWeapon(S, sys);
  const w = CFG.weapons[S.weapons.cur];
  if (w.auto) { if (sys.input.mouse.down) fire(S, sys); }
  else if (sys.input.pressed('Mouse0')) fire(S, sys);
}
