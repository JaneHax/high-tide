// garage.js — the lot that stores cars, and three street-race posts.
import * as THREE from 'three';
import { CFG } from './config.js';
import { dist2 } from './util.js';
import { exitCar } from './vehicles.js';

export function createGarage(scene, S) {
  const posts = CFG.garage.posts.map(([x, z]) => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 5, 10),
      new THREE.MeshLambertMaterial({ color: 0xff7a3c, transparent: true, opacity: 0.5, emissive: 0x883300 }),
    );
    m.position.set(x, 2.5, z); scene.add(m);
    return { mesh: m, x, z };
  });
  const cps = [];
  return { scene, posts, cps, race: null, stored: S.garage.stored || null };
}

export function storeCar(S, sys) {
  if (!S.inCar) return false;
  const lot = sys.city.garageLot;
  if (dist2(S.inCar.pos.x, S.inCar.pos.z, lot[0], lot[1]) > 100) return false;
  const car = S.inCar;
  car.driver = null; car.parked = true;
  car.pos.set(lot[0], 0, lot[1]); car.mesh.position.copy(car.pos);
  S.garage.stored = { color: car.color };
  sys.garage.stored = S.garage.stored;
  exitCar(S, sys);
  sys.hud.toast('Car stored in the garage');
  sys.save.saveGame(S);
  return true;
}

export function retrieveCar(S, sys) {
  if (S.inCar || !S.garage.stored) return false;
  const lot = sys.city.garageLot;
  const car = sys.vehicles.cars.find((c) => c.parked && c.color === S.garage.stored.color)
    || sys.vehicles.cars.find((c) => c.parked);
  if (!car) return false;
  car.pos.set(lot[0] + 6, 0, lot[1]); car.mesh.position.copy(car.pos);
  car.parked = false;
  sys.hud.toast('Your car is out front — press F to drive');
  return true;
}

function startStreetRace(S, sys) {
  if (sys.garage.race) return;
  const pts = [[-80, -40], [60, 80], [120, -80]];
  sys.garage.race = { i: 0, t: CFG.garage.raceTime, pts };
  for (const [x, z] of pts) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 8, 12),
      new THREE.MeshLambertMaterial({ color: 0xff7a3c, transparent: true, opacity: 0.4, emissive: 0x883300 }),
    );
    m.position.set(x, 4, z); sys.garage.scene.add(m);
    sys.garage.cps.push(m);
  }
  sys.hud.toast('Street race! Three checkpoints, 60 seconds — $800 on the line');
}

export function updateGarage(dt, S, sys) {
  const G = sys.garage;
  const P = S.player.pos;
  // Near a race post on foot: E starts the race.
  if (!S.inCar && !G.race) {
    for (const p of G.posts) {
      if (dist2(P.x, P.z, p.x, p.z) < 16 && sys.input.pressed('KeyE')) startStreetRace(S, sys);
    }
  }
  const r = G.race;
  if (r) {
    r.t -= dt;
    const [cx, cz] = r.pts[r.i];
    if (dist2(P.x, P.z, cx, cz) < 49) {
      r.i++;
      sys.hud.toast('Checkpoint ' + r.i + ' of 3!');
      if (r.i >= 3) {
        const t = CFG.garage.raceTime - r.t;
        S.cash += CFG.garage.racePay;
        const best = S.garage.bestRace;
        S.garage.bestRace = best === null || t < best ? t : best;
        sys.hud.toast('Race won — +$800! Time ' + t.toFixed(1) + 's (best ' + S.garage.bestRace.toFixed(1) + 's)');
        sys.save.saveGame(S);
        endRace(sys);
        return;
      }
    }
    if (r.t <= 0) { sys.hud.toast('Street race failed — out of time'); endRace(sys); }
  }
}
function endRace(sys) {
  for (const c of sys.garage.cps) sys.garage.scene.remove(c);
  sys.garage.cps.length = 0;
  sys.garage.race = null;
}
