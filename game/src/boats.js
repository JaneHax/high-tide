// boats.js — three boats at the piers, driving, and the marina boat race.
import * as THREE from 'three';
import { box, mat } from './geom.js';
import { clamp, dist2 } from './util.js';
import { CFG } from './config.js';

function makeBoatMesh(color) {
  const g = new THREE.Group();
  box(g, 2.2, 0.7, 6, color, 0, 0.5, 0);
  box(g, 1.8, 0.8, 2.2, 0xf2ead8, 0, 1.1, -0.6);
  box(g, 0.2, 1.4, 0.2, 0x333333, 0, 1.6, 0.6);
  box(g, 2.4, 0.15, 6.2, 0x5a4028, 0, 0.85, 0);
  return g;
}

export function createBoats(scene, S) {
  const spots = [[36, -170], [110, -158], [150, -176]];
  const boats = spots.map(([x, z], i) => {
    const mesh = makeBoatMesh([0xd95f4b, 0x4b8ad9, 0xe0b13c][i]);
    mesh.position.set(x, 0, z); mesh.rotation.y = Math.PI; scene.add(mesh);
    return { mesh, pos: mesh.position, yaw: Math.PI, speed: 0, driver: null };
  });
  const buoys = CFG.boatRace.buoys.map(([x, z]) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 8), mat(0xff5533, { e: 0x882200 }));
    m.position.set(x, 0.9, z); scene.add(m);
    return m;
  });
  return { boats, buoys, race: null };
}

export function tryBoardBoat(S, sys) {
  let best = null, bd = 25;
  for (const b of sys.boats.boats) {
    if (b.driver) continue;
    const d = dist2(S.player.pos.x, S.player.pos.z, b.pos.x, b.pos.z);
    if (d < bd) { bd = d; best = b; }
  }
  if (!best) return false;
  best.driver = 'player'; S.inBoat = best;
  sys.player.group.visible = false;
  sys.hud.toast('Aboard — W/A/D to sail, F to step off');
  return true;
}

export function leaveBoat(S, sys) {
  const b = S.inBoat; if (!b) return;
  b.driver = null; S.inBoat = null;
  const P = sys.player;
  P.pos.set(b.pos.x, 0, b.pos.z + 4);
  P.group.position.copy(P.pos); P.group.visible = true;
}

export function startBoatRace(S, sys) {
  if (sys.boats.race) return;
  sys.boats.race = { i: 0, t: CFG.boatRace.time };
  sys.hud.toast('Boat race! Four buoys, 90 seconds — go!');
}

export function updateBoats(dt, S, sys) {
  const inp = sys.input, P = sys.player;
  if (S.inBoat) {
    const b = S.inBoat;
    let th = 0;
    if (inp.down('KeyW') || inp.down('ArrowUp')) th = 1;
    if (inp.down('KeyS') || inp.down('ArrowDown')) th = -0.5;
    if (inp.down('KeyA') || inp.down('ArrowLeft')) b.yaw += 1.4 * dt;
    if (inp.down('KeyD') || inp.down('ArrowRight')) b.yaw -= 1.4 * dt;
    b.speed = clamp(b.speed + th * 12 * dt, -6, 18);
    if (th === 0) b.speed *= Math.pow(0.5, dt);
    b.pos.x += Math.sin(b.yaw) * b.speed * dt;
    b.pos.z += Math.cos(b.yaw) * b.speed * dt;
    b.pos.x = clamp(b.pos.x, -200, 200); b.pos.z = clamp(b.pos.z, -260, -140);
    b.mesh.position.copy(b.pos); b.mesh.rotation.y = b.yaw;
    b.mesh.position.y = Math.sin(S.time * 1.4 + b.pos.x * 0.1) * 0.12;
    P.pos.copy(b.pos);
    // Boat race checkpoints.
    const r = sys.boats.race;
    if (r) {
      r.t -= dt;
      const [bx, bz] = CFG.boatRace.buoys[r.i];
      if (dist2(b.pos.x, b.pos.z, bx, bz) < 100) {
        r.i++;
        sys.hud.toast('Buoy ' + r.i + ' of 4!');
        if (r.i >= 4) {
          S.cash += CFG.boatRace.pay; S.stats.boatRace = true;
          sys.hud.toast('Boat race won — +' + '$' + CFG.boatRace.pay);
          sys.boats.race = null;
          sys.save.saveGame(S);
        }
      }
      if (r.t <= 0) { sys.hud.toast('Boat race failed — out of time'); sys.boats.race = null; }
    }
    return;
  }
  // Bob idle boats. (F is handled centrally in main.js.)
  for (const b of sys.boats.boats) b.mesh.position.y = Math.sin(S.time * 1.2 + b.pos.x * 0.1) * 0.1;
}
