// missions.js — ten jobs for Sombra, five of them conditional.
import * as THREE from 'three';
import { CFG } from './config.js';
import { dist2 } from './util.js';
import { addHeat } from './police.js';

const STAR_HEAT = [0, 8, 25, 45, 65, 85];

export function condMet(S, cond) {
  if (!cond) return true;
  const [k, v] = cond.split(':');
  if (k === 'job') return !!S.jobsDone[v];
  if (k === 'time') return S.time >= Number(v);
  if (k === 'stars') return S.stars === Number(v);
  if (k === 'district') return S.districts.visited.has(v);
  return true;
}
export function jobState(S, job) {
  if (S.jobsDone[job.id]) return 'done';
  if (S.job && S.job.id === job.id) return 'active';
  return condMet(S, job.cond) ? 'available' : 'locked';
}

export function createMissions(scene, S) {
  const marker = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 6, 12),
    new THREE.MeshLambertMaterial({ color: 0xffd23c, transparent: true, opacity: 0.35, emissive: 0xaa7700 }),
  );
  marker.position.set(0, 3, 40); scene.add(marker);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.25, 8, 20),
    new THREE.MeshLambertMaterial({ color: 0xffd23c, emissive: 0xaa7700 }),
  );
  ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.2, 40); scene.add(ring);
  return { scene, marker, ring, cps: [], holdT: 0 };
}

function setTarget(sys, x, z) {
  sys.missions.marker.position.set(x, 3, z);
  sys.missions.ring.position.set(x, 0.2, z);
  if (sys.job) sys.job.tx = x, sys.job.tz = z;
}
function clearCps(sys) {
  for (const c of sys.missions.cps) sys.missions.scene.remove(c);
  sys.missions.cps.length = 0;
}
function makeCps(sys, pts) {
  clearCps(sys);
  for (const [x, z] of pts) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 8, 12),
      new THREE.MeshLambertMaterial({ color: 0x33ddff, transparent: true, opacity: 0.4, emissive: 0x1188aa }),
    );
    m.position.set(x, 4, z); sys.missions.scene.add(m);
    sys.missions.cps.push(m);
  }
}

export function clearJob(S, sys) {
  S.job = null;
  clearCps(sys);
  sys.hud.renderJobPanel(S, sys);
}

export function startJob(S, sys, id) {
  const job = CFG.jobs.find((j) => j.id === id);
  if (!job || S.job || jobState(S, job) !== 'available') return false;
  const J = { id, kind: job.kind, step: 0, t: 0, holdT: 0, data: {} };
  S.job = J;
  if (job.kind === 'race') {
    J.t = 75; J.cps = [[-80, -40], [60, 80], [120, -80]]; J.cpI = 0; makeCps(sys, J.cps); setTarget(sys, ...J.cps[0]);
  } else if (job.kind === 'getaway') {
    J.t = 60; addHeat(S, STAR_HEAT[2]); setTarget(sys, ...sys.city.safehouse);
  } else if (job.kind === 'countdown') {
    setTarget(sys, ...job.at);
    const car = sys.vehicles.cars.find((c) => c.parked);
    if (car) { car.cargo = true; car.parked = false; car.pos.set(job.at[0], 0, job.at[1]); car.mesh.position.copy(car.pos); J.data.car = car; }
  } else if (job.kind === 'harbor') {
    setTarget(sys, ...sys.city.boatPost);
  } else {
    setTarget(sys, ...job.at);
  }
  sys.hud.toast('Job: ' + job.title + ' — ' + job.story);
  return true;
}

function payJob(S, sys, job) {
  S.cash += job.pay;
  S.rep += job.rep;
  S.jobsDone[job.id] = true;
  const d = sys.radio.districtAt(S.player.pos.x, S.player.pos.z);
  S.districts.standing[d.name] = (S.districts.standing[d.name] || 0) + 5;
  sys.atlas.recordJob(S, job);
  sys.hud.toast('Job done: ' + job.title + ' — +$' + job.pay + ', +' + job.rep + ' rep');
  sys.save.saveGame(S);
  S.job = null; clearCps(sys);
  sys.hud.renderJobPanel(S, sys);
}

function failJob(S, sys, why) {
  sys.hud.toast('Job failed: ' + why);
  S.job = null; clearCps(sys);
  sys.hud.renderJobPanel(S, sys);
}

