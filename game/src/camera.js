// Third-person follow camera. It trails behind the player (or the car, or
// the boat) at a fixed distance, eases toward its target, and lets the
// mouse orbit around it. Pitch is clamped so the camera never goes under
// the ground or straight overhead.
import * as THREE from 'three';

export function createCamera(camera) {
  let yaw = Math.PI;      // looking south to start, city and sea ahead
  let pitch = 0.32;
  let distance = 11;
  const target = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const look = new THREE.Vector3();

  function update(dt, input, follow, height = 2.2) {
    const md = input.mouseDelta();
    yaw -= md.x * 0.0032;
    pitch += md.y * 0.0026;
    pitch = Math.max(0.08, Math.min(1.1, pitch));
    target.set(follow.x, follow.y + height, follow.z);
    desired.set(
      target.x + Math.sin(yaw) * Math.cos(pitch) * distance,
      target.y + Math.sin(pitch) * distance,
      target.z + Math.cos(yaw) * Math.cos(pitch) * distance,
    );
    const k = 1 - Math.exp(-dt * 7);
    camera.position.lerp(desired, k);
    look.lerp(target, k);
    camera.lookAt(look);
  }

  function snap(follow, height = 2.2) {
    target.set(follow.x, follow.y + height, follow.z);
    camera.position.set(
      target.x + Math.sin(yaw) * Math.cos(pitch) * distance,
      target.y + Math.sin(pitch) * distance,
      target.z + Math.cos(yaw) * Math.cos(pitch) * distance,
    );
    camera.lookAt(target);
    look.copy(target);
  }

  function setDistance(d) { distance = d; }

  return {
    update, snap, setDistance,
    get yaw() { return yaw; },
    set yaw(v) { yaw = v; },
  };
}
