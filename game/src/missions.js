// Ten jobs for Sombra, in five kinds: walk to the ring, hold E to rob a
// shop, race three checkpoints in a car, outrun the law to a marker, drive a
// car to the pier, and sail a boat out past the breakwater. Each paid job
// adds REP; REP levels unlock weapons and faster cars.
import {CylinderGeometry,DoubleSide,Group,Mesh,MeshBasicMaterial,RingGeometry} from 'three';
import {MISSIONS,PALETTE,REP} from './config.js';
const STORY=[
  {title:'The Marina Errand',text:"Sombra's duffel sits under a tarp at the marina, out along the pier where the boats are tied. Take it and don't look at the boats.",areas:['pier'],type:'walk'},
  {title:'Word on the Promenade',text:'The fence drinks at the far end of the promenade, where the lamps stop. He wants the weight of the bag in his hand before he names a price.',areas:['promenade'],type:'walk'},
  {title:'Market Money',text:'The buyer counts his cash in the open air of the market, in the square where the stalls stand. Stand where he can see you and hold the bag still.',areas:['park','street'],type:'walk'},
  {title:'Downtown Drop',text:'The money goes downtown, to a man in a glass tower who never comes down to the street. He is not paying for the bag, he is paying for the silence.',areas:['street'],type:'walk'},
  {title:'Harbour Heist',text:'A shop on the harbour road keeps its till under the counter and its door unlocked at golden hour. Hold E at the door, take the cash, and be gone before the sirens find you.',areas:['street'],type:'rob'},
  {title:'Golden Mile',text:'Three checkpoints, seventy-five seconds, one borrowed car. Sombra wants to know if Rico can drive. The ring moves as you clear it — drive through all three.',areas:['street'],type:'race'},
  {title:'The Getaway',text:'The law is already on you — two stars and climbing. Lose them the only way that counts: reach the far marker before the minute runs out, car or no car.',areas:['promenade','street'],type:'getaway'},
  {title:"Smuggler's Run",text:'A car full of cargo waits on the grid. Take it, drive it to the pier, and do not stop for anyone. The job only counts while you are behind the wheel.',areas:['pier'],type:'drive'},
  {title:"The Fence's Boat",text:'The fence will only meet on the water. Take a boat from the pier and sail it out past the breakwater to the marker. The sea is yours if you can hold a course.',areas:['pier'],type:'boat'},
  {title:'The Breakwater',text:'Sombra waits at the breakwater, at the end of the pier where the water turns deep. He wants the last word, and he has brought a boat.',areas:['pier'],type:'walk'},
];
const HOLD='The police are on you. The handover can wait until they lose interest.';
const nearestOf=(list,v)=>{
  let best=list[0],gap=Math.abs(v-best);
  for(const e of list){const d=Math.abs(e-v);if(d<gap){gap=d;best=e;}}
  return best;
};
export function createMissions({city,scene,player,vehicles,police,hud,boats,combat}){
  const used=new Set();
  function takePoint(areas){
    for(const area of areas)for(let i=0;i<city.spawnPoints.length;i++){
      const p=city.spawnPoints[i];
      if(used.has(i)||p.kind!=='job'||p.area!==area)continue;
      used.add(i);
      return p;
    }
    for(let i=0;i<city.spawnPoints.length;i++){
      const p=city.spawnPoints[i];
      if(used.has(i)||p.kind!=='job')continue;
      used.add(i);
      return p;
    }
    return null;
  }
  const jobs=STORY.map((beat,id)=>{
    let point;
    if(beat.type==='rob')point=city.shops[0]||{x:player.position.x,z:player.position.z};
    else if(beat.type==='boat')point={x:city.boatSpots[2].x,z:city.boatSpots[2].z};
    else point=takePoint(beat.areas)||{x:player.position.x,z:player.position.z,area:'street'};
    const objective={x:point.x,y:beat.type==='boat'?0.4:city.surfaceAt(point.x,point.z),z:point.z,area:point.area||beat.areas[0]};
    return{id,title:beat.title,text:beat.text,area:objective.area,x:objective.x,z:objective.z,pay:MISSIONS.payouts[id],rep:MISSIONS.rep[id],type:beat.type,objective};
  });
  const state={cash:0,job:0,objective:0,active:false,done:false,paid:false,title:'',text:'',marker:null,rep:0,level:0,timer:0,robHold:0,cp:0,cpTotal:0};
  const paidFlags=jobs.map(()=>false);
  let clock=0,warned=false,raceHint=false;
  const marker=new Group();
  const ringMat=new MeshBasicMaterial({color:PALETTE.wantedGold,transparent:true,opacity:0.85,depthWrite:false,side:DoubleSide});
  const colMat=new MeshBasicMaterial({color:PALETTE.accent,transparent:true,opacity:0.14,depthWrite:false,side:DoubleSide});
  const ring=new Mesh(new RingGeometry(MISSIONS.markerRadius*0.74,MISSIONS.markerRadius,44),ringMat);
  ring.rotation.x=-Math.PI/2;
  ring.position.y=0.04;
  const col=new Mesh(new CylinderGeometry(MISSIONS.markerRadius*0.74,MISSIONS.markerRadius,MISSIONS.markerHeight,32,1,true),colMat);
  col.position.y=MISSIONS.markerHeight/2;
  marker.add(ring,col);
  marker.visible=false;
  scene.add(marker);
  const toast=t=>{if(hud&&typeof hud.toast==='function')hud.toast(t);};
  const withdraw=t=>{if(hud&&typeof hud.withdraw==='function')hud.withdraw(t);};
  function levelFor(rep){
    let l=0;
    for(let i=0;i<REP.thresholds.length;i++)if(rep>=REP.thresholds[i])l=i;
    return l;
  }
  function addRep(n){
    state.rep+=n;
    const l=levelFor(state.rep);
    if(l>state.level){
      state.level=l;
      if(combat)combat.unlockByRep(state.rep);
      if(vehicles)vehicles.setBoost(l);
      toast(`REP up: ${REP.levels[l]}. ${l>=1?'A new weapon is unlocked.':''} ${l>=2?'Cars run faster now.':''}`);
    }else if(combat)combat.unlockByRep(state.rep);
  }
  function addCash(n,label){
    state.cash+=n;
    toast(label?`${label} Paid $${n}. $${state.cash} in the bag.`:`Paid $${n}. $${state.cash} in the bag.`);
  }
  function announce(){
    const job=jobs[state.job];
    if(!job||(state.title===job.title&&state.text===job.text))return;
    state.title=job.title;
    state.text=job.text;
    toast(job.title);
  }
  function setMarker(x,y,z){
    state.marker={x,y,z};
    marker.position.set(x,y,z);
    marker.visible=true;
  }
  function raceCheckpoints(job){
    const base=job.objective;
    const pts=[[base.x+66,base.z],[base.x+66,base.z+66],[base.x,base.z+66]];
    return pts.map(([x,z])=>({x:nearestOf(city.roads.zRoads,x),z:nearestOf(city.roads.xRoads,z)}));
  }
  function markObjective(){
    const job=jobs[state.job];
    if(!job||!job.objective){state.marker=null;marker.visible=false;return;}
    if(job.type==='race'){
      const cps=raceCheckpoints(job);
      state.cpTotal=cps.length;
      const cp=cps[state.cp]||job.objective;
      setMarker(cp.x,city.surfaceAt(cp.x,cp.z),cp.z);
      return;
    }
    const s=job.objective;
    setMarker(s.x,s.y,s.z);
  }
  function payJob(i){
    if(paidFlags[i])return;
    paidFlags[i]=true;
    state.cash+=jobs[i].pay;
    addRep(jobs[i].rep);
  }
  function start(){
    if(state.active||state.done||paidFlags[state.job])return;
    state.active=true;state.objective=0;state.paid=false;
    state.robHold=0;state.cp=0;raceHint=false;
    const job=jobs[state.job];
    if(job.type==='race')state.timer=MISSIONS.raceSeconds;
    if(job.type==='getaway'){state.timer=MISSIONS.getawaySeconds;police.addHeat(80);}
    announce();
    markObjective();
  }
  function next(){
    if(state.active)payJob(state.job);
    state.marker=null;marker.visible=false;state.active=false;state.objective=0;state.timer=0;state.robHold=0;state.cp=0;
    if(state.job>=jobs.length-1){
      state.done=true;state.paid=paidFlags[state.job];
      return;
    }
    state.job+=1;
    state.paid=paidFlags[state.job];
    start();
  }
  function completeObjective(){
    if(!state.active||!state.marker)return;
    state.objective+=1;
    payJob(state.job);
    next();
  }
  function nearMarker(r=MISSIONS.reachRadius){
    if(!state.marker)return false;
    const dx=player.position.x-state.marker.x,dz=player.position.z-state.marker.z;
    return Math.hypot(dx,dz)<=r&&Math.abs(player.position.y-state.marker.y)<=2.5;
  }
  function update(dt,input){
    if(dt>0)clock+=dt;
    if(marker.visible){
      const pulse=0.5+0.5*Math.sin(clock*2.6);
      ringMat.opacity=0.55+pulse*0.35;
      colMat.opacity=0.08+pulse*0.1;
      ring.scale.setScalar(1+pulse*0.05);
    }
    if(police&&police.stars>0){
      if(!warned&&state.active&&state.marker){warned=true;toast(HOLD);}
    }else if(warned){warned=false;withdraw(HOLD);}
    if(!state.active||!state.marker)return;
    const job=jobs[state.job];
    if(job.type==='race'){
      state.timer-=dt;
      if(!vehicles.drivenCar&&!raceHint){raceHint=true;toast('Golden Mile needs a car. Take one with F.');}
      if(vehicles.drivenCar&&nearMarker(MISSIONS.reachRadius+1)){
        state.cp+=1;
        if(state.cp>=3){completeObjective();return;}
        markObjective();
        toast(`Checkpoint ${state.cp} of 3.`);
      }
      if(state.timer<=0){
        state.timer=MISSIONS.raceSeconds;
        state.cp=0;
        markObjective();
        toast('Too slow. The checkpoints are reset — go again.');
      }
      return;
    }
    if(job.type==='getaway'){
      state.timer-=dt;
      if(nearMarker()){completeObjective();return;}
      if(state.timer<=0){
        state.timer=MISSIONS.getawaySeconds;
        police.addHeat(80);
        toast('They boxed you in. The clock resets — run it again.');
      }
      return;
    }
    if(job.type==='rob'){
      if(nearMarker()){
        if(input&&input.isDown('KeyE')){
          state.robHold+=dt;
          if(state.robHold>=MISSIONS.robSeconds){
            police.addHeat(80);
            toast('Till emptied. Run.');
            completeObjective();
            return;
          }
        }else state.robHold=Math.max(0,state.robHold-dt*2);
      }else state.robHold=0;
      return;
    }
    if(job.type==='drive'){
      if(vehicles.drivenCar&&nearMarker()){completeObjective();return;}
      return;
    }
    if(job.type==='boat'){
      if(boats&&boats.boarded&&nearMarker(MISSIONS.reachRadius+2)){completeObjective();return;}
      return;
    }
    if(vehicles.drivenCar)return;
    if(nearMarker())completeObjective();
  }
  return{
    jobs,state,update,start,next,completeObjective,addCash,addRep,
    get repLevel(){return state.level;},
  };
}
