// Four weapons, their ammunition, and the shooting itself. A shot is
// tested against every officer and pedestrian by direction: each pellet
// gets its own spread direction, and a target is hit when the pellet's
// ray passes close to it within range. Tracers are short-lived lines.
import * as THREE from 'three';
import { WEAPONS, POLICE } from './config.js';

export function createCombat(scene, camera, player, police, peds) {
  const order = ['pistol', 'shotgun', 'smg', 'rifle'];
  const ammo = {};
  for (const key of order) ammo[key] = WEAPONS[key].ammo;
  let current = 'pistol';
  let cooldown = 0;
  let triggerHeld = false;
  let lastShotAt = null;
  const tracers = [];
  const tracerMat = new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.9 });

  function unlocked(key) {
    return true; // level gating is checked by the caller through repLevel
  }

  function select(key, repLevel) {
    const def = WEAPONS[key];
    if (!def) return false;
    if (repLevel < def.rep) return false;
    current = key;
    return true;
  }

  function cycle(repLevel) {
    const idx = order.indexOf(current);
    for (let i = 1; i <= order.length; i++) {
      const next = order[(idx + i) % order.length];
      if (repLevel >= WEAPONS[next].rep) { current = next; return true; }
    }
    return false;
  }

  function shootDirection(spread) {
    // Forward from the camera, with a random cone offset for this pellet.
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.x += (Math.random() - 0.5) * spread * 2;
    dir.y += (Math.random() - 0.5) * spread * 2;
    dir.z += (Math.random() - 0.5) * spread * 2;
    return dir.normalize();
  }

  function testHit(origin, dir, def) {
    // Returns the closest hit point and what was hit, or null.
    let best = null;
    const targets = [];
    for (const o of police.officers) if (o.active) targets.push({ x: o.x, z: o.z, y: 1.2, r: 1.0, kind: 'officer', ref: o });
    for (const w of peds.walkers) {
      const p = w.mesh.position;
      targets.push({ x: p.x, z: p.z, y: 1.1, r: 0.9, kind: 'ped', ref: w });
    }
    for (const t of targets) {
      const to = new THREE.Vector3(t.x - origin.x, t.y - origin.y, t.z - origin.z);
      const dist = to.length();
      if (dist > def.range || dist < 0.5) continue;
      const along = to.normalize().dot(dir);
      if (along < 0.985) continue; // pellet must fly close to the target
      const hitPoint = origin.clone().add(dir.clone().multiplyScalar(dist));
      if (!best || dist < best.dist) best = { dist, point: hitPoint, target: t };
    }
    return best;
  }

  function fire(repLevel) {
    const def = WEAPONS[current];
    if (cooldown > 0 || ammo[current] <= 0) return false;
    cooldown = def.rate;
    ammo[current] -= 1;
    const origin = player.state.position.clone();
    origin.y += 1.5;
    // A gunshot is loud: every shot draws a little heat, hit or not.
    police.addHeat(2);
    let anyHit = false;
    for (let i = 0; i < def.pellets; i++) {
      const dir = shootDirection(def.spread);
      const hit = testHit(origin, dir, def);
      const end = hit ? hit.point : origin.clone().add(dir.clone().multiplyScalar(def.range));
      const geo = new THREE.BufferGeometry().setFromPoints([origin, end]);
      const line = new THREE.Line(geo, tracerMat.clone());
      scene.add(line);
      tracers.push({ line, life: 0.09 });
      if (hit) {
        anyHit = true;
        if (hit.target.kind === 'officer') {
          hit.target.ref.active = false;
          hit.target.ref.mesh.visible = false;
        } else {
          const w = hit.target.ref;
          w.mesh.visible = false;
          w.gone = true;
        }
        police.addHeat(POLICE.heatPerShot);
      }
    }
    lastShotAt = { x: player.state.position.x, z: player.state.position.z };
    return true;
  }

  function update(dt, input, repLevel) {
    cooldown -= dt;
    if (input.wasPressed('Digit1')) select('pistol', repLevel);
    if (input.wasPressed('Digit2')) select('shotgun', repLevel);
    if (input.wasPressed('Digit3')) select('smg', repLevel);
    if (input.wasPressed('Digit4')) select('rifle', repLevel);
    if (input.wasPressed('KeyQ')) cycle(repLevel);
    const def = WEAPONS[current];
    const wantFire = def.auto ? input.mouseDown() : input.wasClicked();
    if (wantFire) fire(repLevel);
    triggerHeld = input.mouseDown();
    for (let i = tracers.length - 1; i >= 0; i--) {
      tracers[i].life -= dt;
      tracers[i].line.material.opacity = Math.max(0, tracers[i].life / 0.09) * 0.9;
      if (tracers[i].life <= 0) {
        scene.remove(tracers[i].line);
        tracers[i].line.geometry.dispose();
        tracers.splice(i, 1);
      }
    }
  }

  function lockedList(repLevel) {
    return order.filter((k) => repLevel < WEAPONS[k].rep).map((k) => WEAPONS[k].name);
  }

  return {
    update, fire, select, cycle, lockedList,
    get current() { return current; },
    get def() { return WEAPONS[current]; },
    get ammo() { return ammo[current]; },
    get ammoAll() { return { ...ammo }; },
    get lastShotAt() { return lastShotAt; },
  };
}
