// collect.js — five glowing packages hidden around Puerto Sol.
import * as THREE from 'three';
import { CFG } from './config.js';
import { dist2 } from './util.js';

export function createCollectibles(scene, S) {
  const pkgs = CFG.packages.map((p, i) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshLambertMaterial({ color: 0xffd23c, emissive: 0xaa7700 }),
    );
    m.position.set(p.at[0], p.at[2], p.at[1]);
    scene.add(m);
    return { mesh: m, name: p.name, taken: !!S.packages[i], i, baseY: p.at[2] };
  });
  return { pkgs };
}

export function updateCollectibles(dt, S, sys) {
  const P = S.player.pos;
  for (const p of sys.collect.pkgs) {
    if (p.taken || S.packages[p.i]) { p.taken = true; p.mesh.visible = false; continue; }
    p.mesh.rotation.y += dt * 1.5;
    p.mesh.position.y = p.baseY + Math.sin(S.time * 2 + p.i) * 0.15;
    const dx = P.x - p.mesh.position.x, dz = P.z - p.mesh.position.z;
    if (dx * dx + dz * dz < 6.25 && Math.abs(P.y - p.mesh.position.y) < 10) {
      p.taken = true; p.mesh.visible = false;
      S.packages[p.i] = true;
      S.cash += 150;
      sys.atlas.recordPackage(S, p.name);
      sys.hud.toast(p.name + ' found — +$150 (' + S.packages.filter(Boolean).length + '/5)');
      sys.save.saveGame(S);
    }
  }
}
