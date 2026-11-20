// Rico's garage and the street races that start outside it. The garage is
// the gold-roofed alley lot: E stores the car Rico is driving, E brings it
// back. The race posts are three junctions: E starts a three-checkpoint
// timed race that pays on a win and remembers the best time.
import {CylinderGeometry,DoubleSide,Group,Mesh,MeshBasicMaterial,RingGeometry} from 'three';
import {GARAGE,MISSIONS,PALETTE} from './config.js';
const nearestOf=(list,v)=>{
  let best=list[0],gap=Math.abs(v-best);
  for(const e of list){const d=Math.abs(e-v);if(d<gap){gap=d;best=e;}}
  return best;
};
export function createGarage({city,scene,player,vehicles,hud}){
  const spot={x:city.garage.x,z:city.garage.z};
  const state={stored:null,race:{active:false,post:0,cp:0,timer:0,best:0,elapsed:0},marker:null};
  let payCallback=null,toastFn=null;
  const toast=t=>{
    if(hud&&typeof hud.toast==='function')hud.toast(t);
    else if(toastFn)toastFn(t);
  };
  const marker=new Group();
  const ringMat=new MeshBasicMaterial({color:PALETTE.cashGreen,transparent:true,opacity:0.85,depthWrite:false,side:DoubleSide});
  const colMat=new MeshBasicMaterial({color:PALETTE.cashGreen,transparent:true,opacity:0.14,depthWrite:false,side:DoubleSide});
  const ring=new Mesh(new RingGeometry(MISSIONS.markerRadius*0.74,MISSIONS.markerRadius,44),ringMat);
  ring.rotation.x=-Math.PI/2;
  ring.position.y=0.04;
  const col=new Mesh(new CylinderGeometry(MISSIONS.markerRadius*0.74,MISSIONS.markerRadius,MISSIONS.markerHeight,32,1,true),colMat);
  col.position.y=MISSIONS.markerHeight/2;
  marker.add(ring,col);
  marker.visible=false;
  scene.add(marker);
  function nearPost(){
    for(let i=0;i<city.racePosts.length;i++){
      const p=city.racePosts[i];
      if(Math.hypot(player.position.x-p.x,player.position.z-p.z)<4)return i;
    }
    return -1;
  }
  function nearGarage(){
    return Math.hypot(player.position.x-spot.x,player.position.z-spot.z)<6;
  }
  function checkpoints(post){
    const p=city.racePosts[post];
    const pts=[[p.x+66,p.z],[p.x+66,p.z+66],[p.x,p.z+66]];
    return pts.map(([x,z])=>({x:nearestOf(city.roads.zRoads,x),z:nearestOf(city.roads.xRoads,z)}));
  }
  function markCheckpoint(){
    const race=state.race;
    if(!race.active){state.marker=null;marker.visible=false;return;}
    const cp=race.checkpoints[race.cp];
    if(!cp){state.marker=null;marker.visible=false;return;}
    state.marker={x:cp.x,y:city.surfaceAt(cp.x,cp.z),z:cp.z};
    marker.position.set(cp.x,state.marker.y,cp.z);
    marker.visible=true;
  }
  function startRace(post){
    if(state.race.active)return false;
    state.race={active:true,post,cp:0,timer:GARAGE.raceSeconds,best:state.race.best,elapsed:0,checkpoints:checkpoints(post)};
    markCheckpoint();
    toast('Street race: three checkpoints, sixty seconds. Go.');
    return true;
  }
  function interactLabel(){
    if(vehicles.drivenCar&&nearGarage())return 'Store car in garage';
    if(!vehicles.drivenCar&&state.stored&&nearGarage())return 'Retrieve stored car';
    if(!state.race.active&&nearPost()>=0)return 'Start street race';
    if(state.race.active)return 'Race: reach the green ring';
    return null;
  }
  function doInteract(){
    if(vehicles.drivenCar&&nearGarage()){
      const spec=vehicles.stash();
      if(spec){state.stored=spec;toast(`Stored the ${spec.name}. It will be here when you come back.`);return true;}
    }
    if(!vehicles.drivenCar&&state.stored&&nearGarage()){
      const spec=state.stored;
      state.stored=null;
      vehicles.spawnStored(spec,spot.x,spot.z+4);
      toast(`The ${spec.name} is back out.`);
      return true;
    }
    const post=nearPost();
    if(post>=0&&!state.race.active)return startRace(post);
    return false;
  }
  function update(dt){
    const race=state.race;
    if(!race.active)return;
    race.timer-=dt;
    race.elapsed+=dt;
    const cp=race.checkpoints[race.cp];
    if(cp){
      const d=Math.hypot(player.position.x-cp.x,player.position.z-cp.z);
      if(d<MISSIONS.reachRadius+1){
        race.cp+=1;
        if(race.cp>=race.checkpoints.length){
          race.active=false;marker.visible=false;state.marker=null;
          const won=race.elapsed;
          if(!race.best||won<race.best)race.best=won;
          if(payCallback)payCallback(GARAGE.racePay);
          toast(`Race won in ${won.toFixed(1)}s. Paid $${GARAGE.racePay}. Best ${race.best.toFixed(1)}s.`);
          return;
        }
        markCheckpoint();
        toast(`Checkpoint ${race.cp} of 3.`);
      }
    }
    if(race.timer<=0){
      race.active=false;marker.visible=false;state.marker=null;
      toast('Race over — too slow. The post is still there when you want it.');
    }
  }
  return{
    spot,state,marker:()=>state.marker,
    get stored(){return state.stored;},
    set stored(v){state.stored=v;},
    get race(){return state.race;},
    set raceBest(v){state.race.best=v;},
    get raceBest(){return state.race.best;},
    interactLabel,doInteract,startRace,update,
    onPay(fn){payCallback=typeof fn==='function'?fn:null;},
    onToast(fn){toastFn=typeof fn==='function'?fn:null;},
    nearPost,nearGarage,
  };
}
