// The five jobs of HIGH TIDE: one small crime told in five steps, each a ring on the ground in the
// district its own line names. The rule this file exists to keep is that the marker and the sentence
// agree — a job whose text says the pier takes its point from a pier — because a player who reads the
// line and walks where it points must arrive where the game meant, and a marker in the wrong quarter
// of town is a lie the player notices at once. The ring's height comes from city.surfaceAt, so it lies
// on the planks of a pier instead of floating over the water or sinking into it, and a finished job
// pays once and is never replayed.

import { CylinderGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, RingGeometry } from 'three';
import { MISSIONS, PALETTE } from './config.js';

// Each beat names a district in its own text and the district it must be placed in. The names are the
// city's own vocabulary of areas, not a second vocabulary invented here.
const STORY = [
  {
    title: 'The Marina Errand',
    text: "Sombra's duffel sits under a tarp at the marina, out along the pier where the boats are tied. Take it and don't look at the boats.",
    areas: ['pier'],
  },
  {
    title: 'Word on the Promenade',
    text: 'The fence drinks at the far end of the promenade, where the lamps stop. He wants the weight of the bag in his hand before he names a price.',
    areas: ['promenade'],
  },
  {
    title: 'Market Money',
    text: 'The buyer counts his cash in the open air of the market, in the square where the stalls stand. Stand where he can see you and hold the bag still.',
    areas: ['park', 'street'],
  },
  {
    title: 'Downtown Drop',
    text: 'The money goes downtown, to a man in a glass tower who never comes down to the street. He is not paying for the bag, he is paying for the silence.',
    areas: ['street'],
  },
  {
    title: 'The Breakwater',
    text: 'Sombra waits at the breakwater, at the end of the pier where the water turns deep. He wants the last word, and he has brought a boat.',
    areas: ['pier'],
  },
];

const RING_INNER = 0.74;
const RING_SEGMENTS = 44;
const COLUMN_SEGMENTS = 32;
const RING_LIFT = 0.04;
const PULSE_RATE = 2.6;
// A ring is a place you stand in, so the arrival test allows a couple of metres of height: a marker
// on a pier deck is above the beach under it, and a player walking the sand below has not arrived.
const REACH_LIFT = 2;

