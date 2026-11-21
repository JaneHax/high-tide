// The law. Wanted stars from zero to five, heat that rises with crime
// and falls when Rico breaks away, foot officers who chase and shoot,
// cruisers that drive in and ram, and roadblocks across the road ahead
// once the heat is serious.
import * as THREE from 'three';
import { POLICE, PALETTE } from './config.js';
import { box, ball, tube, place, groupAt } from './geometry.js';
import { makeRng, range, pick } from './random.js';

function buildOfficer() {
  const g = groupAt(0, 0, 0);
  const torso = box(0.9, 1.0, 0.5, PALETTE.policeBlue);
  place(torso, 0, 1.15, 0);
  g.add(torso);
  const head = ball(0.32, 0xd9a986);
  place(head, 0, 1.95, 0);
  g.add(head);
  const hat = box(0.62, 0.14, 0.62, 0x1c2733);
  place(hat, 0, 2.2, 0);
  g.add(hat);
  const legL = box(0.32, 0.8, 0.36, 0x1c2733);
  place(legL, -0.24, 0.4, 0);
  g.add(legL);
  const legR = box(0.32, 0.8, 0.36, 0x1c2733);
  place(legR, 0.24, 0.4, 0);
  g.add(legR);
  return g;
}

function buildCruiser() {
  const g = groupAt(0, 0, 0);
  const body = box(2.0, 0.75, 4.4, PALETTE.policeWhite);
  place(body, 0, 0.65, 0);
  g.add(body);
  const cabin = box(1.7, 0.6, 2.0, 0x1c2733);
  place(cabin, 0, 1.28, -0.2);
  g.add(cabin);
  const bar = box(1.2, 0.22, 0.5, PALETTE.policeBlue, { emissive: 0x2244aa });
  place(bar, 0, 1.7, -0.2);
  g.add(bar);
  for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const wheel = tube(0.42, 0.42, 0.3, 0x111111, {}, 10);
    wheel.rotation.z = Math.PI / 2;
    place(wheel, wx, 0.42, wz);
    g.add(wheel);
  }
  return g;
}

