// The shared mesh helpers. A pedestrian, a car or a lamp post is built from a handful of boxes that are
// welded into one geometry with one colour per vertex, so the whole city draws in a few dozen calls
// instead of a few thousand; and one ray test serves the camera, the bullets and the car collisions.

import { BoxGeometry, BufferAttribute, BufferGeometry, Color } from 'three';

const WHITE = new Color(1, 1, 1);

// Bakes one colour into a geometry's vertex colours, which is what lets welded parts keep their own tint.
export function paint(geometry, colour) {
  const tint = new Color(colour);
  const count = geometry.getAttribute('position').count;
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    data[i * 3] = tint.r;
    data[i * 3 + 1] = tint.g;
    data[i * 3 + 2] = tint.b;
  }
  geometry.setAttribute('color', new BufferAttribute(data, 3));
  return geometry;
}

// A box of the given size, tinted, already placed at (x, y, z): one part of a welded mesh.
export function tintedBox(w, h, d, colour, x, y, z) {
  const geometry = new BoxGeometry(w, h, d);
  paint(geometry, colour);
  geometry.translate(x, y, z);
  return geometry;
}

// Welds position, normal and colour of several geometries into one, and disposes the inputs: the caller
// keeps only the result. Indexed inputs are flattened first, so parts of any origin mix.
export function merge(list) {
  const parts = list.map((geometry) => (geometry.index === null ? geometry : geometry.toNonIndexed()));
  let count = 0;
  for (const part of parts) count += part.getAttribute('position').count;
  const position = new Float32Array(count * 3);
  const normal = new Float32Array(count * 3);
  const colour = new Float32Array(count * 3);
  let at = 0;
  for (const part of parts) {
    if (part.getAttribute('normal') === undefined) part.computeVertexNormals();
    if (part.getAttribute('color') === undefined) paint(part, WHITE);
    position.set(part.getAttribute('position').array, at * 3);
    normal.set(part.getAttribute('normal').array, at * 3);
    colour.set(part.getAttribute('color').array, at * 3);
    at += part.getAttribute('position').count;
  }
  const merged = new BufferGeometry();
  merged.setAttribute('position', new BufferAttribute(position, 3));
  merged.setAttribute('normal', new BufferAttribute(normal, 3));
  merged.setAttribute('color', new BufferAttribute(colour, 3));
  merged.computeBoundingSphere();
  for (const part of parts) if (!list.includes(part)) part.dispose();
  for (const geometry of list) geometry.dispose();
  return merged;
}

// The fraction along the segment from -> to of the first collider box it meets, or 1 for a clear line.
// A collider is a footprint with a height; the ray passes over one whose height is below the ray at the
// crossing point, which is how a camera clears a wall and a bullet over a low fence still lands.
export function firstHit(from, to, colliders, padding = 0) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  let best = 1;
  for (const collider of colliders) {
    const minX = collider.minX - padding;
    const maxX = collider.maxX + padding;
    const minZ = collider.minZ - padding;
    const maxZ = collider.maxZ + padding;
    let enter = 0;
    let exit = 1;
    if (Math.abs(dx) < 1e-9) {
      if (from.x < minX || from.x > maxX) continue;
    } else {
      let t1 = (minX - from.x) / dx;
      let t2 = (maxX - from.x) / dx;
      if (t1 > t2) [t1, t2] = [t2, t1];
      enter = Math.max(enter, t1);
      exit = Math.min(exit, t2);
    }
    if (Math.abs(dz) < 1e-9) {
      if (from.z < minZ || from.z > maxZ) continue;
    } else {
      let t1 = (minZ - from.z) / dz;
      let t2 = (maxZ - from.z) / dz;
      if (t1 > t2) [t1, t2] = [t2, t1];
      enter = Math.max(enter, t1);
      exit = Math.min(exit, t2);
    }
    if (enter > exit || enter > best) continue;
    const height = from.y + (to.y - from.y) * enter;
    if (collider.height <= height) continue;
    best = enter;
  }
  return best;
}
