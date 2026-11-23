// guide.js — Harbor Guide: the in-game mission journal.
import { CFG } from './config.js';
import { el, show, fmt$ } from './util.js';
import { jobState } from './missions.js';

export function openGuide(S, sys) {
  const rows = CFG.jobs.map((j) => {
    const st = jobState(S, j);
    const tag = st === 'done' ? '✓ DONE' : st === 'active' ? '▶ ACTIVE' : st === 'available' ? '○ OPEN' : '🔒 LOCKED';
    return `<div class="guide-row ${st}"><b>${j.title}</b> <span>${tag}</span><br>` +
      `<i>${j.story}</i><br>Pay ${fmt$(j.pay)} · +${j.rep} rep · ${j.kind}</div>`;
  }).join('');
  el('guideBody').innerHTML = rows;
  show(el('guidePanel'), true);
  S.guideOpen = true;
}
export function closeGuide(S) {
  show(el('guidePanel'), false);
  S.guideOpen = false;
}
export function toggleGuide(S, sys) {
  if (S.guideOpen) closeGuide(S); else { show(el('atlasPanel'), false); S.atlasOpen = false; openGuide(S, sys); }
}
