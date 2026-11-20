// Four weapons, one barrel: pistol, shotgun, SMG and rifle, switched with
// 1/2/3 or cycled with Q. Rep unlocks the heavier ones. A round stops at the
// first wall, found with geometry.firstHit against city.colliders.
import {BoxGeometry,Mesh,MeshBasicMaterial,MeshLambertMaterial,Vector3} from 'three';
import {COMBAT,PALETTE,WEAPONS,WEAPON_ORDER} from './config.js';
import {firstHit,merge,tintedBox} from './geometry.js';
const CHEST=1.05,MUZZLE=0.45,FLASH_SECONDS=0.06,TRACER_SECONDS=0.09,SPARK_SECONDS=0.26,EFFECTS=8,PICKUP_RISE=0.3,BODY_SLACK=0.5;
const UP=new Vector3(0,1,0);
const AMMO_GEOMETRY=merge([
  tintedBox(0.34,0.2,0.26,'#4a5136',0,0.1,0),
  tintedBox(0.36,0.05,0.28,PALETTE.roadLineYellow,0,0.22,0),
  tintedBox(0.07,0.06,0.07,PALETTE.sun,0,0.26,0)]);
const AMMO_MATERIAL=new MeshLambertMaterial({vertexColors:true,flatShading:true});
const EFFECT_GEOMETRY=new BoxGeometry(1,1,1);
function makePart(scene,colour,seconds){
  const material=new MeshBasicMaterial({color:colour,transparent:true,opacity:1,depthWrite:false});
  const mesh=new Mesh(EFFECT_GEOMETRY,material);
  mesh.visible=false;mesh.frustumCulled=false;scene.add(mesh);
  return{mesh,material,timer:0,seconds};
}
export function createCombat({scene,player,camera,peds,city}){
  const mags={};
  for(const k of WEAPON_ORDER)mags[k]={ammo:k==='pistol'?COMBAT.magSize:0,reserve:k==='pistol'?COMBAT.ammoReserve:0};
  const state={health:COMBAT.health,dead:false,ammo:COMBAT.magSize,reserve:COMBAT.ammoReserve,weapon:'pistol',unlocked:{pistol:true,shotgun:false,smg:false,rifle:false}};
  const listeners=[],drops=[],effects=[];
  let cooldown=0,clock=0,effectCursor=0;
  let noise=0x2545f491;
  function scatter(){
    noise^=noise<<13;noise>>>=0;noise^=noise>>>17;noise^=noise<<5;noise>>>=0;
    return(noise/4294967296)*2-1;
  }
  for(let i=0;i<EFFECTS;i++)effects.push({flash:makePart(scene,PALETTE.sun,FLASH_SECONDS),tracer:makePart(scene,PALETTE.roadLineYellow,TRACER_SECONDS),spark:makePart(scene,PALETTE.sun,SPARK_SECONDS)});
  const from=new Vector3(),to=new Vector3(),end=new Vector3(),dir=new Vector3(),right=new Vector3(),lift=new Vector3(),body=new Vector3(),muzzle=new Vector3();
  const weapon=()=>WEAPONS[state.weapon];
  function syncMags(){mags[state.weapon].ammo=state.ammo;mags[state.weapon].reserve=state.reserve;}
  function switchWeapon(name){
    if(!WEAPONS[name]||!state.unlocked[name]||state.dead)return false;
    if(name===state.weapon)return true;
    syncMags();
    state.weapon=name;
    state.ammo=mags[name].ammo;state.reserve=mags[name].reserve;
    return true;
  }
  function cycleWeapon(){
    const unlocked=WEAPON_ORDER.filter(k=>state.unlocked[k]);
    if(unlocked.length<2)return false;
    const i=unlocked.indexOf(state.weapon);
    return switchWeapon(unlocked[(i+1)%unlocked.length]);
  }
  function unlockByRep(rep){
    let changed=false;
    for(const k of WEAPON_ORDER){
      if(!state.unlocked[k]&&rep>=WEAPONS[k].rep){
        state.unlocked[k]=true;
        mags[k].ammo=WEAPONS[k].magSize;mags[k].reserve=WEAPONS[k].magSize*2;
        if(k===state.weapon){state.ammo=mags[k].ammo;state.reserve=mags[k].reserve;}
        changed=true;
      }
    }
    return changed;
  }
  function fade(part,dt){
    if(part.timer<=0)return;
    part.timer=Math.max(0,part.timer-dt);
    if(part.timer<=0){part.mesh.visible=false;return;}
    part.material.opacity=part.timer/part.seconds;
  }
  function show(part,at,scale){
    part.mesh.position.copy(at);part.mesh.scale.setScalar(scale);
    part.mesh.visible=true;part.material.opacity=1;part.timer=part.seconds;
  }
  function flashAndTrace(start,finish,direction){
    const e=effects[effectCursor%EFFECTS];effectCursor+=1;
    muzzle.copy(start).addScaledVector(direction,MUZZLE);
    show(e.flash,muzzle,0.17+Math.abs(scatter())*0.05);
    const span=Math.max(0.05,muzzle.distanceTo(finish));
    e.tracer.mesh.position.copy(muzzle).add(finish).multiplyScalar(0.5);
    e.tracer.mesh.lookAt(finish);e.tracer.mesh.scale.set(0.035,0.035,span);
    e.tracer.mesh.visible=true;e.tracer.material.opacity=1;e.tracer.timer=e.tracer.seconds;
    show(e.spark,finish,0.18);
  }
  function targetInCone(reach){
    let target=null,nearest=Infinity;
    for(const ped of peds.list){
      if(!ped||ped.state==='down'||ped.health<=0)continue;
      body.set(ped.position.x-from.x,ped.position.y+CHEST-from.y,ped.position.z-from.z);
      const along=body.dot(dir);
      if(along<=MUZZLE||along>reach)continue;
      const lat=Math.sqrt(Math.max(0,body.lengthSq()-along*along));
      if(lat>BODY_SLACK+along*COMBAT.cone)continue;
      if(along<nearest){nearest=along;target=ped;}
    }
    return{target,distance:nearest};
  }
  function shoot(){
    if(state.dead||player.state==='driving'||player.state==='sailing')return false;
    const w=weapon();
    if(state.ammo<=0||cooldown>0)return false;
    state.ammo-=1;cooldown=w.fireInterval;
    dir.set(0,0,-1).applyQuaternion(camera.quaternion);
    right.crossVectors(dir,UP).normalize();
    lift.crossVectors(right,dir).normalize();
    from.copy(camera.position);
    let hit=false,killed=false,firstEnd=null,firstFrom=null;
    for(let p=0;p<w.pellets;p++){
      const d=dir.clone().addScaledVector(right,scatter()*w.spread).addScaledVector(lift,scatter()*w.spread).normalize();
      to.copy(from).addScaledVector(d,w.range);
      const reach=w.range*firstHit(from,to,city.colliders,0);
      const shot=targetInCone.call(null,reach);
      // targetInCone reads the shared dir/from, so point it at this pellet first
      end.copy(from).addScaledVector(d,reach);
      if(shot.target){
        hit=true;
        shot.target.health-=w.damage;
        killed=shot.target.health<=0;
        end.copy(from).addScaledVector(d,shot.distance);
      }
      flashAndTrace(from,end,d);
      if(p===0){firstEnd=end.clone();firstFrom=muzzle.clone();}
    }
    // Re-aim the shared vectors for the cone test above: pellets already fired
    // with their own clones; the report carries the first pellet's line.
    peds.alarm(player.position.x,player.position.z);
    const report={hit,killed,damage:w.damage,from:firstFrom||muzzle.clone(),to:firstEnd||end.clone()};
    for(const fn of listeners)fn(report);
    return true;
  }
  function reload(){
    if(state.dead)return 0;
    const w=weapon(),load=Math.min(w.magSize-state.ammo,state.reserve);
    if(load<=0)return 0;
    state.ammo+=load;state.reserve-=load;syncMags();
    return load;
  }
  function damage(amount){
    if(state.dead||!(amount>0))return;
    state.health=Math.max(0,state.health-amount);
    if(state.health<=0)state.dead=true;
  }
  function revive(){
    state.health=COMBAT.reviveHealth;state.dead=false;
    state.ammo=COMBAT.magSize;state.reserve=COMBAT.ammoReserve;
    mags.pistol.ammo=state.ammo;mags.pistol.reserve=state.reserve;
  }
  function removeDrop(i){scene.remove(drops[i].mesh);drops.splice(i,1);}
  function dropAmmo(x,z){
    while(drops.length>=COMBAT.maxDrops)removeDrop(0);
    const mesh=new Mesh(AMMO_GEOMETRY,AMMO_MATERIAL);
    mesh.castShadow=true;
    const ground=city.surfaceAt(x,z);
    mesh.position.set(x,ground+PICKUP_RISE,z);scene.add(mesh);
    drops.push({x,z,ground,mesh,spin:0});
  }
  function update(dt){
    if(dt>0){cooldown=Math.max(0,cooldown-dt);clock+=dt;}
    for(const e of effects){fade(e.flash,dt);fade(e.tracer,dt);fade(e.spark,dt);}
    for(let i=drops.length-1;i>=0;i--){
      const drop=drops[i];
      drop.spin+=dt*2.2;drop.mesh.rotation.y=drop.spin;
      drop.mesh.position.y=drop.ground+PICKUP_RISE+Math.sin(clock*3+drop.x)*0.07;
      const dx=player.position.x-drop.x,dz=player.position.z-drop.z;
      if(Math.hypot(dx,dz)>COMBAT.dropReach)continue;
      if(Math.abs(player.position.y-drop.ground)>1.6)continue;
      state.reserve+=weapon().magSize;syncMags();
      removeDrop(i);
    }
  }
  return{
    state,update,shoot,reload,damage,revive,switchWeapon,cycleWeapon,unlockByRep,
    get weaponName(){return weapon().name;},
    get weapons(){return WEAPON_ORDER.map(k=>({key:k,name:WEAPONS[k].name,unlocked:state.unlocked[k],rep:WEAPONS[k].rep}));},
    onFire(fn){if(typeof fn==='function')listeners.push(fn);},
    dropAmmo,
  };
}
