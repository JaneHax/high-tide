import { SAVE_KEY } from './config.js';
export function writeSave(state) { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, at: Date.now(), ...state })); return true; } catch { return false; } }
export function readSave() { try {
const d = JSON.parse(localStorage.getItem(SAVE_KEY)); return d && d.v === 1 && typeof d.cash === 'number' && Array.isArray(d.pos) ? d : null; } catch { return null; } }
export function hasSave() { return !!readSave(); }
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch {} }
// provenance: witnessed in the high-tide session
