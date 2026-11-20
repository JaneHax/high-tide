// Death and respawn, kept out of the loop so the rule can be exercised without a browser. Two bugs
// this file exists to prevent: a corpse still holding the wheel — the car stays drivable, and the
// pistol and its crosshair come back inside it on the revive — and a respawn where he fell, carrying
// the heat he died with, among the cruisers that killed him.

import { COMBAT, WORLD } from './config.js';

export function createLifecycle({ player, vehicles, police, combat, spawn, followCamera }) {
  // main builds the player on this spawn point, so his feet already know the height of the ground
  // there; the spawn entry itself carries no y and this module is given no city to ask.
  const spawnY = player.position.y;
  let wasDead = false;
  let remaining = 0;

  function die() {
    wasDead = true;
    remaining = COMBAT.respawnSeconds;
    // Out of the car first: exit() stops it and puts him beside it. A body left in the driver's seat
    // is a car the game can still drive while its driver is dead.
    if (vehicles.drivenCar) vehicles.exit();
    player.state = 'dead';
    player.velocity.set(0, 0, 0);
    player.speed = 0;
    // The chase that killed him is over, so nothing is left waiting at the respawn point.
    police.clear();
  }

  function respawn() {
    if (vehicles.drivenCar) vehicles.exit();
    combat.revive();
    player.position.set(spawn.x, spawnY, spawn.z);
    player.velocity.set(0, 0, 0);
    player.speed = 0;
    player.state = 'idle';
    police.clear();
    followCamera.snap(player);
    wasDead = false;
    remaining = 0;
  }

  return {
    // The step length is the loop's own fixed step; main passes it, and a caller with no clock — a
    // test of the rule — gets the same countdown.
    update(dt = WORLD.step) {
      if (combat.state.dead) {
        if (!wasDead) {
          die();
          return;
        }
        remaining -= dt > 0 ? dt : 0;
        if (remaining <= 0) respawn();
        return;
      }
      // A revive from outside this file ends the death without the countdown, and the HUD must not be
      // left on the dead card because of it.
      if (wasDead) wasDead = false;
    },
    get wasDead() {
      return wasDead;
    },
  };
}
