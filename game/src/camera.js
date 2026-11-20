// Two booms on the one THREE camera: a short one over Rico's shoulder on foot and a long one behind
// the car. Both take the mouse, both are pulled in by a wall, because a boom that looks through a
// building is the reason a police car can be invisible in a screenshot. main.js picks one per frame.

import { Vector3 } from 'three';
import { CAMERA } from './config.js';
import { firstHit } from './geometry.js';

const _dir = new Vector3();

function clampPitch(value) {
  return Math.max(CAMERA.pitchMin, Math.min(CAMERA.pitchMax, value));
}

function wrap(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

// Pulls `point` back along the boom until it is clear of the city. The padded test leaves the camera a
// body's width off the face; the second, tighter test catches the case where a wall is nearer than
// that padding and the minimum gap has already pushed the camera past it.
function resolveBoom(anchor, point, colliders) {
  if (!colliders || colliders.length === 0) return;
  _dir.subVectors(point, anchor);
  const span = _dir.length();
  if (span < 1e-4) return;
  _dir.divideScalar(span);
  const hit = firstHit(anchor, point, colliders, CAMERA.collisionPadding);
  let boom = hit >= 1 ? span : span * hit - 0.05;
  // The minimum gap is a floor only while it still sits outside the wall, which is what stops the
  // near plane parking inside Rico's head without letting the camera push through a shop front.
  if (hit < 1) boom = Math.max(boom, Math.min(CAMERA.minDistance, span));
  boom = Math.max(0, Math.min(span, boom));
  point.copy(anchor).addScaledVector(_dir, boom);
  // The near plane is 0.1, so a tighter test shortens the boom again when a face is closer than the
  // padded one allowed. It may only shorten: a hit further along is a wall the boom never reached.
  const hard = firstHit(anchor, point, colliders, CAMERA.near + 0.05);
  if (hard < 1) {
    const shorter = Math.max(0, boom * hard - 0.04);
    if (shorter < boom) point.copy(anchor).addScaledVector(_dir, shorter);
  }
}

export function createFollowCamera({ camera, player }) {
  const anchor = new Vector3();
  const wanted = new Vector3();
  const look = new Vector3();

  const follow = {
    yaw: player ? player.yaw : 0,
    pitch: CAMERA.pitch,
    update(dt, input, body) {
      follow.yaw += input.yawDelta;
      follow.pitch = clampPitch(follow.pitch - input.mouse.dy * CAMERA.sensitivity);
      aim(body, 1 - Math.exp(-CAMERA.followLag * dt));
    },
    snap(body) {
      follow.yaw = body.yaw;
      aim(body, 1);
    },
    setYaw(v) {
      follow.yaw = v;
    },
  };

  // The boom hangs from a point CAMERA.height above the feet and swings on the pitch, so the rest pose
  // is CAMERA.distance behind and a little above the shoulders he is looking over.
  function aim(body, ease) {
    anchor.set(body.position.x, body.position.y + CAMERA.height, body.position.z);
    const cos = Math.cos(follow.pitch);
    wanted.set(
      anchor.x + Math.sin(follow.yaw) * CAMERA.distance * cos,
      anchor.y - Math.sin(follow.pitch) * CAMERA.distance,
      anchor.z + Math.cos(follow.yaw) * CAMERA.distance * cos,
    );
    // Rico carries the city's boxes because the boom has to answer for them: a camera left inside the
    // wall behind him is the one thing that makes the character disappear.
    resolveBoom(anchor, wanted, body.colliders);
    camera.position.lerp(wanted, ease);
    // The eased point can cut a corner the ray did not, so the same test decides the final spot.
    resolveBoom(anchor, camera.position, body.colliders);
    look.set(body.position.x, body.position.y + 1.45, body.position.z);
    camera.lookAt(look);
  }

  if (player) aim(player, 1);
  return follow;
}

export function createChaseCamera({ camera, city }) {
  const target = new Vector3();
  const anchor = new Vector3();
  const wanted = new Vector3();
  const look = new Vector3();
  let yaw = 0;
  let pitch = CAMERA.pitch;

  function aim() {
    anchor.set(target.x, target.y + CAMERA.chaseHeight, target.z);
    const cos = Math.cos(pitch);
    wanted.set(
      anchor.x + Math.sin(yaw) * CAMERA.chaseDistance * cos,
      anchor.y - Math.sin(pitch) * CAMERA.chaseDistance,
      anchor.z + Math.cos(yaw) * CAMERA.chaseDistance * cos,
    );
    resolveBoom(anchor, wanted, city.colliders);
    camera.position.copy(wanted);
    look.set(target.x, target.y + 1, target.z);
    camera.lookAt(look);
  }

  return {
    update(dt, input, car) {
      yaw += input.yawDelta;
      pitch = clampPitch(pitch - input.mouse.dy * CAMERA.sensitivity);
      if (car) {
        target.copy(car.position);
        // The heading is chased rather than copied: the gap between where the camera points and where
        // the car points is the whole feeling of a turn, and it closes at chaseLag.
        yaw += wrap(car.heading - yaw) * (1 - Math.exp(-CAMERA.chaseLag * dt));
      }
      aim();
    },
    reset(car) {
      if (car) {
        target.copy(car.position);
        yaw = car.heading;
      }
      pitch = CAMERA.pitch;
      aim();
    },
  };
}
