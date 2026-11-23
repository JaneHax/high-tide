import * as THREE from 'three';
import { MISSION_COLORS, LANDMARKS } from './config.js';
import { mesh, glowTexture, textTexture, clamp, formatTime, TAU } from './utils.js';
const START_POINTS = { garage: [LANDMARKS.garage.x, LANDMARKS.garage.z + 18],
marina: [-78, 38],
market: [LANDMARKS.market.x, LANDMARKS.market.z + 18],
garage2: [LANDMARKS.garage.x + 16, LANDMARKS.garage.z + 18],
garage3: [LANDMARKS.garage.x - 16, LANDMARKS.garage.z + 18],
marina2: [-64, 38],
market2: [LANDMARKS.market.x + 18, LANDMARKS.market.z + 18],
market3: [LANDMARKS.market.x - 18, LANDMARKS.market.z + 18],
market4: [LANDMARKS.market.x + 34, LANDMARKS.market.z + 18],
};
function makeBeacon(color, height = 15, radius = 2.2) {
const g = new THREE.Group();
const beamMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
const beam = mesh(new THREE.CylinderGeometry(radius * 0.5, radius, height, 16, 1, true), beamMat, 0, height / 2, 0); g.add(beam);
const coreMat = new THREE.MeshBasicMaterial({ color: 0xfff2d0, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending });
const core = mesh(new THREE.CylinderGeometry(0.18, 0.35, height, 8, 1, true), coreMat, 0, height / 2, 0); g.add(core);
const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
const ring = mesh(new THREE.RingGeometry(radius * 0.8, radius * 1.15, 28), ringMat, 0, 0.06, 0); ring.rotation.x = -Math.PI / 2; g.add(ring);
const dia = mesh(new THREE.OctahedronGeometry(0.8, 0), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }), 0, height * 0.62, 0); g.add(dia);
const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })); glow.position.y = height * 0.62; glow.scale.set(8, 8, 1); g.add(glow); g.userData = { ring, dia, glow, beam }; return g; }
export class Missions { constructor(game) { this.game = game; this.scene = game.scene; this.active = null; this.stepIndex = 0; this.dwell = 0; this.timer = 0; this.completed = new Set(); this.payouts = new Set(); this.targetMarker = null; this.startMarkers = new Map(); this.defs = this.buildDefs(); this.buildStartMarkers(); } buildDefs() {
const g = () => this.game; return { dead_drop: { title: 'DEAD DROP', giver: 'MARA', color: MISSION_COLORS.story, start: 'garage',
brief: 'Mara needs a courier run before the storm locks the port.',
steps: [
{ text: 'Take the Sol Courier from the Sombra lot', mode: 'car', carType: 'courier', check: () => g().car?.typeKey === 'courier' },
{ text: 'Load the crates at the fish market', target: () => [LANDMARKS.market.x, LANDMARKS.market.z + 20], radius: 8, mode: 'car', dwell: 1.4 },
{ text: 'Run the crates to the art-deco terminal', target: () => [LANDMARKS.terminal.x - 2, LANDMARKS.terminal.z + 24], radius: 9, mode: 'car', dwell: 1.4 },
],
reward: 320, rep: 45,
outro: 'Mara: "Clean. The terminal pays, and the storm pays better."',
},
crossing: { title: 'THE CROSSING', giver: 'SOMBRA CREW', color: MISSION_COLORS.boat, start: 'marina',
brief: 'Two crates in the channel. The bascule is your only way east.',
steps: [
{ text: 'Board the Sombra launch at the marina', mode: 'boat', check: () => g().mode === 'boat' },
{ text: 'Collect crate one at the west buoy', target: () => [-150, 0], radius: 5, mode: 'boat', dwell: 0.8, onEnter: () => g().notify('Dispatch: buoy marked west of the span.', 'info') },
{ text: 'Bridge raising — hold west of the span', target: () => [-26, 0], radius: 12, mode: 'boat', onEnter: () => { g().bridge.requestOpen(); g().notify('Dispatch: bascule opening. Wait for the all-clear.', 'warn'); }, check: () => g().bridge.raised },
{ text: 'Clear the span and take crate two east', target: () => [104, 0], radius: 6, mode: 'boat', dwell: 0.8, onEnter: () => { if (g().bridge.state === 'closed') g().bridge.requestOpen(); } },
{ text: 'Dock at the east pier', target: () => [250, 26], radius: 10, mode: 'boat', dwell: 1.2 },
],
reward: 760, rep: 130,
outro: 'Dispatch: "Cargo ashore. The channel is yours, Rico."',
},
storm_run: { title: 'STORM RUN', giver: 'MARA', color: MISSION_COLORS.heat, start: 'garage',
requires: 'dead_drop',
brief: 'A black box at the garage. Guardia already have the plate.',
steps: [
{ text: 'Take the Tempest GT from the Sombra garage', mode: 'car', carType: 'muscle', check: () => g().car?.typeKey === 'muscle' },
{ text: 'Lose the Guardia — bridge or coastal route',
mode: 'car',
onEnter: () => { g().police.setStars(3); g().police.evade = 0; g().bridge.forceOpen(); g().notify('Mara: "Bridge is up. Wait it out, or run the coast road."', 'warn'); },
check: () => g().police.stars === 0,
},
{ text: 'Deliver the black box to the north pier', target: () => [268, -36], radius: 10, mode: 'car', dwell: 1.5 },
],
reward: 1250, rep: 220,
outro: 'Mara: "Box is on the boat. You just bought yourself a way out."',
},
quay_race: { title: 'QUAY CIRCUIT', giver: 'ELIO', color: MISSION_COLORS.race, start: 'market',
brief: 'Four checkpoints around the south quay. One hundred seconds.',
steps: [
{ text: 'Get in a car for the quay circuit', mode: 'car', check: () => g().mode === 'car' },
{ text: 'Checkpoint 1 — market straight', target: () => [150, 44], radius: 10, mode: 'car', time: 100, onEnter: () => { this.timer = 100; g().notify('Elio: "Clock is running. Go."', 'info'); } },
{ text: 'Checkpoint 2 — palm boulevard', target: () => [214, 154], radius: 11, mode: 'car' },
{ text: 'Checkpoint 3 — storm wall', target: () => [150, 234], radius: 11, mode: 'car' },
{ text: 'Checkpoint 4 — marina bridge', target: () => [0, 154], radius: 11, mode: 'car' },
{ text: 'Checkpoint 5 — back to the market', target: () => [88, 76], radius: 11, mode: 'car' },
],
reward: 420, rep: 70,
outro: 'Elio: "Not bad for a courier. The quay remembers."',
},
repo_run: { title: 'REPO RUN', giver: 'MARA', color: MISSION_COLORS.job, start: 'garage2',
brief: 'A sedan the Guardia impounded is sitting loose in the terminal yard.',
steps: [
{ text: 'Drive the sedan onto the terminal weighbridge', target: () => [LANDMARKS.terminal.x + 10, LANDMARKS.terminal.z + 34], radius: 9, mode: 'car', dwell: 1.2, check: () => g().mode === 'car', need: 'You need to be inside a car — walk back to the lot and take one.' },
],
reward: 380, rep: 60,
outro: 'Mara: "Plates are swapped. The yard never saw a thing."',
},
last_light: { title: 'LAST LIGHT', giver: 'ELIO', color: MISSION_COLORS.race, start: 'market2',
brief: 'Elio has a buyer on the north quay and the light is already going.',
steps: [
{ text: 'Run the envelope to the north quay before the light dies', target: () => [-42, -152], radius: 9, mode: 'car', time: 48, onEnter: () => g().notify('Elio: "Forty-eight seconds. The buyer will not wait."', 'warn'), need: 'The clock is running — get in a car and drive.' },
],
reward: 460, rep: 80,
outro: 'Elio: "On time. The buyer likes that in a courier."',
},
clean_hands: { title: 'CLEAN HANDS', giver: 'MARA', color: MISSION_COLORS.story, start: 'garage3',
brief: 'The terminal gate will not open for a car the Guardia is hunting.',
steps: [
{ text: 'Reach the terminal gate with a clean plate', target: () => [LANDMARKS.terminal.x - 6, LANDMARKS.terminal.z + 30], radius: 10, mode: 'car', check: () => g().police.stars === 0, need: 'Guardia still has you marked — lose every wanted star first.' },
],
reward: 540, rep: 95,
outro: 'Mara: "Clean plate, clean gate. That is the whole trick."',
},
split_take: { title: 'SPLIT TAKE', giver: 'SOMBRA CREW', color: MISSION_COLORS.heat, start: 'market3',
brief: 'Two halves of one payout: the bag at the market, the launch at the east pier.',
steps: [
{ text: 'Collect the bag behind the fish market', target: () => [LANDMARKS.market.x - 16, LANDMARKS.market.z + 16], radius: 7, mode: 'car', dwell: 0.9, onEnter: () => { g().police.setStars(2); g().notify('Sombra: "Bag is hot. Guardia saw the handoff."', 'warn'); } },
{ text: 'Get the bag to the launch at the east pier', target: () => [250, 30], radius: 11, mode: 'car', dwell: 1.4 },
],
reward: 980, rep: 160,
outro: 'Sombra: "Both halves, one payment at the end. The crew remembers."',
},
harbor_ferry: { title: 'HARBOR FERRY', giver: 'ELIO', color: MISSION_COLORS.boat, start: 'marina2',
brief: 'A fare is waiting on open water and will not set foot on a quay.',
steps: [
{ text: 'Bring the launch alongside the mid-channel buoy', target: () => [0, 10], radius: 7, mode: 'boat', dwell: 1.2, check: () => g().mode === 'boat', need: 'This fare only boards from the water — take the Sombra launch.' },
],
reward: 520, rep: 90,
outro: 'Elio: "Fare paid, no names. Good crossing, Rico."',
},
toll_run: { title: 'TOLL RUN', giver: 'ELIO', color: MISSION_COLORS.job, start: 'market4',
brief: 'The north gate takes its cut in cash, and Elio is short this week.',
steps: [
{ text: 'Pay the north gate toll and hand over the manifest', target: () => [258, -110], radius: 8, mode: 'car', check: () => g().cash >= 200, need: 'The gate wants $200 cash — come back with the toll.' },
],
reward: 430, rep: 70,
outro: 'Elio: "Gate paid, manifest stamped. Nobody looks twice."',
},
}; } buildStartMarkers() { for (const [id, def] of Object.entries(this.defs)) {
const p = START_POINTS[def.start];
const marker = makeBeacon(def.color, 11, 1.7); marker.position.set(p[0], 0.4, p[1]); this.scene.add(marker); this.startMarkers.set(id, marker); } this.targetMarker = makeBeacon(MISSION_COLORS.story, 18, 2.5); this.targetMarker.visible = false; this.scene.add(this.targetMarker); this.refreshMarkers(); } available(id) {
const def = this.defs[id]; if (!def || this.completed.has(id)) return false; if (def.requires && !this.completed.has(def.requires)) return false; return true; } nearestStart(px, pz) {
let best = null, bd = 4.0; for (const [id, def] of Object.entries(this.defs)) { if (!this.available(id)) continue;
const p = START_POINTS[def.start];
const d = Math.hypot(px - p[0], pz - p[1]); if (d < bd) { bd = d; best = id; } } return best; } start(id) { if (!this.available(id)) return false; this.active = id; this.stepIndex = 0; this.dwell = 0; this.timer = 0;
const def = this.defs[id]; this.game.hud.banner(def.title, def.giver, def.color); this.game.audio.missionChime(); this.enterStep(); return true; } enterStep() {
const def = this.defs[this.active];
const step = def.steps[this.stepIndex]; this.dwell = 0; if (step.onEnter) step.onEnter(); if (step.time) this.timer = step.time;
const target = this.stepTarget(); if (target) { this.targetMarker.position.set(target[0], this.game.world.heightAt(target[0], target[1]) + 0.05, target[1]); this.targetMarker.visible = true; this.targetMarker.children.forEach((c) => { if (c.material && c.material.color) c.material.color.setHex(def.color); }); } else { this.targetMarker.visible = false; } this.game.hud.toast(step.text, 'objective'); } stepTarget() {
const def = this.defs[this.active];
const step = def?.steps[this.stepIndex]; if (!step) return null; if (step.target) return step.target(); if (step.carType) {
const car = this.game.findCarOfType(step.carType); if (car) return [car.pos.x, car.pos.z]; } if (step.mode === 'boat') return [this.game.boat.pos.x, this.game.boat.pos.z]; return null; } advance() {
const def = this.defs[this.active]; if (!def) return; this.stepIndex++; if (this.stepIndex >= def.steps.length) { this.complete(); } else { this.enterStep(); } } complete() {
const id = this.active; if (!id) return;
const def = this.defs[id]; this.active = null; this.targetMarker.visible = false; if (!this.payouts.has(id)) { this.payouts.add(id); this.completed.add(id); this.game.cash += def.reward; this.game.rep += def.rep; this.game.addStanding(this.game.zoneName); this.game.audio.cash();
this.game.hud.banner('JOB PAID', `$${def.reward.toLocaleString()}  •  REP +${def.rep}`, def.color);
this.game.hud.toast(def.outro, 'success'); this.game.saveGame(); } this.game.refreshMissionMarkers(); } fail(reason = 'JOB FAILED') { if (!this.active) return; this.game.hud.banner(reason, 'The drop is cold. Try again at the marker.', 0xff5d4a); this.active = null; this.stepIndex = 0; this.targetMarker.visible = false; this.game.refreshMissionMarkers(); } update(dt) { for (const [id, marker] of this.startMarkers) { if (!marker.visible) continue; marker.rotation.y += dt * 0.5; marker.userData.dia.rotation.y += dt * 1.2; marker.userData.dia.position.y = 6.8 + Math.sin(performance.now() * 0.002) * 0.35; } if (this.targetMarker.visible) { this.targetMarker.rotation.y += dt * 0.7; this.targetMarker.userData.dia.rotation.y += dt * 1.6; this.targetMarker.userData.dia.position.y = 11 + Math.sin(performance.now() * 0.0025) * 0.4; } if (!this.active) return;
const def = this.defs[this.active];
const step = def.steps[this.stepIndex]; if (!step) return; if (this.active === 'crossing' && this.stepIndex === 3 && (this.game.bridge.state === 'closed' || this.game.bridge.state === 'closing')) { this.game.bridge.requestOpen(); } if (step.time) { this.timer -= dt; if (this.timer <= 0) { this.fail('CLOCK EXPIRED'); return; } } else if (this.active === 'quay_race' && this.stepIndex >= 1) { this.timer -= dt; if (this.timer <= 0) { this.fail('CLOCK EXPIRED'); return; } }
const target = this.stepTarget(); if (target) { this.targetMarker.position.set(target[0], this.game.world.heightAt(target[0], target[1]) + 0.05, target[1]); }
const modeOk = !step.mode || this.game.mode === step.mode;
let inRange = true; if (target) {
const ap = this.game.activePos;
const d = Math.hypot(ap.x - target[0], ap.z - target[1]); inRange = d < (step.radius ?? 7); }
const checkOk = step.check ? step.check() : true; if (modeOk && inRange && checkOk) { if (step.dwell) { this.dwell += dt; if (this.dwell >= step.dwell) this.advance(); } else { this.advance(); } } else { this.dwell = 0; } } objective() { if (!this.active) {
const id = this.game.missions?.nearestStart(this.game.player.pos.x, this.game.player.pos.z); if (id) return { title: this.defs[id].title, text: 'Press E to take the job', dist: 0, color: this.defs[id].color, idle: true }; return { title: 'STORM SHIFT', text: 'Find a job marker: garage, marina or market', dist: null, color: MISSION_COLORS.story, idle: true }; }
const def = this.defs[this.active];
const step = def.steps[this.stepIndex];
const target = this.stepTarget();
let dist = null; if (target) {
const ap = this.game.activePos; dist = Math.hypot(ap.x - target[0], ap.z - target[1]); }
let text = step.text; if (target && dist < (step.radius ?? 7) && step.need) {
const met = (!step.mode || this.game.mode === step.mode) && (!step.check || step.check()); if (!met) text = step.need; }
return { title: def.title, text, dist, color: def.color, timer: step.time || (this.active === 'quay_race' && this.stepIndex >= 1) ? this.timer : null }; } save() { return { active: this.active, step: this.stepIndex, completed: [...this.completed], payouts: [...this.payouts] }; } load(data) { if (!data) return; this.completed = new Set(data.completed || []); this.payouts = new Set(data.payouts || []); this.refreshMarkers(); if (data.active && this.defs[data.active] && !this.completed.has(data.active)) { this.active = data.active; this.stepIndex = Math.min(data.step || 0, this.defs[data.active].steps.length - 1); this.enterStep(); } } refreshMarkers() { for (const [id, marker] of this.startMarkers) { marker.visible = this.available(id); } } }
// provenance: witnessed in the high-tide session
// high-tide round 16 authorship provenance