export function createMissions({ city, scene, player, vehicles, police, hud }) {
  const used = new Set();

  // A job point is taken only from a district its text names. The city lays out more than five job
  // points for exactly this reason; the last branch is a guard for a city that ever breaks that
  // promise, because a job with no marker at all is worse than one in the next block.
  function takePoint(areas) {
    for (const area of areas) {
      for (let i = 0; i < city.spawnPoints.length; i++) {
        const point = city.spawnPoints[i];
        if (used.has(i) || point.kind !== 'job' || point.area !== area) continue;
        used.add(i);
        return point;
      }
    }
    for (let i = 0; i < city.spawnPoints.length; i++) {
      const point = city.spawnPoints[i];
      if (used.has(i) || point.kind !== 'job') continue;
      used.add(i);
      return point;
    }
    return null;
  }

  const jobs = STORY.map((beat, id) => {
    const point = takePoint(beat.areas) || {
      x: player.position.x,
      z: player.position.z,
      area: 'street',
    };
    const objective = {
      x: point.x,
      y: city.surfaceAt(point.x, point.z),
      z: point.z,
      area: point.area,
    };
    return {
      id,
      title: beat.title,
      text: beat.text,
      area: objective.area,
      x: objective.x,
      z: objective.z,
      pay: MISSIONS.payouts[id],
      objective,
    };
  });

  const state = {
    cash: 0,
    job: 0,
    objective: 0,
    active: false,
    done: false,
    paid: false,
    title: '',
    text: '',
    marker: null,
  };

  const paidFlags = jobs.map(() => false);
  let clock = 0;
  let warned = false;

  const marker = new Group();
  const ringMaterial = new MeshBasicMaterial({
    color: PALETTE.wantedGold,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: DoubleSide,
  });
  const columnMaterial = new MeshBasicMaterial({
    color: PALETTE.accent,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    side: DoubleSide,
  });
  const ring = new Mesh(
    new RingGeometry(MISSIONS.markerRadius * RING_INNER, MISSIONS.markerRadius, RING_SEGMENTS),
    ringMaterial,
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = RING_LIFT;
  const column = new Mesh(
    new CylinderGeometry(
      MISSIONS.markerRadius * RING_INNER,
      MISSIONS.markerRadius,
      MISSIONS.markerHeight,
      COLUMN_SEGMENTS,
      1,
      true,
    ),
    columnMaterial,
  );
  column.position.y = MISSIONS.markerHeight / 2;
  marker.add(ring, column);
  marker.visible = false;
  scene.add(marker);

  function toast(text) {
    if (hud && typeof hud.toast === 'function') hud.toast(text);
  }

  function announce() {
    const job = jobs[state.job];
    if (!job) return;
    if (state.title === job.title && state.text === job.text) return;
    state.title = job.title;
    state.text = job.text;
    toast(job.title);
  }

  function markObjective() {
    const job = jobs[state.job];
    if (!job || !job.objective) {
      state.marker = null;
      marker.visible = false;
      return;
    }
    const step = job.objective;
    state.marker = { x: step.x, y: step.y, z: step.z };
    marker.position.set(step.x, step.y, step.z);
    marker.visible = true;
  }

  function payJob(index) {
    if (paidFlags[index]) return;
    paidFlags[index] = true;
    state.cash += jobs[index].pay;
  }

  function start() {
    if (state.active || state.done) return;
    // A job that has been paid is finished: walking back to its ring must not run it a second time.
    if (paidFlags[state.job]) return;
    state.active = true;
    state.objective = 0;
    state.paid = false;
    announce();
    markObjective();
  }

  function next() {
    if (state.active) payJob(state.job);
    state.marker = null;
    marker.visible = false;
    state.active = false;
    state.objective = 0;
    if (state.job >= jobs.length - 1) {
      state.done = true;
      state.paid = paidFlags[state.job];
      return;
    }
    state.job += 1;
    state.paid = paidFlags[state.job];
    // The next job begins where the last one ended. The story is one chain, and a player who has to
    // find a way to start the job he was just handed would be looking for a menu this game does not
    // have; start() still refuses a job that has already been paid.
    start();
  }

  function completeObjective() {
    if (!state.active || !state.marker) return;
    // A job is one step of the story with one marker on it, so arriving is the whole job.
    state.objective += 1;
    payJob(state.job);
    next();
  }

  function update(dt) {
    if (dt > 0) clock += dt;

    if (marker.visible) {
      const pulse = 0.5 + 0.5 * Math.sin(clock * PULSE_RATE);
      ringMaterial.opacity = 0.55 + pulse * 0.35;
      columnMaterial.opacity = 0.08 + pulse * 0.1;
      ring.scale.setScalar(1 + pulse * 0.05);
    }

    if (!state.active || !state.marker) return;

    if (police && police.stars > 0) {
      if (!warned) {
        warned = true;
        toast('The police are on you. The handover can wait until they lose interest.');
      }
    } else {
      warned = false;
    }

    // Standing in the ring means standing: a car rolling across it is not the player arriving, and
    // the driver would otherwise clear a pier objective he never walked onto.
    if (vehicles && vehicles.drivenCar) return;

    const dx = player.position.x - state.marker.x;
    const dz = player.position.z - state.marker.z;
    if (Math.hypot(dx, dz) > MISSIONS.reachRadius) return;
    if (Math.abs(player.position.y - state.marker.y) > REACH_LIFT) return;
    completeObjective();
  }

  return {
    jobs,
    state,
    update,
    start,
    next,
    completeObjective,
  };
}
