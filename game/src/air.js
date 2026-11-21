// Air One, the police helicopter. It appears at three stars or more,
// circles high above Rico with a spinning rotor, sweeps a searchlight
// cone across the ground, and at four stars or more it spots him and
// resets his escape progress.
import * as THREE from 'three';
import { PALETTE } from './config.js';
import { box, tube, cone, place, groupAt } from './geometry.js';

export function createAir(scene, player) {
  const heli = groupAt(0, 26, 0);
  const body = box(3.4, 1.5, 6.5, PALETTE.heliDark);
  place(body, 0, 0, 0);
  heli.add(body);
  const nose = box(2.6, 1.1, 1.6, 0x2f6df6);
  place(nose, 0, -0.1, 3.6);
  heli.add(nose);
  const tail = box(0.7, 0.7, 4.4, PALETTE.heliDark);
  place(tail, 0, 0.3, -5);
  heli.add(tail);
  const fin = box(0.25, 1.6, 1.2, PALETTE.policeBlue);
  place(fin, 0, 1.0, -6.8);
  heli.add(fin);
  const mast = tube(0.16, 0.16, 1.0, 0x111111);
  place(mast, 0, 1.2, 0);
  heli.add(mast);
  const rotor = box(11, 0.12, 0.7, 0x1a1a1a);
  place(rotor, 0, 1.75, 0);
  heli.add(rotor);
  const rotor2 = box(0.7, 0.12, 11, 0x1a1a1a);
  place(rotor2, 0, 1.75, 0);
  heli.add(rotor2);
  const skidL = tube(0.09, 0.09, 5.4, 0x333333);
  skidL.rotation.x = Math.PI / 2;
  place(skidL, -1.3, -1.0, 0);
  heli.add(skidL);
  const skidR = tube(0.09, 0.09, 5.4, 0x333333);
  skidR.rotation.x = Math.PI / 2;
  place(skidR, 1.3, -1.0, 0);
  heli.add(skidR);

  // Searchlight: a translucent cone in world space, apex at the heli and
  // base sweeping a circle on the ground, plus a real spotlight.
  const coneMesh = cone(5.5, 24, 0xfff2b0, { opacity: 0.16 }, 20);
  coneMesh.visible = false;
  scene.add(coneMesh);
  const lamp = new THREE.SpotLight(0xfff2b0, 900, 60, 0.32, 0.5, 1.2);
  lamp.position.set(0, -1, 0);
  heli.add(lamp);
  lamp.target.position.set(0, -26, 0);
  heli.add(lamp.target);
  heli.visible = false;
  scene.add(heli);

  let angle = 0;
  let active = false;
  let rotorSpin = 0;
  const UP = new THREE.Vector3(0, 1, 0);
  const apexDir = new THREE.Vector3();
  const mid = new THREE.Vector3();

  function update(dt, stars) {
    active = stars >= 3;
    heli.visible = active;
    coneMesh.visible = active;
    if (!active) return;
    const p = player.state.position;
    angle += dt * 0.45;
    const radius = 30;
    heli.position.set(
      p.x + Math.cos(angle) * radius,
      26 + Math.sin(angle * 0.7) * 2,
      p.z + Math.sin(angle) * radius,
    );
    heli.rotation.y = Math.atan2(p.x - heli.position.x, p.z - heli.position.z);
    rotorSpin += dt * 22;
    rotor.rotation.y = rotorSpin;
    rotor2.rotation.y = rotorSpin;
    // The light sweeps a slow circle on the ground around Rico: the cone
    // runs from the helicopter down to that moving point.
    const sweep = angle * 1.7;
    const lx = p.x + Math.cos(sweep) * 9;
    const lz = p.z + Math.sin(sweep) * 9;
    lamp.target.position.set(lx - heli.position.x, -26, lz - heli.position.z);
    const len = Math.hypot(lx - heli.position.x, heli.position.y, lz - heli.position.z);
    mid.set((heli.position.x + lx) / 2, heli.position.y / 2, (heli.position.z + lz) / 2);
    coneMesh.position.copy(mid);
    apexDir.set(heli.position.x - lx, heli.position.y, heli.position.z - lz).normalize();
    coneMesh.quaternion.setFromUnitVectors(UP, apexDir);
    coneMesh.scale.set(1, len / 24, 1);
    coneMesh.visible = true;
  }

  return {
    update, heli,
    get active() { return active; },
    get spotter() { return active; }, // caller checks stars >= 4 itself
  };
}
