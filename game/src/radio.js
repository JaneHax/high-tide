// radio.js — district radio stations and per-district job standing.
import { CFG } from './config.js';

export function districtAt(x, z) {
  for (const d of CFG.districts) {
    if (x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1) return d;
  }
  return CFG.districts[0];
}

export function updateRadio(S, sys) {
  const d = districtAt(S.player.pos.x, S.player.pos.z);
  if (S.district !== d.name) {
    S.district = d.name;
    S.station = d.station;
    if (!S.districts.visited.has(d.name)) {
      S.districts.visited.add(d.name);
      sys.atlas.recordVisit(S, d.name);
      sys.hud.toast(d.name + ' — now playing: ' + d.station);
    }
  }
  S.repLevel = CFG.repLevels.reduce((n, l, i) => (S.rep >= l.at ? i : n), 0);
}
