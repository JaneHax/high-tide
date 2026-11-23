// bridge.js — the harbor drawbridge: open/closed state, visible in the world and HUD.
import * as THREE from 'three';
import { box } from './geom.js';
import { CFG } from './config.js';

export function createBridge(scene, S) {
  const [bx, bz] = CFG.bridge.at;
  const g = new THREE.Group(); scene.add(g);
  // Fixed approach decks.
  box(g, 12, 0.6, 10, 0x6a6a6e, bx - 11, 0.3, bz);
  box(g, 12, 0.6, 10, 0x6a6a6e, bx + 11, 0.3, bz);
  // Raising leaf: geometry offset so it pivots at the west edge, flat when open.
  const leaf = box(g, 10, 0.5, 9, 0xd95f4b, bx - 5, 0.3, bz);
  leaf.geometry.translate(5, 0, 0);
  // Towers + warning lights.
  for (const s of [-1, 1]) {
    box(g, 1.2, 9, 1.2, 0x8a8a8a, bx + s * 6, 4.5, bz - 5);
    box(g, 1.2, 9, 1.2, 0x8a8a8a, bx + s * 6, 4.5, bz + 5);
  }
  const warn = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshLambertMaterial({ color: 0xff3333, emissive: 0xff2222 }));
  warn.position.set(bx, 9.4, bz - 5); g.add(warn);
  return { group: g, leaf, warn, t: 0, state: 'open' };
}

export function updateBridge(dt, S, sys) {
  const B = sys.bridge;
  B.t += dt;
  const span = B.state === 'open' ? CFG.bridge.openFor : CFG.bridge.closedFor;
  if (B.t >= span) {
    B.t = 0;
    B.state = B.state === 'open' ? 'closed' : 'open';
    S.bridge = B.state;
    sys.hud.toast('Harbor bridge is now ' + B.state.toUpperCase());
  }
  // Leaf raises when closed (blocking the road), flat when open.
  const target = B.state === 'closed' ? 1.0 : 0;
  B.leaf.rotation.z += (target - B.leaf.rotation.z) * Math.min(1, dt * 1.5);
  // Count a crossing when the player passes the bridge line on the road.
  const px = S.player.pos.x, pz = S.player.pos.z;
  if (Math.abs(pz - CFG.bridge.at[1]) < 6) {
    if (B.lastX !== undefined && Math.sign(px - CFG.bridge.at[0]) !== Math.sign(B.lastX - CFG.bridge.at[0])) {
      S.atlas.crossings = (S.atlas.crossings || 0) + 1;
    }
  }
  B.lastX = px;
  // Warning light blinks while closed.
  B.warn.material.emissiveIntensity = B.state === 'closed' ? (Math.sin(S.time * 6) > 0 ? 1.6 : 0.2) : 0.4;
}