export function updateMissions(dt, S, sys) {
  const M = sys.missions;
  M.marker.rotation.y += dt;
  M.marker.position.y = 3 + Math.sin(S.time * 2) * 0.3;
  for (const c of M.cps) c.rotation.y += dt * 0.5;
  const J = S.job;
  if (!J) return;
  const job = CFG.jobs.find((j) => j.id === J.id);
  const P = S.player.pos;
  const near = (x, z, r) => dist2(P.x, P.z, x, z) < r * r;
  if (J.kind === 'robbery') {
    if (near(job.at[0], job.at[1], 5) && sys.input.down('KeyE')) {
      J.holdT += dt;
      sys.hud.setHold(J.holdT / 3);
      if (J.holdT >= 3) {
        sys.hud.setHold(0);
        const want = Math.min(5, S.stars + 2);
        S.heat = STAR_HEAT[want]; S.stars = want; S.lastCrime = S.time;
        payJob(S, sys, job);
      }
    } else { J.holdT = Math.max(0, J.holdT - dt * 2); sys.hud.setHold(0); }
    return;
  }
  if (J.kind === 'race') {
    J.t -= dt;
    const [cx, cz] = J.cps[J.cpI];
    if (near(cx, cz, 7)) {
      J.cpI++;
      sys.hud.toast('Checkpoint ' + J.cpI + ' of 3!');
      if (J.cpI >= 3) { payJob(S, sys, job); return; }
      setTarget(sys, ...J.cps[J.cpI]);
    }
    if (J.t <= 0) failJob(S, sys, 'out of time');
    return;
  }
  if (J.kind === 'getaway') {
    J.t -= dt;
    if (near(...sys.city.safehouse, 6)) { payJob(S, sys, job); return; }
    if (J.t <= 0) failJob(S, sys, 'the safehouse closed on you');
    return;
  }
  if (J.kind === 'countdown') {
    if (J.step === 0) {
      if (S.inCar && S.inCar.cargo) { J.step = 1; J.t = 60; setTarget(sys, 150, -160); sys.hud.toast('Drive the cargo to the port — 60 seconds!'); }
      return;
    }
    J.t -= dt;
    if (near(150, -160, 8) && S.inCar) { payJob(S, sys, job); return; }
    if (J.t <= 0) failJob(S, sys, 'out of time');
    return;
  }
  if (J.kind === 'repo') {
    if (J.step === 0) {
      if (near(job.at[0], job.at[1], 5) && sys.input.pressed('KeyE')) {
        J.step = 1; setTarget(sys, ...sys.city.garageLot);
        sys.hud.toast('Got the car — bring it back to the garage lot');
      }
      return;
    }
    if (near(...sys.city.garageLot, 8)) { payJob(S, sys, job); return; }
    return;
  }
  if (J.kind === 'clean') {
    if (S.stars > 0) { failJob(S, sys, 'you got hot — the ledger job is blown'); return; }
    if (near(job.at[0], job.at[1], 4) && sys.input.pressed('KeyE')) payJob(S, sys, job);
    return;
  }
  if (J.kind === 'split') {
    const pts = [job.at, [40, -40]];
    if (near(pts[J.step][0], pts[J.step][1], 4) && sys.input.pressed('KeyE')) {
      J.step++;
      if (J.step >= 2) { payJob(S, sys, job); return; }
      setTarget(sys, ...pts[1]);
      sys.hud.toast('First drop done — one more');
    }
    return;
  }
  if (J.kind === 'harbor') {
    if (J.step === 0) {
      if (S.inBoat) { J.step = 1; setTarget(sys, 140, -190); sys.hud.toast('Sail to the harbor buoy'); }
      return;
    }
    if (J.step === 1) {
      if (S.inBoat && near(140, -190, 8)) { J.step = 2; setTarget(sys, ...sys.city.sombra); sys.hud.toast('Dock and walk to Sombra at the port office'); }
      return;
    }
    if (near(...sys.city.sombra, 5) && sys.input.pressed('KeyE')) payJob(S, sys, job);
    return;
  }
  // Plain walk jobs.
  if (near(job.at[0], job.at[1], 4) && sys.input.pressed('KeyE')) payJob(S, sys, job);
}
