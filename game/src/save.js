// save.js — localStorage save: cash, rep, jobs, packages, garage, best times, weapons.
const KEY = 'hightide-save-v1';

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object') return null;
    return d;
  } catch { return null; }
}

export function saveGame(S) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      cash: S.cash, rep: S.rep, health: S.health,
      jobsDone: S.jobsDone, packages: S.packages,
      garage: S.garage, weapons: S.weapons,
      districts: { visited: [...S.districts.visited], standing: S.districts.standing },
      stats: S.stats, pos: [S.player.pos.x, S.player.pos.z],
    }));
  } catch { /* storage full or unavailable */ }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function applySave(S, d) {
  if (!d) return;
  S.cash = d.cash ?? S.cash; S.rep = d.rep ?? S.rep; S.health = d.health ?? S.health;
  S.jobsDone = d.jobsDone || {}; S.packages = d.packages || [false, false, false, false, false];
  S.garage = Object.assign({ stored: null, bestRace: null }, d.garage);
  if (d.weapons) S.weapons = d.weapons;
  if (d.districts) {
    S.districts.visited = new Set(d.districts.visited || []);
    S.districts.standing = d.districts.standing || {};
  }
  S.stats = d.stats || {};
  if (d.pos) S.player.pos.set(d.pos[0], 0, d.pos[1]);
}
