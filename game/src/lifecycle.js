// Death and respawn, kept out of the frame loop so the rule runs without
// a browser. Dying drops Rico out of whatever he was driving or sailing.
import {COMBAT,WORLD} from './config.js';
export function createLifecycle({player,vehicles,police,combat,spawn,followCamera,boats}){
  const spawnY=player.position.y;
  let wasDead=false,remaining=0;
  function die(){
    wasDead=true;remaining=COMBAT.respawnSeconds;
    if(boats&&boats.boarded)boats.leave();
    if(vehicles.drivenCar)vehicles.exit();
    player.state='dead';player.velocity.set(0,0,0);player.speed=0;police.clear();
  }
  function respawn(){
    if(boats&&boats.boarded)boats.leave();
    if(vehicles.drivenCar)vehicles.exit();
    combat.revive();
    player.position.set(spawn.x,spawnY,spawn.z);
    player.velocity.set(0,0,0);player.speed=0;player.state='idle';
    police.clear();followCamera.snap(player);wasDead=false;remaining=0;
  }
  return{
    update(dt=WORLD.step){
      if(combat.state.dead){
        if(!wasDead){die();return;}
        remaining-=dt>0?dt:0;
        if(remaining<=0)respawn();
        return;
      }
      if(wasDead)wasDead=false;
    },
    get wasDead(){return wasDead;},
  };
}
