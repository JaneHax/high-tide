// heli.js — Air One police helicopter: rotor, searchlight cone, spotter at 4+ stars.
import * as THREE from 'three';
import { box, cyl, mat } from './geom.js';

export function createHeli(scene, S) {
  const g = new THREE.Group(); scene.add(g);
  box(g, 3.4, 1.2, 1.6, 0x1a2a4a, 0, 0, 0);
  box(g, 1.2, 1, 1.2, 0x2a3a5a, 0, 0.1, 1.2);
  const boom = cyl(g, 0.08, 0.08, 3.4, 0x222222, 0, 0.2, -2.4, 6);
  boom.rotation.x = Math.PI / 2; // tail boom
  box(g, 0.5, 0.5, 0.3, 0x2244ff, -1.2, 0, 0.6, 0, { e: 0x2244ff }); // searchlight housing
  const rotor = new THREE.Group(); rotor.position.y = 0.9; g.add(rotor);
  box(rotor, 7, 0.08, 0.4, 0x111111, 0, 0, 0);
  box(rotor, 0.4, 0.08, 7, 0x111111, 0, 0, 0);
  // Searchlight cone: geometry axis rotated to +Z (apex forward), so lookAt aims it.
  const coneGeo = new THREE.ConeGeometry(4.5, 26, 16, 1, true);
  coneGeo.rotateX(Math.PI / 2);
  const cone = new THREE.Mesh(coneGeo, new THREE.MeshLambertMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.28, side: THREE.DoubleSide }));
  scene.add(cone);
  const light = new THREE.SpotLight(0xfff2b0, 80, 70, 0.32, 0.5, 1.1);
  scene.add(light);
  const target = new THREE.Object3D(); scene.add(target);
  light.target = target;
  g.visible = false; cone.visible = false; light.visible = false;
  return { group: g, rotor, light, cone, target, angle: 0, active: false };
}

export function updateHeli(dt, S, sys) {
  const H = sys.heli;
  const on = S.stars >= 3 && S.started && !S.paused;
  H.group.visible = on; H.cone.visible = on; H.light.visible = on; H.active = on;
  if (!on) return;
  if (!S.debugFreeze) H.angle += dt * 0.55;
  const P = S.player.pos;
  const r = S.stars >= 4 ? 16 : 22; // spotter at 4 stars flies tighter
  const hx = P.x + Math.cos(H.angle) * r, hz = P.z + Math.sin(H.angle) * r;
  const hy = S.heliY || 34;
  H.group.position.set(hx, hy, hz);
  H.group.rotation.y = Math.atan2(P.x - hx, P.z - hz);
  H.rotor.rotation.y += dt * 22;
  // Cone: apex at the heli, wide end on the player.
  const mx = (hx + P.x) / 2, my = hy / 2, mz = (hz + P.z) / 2;
  H.cone.position.set(mx, my, mz);
  H.cone.lookAt(hx, hy, hz);
  const dist = Math.hypot(P.x - hx, hy, P.z - hz);
  H.cone.scale.set(1, 1, dist / 26);
  H.target.position.set(P.x, 0, P.z);
  H.light.position.set(hx, hy, hz);
  H.light.intensity = 80 + Math.sin(S.time * 6) * 15;
}
