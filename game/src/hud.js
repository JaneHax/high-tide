// The heads-up display: cash, reputation and its level, wanted stars,
// health, the selected weapon and its ammunition, the job panel, toast
// messages, the live E prompt, the AIR ONE banner, and a minimap drawn
// on a small canvas: roads, sea, the player, cars, and the objective.
import { REP, WEAPONS } from './config.js';

export function createHud(document, city) {
  const el = (id) => document.getElementById(id);
  const cashEl = el('hud-cash');
  const repEl = el('hud-rep');
  const repBarEl = el('hud-repbar');
  const repTitleEl = el('hud-reptitle');
  const starsEl = el('hud-stars');
  const healthEl = el('hud-health');
  const healthBarEl = el('hud-healthbar');
  const weaponEl = el('hud-weapon');
  const ammoEl = el('hud-ammo');
  const jobTitleEl = el('hud-jobtitle');
  const jobTextEl = el('hud-jobtext');
  const jobPayEl = el('hud-jobpay');
  const promptEl = el('hud-prompt');
  const bannerEl = el('hud-airone');
  const toastEl = el('hud-toasts');
  const mapCanvas = el('hud-map');
  const mapCtx = mapCanvas.getContext('2d');
  const toasts = [];
  let toastTimer = 0;

  function toast(text) {
    toasts.push(text);
    if (toasts.length > 3) toasts.shift();
    toastTimer = 4;
    renderToasts();
  }

  function renderToasts() {
    toastEl.innerHTML = '';
    for (const t of toasts) {
      const div = document.createElement('div');
      div.className = 'toast';
      div.textContent = t;
      toastEl.appendChild(div);
    }
  }

  function drawMap(playerPos, objective, cars, boats) {
    const w = mapCanvas.width, h = mapCanvas.height;
    const scale = w / 440;
    const px = (x) => (x + 220) * scale;
    const pz = (z) => (z + 220) * scale;
    mapCtx.clearRect(0, 0, w, h);
    mapCtx.fillStyle = '#2e7f9e';
    mapCtx.fillRect(0, pz(120), w, h - pz(120));
    mapCtx.fillStyle = '#3f6b3a';
    mapCtx.fillRect(0, 0, w, pz(120));
    mapCtx.strokeStyle = '#3c3f46';
    mapCtx.lineWidth = 3;
    for (const z of city.roads.xRoads) {
      mapCtx.beginPath(); mapCtx.moveTo(0, pz(z)); mapCtx.lineTo(w, pz(z)); mapCtx.stroke();
    }
    for (const x of city.roads.zRoads) {
      mapCtx.beginPath(); mapCtx.moveTo(px(x), 0); mapCtx.lineTo(px(x), h); mapCtx.stroke();
    }
    mapCtx.fillStyle = '#8a6a48';
    mapCtx.fillRect(px(-48), pz(112), 16 * scale, 84 * scale);
    if (objective) {
      mapCtx.fillStyle = '#ffc93c';
      mapCtx.beginPath();
      mapCtx.arc(px(objective.x), pz(objective.z), 5, 0, Math.PI * 2);
      mapCtx.fill();
      mapCtx.strokeStyle = '#fff';
      mapCtx.lineWidth = 1.5;
      mapCtx.stroke();
    }
    mapCtx.fillStyle = '#37e0a0';
    for (const c of cars) {
      mapCtx.fillRect(px(c.x) - 1.5, pz(c.z) - 1.5, 3, 3);
    }
    mapCtx.fillStyle = '#7fc9e0';
    for (const b of boats) {
      mapCtx.fillRect(px(b.x) - 1.5, pz(b.z) - 1.5, 3, 3);
    }
    mapCtx.fillStyle = '#ffffff';
    mapCtx.beginPath();
    mapCtx.arc(px(playerPos.x), pz(playerPos.z), 4, 0, Math.PI * 2);
    mapCtx.fill();
    mapCtx.strokeStyle = '#111';
    mapCtx.lineWidth = 1.5;
    mapCtx.stroke();
  }

  function update(dt, game) {
    const m = game.missions.state;
    cashEl.textContent = '$' + m.cash.toLocaleString('en-US');
    repEl.textContent = 'REP ' + m.rep;
    repTitleEl.textContent = REP.levels[m.level];
    const nextAt = REP.thresholds[m.level + 1];
    const prevAt = REP.thresholds[m.level];
    const frac = nextAt === undefined ? 1 : Math.min(1, (m.rep - prevAt) / (nextAt - prevAt));
    repBarEl.style.width = Math.round(frac * 100) + '%';
    const stars = game.police.stars;
    starsEl.textContent = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    starsEl.className = stars > 0 ? 'stars hot' : 'stars';
    const hp = Math.round(game.player.state.health);
    healthEl.textContent = hp;
    healthBarEl.style.width = hp + '%';
    healthBarEl.className = hp < 30 ? 'bar low' : 'bar';
    const weapon = game.combat.def;
    weaponEl.textContent = weapon.name;
    ammoEl.textContent = game.combat.ammo + ' ammo';
    const locked = game.combat.lockedList(m.level);
    weaponEl.title = locked.length ? 'Locked: ' + locked.join(', ') : 'All weapons unlocked';
    jobTitleEl.textContent = m.title || game.missions.current.title;
    jobTextEl.textContent = m.text || game.missions.current.text;
    jobPayEl.textContent = m.done ? 'All jobs done — Sombra is pleased.' : 'Pays $' + game.missions.current.pay;
    promptEl.textContent = game.prompt ? 'E — ' + game.prompt : '';
    promptEl.style.display = game.prompt ? 'block' : 'none';
    bannerEl.style.display = game.air.active ? 'block' : 'none';
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) { toasts.length = 0; renderToasts(); }
    }
    drawMap(game.player.state.position, game.missions.markerPos, game.vehicles.traffic, game.boats.boats);
  }

  return { update, toast };
}
