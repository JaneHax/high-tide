// geom.js — cached materials and box/cylinder mesh helpers (three.js).
import * as THREE from 'three';
const cache = new Map();
export function mat(color, opts = {}) {
  const key = color + '|' + (opts.e || 0) + '|' + (opts.o || 1);
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, emissive: opts.e || 0x000000, transparent: (opts.o || 1) < 1, opacity: opts.o || 1 });
    cache.set(key, m);
  }
  return m;
}
export function box(g, w, h, d, c, x, y, z, ry = 0, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, opts));
  m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m;
}
export function cyl(g, rt, rb, h, c, x, y, z, seg = 10, opts) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c, opts));
  m.position.set(x, y, z); g.add(m); return m;
}
export function flat(g, w, d, c, x, z, y = 0.02) {
  return box(g, w, 0.04, d, c, x, y, z);
}
export function cone(g, r, h, c, x, y, z, opts) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 12), mat(c, opts));
  m.position.set(x, y, z); g.add(m); return m;
}
