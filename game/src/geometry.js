// The shared mesh helpers: welded boxes with per-vertex colour, and the one ray test the camera, the
// bullets and the car collisions all use.
import { BoxGeometry, BufferAttribute, BufferGeometry, Color } from 'three';

const WHITE = new Color(1, 1, 1);

export function paint(geometry, colour) {
  const tint = new Color(colour), count = geometry.getAttribute('position').count;
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    data[i] = tint.r;
    data[i + 1] = tint.g;
    data[i + 2] = tint.b;
  }
  geometry.setAttribute('color', new BufferAttribute(data, 3));
  return geometry;
}

export function tintedBox(w, h, d, colour, x, y, z) {
  const geometry = new BoxGeometry(w, h, d);
  paint(geometry, colour);
  geometry.translate(x, y, z);
  return geometry;
}

export function merge(list) {
  const parts = list.map((geometry) => (geometry.index === null ? geometry : geometry.toNonIndexed()));
  let count = 0;
  for (const part of parts) count += part.getAttribute('position').count;
  const position = new Float32Array(count * 3), normal = new Float32Array(count * 3);
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

// Slides a circle out of any collider it already overlaps, the shortest way, and returns the spot.
export function unstick(x, z, radius, top, colliders) {
  for (const collider of colliders) {
    if (collider.height <= top) continue;
    const minX = collider.minX - radius, maxX = collider.maxX + radius, minZ = collider.minZ - radius;
    const maxZ = collider.maxZ + radius;
    if (x <= minX || x >= maxX || z <= minZ || z >= maxZ) continue;
    const west = x - minX, east = maxX - x, south = z - minZ, north = maxZ - z;
    const least = Math.min(west, east, south, north);
    if (least === west) x = minX;
    else if (least === east) x = maxX;
    else if (least === south) z = minZ;
    else z = maxZ;
  }
  return { x, z };
}

export function firstHit(from, to, colliders, padding = 0) {
  const dx = to.x - from.x, dz = to.z - from.z;
  let best = 1;
  for (const collider of colliders) {
    const minX = collider.minX - padding, maxX = collider.maxX + padding, minZ = collider.minZ - padding;
    const maxZ = collider.maxZ + padding;
    let enter = 0, exit = 1;
    if (Math.abs(dx) < 1e-9) {
      if (from.x < minX || from.x > maxX) continue;
    } else {
      let t1 = (minX - from.x) / dx, t2 = (maxX - from.x) / dx;
      if (t1 > t2) [t1, t2] = [t2, t1];
      enter = Math.max(enter, t1);
      exit = Math.min(exit, t2);
    }
    if (Math.abs(dz) < 1e-9) {
      if (from.z < minZ || from.z > maxZ) continue;
    } else {
      let t1 = (minZ - from.z) / dz, t2 = (maxZ - from.z) / dz;
      if (t1 > t2) [t1, t2] = [t2, t1];
      enter = Math.max(enter, t1);
      exit = Math.min(exit, t2);
    }
    if (enter > exit || enter > best) continue;
    if (collider.height <= from.y + (to.y - from.y) * enter) continue;
    best = enter;
  }
  return best;
}
