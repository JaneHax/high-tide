import { SAVE_KEY } from './config.js';
export function writeSave(state) { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, at: Date.now(), ...state })); return true; } catch (e) { return false; } }
export function readSave() { try {
const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null;
const d = JSON.parse(raw); if (!d || d.v !== 1 || typeof d.cash !== 'number' || !Array.isArray(d.pos)) return null; return d; } catch (e) { return null; } }
export function hasSave() { return readSave() !== null; }
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
