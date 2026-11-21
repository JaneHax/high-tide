// Ten jobs for Sombra, in five kinds: walk to a spot, hold E to rob a
// shop, race three checkpoints in a car, outrun the law to a marker,
// drive a car to the pier, and sail a boat out past the breakwater.
// Each paid job adds cash and reputation; reputation unlocks weapons.
import * as THREE from 'three';
import { MISSIONS, REP } from './config.js';
import { ring, place } from './geometry.js';

const STORY = [
  { title: 'The Marina Errand', text: "Sombra's duffel sits under a tarp at the marina pier. Fetch it and don't look at the boats.", area: 'pier', type: 'walk' },
  { title: 'Word on the Promenade', text: 'The fence drinks at the far end of the promenade. He wants the bag in his hand before he names a price.', area: 'promenade', type: 'walk' },
  { title: 'Market Money', text: 'The buyer counts his cash in the open air of the market square. Stand where he can see you.', area: 'park', type: 'walk' },
  { title: 'Downtown Drop', text: 'The money goes downtown, to a man in a glass tower who never comes down to the street.', area: 'street', type: 'walk' },
  { title: 'Harbour Heist', text: 'A shop on the harbour road keeps its till under the counter. Hold E at the door, take the cash, and run.', area: 'street', type: 'rob' },
  { title: 'Golden Mile', text: 'Three checkpoints, seventy-five seconds, one borrowed car. Sombra wants to know if Rico can drive.', area: 'street', type: 'race' },
  { title: 'The Getaway', text: 'The law is already on you, two stars and climbing. Lose them: reach the far marker before the minute runs out.', area: 'street', type: 'getaway' },
  { title: "Smuggler's Run", text: 'A car full of cargo waits on the grid. Take it, drive it to the pier, and do not stop for anyone.', area: 'pier', type: 'drive' },
  { title: "The Fence's Boat", text: 'The fence will only meet on the water. Take a boat from the pier and sail it out past the breakwater.', area: 'pier', type: 'boat' },
  { title: 'The Breakwater', text: 'Sombra waits at the end of the pier where the water turns deep. He wants the last word.', area: 'pier', type: 'walk' },
];