export function createPolice(scene, city, player) {
  const rng = makeRng(99);
  const officers = [];
  const cruisers = [];
  let stars = 0;
  let heat = 0;
  let block = null;         // active roadblock group, if any
  let blockTimer = 0;
  let escapeClock = 0;      // time since last seen, for the spotter rule
  let shootClock = 0;
  let onShoot = null;

  for (let i = 0; i < 6; i++) {
    const mesh = buildOfficer();
    scene.add(mesh);
    officers.push({ mesh, active: false, phase: rng() * 6, x: 0, z: 0 });
  }
  for (let i = 0; i < 3; i++) {
    const mesh = buildCruiser();
    scene.add(mesh);
    cruisers.push({ mesh, active: false, heading: 0, speed: 0, x: 0, z: 0 });
  }

  function setStars(n) {
    stars = Math.max(0, Math.min(POLICE.maxStars, n));
    heat = stars * 20;
  }

  function addHeat(n) {
    heat = Math.min(100, heat + n);
    stars = Math.max(stars, Math.min(POLICE.maxStars, Math.ceil(heat / 20)));
  }

  function nearestOfficerDist() {
    const p = player.state.position;
    let best = Infinity;
    for (const o of officers) {
      if (!o.active) continue;
      best = Math.min(best, Math.hypot(o.x - p.x, o.z - p.z));
    }
    return best;
  }

  function spawnOfficerNear() {
    const p = player.state.position;
    const o = officers.find((x) => !x.active) || officers[0];
    const a = rng() * Math.PI * 2;
    o.x = p.x + Math.cos(a) * 30;
    o.z = p.z + Math.sin(a) * 30;
    o.x = Math.max(-195, Math.min(195, o.x));
    o.z = Math.max(-195, Math.min(115, o.z));
    o.active = true;
    o.mesh.visible = true;
  }

  function spawnCruiserNear() {
    const p = player.state.position;
    const c = cruisers.find((x) => !x.active) || cruisers[0];
    const a = rng() * Math.PI * 2;
    c.x = p.x + Math.cos(a) * 55;
    c.z = p.z + Math.sin(a) * 55;
    c.x = Math.max(-195, Math.min(195, c.x));
    c.z = Math.max(-195, Math.min(115, c.z));
    c.active = true;
    c.mesh.visible = true;
  }

  function makeRoadblock() {
    if (block) return;
    const p = player.state.position;
    // Find the road Rico is closest to and block it ahead of him.
    const roads = city.roads;
    let bestRoad = null, bestD = Infinity, horizontal = true;
    for (const z of roads.xRoads) {
      const d = Math.abs(p.z - z);
      if (d < bestD) { bestD = d; bestRoad = z; horizontal = true; }
    }
    for (const x of roads.zRoads) {
      const d = Math.abs(p.x - x);
      if (d < bestD) { bestD = d; bestRoad = x; horizontal = false; }
    }
    const g = new THREE.Group();
    const dir = Math.atan2(p.x, p.z);
    const ahead = 42;
    const bx = p.x + Math.sin(dir) * ahead;
    const bz = p.z + Math.cos(dir) * ahead;
    const c1 = buildCruiser();
    const c2 = buildCruiser();
    if (horizontal) {
      place(c1, bx - 4, 0, bestRoad, Math.PI / 2);
      place(c2, bx + 4, 0, bestRoad, Math.PI / 2);
    } else {
      place(c1, bestRoad, 0, bz - 4, 0);
      place(c2, bestRoad, 0, bz + 4, 0);
    }
    g.add(c1, c2);
    const o1 = buildOfficer();
    const o2 = buildOfficer();
    place(o1, bx - 2, 0, bz + 4);
    place(o2, bx + 2, 0, bz + 4);
    g.add(o1, o2);
    scene.add(g);
    block = { group: g, x: bx, z: bz };
    blockTimer = 0;
  }

  function clearRoadblock() {
    if (!block) return;
    scene.remove(block.group);
    block = null;
  }

  function update(dt, spotterActive) {
    const p = player.state.position;
    const wantOfficers = stars >= 1 ? Math.min(2 + stars, 6) : 0;
    const wantCruisers = stars >= 2 ? Math.min(stars - 1, 3) : 0;
    let activeOfficers = officers.filter((o) => o.active).length;
    if (activeOfficers < wantOfficers) spawnOfficerNear();
    if (activeOfficers > wantOfficers) {
      const extra = officers.find((o) => o.active);
      if (extra) { extra.active = false; extra.mesh.visible = false; }
    }
    let activeCruisers = cruisers.filter((c) => c.active).length;
    if (activeCruisers < wantCruisers) spawnCruiserNear();
    if (activeCruisers > wantCruisers) {
      const extra = cruisers.find((c) => c.active);
      if (extra) { extra.active = false; extra.mesh.visible = false; }
    }

    // Foot officers chase and shoot.
    shootClock -= dt;
    for (const o of officers) {
      if (!o.active) continue;
      const dx = p.x - o.x, dz = p.z - o.z;
      const d = Math.hypot(dx, dz) || 1;
      if (d > 2) {
        o.x += (dx / d) * POLICE.officerSpeed * dt;
        o.z += (dz / d) * POLICE.officerSpeed * dt;
      }
      o.mesh.position.set(o.x, city.surfaceAt(o.x, o.z), o.z);
      o.mesh.rotation.y = Math.atan2(dx, dz);
      o.phase += dt * 8;
      const swing = Math.sin(o.phase) * 0.4;
      o.mesh.children[3].rotation.x = swing;
      o.mesh.children[4].rotation.x = -swing;
      if (d < POLICE.officerShootRange && shootClock <= 0 && player.state.alive) {
        shootClock = 0.9;
        player.damage(POLICE.officerDamage);
        if (onShoot) onShoot(o.x, o.z);
      }
    }

    // Cruisers drive at Rico and ram.
    for (const c of cruisers) {
      if (!c.active) continue;
      const dx = p.x - c.x, dz = p.z - c.z;
      const d = Math.hypot(dx, dz) || 1;
      const wantHeading = Math.atan2(dx, dz);
      let dh = wantHeading - c.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      c.heading += Math.max(-1.6 * dt, Math.min(1.6 * dt, dh));
      c.speed = Math.min(POLICE.cruiserSpeed, c.speed + 12 * dt);
      c.x += Math.sin(c.heading) * c.speed * dt;
      c.z += Math.cos(c.heading) * c.speed * dt;
      c.mesh.position.set(c.x, 0, c.z);
      c.mesh.rotation.y = c.heading;
      if (d < 3.2 && player.state.alive) {
        player.damage(POLICE.cruiserRam * dt * 2);
        c.speed *= 0.4;
      }
    }

    // Roadblocks at three stars or more.
    if (stars >= 3) {
      blockTimer += dt;
      if (!block && blockTimer > 4) makeRoadblock();
    } else if (block) {
      clearRoadblock();
      blockTimer = 0;
    }

    // Heat decays only when nobody is close; the spotter resets escape.
    const near = nearestOfficerDist();
    if (stars > 0) {
      if (near > POLICE.decayRange) {
        escapeClock += dt;
        if (spotterActive && stars >= POLICE.spotterStars) escapeClock = 0;
        if (escapeClock > 2) {
          heat -= POLICE.decayRate * dt;
          if (heat <= 0) {
            heat = 0;
            stars = 0;
            escapeClock = 0;
            clearRoadblock();
          } else {
            stars = Math.max(1, Math.ceil(heat / 20));
          }
        }
      } else {
        escapeClock = 0;
      }
    }
  }

  return {
    update, setStars, addHeat, makeRoadblock, clearRoadblock,
    officers, cruisers,
    get stars() { return stars; },
    get heat() { return heat; },
    get roadblock() { return block; },
    set onShoot(fn) { onShoot = fn; },
  };
}
