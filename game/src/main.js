// HIGH TIDE's frame: the renderer, the golden-hour sky, the build order and
// the fixed-step loop. Every listener is added here, because input.js is the
// one module allowed to read the keyboard and the mouse.
import * as THREE from 'three';
import {CAMERA,PALETTE,POLICE,VEHICLES,WORLD} from './config.js';
import {buildPuertoSol} from './city.js';
import {createInput} from './input.js';
import {createPlayer} from './player.js';
import {createChaseCamera,createFollowCamera} from './camera.js';
import {createVehicles} from './vehicles.js';
import {createPeds} from './peds.js';
import {createCombat} from './combat.js';
import {createPolice} from './police.js';
import {createAir} from './air.js';
import {createBoats} from './boats.js';
import {createGarage} from './garage.js';
import {createMissions} from './missions.js';
import {createHud} from './hud.js';
import {createLifecycle} from './lifecycle.js';
const params=new URLSearchParams(window.location.search);
const seedParam=Number(params.get('seed'));
const seed=Number.isFinite(seedParam)&&params.get('seed')!==null?seedParam:1;
const manual=params.get('manual')==='1';
const fresh=params.get('fresh')==='1';
const canvas=document.getElementById('game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
renderer.setSize(window.innerWidth,window.innerHeight,false);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(PALETTE.fog,WORLD.fog.near,WORLD.fog.far);
scene.background=new THREE.Color(PALETTE.fog);
const camera=new THREE.PerspectiveCamera(CAMERA.fov,window.innerWidth/window.innerHeight,CAMERA.near,CAMERA.far);
const sunDirection=new THREE.Vector3(
  Math.cos(WORLD.sunElevation)*Math.sin(WORLD.sunAzimuth),
  Math.sin(WORLD.sunElevation),
  Math.cos(WORLD.sunElevation)*Math.cos(WORLD.sunAzimuth)).normalize();
const sun=new THREE.DirectionalLight(PALETTE.sun,WORLD.sunIntensity);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.bias=-0.0005;sun.shadow.normalBias=0.06;
const shadowCamera=sun.shadow.camera;
shadowCamera.left=-WORLD.shadowExtent;shadowCamera.right=WORLD.shadowExtent;
shadowCamera.top=WORLD.shadowExtent;shadowCamera.bottom=-WORLD.shadowExtent;
shadowCamera.near=1;shadowCamera.far=WORLD.sunDistance+WORLD.shadowExtent*2;
shadowCamera.updateProjectionMatrix();
scene.add(sun,sun.target);
const lightRight=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),sunDirection).normalize();
const lightUp=new THREE.Vector3().crossVectors(sunDirection,lightRight).normalize();
const TEXEL=(WORLD.shadowExtent*2)/2048;
const focus=new THREE.Vector3();
function aimSun(at){
  const right=Math.round(at.dot(lightRight)/TEXEL)*TEXEL,up=Math.round(at.dot(lightUp)/TEXEL)*TEXEL;
  focus.copy(lightRight).multiplyScalar(right).addScaledVector(lightUp,up).addScaledVector(sunDirection,at.dot(sunDirection));
  sun.target.position.copy(focus);
  sun.position.copy(focus).addScaledVector(sunDirection,WORLD.sunDistance);
  sun.target.updateMatrixWorld();
}
const sky=new THREE.Mesh(
  new THREE.SphereGeometry(WORLD.fog.far+60,32,20),
  new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,fog:false,
    uniforms:{
      skyWarm:{value:new THREE.Color(PALETTE.skyWarm)},
      skyCool:{value:new THREE.Color(PALETTE.skyCool)},
      sunColour:{value:new THREE.Color(PALETTE.sun)},
      sunDirection:{value:sunDirection.clone()}},
    vertexShader:`
varying vec3 vDir;
void main(){
  vDir=normalize(position);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}`,
    fragmentShader:`
uniform vec3 skyWarm;
uniform vec3 skyCool;
uniform vec3 sunColour;
uniform vec3 sunDirection;
varying vec3 vDir;
void main(){
  vec3 d=normalize(vDir);
  float height=clamp(d.y,-1.0,1.0);
  vec3 colour=mix(skyWarm,skyCool,smoothstep(0.0,0.6,height));
  colour=mix(colour,skyWarm*0.55,smoothstep(0.0,-0.3,height));
  float s=max(0.0,dot(d,normalize(sunDirection)));
  float disc=smoothstep(0.9976,0.9993,s);
  float glow=pow(s,60.0)*0.6+pow(s,8.0)*0.14;
  gl_FragColor=vec4(colour+sunColour*(disc*1.4+glow),1.0);
}`}));
sky.frustumCulled=false;sky.renderOrder=-1;scene.add(sky);
scene.add(new THREE.HemisphereLight(PALETTE.skyCool,PALETTE.wallTan,WORLD.ambient));
const city=buildPuertoSol(seed);
scene.add(city.group);
const spawnPoint=city.spawnPoints.find(p=>p.kind==='player')??city.spawnPoints[0];
const player=createPlayer({city,scene,spawn:spawnPoint});
const followCamera=createFollowCamera({camera,player});
const chaseCamera=createChaseCamera({camera,city});
const vehicles=createVehicles({city,scene,seed,player});
const peds=createPeds({city,scene,seed,player});
const combat=createCombat({scene,player,camera,peds,city});
const police=createPolice({city,scene,player,combat});
const air=createAir({scene,player,police});
const boats=createBoats({city,scene,player});
let hud=null;
const hudBridge={
  toast(t){if(hud)hud.toast(t);},
  withdraw(t){if(hud)hud.withdraw(t);},
};
const garage=createGarage({city,scene,player,vehicles,hud:hudBridge});
const missions=createMissions({city,scene,player,vehicles,police,hud:hudBridge,boats,combat});
garage.onPay(amount=>missions.addCash(amount,'Street race'));
hud=createHud({missions,combat,police,vehicles,player,air,boats,garage});
const lifecycle=createLifecycle({player,vehicles,police,combat,spawn:spawnPoint,followCamera,boats});
const input=createInput(canvas);
input.onGesture(()=>hud.unlockAudio());
vehicles.onHit(()=>hud.sound('crash'));
peds.onRunOver((ped,car)=>{if(car&&car===vehicles.drivenCar)police.addHeat(POLICE.heatKill);});
police.onDrop((x,z)=>combat.dropAmmo(x,z));
combat.onFire(()=>hud.sound('shot'));
const SAVE_KEY=`high-tide.save.v1.${seed}`;
let savedCash=0,savedRep=0;
function saveProgress(){
  const s=missions.state;
  const payload={cash:s.cash,job:s.job,objective:s.objective,done:s.done,paid:s.paid,rep:s.rep,stored:garage.stored,raceBest:garage.raceBest,unlocked:combat.state.unlocked};
  try{window.localStorage.setItem(SAVE_KEY,JSON.stringify(payload));}catch{}
}
function loadProgress(){
  try{
    if(fresh){window.localStorage.removeItem(SAVE_KEY);return null;}
    const raw=window.localStorage.getItem(SAVE_KEY);
    if(!raw)return null;
    const saved=JSON.parse(raw);
    return saved&&typeof saved==='object'?saved:null;
  }catch{return null;}
}
const saved=loadProgress();
if(saved){
  missions.state.cash=Number(saved.cash)||0;
  missions.state.job=Math.min(missions.jobs.length-1,Math.max(0,Math.round(Number(saved.job)||0)));
  missions.state.objective=Math.max(0,Math.round(Number(saved.objective)||0));
  missions.state.done=saved.done===true;
  missions.state.paid=saved.paid===true;
  missions.state.rep=Number(saved.rep)||0;
  missions.state.level=missions.state.rep>=130?3:missions.state.rep>=70?2:missions.state.rep>=30?1:0;
  combat.unlockByRep(missions.state.rep);
  if(saved.unlocked)for(const k of Object.keys(saved.unlocked))if(saved.unlocked[k])combat.state.unlocked[k]=true;
  vehicles.setBoost(missions.state.level);
  if(saved.stored)garage.stored=saved.stored;
  if(saved.raceBest)garage.raceBest=Number(saved.raceBest)||0;
  savedCash=missions.state.cash;savedRep=missions.state.rep;
}
const finished=Boolean(saved&&saved.done===true);
hud.mode=finished?'complete':manual?'play':'title';
if(hud.mode==='play')missions.start();
const FROZEN={
  isDown:()=>false,wasPressed:()=>false,mouse:{left:false,dx:0,dy:0},yawDelta:0,
  requestLock(){},endFrame(){},onGesture(){},
};
let triggerHeld=false,settle=0;
function begin(){
  if(hud.mode!=='title')return;
  hud.mode='play';triggerHeld=true;input.requestLock();missions.start();
}
function pause(){
  if(hud.mode!=='play'&&hud.mode!=='dead')return;
  saveProgress();hud.mode='paused';settle=0.3;
}
function resume(){
  if(hud.mode!=='paused')return;
  hud.mode=lifecycle.wasDead?'dead':'play';triggerHeld=true;input.requestLock();
}
// E is context interact: garage first, then a boat, then the job marker.
function currentInteract(){
  const label=garage.interactLabel();
  if(label)return{label,run:()=>garage.doInteract()};
  if(!vehicles.drivenCar&&!boats.boarded){
    const boat=boats.nearest(player.position,3.4);
    if(boat)return{label:'Board the boat',run:()=>{const b=boats.board();if(b)chaseCamera.reset(b);}};
  }
  const m=missions.state.marker;
  if(m&&missions.state.active){
    const d=Math.hypot(player.position.x-m.x,player.position.z-m.z);
    const job=missions.jobs[missions.state.job];
    if(d<4&&job){
      if(job.type==='walk')return{label:'Talk to the contact',run:()=>hud.toast(job.text)};
      if(job.type==='drive')return{label:'This job needs a car',run:()=>hud.toast('Smuggler\'s Run only counts behind the wheel.')};
      if(job.type==='boat')return{label:'This job needs a boat',run:()=>hud.toast('Take a boat from the pier.')};
    }
  }
  return null;
}
function step(dt=WORLD.step){
  if(!(dt>0))return;
  if(manual)frameDt=dt;
  if(hud.mode==='paused'||hud.mode==='title'||hud.mode==='complete'){
    if(manual)input.endFrame();
    return;
  }
  lifecycle.update(dt);
  hud.mode=lifecycle.wasDead?'dead':'play';
  const live=lifecycle.wasDead?FROZEN:input,health=combat.state.health,rounds=police.shots;
  if(live===input){
    if(input.wasPressed('KeyR'))combat.reload();
    if(input.wasPressed('Digit1'))combat.switchWeapon('pistol');
    if(input.wasPressed('Digit2'))combat.switchWeapon('shotgun');
    if(input.wasPressed('Digit3'))combat.switchWeapon('smg');
    if(input.wasPressed('KeyQ'))combat.cycleWeapon();
    if(input.wasPressed('KeyE')){
      const it=currentInteract();
      if(it)it.run();
    }
    if(input.wasPressed('KeyF')){
      if(boats.boarded){boats.leave();followCamera.snap(player);}
      else if(vehicles.drivenCar){vehicles.exit();followCamera.snap(player);}
      else{
        const boat=boats.nearest(player.position,3.4);
        if(boat){const b=boats.board();if(b)chaseCamera.reset(b);}
        else{
          const target=vehicles.nearest(player.position,VEHICLES.enterReach);
          const freshCar=target!==null&&!target.stolen;
          const car=vehicles.enter();
          if(car){if(freshCar)police.addHeat(POLICE.heatCrime);chaseCamera.reset(car);}
        }
      }
    }
    if(input.mouse.left&&!triggerHeld)combat.shoot();
    if(!input.mouse.left)triggerHeld=false;
  }
  if(boats.boarded)chaseCamera.update(dt,live,boats.boarded);
  else if(vehicles.drivenCar)chaseCamera.update(dt,live,vehicles.drivenCar);
  else followCamera.update(dt,live,player);
  player.update(dt,live,followCamera.yaw);
  vehicles.update(dt,live,player.state!=='driving');
  boats.update(dt,live);
  peds.update(dt,vehicles.traffic,police.cars);
  combat.update(dt);
  police.update(dt);
  air.update(dt);
  missions.update(dt,live);
  garage.update(dt);
  city.tick(dt);
  aimSun(player.position);
  if(combat.state.health<health)hud.sound('hit');
  if(police.shots>rounds)hud.sound('shot');
  const it=currentInteract();
  hud.setPrompt(it?it.label:null);
  if(missions.state.cash>savedCash||missions.state.rep>savedRep){
    savedCash=missions.state.cash;savedRep=missions.state.rep;
    saveProgress();
  }
  if(missions.state.done&&hud.mode==='play'){hud.mode='complete';saveProgress();}
  if(manual)input.endFrame();
}
function render(){
  hud.update(frameDt,{input,camera,renderer});
  aimSun(player.position);
  sky.position.copy(camera.position);
  renderer.render(scene,camera);
}
let accumulator=0,frameDt=0,last=performance.now();
function frame(now){
  const dt=Math.max(0,(now-last)/1000);
  last=now;frameDt=dt;
  settle=Math.max(0,settle-dt);
  if(settle<=0&&input.wasPressed('Escape')){
    if(hud.mode==='play'||hud.mode==='dead')pause();
    else if(hud.mode==='paused')resume();
  }
  if(dt<=0.25){
    accumulator+=dt;
    let slices=0;
    while(accumulator>=WORLD.step&&slices<8){step(WORLD.step);accumulator-=WORLD.step;slices+=1;}
    if(slices===8)accumulator=0;
  }else accumulator=0;
  render();
  input.endFrame();
  requestAnimationFrame(frame);
}
window.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  if(hud.mode==='title')begin();
  else if(hud.mode==='paused')resume();
});
window.addEventListener('keydown',event=>{
  if(event.code==='Enter'){
    if(hud.mode==='title')begin();
    else if(hud.mode==='paused')resume();
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('resize',()=>{
  renderer.setSize(window.innerWidth,window.innerHeight,false);
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
});
aimSun(player.position);
render();
if(!manual)requestAnimationFrame(frame);
const game={
  THREE,scene,renderer,camera,city,player,followCamera,chaseCamera,input,
  vehicles,peds,combat,police,air,boats,garage,missions,hud,step,render,
  teleport(x,z){
    player.position.set(x,city.surfaceAt(x,z),z);
    player.velocity.set(0,0,0);
    followCamera.snap(player);
  },
  setStars(n){police.addHeat(n*POLICE.heatPerStar);},
};
Object.defineProperties(game,{
  traffic:{get:()=>vehicles.traffic,enumerable:true},
  drivenCar:{get:()=>vehicles.drivenCar,enumerable:true},
  mode:{get:()=>hud.mode,enumerable:true},
});
window.game=game;
