// Boats at the marina. Board one with F, drive it on the water with W
// to go forward and A and D to steer, and leave it with F. Boats stay
// on the water: they cannot climb onto land.
import * as THREE from 'three';
import { BOAT, WORLD } from './config.js';
import { box, tube, cone, place, groupAt } from './geometry.js';
import { makeRng, pick } from './random.js';

function buildBoat(color) {
  const g = groupAt(0, 0, 0);
  const hull = box(2.4, 0.9, 6.0, color);
  place(hull, 0, 0.45, 0);
  g.add(hull);
  const bow = cone(1.2, 1.8, color, {}, 4);
  bow.rotation.x = Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  place(bow, 0, 0.45, 3.8);
  g.add(bow);
  const deck = box(2.0, 0.25, 4.6, 0xd8c9a8);
  place(deck, 0, 0.95, -0.4);
  g.add(deck);
  const seat = box(1.8, 0.5, 0.8, 0x8a6f5c);
  place(seat, 0, 1.2, -1.6);
  g.add(seat);
  const mast = tube(0.09, 0.12, 3.4, 0x888888);
  place(mast, 0, 2.6, 0.6);
  g.add(mast);
  return g;
}

export function createBoats(scene, city, player) {
  const rng = makeRng(31337);
  const boats = [];
  const colors = [0xd8d8d8, 0x3c6ec9, 0xc93c3c];
  for (let i = 0; i < BOAT.count; i++) {
    const spot = city.boatSpots[i];
    const mesh = buildBoat(colors[i]);
    // Moored facing open water (south), so W drives straight out to sea.
    place(mesh, spot.x, -0.1, spot.z, 0);
    scene.add(mesh);
    boats.push({ mesh, x: spot.x, z: spot.z, heading: 0, speed: 0, moored: true });
  }
  let boarded = null;

  function nearestBoat(maxDist) {
    const p = player.state.position;
    let best = null, bestD = maxDist;
    for (const b of boats) {
      const d = Math.hypot(b.x - p.x, b.z - p.z);
      if (d < bestD) { bestD = d; best = b; }
    }
    return best;
  }

  function board() {
    const b = nearestBoat(4.5);
    if (!b) return false;
    boarded = b;
    b.moored = false;
    player.body.visible = false;
    return true;
  }

  function leave() {
    if (!boarded) return;
    const p = player.state.position;
    // Step off onto the pier deck, or the beach if that is closer.
    const pierX = WORLD.pierX;
    const onPier = Math.abs(boarded.x - pierX) < 12;
    p.set(
      onPier ? pierX : boarded.x,
      city.surfaceAt(onPier ? pierX : boarded.x, boarded.z),
      boarded.z,
    );
    player.body.visible = true;
    boarded.speed = 0;
    boarded = null;
  }

  function update(dt, input) {
    // Gentle bob for moored boats.
    for (const b of boats) {
      if (b.moored) {
        b.mesh.position.y = -0.1 + Math.sin(performance.now() * 0.001 + b.x) * 0.08;
      }
    }
    if (!boarded) return;
    const axis = input.axis();
    if (axis.y > 0) boarded.speed = Math.min(BOAT.speed, boarded.speed + 9 * dt);
    else boarded.speed = Math.max(0, boarded.speed - 6 * dt);
    boarded.heading += axis.x * BOAT.turn * dt * (boarded.speed > 0.5 ? -1 : 0);
    boarded.x += Math.sin(boarded.heading) * boarded.speed * dt;
    boarded.z += Math.cos(boarded.heading) * boarded.speed * dt;
    // Stay in the water: push back from the shore and the world edge.
    if (boarded.z < WORLD.seaZ + 4) { boarded.z = WORLD.seaZ + 4; boarded.speed *= 0.3; }
    if (boarded.z > 235) { boarded.z = 235; boarded.speed *= 0.3; }
    boarded.x = Math.max(-195, Math.min(195, boarded.x));
    boarded.mesh.position.set(boarded.x, -0.05, boarded.z);
    boarded.mesh.rotation.y = boarded.heading;
    const p = player.state.position;
    p.set(boarded.x, 0.4, boarded.z);
  }

  return {
    boats, board, leave, update, nearestBoat,
    get boarded() { return boarded; },
  };
}
