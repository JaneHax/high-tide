// hud.js — cash, rep, stars, health, weapons, job panel, minimap, toasts, banners.
import { CFG } from './config.js';
import { el, show, fmt$ } from './util.js';
import { jobState } from './missions.js';

let toastQueue = [], toastBusy = false;

export function toast(msg) {
  toastQueue.push(msg);
  if (!toastBusy) nextToast();
}
function nextToast() {
  const msg = toastQueue.shift();
  if (msg === undefined) { toastBusy = false; return; }
  toastBusy = true;
  const t = el('toast');
  t.textContent = msg; show(t, true);
  setTimeout(() => { show(t, false); nextToast(); }, 2600);
}

export function createHUD(S, sys) {
  el('guideBtn').onclick = () => sys.guide.toggleGuide(S, sys);
  el('atlasBtn').onclick = () => sys.atlas.toggleAtlas(S, sys);
  el('guideClose').onclick = () => sys.guide.closeGuide(S);
  el('atlasClose').onclick = () => sys.atlas.closeAtlas(S);
  renderJobPanel(S, sys);
}

export function renderJobPanel(S, sys) {
  const list = el('jobList');
  list.innerHTML = CFG.jobs.map((j) => {
    const st = jobState(S, j);
    const btn = st === 'available'
      ? `<button data-job="${j.id}">Start</button>`
      : st === 'active' ? '<b>ACTIVE</b>' : st === 'done' ? '✓' : '🔒';
    return `<div class="job-row ${st}"><b>${j.title}</b> ${fmt$(j.pay)} · +${j.rep} rep ${btn}</div>`;
  }).join('');
  list.querySelectorAll('button[data-job]').forEach((b) => {
    b.onclick = () => { if (sys.missions.startJob(S, sys, b.dataset.job)) renderJobPanel(S, sys); };
  });
}

export function setHold(frac) {
  const h = el('holdBar');
  h.style.display = frac > 0 ? 'block' : 'none';
  el('holdFill').style.width = Math.round(frac * 100) + '%';
}
export function setPrompt(text) {
  const p = el('prompt');
  p.textContent = text || '';
  show(p, !!text);
}

export function updateHUD(dt, S, sys) {
  el('cash').textContent = fmt$(S.cash);
  const lvl = CFG.repLevels[S.repLevel];
  const next = CFG.repLevels[S.repLevel + 1];
  el('repName').textContent = lvl.name + ' · rep ' + S.rep;
  el('repFill').style.width = (next ? (S.rep - lvl.at) / (next.at - lvl.at) * 100 : 100) + '%';
  el('stars').textContent = '★'.repeat(S.stars) + '☆'.repeat(5 - S.stars);
  el('healthFill').style.width = S.health + '%';
  const w = CFG.weapons[S.weapons.cur];
  el('weapon').textContent = w.name;
  el('ammo').textContent = (S.weapons.ammo[S.weapons.cur] || 0) + ' / ' + (S.weapons.owned[S.weapons.cur] ? w.mag : 0);
  // Job readout + timer.
  const J = S.job;
  if (J) {
    const job = CFG.jobs.find((j) => j.id === J.id);
    el('jobTitle').textContent = job.title;
    el('jobDesc').textContent = job.story;
    el('jobTimer').textContent = J.t > 0 ? Math.ceil(J.t) + 's' : '';
  } else {
    el('jobTitle').textContent = 'No active job';
    el('jobDesc').textContent = 'Pick a job from the panel — or open the Harbor Guide (G).';
    el('jobTimer').textContent = '';
  }
  // AIR ONE banner, port status, district.
  show(el('banner'), sys.heli.active);
  el('portStatus').textContent = 'Bridge: ' + S.bridge.toUpperCase() + (S.storm > 0.5 ? ' · STORM' : S.storm > 0.25 ? ' · rain' : ' · clear');
  const st = S.districts.standing[S.district] || 0;
  el('district').textContent = S.district + ' · ' + S.station + ' · standing ' + st;
  el('pkgCount').textContent = '📦 ' + S.packages.filter(Boolean).length + '/5';
  drawMinimap(S, sys);
}

function drawMinimap(S, sys) {
  const cv = el('minimap');
  if (!cv) return;
  const c = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const toX = (x) => (x + 200) / 400 * W, toY = (z) => (z + 240) / 440 * H;
  c.fillStyle = '#101018'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#1d4a5e'; c.fillRect(0, 0, W, toY(-150)); // sea
  c.fillStyle = '#d9c27a'; c.fillRect(0, toY(-150), W, toY(-138) - toY(-150)); // beach
  c.strokeStyle = '#3c3c40'; c.lineWidth = 2;
  for (let x = -160; x <= 160; x += 40) { c.beginPath(); c.moveTo(toX(x), toY(-120)); c.lineTo(toX(x), toY(160)); c.stroke(); }
  for (let z = -120; z <= 160; z += 40) { c.beginPath(); c.moveTo(toX(-160), toY(z)); c.lineTo(toX(160), toY(z)); c.stroke(); }
  c.fillStyle = '#8a7f8d';
  for (const b of sys.city.colliders) c.fillRect(toX(b.x0), toY(b.z0), toX(b.x1) - toX(b.x0), toY(b.z1) - toY(b.z0));
  // Mission marker.
  if (S.job) {
    c.fillStyle = '#ffd23c';
    c.beginPath(); c.arc(toX(S.job.tx), toY(S.job.tz), 5, 0, 7); c.fill();
  }
  // Police, boats, packages.
  c.fillStyle = '#ff4444';
  for (const o of sys.police.officers) { c.beginPath(); c.arc(toX(o.pos.x), toY(o.pos.z), 2.5, 0, 7); c.fill(); }
  for (const cr of sys.police.cruisers) { c.beginPath(); c.arc(toX(cr.pos.x), toY(cr.pos.z), 3, 0, 7); c.fill(); }
  c.fillStyle = '#4b8ad9';
  for (const b of sys.boats.boats) { c.beginPath(); c.arc(toX(b.pos.x), toY(b.pos.z), 3, 0, 7); c.fill(); }
  c.fillStyle = '#ffd23c';
  for (const p of sys.collect.pkgs) if (!p.taken) { c.beginPath(); c.arc(toX(p.mesh.position.x), toY(p.mesh.position.z), 2, 0, 7); c.fill(); }
  // Player arrow.
  const P = S.player.pos;
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(toX(P.x), toY(P.z), 4, 0, 7); c.fill();
  // North + viewport frame.
  c.strokeStyle = '#666'; c.strokeRect(0.5, 0.5, W - 1, H - 1);
}
