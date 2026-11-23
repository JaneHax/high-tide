// atlas.js — Harbor Atlas: what the player has found and done in Puerto Sol.
import { CFG } from './config.js';
import { el, show } from './util.js';

export function recordVisit(S, name) {
  S.atlas.visits = S.atlas.visits || {};
  S.atlas.visits[name] = (S.atlas.visits[name] || 0) + 1;
}
export function recordJob(S, job) {
  S.atlas.jobs = S.atlas.jobs || {};
  S.atlas.jobs[job.id] = job.title;
}
export function recordPackage(S, name) {
  S.atlas.packages = S.atlas.packages || [];
  if (!S.atlas.packages.includes(name)) S.atlas.packages.push(name);
}

export function openAtlas(S, sys) {
  const done = Object.keys(S.atlas.jobs || {}).length;
  const dists = CFG.districts.map((d) => {
    const v = S.districts.visited.has(d.name);
    return `<div class="atlas-row">${v ? '✓' : '·'} ${d.name} <span>${S.districts.standing[d.name] || 0} standing</span></div>`;
  }).join('');
  const pkgs = (S.atlas.packages || []).map((p) => `<div class="atlas-row">✓ ${p}</div>`).join('') || '<div class="atlas-row">No packages found yet.</div>';
  const jobs = Object.values(S.atlas.jobs || {}).map((t) => `<div class="atlas-row">✓ ${t}</div>`).join('') || '<div class="atlas-row">No jobs done yet.</div>';
  el('atlasBody').innerHTML =
    `<h3>Districts visited ${S.districts.visited.size}/${CFG.districts.length}</h3>${dists}` +
    `<h3>Jobs done ${done}/10</h3>${jobs}` +
    `<h3>Packages ${S.packages.filter(Boolean).length}/5</h3>${pkgs}` +
    `<h3>Bridge crossings</h3><div class="atlas-row">${S.atlas.crossings || 0} times over the harbor bridge</div>`;
  show(el('atlasPanel'), true);
  S.atlasOpen = true;
}
export function closeAtlas(S) {
  show(el('atlasPanel'), false);
  S.atlasOpen = false;
}
export function toggleAtlas(S, sys) {
  if (S.atlasOpen) closeAtlas(S); else { show(el('guidePanel'), false); S.guideOpen = false; openAtlas(S, sys); }
}
