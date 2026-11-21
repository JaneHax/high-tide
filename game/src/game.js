import * as THREE from 'three';
import { WORLD, PLAYER, ECONOMY } from './config.js';
import { World } from './world.js';
import { Drawbridge } from './bridge.js';
import { Player, Crowd } from './people.js';
import { Car, Traffic } from './vehicles.js';
import { Boat } from './boat.js';
import { Police } from './police.js';
import { Missions } from './missions.js';
import { Hud } from './hud.js';
import { Input } from './input.js';
import { GameAudio } from './audio.js';
import { readSave, writeSave, hasSave, clearSave } from './save.js';
import { clamp, lerp, dampAngle } from './utils.js';
export class Game { constructor() { this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 1600); this.scene.add(this.camera); this.cameraFill = new THREE.PointLight(0xffe2c4, 0.9, 9, 2); this.cameraFill.position.set(0, -0.2, 0); this.camera.add(this.cameraFill); this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6)); this.renderer.setSize(innerWidth, innerHeight); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.02; this.renderer.outputColorSpace = THREE.SRGBColorSpace; document.getElementById('stage').appendChild(this.renderer.domElement); this.canvas = this.renderer.domElement;
const gl = this.renderer.getContext();
const dbg = gl.getExtension('WEBGL_debug_renderer_info');
const gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ''; this.lowQuality = /swiftshader|llvmpipe|software|angle \(google/i.test(gpu); if (this.lowQuality) this.renderer.setPixelRatio(1); this.world = new World(this.scene, { low: this.lowQuality }); this.scene.userData.world = this.world; this.bridge = new Drawbridge(this.scene, this.world); this.world.bridge = this.bridge; this.player = new Player(this.scene); this.traffic = new Traffic(this.scene, this.world, this.lowQuality ? 18 : 28); this.boat = new Boat(this.scene); this.crowd = new Crowd(this.scene, this.lowQuality ? 38 : 54); if (this.lowQuality) { this.crowd.peds.forEach((p) => p.rig.group.traverse((o) => { if (o.isMesh) o.castShadow = false; })); this.traffic.cars.forEach((c) => c.mesh.traverse((o) => { if (o.isMesh) o.castShadow = false; })); } this.audio = new GameAudio(); this.police = new Police(this.scene, this.world, this.audio); this.hud = new Hud(); this.missions = new Missions(this); this.garageCar = new Car(this.scene, 'courier', -58, 116, -Math.PI / 2); this.garageCar.mesh.traverse((o) => { if (o.isMesh) o.castShadow = true; }); this.traffic.parked.push(this.garageCar); this.muscleCar = new Car(this.scene, 'muscle', -84, 116, Math.PI / 2); this.muscleCar.mesh.traverse((o) => { if (o.isMesh) o.castShadow = true; }); this.traffic.parked.push(this.muscleCar); this.input = new Input(this.canvas, { onKey: (c, e) => this.onKey(c, e) }); this.clock = new THREE.Clock(); this.gameClock = 18 * 60 + 42; this.state = 'title'; this.mode = 'foot'; this.car = null; this.cash = 180; this.rep = 0; this.wanted = 0; this.stormLevel = 0.2; this.elapsed = 0; this.lastDamage = -100; this.autosaveTimer = 0; this.cameraYaw = Math.PI / 2; this.cameraPitch = 0.07; this.cameraDist = 6.2; this.orbitYaw = 0; this.shake = 0; this.tracers = []; this.flashes = []; this.lightningTimer = 12; this.titleAngle = 0; this.cameraTarget = new THREE.Vector3(); this.cameraPos = new THREE.Vector3(); this.bindUI(); this.bindResize(); this.updateTitleButtons(); this.startLoop(); } bindUI() { document.getElementById('btnStart').addEventListener('click', () => this.startGame(false)); document.getElementById('btnResume').addEventListener('click', () => this.startGame(true)); document.getElementById('btnResumePause').addEventListener('click', () => this.resumeGame()); document.getElementById('btnSaveQuit').addEventListener('click', () => this.saveAndQuit()); document.getElementById('btnRestart').addEventListener('click', () => this.restartGame()); document.getElementById('btnRestartDead').addEventListener('click', () => this.respawn()); document.getElementById('btnTitleDead').addEventListener('click', () => this.toTitle()); document.getElementById('btnMute').addEventListener('click', () => {
const m = this.audio.toggleMute(); document.getElementById('btnMute').textContent = m ? 'SOUND OFF' : 'SOUND ON'; }); document.getElementById('btnControls').addEventListener('click', () => { document.getElementById('controlsCard').classList.toggle('open'); }); } bindResize() { addEventListener('resize', () => { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(innerWidth, innerHeight); }); } updateTitleButtons() {
const r = document.getElementById('btnResume'); r.style.display = hasSave() ? 'inline-flex' : 'none';
const sub = document.getElementById('titleSub'); sub.textContent = hasSave() ? 'A saved shift is waiting at the harbor.' : 'Rico has one last crossing before the storm.'; } showScreen(id) { for (const s of ['titleScreen', 'pauseScreen', 'deadScreen']) { document.getElementById(s).classList.toggle('hidden', s !== id); } document.getElementById('hud').classList.toggle('hidden', id !== null); } startGame(resume) { this.audio.init(); this.audio.ui(); if (resume && this.loadGame()) { this.hud.toast('Shift restored. The storm has not passed.', 'info'); } else { this.newShift(); } this.state = 'playing'; this.input.enabled = true; this.showScreen(null); this.input.requestLock(); this.cameraYaw = this.mode === 'car' ? this.car.yaw : this.player.yaw; this.snapCamera(); this.autosaveTimer = 0; } newShift() { clearSave(); this.cash = 180; this.rep = 0; this.gameClock = 18 * 60 + 42; this.elapsed = 0; this.stormLevel = 0.2; this.mode = 'foot'; this.car = null; this.player.setPosition(-54, 36.5, Math.PI / 2); this.player.health = PLAYER.maxHealth; this.player.alive = true; this.player.ammo = PLAYER.ammo; this.player.reserve = 96; this.player.group.visible = true; this.boat.pos.set(-86, 0, 16); this.boat.group.position.set(-86, 0.08, 16); this.boat.yaw = -Math.PI / 2; this.boat.group.rotation.y = -Math.PI / 2; this.boat.speed = 0; this.police.clear(); this.police.stars = 0; this.wanted = 0; this.cameraYaw = Math.PI / 2; this.cameraPitch = 0.07; this.rebuildMissions(); this.hud.toast('Rico, the marina is on the line. Find a job marker.', 'info', 6); } rebuildMissions() { for (const m of this.missions.startMarkers.values()) this.scene.remove(m); this.scene.remove(this.missions.targetMarker); this.missions = new Missions(this); } loadGame() {
const s = readSave(); if (!s) return false; this.cash = s.cash ?? 180; this.rep = s.rep ?? 0; this.gameClock = s.clock ?? 18 * 60 + 42; this.stormLevel = s.storm ?? 0.2; this.player.health = clamp(s.health ?? 100, 1, PLAYER.maxHealth); this.player.ammo = s.ammo ?? PLAYER.ammo; this.player.reserve = s.reserve ?? 96; this.player.alive = true; this.police.setStars(s.wanted ?? 0); this.wanted = this.police.stars;
const [x, z] = s.pos; this.player.setPosition(x, z, s.yaw ?? 0); this.mode = 'foot'; this.car = null; this.player.group.visible = true; if (s.mode === 'car' && Array.isArray(s.carPos)) {
const type = s.carType ?? 'sedan';
const car = new Car(this.scene, type, s.carPos[0], s.carPos[1], s.carYaw ?? 0); car.mesh.traverse((o) => { if (o.isMesh) o.castShadow = true; }); car.addHeadlight(); this.car = car; this.mode = 'car'; this.player.group.visible = false; this.traffic.parked.push(car); } else if (s.mode === 'boat' && Array.isArray(s.boatPos)) { this.boat.pos.set(s.boatPos[0], 0, s.boatPos[1]); this.boat.yaw = s.boatYaw ?? -Math.PI / 2; this.boat.speed = 0; this.boat.group.position.set(s.boatPos[0], 0.08, s.boatPos[1]); this.boat.group.rotation.y = this.boat.yaw; this.boat.board(this.player); this.mode = 'boat'; } this.rebuildMissions(); this.missions.load(s.missions); this.updateTitleButtons(); return true; } saveGame() { if (this.state === 'title') return false;
const state = { cash: this.cash,
rep: this.rep,
health: this.player.health,
ammo: this.player.ammo,
reserve: this.player.reserve,
wanted: this.police.stars,
clock: this.gameClock,
storm: this.stormLevel,
mode: this.mode,
pos: [this.player.pos.x, this.player.pos.z],
yaw: this.player.yaw,
carType: this.car?.typeKey,
carPos: this.car ? [this.car.pos.x, this.car.pos.z] : null,
carYaw: this.car?.yaw,
boatPos: [this.boat.pos.x, this.boat.pos.z],
boatYaw: this.boat.yaw,
missions: this.missions.save(),
};
const ok = writeSave(state); this.updateTitleButtons(); return ok; } pauseGame() { if (this.state !== 'playing') return; this.state = 'paused'; this.input.enabled = false; this.input.releaseLock(); this.showScreen('pauseScreen'); this.saveGame(); } resumeGame() { if (this.state !== 'paused') return; this.audio.init(); this.audio.ui(); this.state = 'playing'; this.input.enabled = true; this.showScreen(null); this.input.requestLock(); } saveAndQuit() { this.saveGame(); this.toTitle(); } restartGame() { this.audio.ui(); this.newShift(); this.state = 'playing'; this.input.enabled = true; this.showScreen(null); this.input.requestLock(); this.snapCamera(); } toTitle() { this.state = 'title'; this.input.enabled = false; this.input.releaseLock(); this.updateTitleButtons(); this.showScreen('titleScreen'); this.cameraYaw = Math.PI; this.cameraPitch = 0.16; } respawn() { this.cash = Math.max(0, this.cash - ECONOMY.clinic); this.player.health = PLAYER.maxHealth; this.player.alive = true; this.player.group.visible = true; this.mode = 'foot'; this.car = null; this.player.setPosition(44, 132, Math.PI); this.police.clear(); this.missions.fail('SHIFT WASHED OUT'); this.state = 'playing'; this.input.enabled = true; this.showScreen(null); this.input.requestLock();
this.hud.toast(`Clinic bill: $${ECONOMY.clinic}. You are back on your feet.`, 'warn');
} onKey(code) { if (code === 'Escape') { if (this.state === 'playing') this.pauseGame(); else if (this.state === 'paused') this.resumeGame(); return; } if (this.state !== 'playing') return; if (code === 'KeyE') this.interact(); if (code === 'KeyR') this.reload(); if (code === 'KeyM') {
const m = this.audio.toggleMute(); this.hud.toast(m ? 'Sound muted' : 'Sound on', 'info', 2); } if (code === 'KeyB' && this.mode === 'boat') this.bridge.requestOpen(); } interact() { if (this.mode === 'car') { this.exitCar(); return; } if (this.mode === 'boat') { this.exitBoat(); return; }
const px = this.player.pos.x, pz = this.player.pos.z;
const missionId = this.missions.nearestStart(px, pz); if (missionId) { this.missions.start(missionId); return; } if (Math.hypot(px - 17, pz + 36) < 4.5) { if (this.bridge.state === 'closed' || this.bridge.state === 'warning') { this.bridge.requestOpen(); this.hud.toast('Bridge control: raising the span.', 'info'); } else { this.bridge.requestClose(); this.hud.toast('Bridge control: lowering the span.', 'info'); } return; } if (Math.hypot(px - (-74), pz - 118) < 6) { this.respray(); return; }
const car = this.nearestCar(px, pz, 4.6); if (car) { this.enterCar(car); return; } if (Math.hypot(px - this.boat.pos.x, pz - this.boat.pos.z) < 5.5) { this.boardBoat(); return; } if (Math.hypot(px - 44, pz - 132) < 5) { this.player.health = PLAYER.maxHealth; this.hud.toast('Clinic patched you up.', 'success'); this.audio.missionChime(); } } nearestCar(px, pz, maxDist) {
let best = null, bd = maxDist; for (const c of [...this.traffic.parked, ...this.traffic.cars]) {
const d = Math.hypot(px - c.pos.x, pz - c.pos.z); if (d < bd) { bd = d; best = c; } } return best; } findCarOfType(type) {
const all = [this.car, this.garageCar, this.muscleCar, ...this.traffic.parked, ...this.traffic.cars]; return all.find((c) => c && c.typeKey === type) || null; } refreshMissionMarkers() { this.missions.refreshMarkers(); } notify(text, kind = 'info') { this.hud.toast(text, kind); } enterCar(car) { if (!car) return; this.traffic.remove(car); this.car = car; car.ai = false; car.speed = 0; car.addHeadlight(); this.mode = 'car'; this.player.group.visible = false; this.cameraYaw = car.yaw; this.orbitYaw = 0; this.snapCamera(); this.audio.ui();
this.hud.toast(`${car.name} taken.`, 'info', 2);
if (car.typeKey === 'police') this.police.addStar(1); } exitCar() {
const car = this.car; if (!car) return;
const side = new THREE.Vector3(Math.cos(car.yaw), 0, -Math.sin(car.yaw));
let x = car.pos.x + side.x * 2.8;
let z = car.pos.z + side.z * 2.8;
const hit = this.world.collide(x, z, PLAYER.radius); if (hit) { x -= side.x * 4.4; z -= side.z * 4.4; } this.player.setPosition(clamp(x, -294, 294), clamp(z, -294, 294), car.yaw); this.player.group.visible = true; car.speed = 0; this.mode = 'foot'; this.car = null; if (!this.traffic.parked.includes(car) && !this.traffic.cars.includes(car)) this.traffic.parked.push(car); this.cameraYaw = car.yaw; this.snapCamera(); } boardBoat() { if (Math.hypot(this.player.pos.x - this.boat.pos.x, this.player.pos.z - this.boat.pos.z) > 6) return; this.boat.board(this.player); this.mode = 'boat'; this.player.group.visible = false; this.cameraYaw = this.boat.yaw; this.orbitYaw = 0; this.snapCamera(); this.audio.ui(); this.hud.toast('Sombra launch under way. W/S throttle, A/D helm.', 'info', 4); } exitBoat() {
const b = this.boat; if (Math.abs(b.pos.z) < 19 && Math.abs(b.pos.x - 252) > 10) { this.hud.toast('Too deep. Bring her alongside a quay.', 'warn', 2.4); return; } b.disembark(this.player); this.player.pos.z = clamp(this.player.pos.z, 27, 34); this.player.group.position.set(this.player.pos.x, 0.4, this.player.pos.z); this.mode = 'foot'; this.cameraYaw = b.yaw; this.snapCamera(); } respray() { if (this.cash < ECONOMY.respray) { this.hud.toast('Respray costs $180. Come back with cash.', 'warn'); return; } this.cash -= ECONOMY.respray; this.player.health = PLAYER.maxHealth; this.police.clear(); this.hud.toast('Fresh paint, clean plates. Guardia lost the trail.', 'success'); this.audio.cash(); this.saveGame(); } reload() { if (this.mode === 'foot' && this.player.reload()) this.audio.blip(300, 0.06, 'square', 0.08); } get wantedLevel() { return this.police.stars; } get activePos() { if (this.mode === 'car' && this.car) return this.car.pos; if (this.mode === 'boat') return this.boat.pos; return this.player.pos; } get zoneName() {
const ap = this.activePos, x = ap.x, z = ap.z; if (Math.abs(z) < 26) return 'BASCULE CHANNEL'; if (z < -24) return x < -40 ? 'ART-DECO TERMINAL' : 'NORTH DOCKS'; if (z > 24) { if (x > 40) return 'FISH MARKET'; if (x > -140 && x < -30 && z < 56) return 'MARINA SOL'; return x < -40 ? 'SOMBRA GARAGE' : 'MARINA PROMENADE'; } return 'PUERTO SOL'; } shoot() {
const p = this.player; if (!p.canFire()) { if (p.ammo <= 0) this.reload(); return; } p.consumeShot(); this.audio.gunshot(0.42); this.shake = Math.max(this.shake, 0.35);
const origin = this.camera.position.clone();
const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir);
const ray = new THREE.Raycaster(origin, dir, 0.2, 110);
let hit = null;
const policeHit = this.police.hitTest(origin, dir, 90);
const ped = this.crowd.peds.find((q) => { if (!q.alive) return false;
const v = new THREE.Vector3(q.x, 1.0, q.z); return ray.ray.distanceToPoint(v) < 0.6 && origin.distanceTo(v) < 80; });
const pedDist = ped ? origin.distanceTo(new THREE.Vector3(ped.x, 1.0, ped.z)) : Infinity;
const buildHit = ray.intersectObject(this.world.buildings, false)[0];
const buildDist = buildHit ? buildHit.distance : Infinity;
let bestDist = Math.min(policeHit ? policeHit.dist : Infinity, pedDist, buildDist);
let point; if (policeHit && policeHit.dist <= bestDist + 0.01) { hit = policeHit; point = policeHit.point; if (policeHit.type === 'officer') { this.police.damageOfficer(policeHit.officer, 1); this.police.addStar(1); this.hud.toast('Guardia officer down.', 'warn', 2); } else { this.police.addStar(1); } } else if (ped && pedDist <= bestDist + 0.01) { ped.alive = false; ped.flee = 0; this.crowd.scareAt(ped.x, ped.z, 34); this.police.addStar(2); this.hud.toast('Civilian down. Guardia is responding.', 'warn', 2.4); point = new THREE.Vector3(ped.x, 1.0, ped.z); } else if (buildHit) { point = buildHit.point; } else { point = origin.clone().add(dir.clone().multiplyScalar(80)); } if (this.police.stars === 0) { this.police.addStar(1); this.hud.toast('Shots fired. Harbor patrol alerted.', 'warn', 2.2); } this.spawnTracer(origin, point); this.spawnMuzzle(); } spawnTracer(from, to) {
const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
const mat = new THREE.LineBasicMaterial({ color: 0xffe1a6, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
const line = new THREE.Line(geo, mat); this.scene.add(line); this.tracers.push({ line, life: 0.1 }); } spawnMuzzle() {
const yaw = this.mode === 'car' ? this.car.yaw : this.mode === 'boat' ? this.boat.yaw : this.player.yaw;
const ap = this.activePos;
const pos = new THREE.Vector3(ap.x, this.world.heightAt(ap.x, ap.z) + 1.25, ap.z);
const dir = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)); pos.addScaledVector(dir, this.mode === 'car' ? 2.4 : 0.8);
const mat = new THREE.SpriteMaterial({ map: this.world.sun.material.map, color: 0xffd9a0, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
const sp = new THREE.Sprite(mat); sp.position.copy(pos); sp.scale.set(1.8, 1.8, 1); this.scene.add(sp); this.flashes.push({ sp, life: 0.06 }); } damagePlayer(n) { if (this.state !== 'playing') return; this.player.takeDamage(n); this.lastDamage = this.elapsed; this.shake = Math.max(this.shake, 0.5); this.hud.flashDamage(); if (!this.player.alive) this.playerDied(); } playerDied() { this.state = 'dead'; this.input.enabled = false; this.input.releaseLock(); this.showScreen('deadScreen'); this.audio.sirenStop(); this.audio.setEngine(0, false); this.saveGame(); } updateGame(dt) { this.elapsed += dt; this.gameClock += dt;
const p = this.player;
const mouse = this.input.consumeMouse();
const zoom = this.input.consumeZoom();
const sens = p.aiming ? 0.0017 : 0.0024; if (this.mode === 'foot') this.cameraYaw -= mouse.dx * sens; else this.orbitYaw = clamp(this.orbitYaw - mouse.dx * sens, -2.6, 2.6); this.cameraPitch = clamp(this.cameraPitch + mouse.dy * sens, -0.5, 0.95); if (zoom) this.cameraDist = clamp(this.cameraDist + zoom * 0.6, 3.2, 9.5);
const aim = this.input.aim;
const fire = this.input.fire, throttle = (this.input.forward ? 1 : 0) - (this.input.back ? 1 : 0), steer = (this.input.left ? 1 : 0) - (this.input.right ? 1 : 0); if (this.mode === 'foot') { p.update(dt, { forward: this.input.forward, back: this.input.back, left: this.input.left,
right: this.input.right, run: this.input.run, aim,
}, this.world, this.cameraYaw); if (aim) p.yaw = dampAngle(p.yaw, this.cameraYaw, 18, dt); if (fire) this.shoot(); } else if (this.mode === 'car') {
this.car.drive(dt, throttle, steer, this.input.handbrake); this.car.updateVisual(dt); if (fire) this.shoot(); if (this.car.speed > 6) this.checkCarHits(); } else if (this.mode === 'boat') {
this.boat.update(dt, throttle, steer, this.world); } this.police.update(dt, { playerPos: this.mode === 'car' ? this.car.pos : this.mode === 'boat' ? this.boat.pos : p.pos,
playerOnFoot: this.mode === 'foot',
playerCar: this.car,
playerAlive: p.alive,
onDamage: (n) => this.damagePlayer(n),
}); this.wanted = this.police.stars; this.traffic.update(dt, p, this.car); this.crowd.update(dt, p.pos, this.car, this.wanted); this.bridge.update(dt); this.missions.update(dt); this.updateStorm(dt); this.updatePrompts(); this.updateEffects(dt); this.updateCamera(dt); this.hud.update(dt, this); if (this.mode === 'car') this.audio.setEngine(clamp(Math.abs(this.car.speed) / this.car.spec.maxSpeed, 0, 1), true, 'car'); else if (this.mode === 'boat') this.audio.setEngine(clamp(Math.abs(this.boat.speed) / 24, 0, 1), true, 'boat'); else this.audio.setEngine(0, false); this.audio.updateSiren(); this.audio.setRain(this.stormLevel); if (p.health < p.maxHealth && this.elapsed - this.lastDamage > 11) p.heal(dt * 2.2); this.autosaveTimer += dt; if (this.autosaveTimer > 22) { this.autosaveTimer = 0; this.saveGame(); } if (this.wanted >= 1) this.stormLevel = Math.min(1, this.stormLevel + dt * 0.008); } checkCarHits() {
const car = this.car; for (const ped of this.crowd.peds) { if (!ped.alive) continue;
const d = Math.hypot(ped.x - car.pos.x, ped.z - car.pos.z); if (d < 2.2 && Math.abs(car.speed) > 4) { ped.alive = false; this.crowd.scareAt(ped.x, ped.z, 30); this.police.addStar(2); this.audio.crash(); this.hud.toast('Hit a civilian. Heat rising.', 'warn', 2); } }
const hit = this.world.collide(car.pos.x, car.pos.z, car.radius); if (hit && Math.abs(car.speed) > 12 && this.car.collisionCooldown <= 0) { this.car.collisionCooldown = 0.6; this.audio.crash(); this.shake = Math.max(this.shake, 0.3); this.car.speed *= 0.45; } this.car.collisionCooldown = Math.max(0, this.car.collisionCooldown - 0.016); } updateStorm(dt) {
const base = 0.18 + Math.min(this.elapsed / 260, 1) * 0.5;
const target = clamp(base + this.wanted * 0.06, 0, 1); this.stormLevel = lerp(this.stormLevel, target, 1 - Math.exp(-0.25 * dt)); this.world.setStorm(this.stormLevel); this.lightningTimer -= dt; if (this.stormLevel > 0.55 && this.lightningTimer <= 0) { this.lightningTimer = 14 + Math.random() * 26; this.world.lightning(); this.audio.thunder(); } } updatePrompts() { if (this.state !== 'playing') return;
let prompt = ''; if (this.mode === 'foot') {
const px = this.player.pos.x, pz = this.player.pos.z;
const mid = this.missions.nearestStart(px, pz);
if (mid) prompt = `<b>E</b> — START ${this.missions.defs[mid].title}`;
else if (Math.hypot(px - 17, pz + 36) < 4.5) prompt = `<b>E</b> — BRIDGE CONTROL`;
else if (Math.hypot(px - (-74), pz - 118) < 6) prompt = this.wanted > 0 ? `<b>E</b> — RESPRAY $180` : `<b>E</b> — SAVE AT GARAGE`;
else if (Math.hypot(px - 44, pz - 132) < 5) prompt = `<b>E</b> — CLINIC PATCH-UP`;
else {
const car = this.nearestCar(px, pz, 4.6);
if (car) prompt = `<b>E</b> — TAKE ${car.name.toUpperCase()}`;
else if (Math.hypot(px - this.boat.pos.x, pz - this.boat.pos.z) < 5.5) prompt = `<b>E</b> — BOARD SOMBRA LAUNCH`;
} } else if (this.mode === 'car') {
prompt = `<b>E</b> — EXIT VEHICLE`;
} else if (this.mode === 'boat') {
prompt = `<b>E</b> — DOCK / DISEMBARK <span class="dim">•</span> <b>B</b> — CALL BRIDGE`;
} this.hud.setPrompt(prompt); } updateEffects(dt) { for (let i = this.tracers.length - 1; i >= 0; i--) {
const t = this.tracers[i]; t.life -= dt; t.line.material.opacity = Math.max(0, t.life / 0.1) * 0.9; if (t.life <= 0) { this.scene.remove(t.line); t.line.geometry.dispose(); t.line.material.dispose(); this.tracers.splice(i, 1); } } for (let i = this.flashes.length - 1; i >= 0; i--) {
const f = this.flashes[i]; f.life -= dt; f.sp.material.opacity = Math.max(0, f.life / 0.06); if (f.life <= 0) { this.scene.remove(f.sp); f.sp.material.dispose(); this.flashes.splice(i, 1); } } this.shake = Math.max(0, this.shake - dt * 2.2); } snapCamera() { this.updateCamera(0.016, true); } updateCamera(dt, snap = false) { if (this.freeCam) { this.camera.position.set(this.freeCam.px, this.freeCam.py, this.freeCam.pz); this.camera.lookAt(this.freeCam.tx, this.freeCam.ty, this.freeCam.tz); return; }
const target = new THREE.Vector3();
let dist = this.cameraDist;
let height = 0.95;
let yaw = this.cameraYaw; if (this.mode === 'car') {
const car = this.car; target.set(car.pos.x, 1.3, car.pos.z); yaw = car.yaw + this.orbitYaw; this.orbitYaw *= Math.exp(-1.6 * dt); dist = 9.0; height = 2.8; } else if (this.mode === 'boat') { target.set(this.boat.pos.x, 1.4, this.boat.pos.z); yaw = this.boat.yaw + this.orbitYaw; this.orbitYaw *= Math.exp(-1.4 * dt); dist = 12.5; height = 2.4; } else { target.set(this.player.pos.x, this.player.group.position.y + 1.5, this.player.pos.z); if (this.player.aiming) { dist = 2.7; height = 0.25; } }
const pitch = clamp(this.cameraPitch, -0.45, 0.95);
const cosP = Math.cos(pitch);
const offset = new THREE.Vector3(
Math.sin(yaw) * dist * cosP,
height + Math.sin(pitch) * dist,
Math.cos(yaw) * dist * cosP,
);
const desired = target.clone().add(offset);
const gy = this.world.heightAt(desired.x, desired.z); desired.y = Math.max(desired.y, gy + 0.6); if (snap) { this.camera.position.copy(desired); this.cameraTarget.copy(target); } else {
const k = this.player.aiming ? 20 : 9; this.camera.position.lerp(desired, 1 - Math.exp(-k * dt)); this.cameraTarget.lerp(target, 1 - Math.exp(-14 * dt)); }
const shakeX = (Math.random() - 0.5) * this.shake * 0.22;
const shakeY = (Math.random() - 0.5) * this.shake * 0.22; this.camera.position.x += shakeX; this.camera.position.y += shakeY; if (this.player.aiming && this.mode === 'foot') {
const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)); this.camera.position.addScaledVector(right, 0.55); this.cameraTarget.addScaledVector(right, 0.4); } this.camera.lookAt(this.cameraTarget); } startTitleCamera(dt) { this.titleAngle += dt * 0.035;
const r = 150; this.camera.position.set(Math.cos(this.titleAngle) * r + 20, 52 + Math.sin(this.titleAngle * 0.7) * 8, Math.sin(this.titleAngle) * r + 10); this.camera.lookAt(0, 8, 0); this.cameraYaw = this.titleAngle; } update(dt) { if (this.state === 'playing') { this.updateGame(dt); } else if (this.state === 'title') { this.startTitleCamera(dt); this.traffic.update(dt, this.player, null); this.crowd.update(dt, this.player.pos, null, 0); this.bridge.update(dt); this.world.setStorm(this.stormLevel); } this.world.update(dt, this.camera); this.renderer.render(this.scene, this.camera); } startLoop() {
const loop = () => { requestAnimationFrame(loop);
const dt = Math.min(this.clock.getDelta(), 0.05); this.update(dt); }; loop(); } }
