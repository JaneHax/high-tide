// Small shared shape helpers, so every module builds meshes the same way.
// All materials are cheap Lambert ones: this game wants a warm flat look
// with long shadows, not a physically-based render.
import * as THREE from 'three';

const cache = new Map();

export function material(color, opts = {}) {
  const key = color + '|' + (opts.emissive || 0) + '|' + (opts.opacity ?? 1);
  if (!cache.has(key)) {
    cache.set(key, new THREE.MeshLambertMaterial({
      color,
      emissive: opts.emissive || 0x000000,
      transparent: opts.opacity !== undefined && opts.opacity < 1,
      opacity: opts.opacity ?? 1,
    }));
  }
  return cache.get(key);
}

export function box(w, h, d, color, opts) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color, opts));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function slab(w, h, d, color, opts) {
  // A flat box that never casts a shadow (ground, roads, water).
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color, opts));
  mesh.receiveShadow = true;
  return mesh;
}

export function tube(rTop, rBottom, h, color, opts, sides = 10) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, h, sides),
    material(color, opts),
  );
  mesh.castShadow = true;
  return mesh;
}

export function ball(r, color, opts, wSeg = 12, hSeg = 9) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, wSeg, hSeg), material(color, opts));
  mesh.castShadow = true;
  return mesh;
}

export function cone(r, h, color, opts, sides = 12) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, sides), material(color, opts));
  mesh.castShadow = true;
  return mesh;
}

export function ring(inner, outer, color, opts) {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 40),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: opts?.opacity ?? 0.85,
      side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

export function place(mesh, x, y, z, ry = 0) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  return mesh;
}

export function groupAt(x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  return g;
}
