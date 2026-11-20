// The five jobs: one small crime in five steps, each a ring in the district its own line names, so a
// player who walks where the text points arrives where the game meant. A finished job pays once.
import { CylinderGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, RingGeometry } from 'three';
import { MISSIONS, PALETTE } from './config.js';

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
const REACH_LIFT = 2;
const HOLD = 'The police are on you. The handover can wait until they lose interest.';

export function createMissions({ city, scene, player, vehicles, police, hud }) {
  const used = new Set();

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
    const point = takePoint(beat.areas) || { x: player.position.x, z: player.position.z, area: 'street' };
    const objective = { x: point.x, y: city.surfaceAt(point.x, point.z), z: point.z, area: point.area };
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
  let clock = 0, warned = false;

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

  function withdraw(text) {
    if (hud && typeof hud.withdraw === 'function') hud.withdraw(text);
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
    start();
  }

  function completeObjective() {
    if (!state.active || !state.marker) return;
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

    // The hold is only true while a job waits and the police are up: once the stars are gone the
    // same line is withdrawn, from the toast and from #status alike, so nothing claims a chase that ended.
    if (police && police.stars > 0) {
      if (!warned && state.active && state.marker) {
        warned = true;
        toast(HOLD);
      }
    } else if (warned) {
      warned = false;
      withdraw(HOLD);
    }

    if (!state.active || !state.marker) return;

    if (vehicles && vehicles.drivenCar) return;

    const dx = player.position.x - state.marker.x, dz = player.position.z - state.marker.z;
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
