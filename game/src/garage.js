// The garage: store the car you drove in, fetch it back later, and run
// street races from the posts beside it. Cash, reputation, the stored
// car and the best race time are kept in the browser's local storage,
// so a saved game survives a reload.
import * as THREE from 'three';
import { GARAGE, SAVE_KEY, WORLD } from './config.js';
import { ring } from './geometry.js';

export function createGarage(scene, city, player, vehicles, missions) {
  const lot = city.garageLot;
  let stored = false;
  let bestRace = null;
  let racing = false;
  let raceTimer = 0;
  let raceCp = 0;
  let raceCps = [];
  const marker = new THREE.Group();
  const markerRing = ring(4, 5.5, 0x37e0a0, { opacity: 0.8 });
  marker.add(markerRing);
  marker.visible = false;
  scene.add(marker);

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveGame() {
    try {
      const data = {
        cash: missions.state.cash,
        rep: missions.state.rep,
        stored,
        bestRace,
        weapons: [],
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch { /* storage may be unavailable */ }
  }

  function applySave(save) {
    if (!save) return;
    missions.state.cash = save.cash || 0;
    if (save.rep) missions.addRep(save.rep);
    stored = !!save.stored;
    bestRace = save.bestRace ?? null;
  }

  function inLot() {
    const p = player.state.position;
    return Math.abs(p.x - lot.x) < lot.w / 2 && Math.abs(p.z - lot.z) < lot.d / 2;
  }

  function nearPost() {
    const p = player.state.position;
    for (const post of city.racePosts) {
      if (Math.hypot(p.x - post.x, p.z - post.z) < 4) return post;
    }
    return null;
  }

  function prompt() {
    if (racing) return null;
    if (inLot() && vehicles.drivenCar) return 'Store car in garage';
    if (inLot() && stored && !vehicles.drivenCar) return 'Retrieve stored car';
    const post = nearPost();
    if (post) return 'Start street race';
    return null;
  }

  function storeCar() {
    if (!vehicles.drivenCar) return false;
    const c = vehicles.drivenCar;
    c.parked = true;
    c.mesh.visible = false;
    vehicles.exitCar();
    stored = true;
    saveGame();
    return true;
  }

  function retrieveCar() {
    if (!stored || vehicles.drivenCar) return false;
    const car = vehicles.spawnNearPlayer();
    car.x = lot.x;
    car.z = lot.z - 4;
    car.mesh.position.set(car.x, 0, car.z);
    stored = false;
    saveGame();
    return true;
  }

  function racePoints() {
    // Three checkpoints along the roads near the garage.
    const roads = city.roads.xRoads;
    return [
      { x: lot.x - 70, z: roads[3] },
      { x: lot.x - 70, z: roads[5] },
      { x: lot.x + 10, z: roads[5] },
    ];
  }

  function startRace() {
    if (racing) return false;
    racing = true;
    raceTimer = GARAGE.raceSeconds;
    raceCp = 0;
    raceCps = racePoints();
    const c = raceCps[0];
    marker.position.set(c.x, 0.1, c.z);
    marker.visible = true;
    return true;
  }

  function raceMarker() {
    return racing ? raceCps[raceCp] : null;
  }

  function update(dt) {
    if (!racing) return;
    raceTimer -= dt;
    const cp = raceCps[raceCp];
    const p = player.state.position;
    if (cp && vehicles.drivenCar && Math.hypot(p.x - cp.x, p.z - cp.z) < 6) {
      raceCp += 1;
      if (raceCp >= raceCps.length) {
        racing = false;
        marker.visible = false;
        const used = GARAGE.raceSeconds - raceTimer;
        missions.state.cash += GARAGE.raceWin;
        missions.addRep(GARAGE.raceRep);
        if (bestRace === null || used < bestRace) bestRace = Math.round(used * 10) / 10;
        saveGame();
        if (missions && missions.state) { /* cash toast comes from the HUD */ }
        return;
      }
      const next = raceCps[raceCp];
      marker.position.set(next.x, 0.1, next.z);
    }
    if (raceTimer <= 0) {
      racing = false;
      marker.visible = false;
    }
  }

  return {
    loadSave, saveGame, applySave, prompt, storeCar, retrieveCar,
    startRace, update, inLot, nearPost,
    get stored() { return stored; },
    get bestRace() { return bestRace; },
    get racing() { return racing; },
    get raceTimer() { return raceTimer; },
    get raceCp() { return raceCp; },
    raceMarker,
  };
}