export function createMissions({ scene, city, player, vehicles, police, boats, hud, garage }) {
  const jobs = STORY.map((s, i) => ({
    id: i, title: s.title, text: s.text, area: s.area, type: s.type,
    pay: MISSIONS.payouts[i], rep: MISSIONS.rep[i],
  }));
  const state = {
    cash: 0, job: 0, rep: 0, level: 0,
    active: false, done: false, timer: 0,
    robHold: 0, cp: 0, cpTotal: 0,
    title: '', text: '',
  };
  const paid = jobs.map(() => false);
  let markerPos = null;
  let clock = 0;
  let warned = false;

  const marker = new THREE.Group();
  const ringMesh = ring(MISSIONS.markerRadius * 0.72, MISSIONS.markerRadius, 0xffc93c, { opacity: 0.85 });
  marker.add(ringMesh);
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(MISSIONS.markerRadius * 0.72, MISSIONS.markerRadius, MISSIONS.markerHeight, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x37e0a0, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false }),
  );
  column.position.y = MISSIONS.markerHeight / 2;
  marker.add(column);
  marker.visible = false;
  scene.add(marker);

  function toast(t) { if (hud) hud.toast(t); }

  function levelFor(rep) {
    let l = 0;
    for (let i = 0; i < REP.thresholds.length; i++) if (rep >= REP.thresholds[i]) l = i;
    return l;
  }

  function addRep(n) {
    state.rep += n;
    const l = levelFor(state.rep);
    if (l > state.level) {
      state.level = l;
      if (vehicles) vehicles.setBoost(l);
      toast(`REP up: ${REP.levels[l]}.${l >= 1 ? ' A new weapon is unlocked.' : ''}`);
    }
  }

  function payJob(i) {
    if (paid[i]) return;
    paid[i] = true;
    state.cash += jobs[i].pay;
    addRep(jobs[i].rep);
    toast(`Paid $${jobs[i].pay}. $${state.cash} in the bag.`);
  }

  function jobPoint(job) {
    const p = player.state.position;
    if (job.type === 'rob') {
      const s = city.shops[0];
      return { x: s.x, z: s.z, y: 0 };
    }
    if (job.type === 'boat') {
      return { x: city.boatSpots[2].x, z: city.boatSpots[2].z + 30, y: 0 };
    }
    if (job.type === 'drive') {
      return { x: city.pierX || -40, z: 150, y: 0.6 };
    }
    const pool = city.spawnPoints.filter((sp) => sp.area === job.area);
    const used = new Set();
    for (const sp of pool) {
      if (sp.used) continue;
      sp.used = true;
      return { x: sp.x, z: sp.z, y: city.surfaceAt(sp.x, sp.z) };
    }
    return { x: p.x + 20, z: p.z, y: 0 };
  }

  function racePoints() {
    // Three checkpoints along nearby roads, starting from Rico's position.
    const p = player.state.position;
    const roads = city.roads.xRoads;
    const near = roads.slice().sort((a, b) => Math.abs(a - p.z) - Math.abs(b - p.z));
    return [
      { x: p.x + 70, z: near[0] },
      { x: p.x + 70, z: near[1] ?? near[0] + 40 },
      { x: p.x, z: near[1] ?? near[0] + 40 },
    ].map((c) => ({ x: Math.max(-190, Math.min(190, c.x)), z: c.z, y: 0 }));
  }

  let raceCps = [];
  function setMarker(x, y, z) {
    markerPos = { x, y, z };
    marker.position.set(x, y, z);
    marker.visible = true;
  }
  function hideMarker() { markerPos = null; marker.visible = false; }

  function showJob() {
    const job = jobs[state.job];
    if (!job) return;
    state.title = job.title;
    state.text = job.text;
    if (job.type === 'race') {
      raceCps = racePoints();
      state.cpTotal = raceCps.length;
      state.cp = 0;
      const c = raceCps[0];
      setMarker(c.x, c.y, c.z);
      return;
    }
    const pt = jobPoint(job);
    setMarker(pt.x, pt.y, pt.z);
  }

  function start() {
    if (state.active || state.done || paid[state.job]) return;
    state.active = true;
    state.robHold = 0;
    state.cp = 0;
    const job = jobs[state.job];
    if (job.type === 'race') state.timer = MISSIONS.raceSeconds;
    if (job.type === 'getaway') { state.timer = MISSIONS.getawaySeconds; police.addHeat(80); }
    toast(job.title);
    showJob();
  }

  function next() {
    if (state.active) payJob(state.job);
    state.active = false;
    state.timer = 0;
    state.robHold = 0;
    state.cp = 0;
    hideMarker();
    if (state.job >= jobs.length - 1) {
      state.done = true;
      return;
    }
    state.job += 1;
    start();
  }

  function nearMarker(r = MISSIONS.reachRadius) {
    if (!markerPos) return false;
    const p = player.state.position;
    return Math.hypot(p.x - markerPos.x, p.z - markerPos.z) <= r;
  }

  function complete() {
    payJob(state.job);
    next();
  }

  function update(dt, input) {
    clock += dt;
    if (marker.visible) {
      const pulse = 0.5 + 0.5 * Math.sin(clock * 2.6);
      ringMesh.material.opacity = 0.55 + pulse * 0.35;
      column.material.opacity = 0.08 + pulse * 0.09;
    }
    if (police.stars > 0 && state.active && markerPos && !warned) {
      warned = true;
      toast('The police are on you. The handover can wait until they lose interest.');
    }
    if (police.stars === 0) warned = false;
    if (!state.active || !markerPos) return;
    const job = jobs[state.job];

    if (job.type === 'race') {
      state.timer -= dt;
      if (!vehicles.drivenCar && state.timer > MISSIONS.raceSeconds - 1) toast('Golden Mile needs a car. Take one with F.');
      if (vehicles.drivenCar && nearMarker(MISSIONS.reachRadius + 1)) {
        state.cp += 1;
        if (state.cp >= raceCps.length) { complete(); return; }
        const c = raceCps[state.cp];
        setMarker(c.x, c.y, c.z);
        toast(`Checkpoint ${state.cp} of 3.`);
      }
      if (state.timer <= 0) {
        state.timer = MISSIONS.raceSeconds;
        state.cp = 0;
        setMarker(raceCps[0].x, raceCps[0].y, raceCps[0].z);
        toast('Too slow. The checkpoints are reset — go again.');
      }
      return;
    }

    if (job.type === 'getaway') {
      state.timer -= dt;
      if (nearMarker()) { complete(); return; }
      if (state.timer <= 0) {
        state.timer = MISSIONS.getawaySeconds;
        police.addHeat(80);
        toast('They boxed you in. The clock resets — run it again.');
      }
      return;
    }

    if (job.type === 'rob') {
      if (nearMarker()) {
        if (input && input.isDown('KeyE')) {
          state.robHold += dt;
          if (state.robHold >= MISSIONS.robSeconds) {
            police.addHeat(POLICE_ROB_HEAT());
            toast('Till emptied. Run.');
            complete();
            return;
          }
        } else {
          state.robHold = Math.max(0, state.robHold - dt * 2);
        }
      } else {
        state.robHold = 0;
      }
      return;
    }

    if (job.type === 'drive') {
      if (vehicles.drivenCar && nearMarker()) { complete(); return; }
      return;
    }

    if (job.type === 'boat') {
      if (boats && boats.boarded && nearMarker(MISSIONS.reachRadius + 2)) { complete(); return; }
      return;
    }

    if (vehicles.drivenCar) return;
    if (nearMarker()) complete();
  }

  function jumpTo(i) {
    // Test helper: move straight to one job, unpaid, and start it.
    state.job = Math.max(0, Math.min(jobs.length - 1, i));
    state.active = false;
    state.done = false;
    state.robHold = 0;
    state.cp = 0;
    hideMarker();
    start();
  }

  function POLICE_ROB_HEAT() { return 80; }

  return {
    jobs, state, update, start, next, complete, addRep, showJob, jumpTo,
    get current() { return jobs[state.job]; },
    get markerPos() { return markerPos; },
  };
}
