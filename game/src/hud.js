// The face of the game: panels, four cards, and every sound, synthesised
// because the build has no assets and makes no request. The panel follows
// the frame, not the fixed step, because main calls update once per paint.
import {Vector3} from 'three';
import {CITY,COMBAT,HUD,PALETTE,REP} from './config.js';
const STAR_COUNT=5,TOAST_SECONDS=4.5,STEP_DISTANCE=1.15,MAP_MARGIN=2,MAP_RIM=9,MAP_DOT=3;
const ENGINE_IDLE=44,ENGINE_SPAN=96,ENGINE_GAIN=0.05,ENGINE_DRIVE=0.12,SIREN_GAIN=0.05;
const PITCH=CITY.blockSize+CITY.roadWidth,HALF_X=(CITY.gridX*PITCH)/2,HALF_Z=(CITY.gridZ*PITCH)/2;
const EDGE_X=HALF_X+CITY.roadWidth/2,EDGE_Z=HALF_Z+CITY.roadWidth/2;
const CONTROLS=[
  ['W A S D','walk / drive'],['Shift','run'],['Space','jump / handbrake'],
  ['Mouse','look'],['Left click','fire'],['R','reload'],
  ['1 2 3 / Q','switch weapon'],['F','take car / board boat'],
  ['E','interact'],['Enter','begin / confirm'],['Esc','pause']];
function element(tag,className,parent){
  const n=document.createElement(tag);
  if(className)n.className=className;
  if(parent)parent.appendChild(n);
  return n;
}
function injectStyle(){
  if(document.getElementById('ht-style'))return;
  const style=document.createElement('style');
  style.id='ht-style';
  style.textContent=`
#ht-hud{position:fixed;inset:0;pointer-events:none;user-select:none;font-family:${HUD.font};color:${PALETTE.text};-webkit-font-smoothing:antialiased;}
#ht-hud *{box-sizing:border-box;}
.ht-panel{background:${PALETTE.panel};border:1px solid rgba(242,163,94,0.28);border-radius:10px;padding:10px 12px;box-shadow:0 6px 22px rgba(0,0,0,0.35);}
.ht-job{position:absolute;left:${HUD.margin}px;top:${HUD.margin}px;width:${HUD.panelWidth}px;}
.ht-job-title{margin:0 0 5px;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:${PALETTE.accent};}
.ht-job-text{margin:0 0 9px;font-size:12.5px;line-height:1.45;color:${PALETTE.text};}
.ht-job-meta{margin:0;display:flex;justify-content:space-between;align-items:baseline;font-size:11.5px;letter-spacing:0.06em;color:${PALETTE.muted};}
.ht-cash{color:${PALETTE.cashGreen};font-weight:600;font-size:13px;}
.ht-rep{margin:6px 0 0;font-size:11.5px;letter-spacing:0.06em;color:${PALETTE.wantedGold};}
.ht-timer{margin:4px 0 0;font-size:12px;font-weight:600;color:${PALETTE.sirenRed};}
.ht-wanted{position:absolute;right:${HUD.margin}px;top:${HUD.margin}px;font-size:22px;letter-spacing:3px;line-height:1;transition:opacity 0.3s linear;}
.ht-star{color:rgba(244,239,230,0.3);text-shadow:0 1px 4px rgba(0,0,0,0.7);}
.ht-star.on{color:${PALETTE.wantedGold};text-shadow:0 0 10px rgba(245,196,81,0.55);}
.ht-wanted.ht-fading{opacity:0.45;}
.ht-air{position:absolute;left:50%;top:${HUD.margin}px;transform:translateX(-50%);padding:6px 14px;border-radius:999px;background:rgba(120,20,16,0.85);border:1px solid rgba(245,196,81,0.5);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#ffd9a0;display:none;}
.ht-air.show{display:block;}
.ht-status{position:absolute;left:${HUD.margin}px;bottom:${HUD.margin+ HUD.minimapSize+12}px;width:${HUD.minimapSize}px;padding:8px 10px;border-radius:10px;background:${PALETTE.panel};border:1px solid rgba(242,163,94,0.22);}
.ht-health-row{display:flex;align-items:center;gap:7px;margin-bottom:5px;}
.ht-heart{color:${PALETTE.healthRed};font-size:15px;line-height:1;}
.ht-health-track{flex:1;height:8px;border-radius:4px;overflow:hidden;background:rgba(244,239,230,0.16);border:1px solid rgba(0,0,0,0.35);}
.ht-health-fill{height:100%;width:100%;background:${PALETTE.healthRed};transition:width 0.12s linear;}
.ht-ammo{font-size:12px;letter-spacing:0.08em;color:${PALETTE.muted};}
.ht-ammo b{color:${PALETTE.text};font-weight:600;font-size:13px;}
.ht-weapons{font-size:11px;letter-spacing:0.05em;color:${PALETTE.muted};margin-top:4px;}
.ht-weapons .on{color:${PALETTE.accent};font-weight:600;}
.ht-map-wrap{position:absolute;left:${HUD.margin}px;bottom:${HUD.margin}px;width:${HUD.minimapSize}px;height:${HUD.minimapSize}px;border-radius:50%;overflow:hidden;border:1px solid rgba(242,163,94,0.35);box-shadow:0 8px 24px rgba(0,0,0,0.45);background:${PALETTE.panel};}
.ht-map{display:block;width:100%;height:100%;border-radius:50%;}
.ht-speed{position:absolute;right:${HUD.margin}px;bottom:${HUD.margin}px;min-width:132px;text-align:right;opacity:0;transition:opacity 0.18s linear;}
.ht-speed.show{opacity:1;}
.ht-speed-value{font-size:26px;font-weight:600;line-height:1;}
.ht-speed-unit{font-size:11px;letter-spacing:0.1em;color:${PALETTE.muted};margin-left:5px;}
.ht-speed-track{height:4px;margin-top:7px;border-radius:2px;overflow:hidden;background:rgba(244,239,230,0.16);}
.ht-speed-fill{height:100%;width:0;background:${PALETTE.accent};}
.ht-prompt{position:absolute;left:50%;bottom:29%;transform:translateX(-50%);padding:6px 14px;border-radius:999px;background:rgba(18,16,26,0.86);border:1px solid rgba(95,208,138,0.5);font-size:13px;color:#c9f2d6;display:none;}
.ht-prompt.show{display:block;}
.ht-toast{position:absolute;left:50%;bottom:22%;transform:translateX(-50%);max-width:70vw;padding:8px 16px;border-radius:999px;background:rgba(18,16,26,0.86);border:1px solid rgba(242,163,94,0.3);font-size:13px;line-height:1.35;text-align:center;opacity:0;transition:opacity 0.25s linear;}
.ht-toast.show{opacity:1;}
.ht-cards{position:absolute;inset:0;}
.ht-card{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(10,9,14,0.8);}
.ht-card.hidden{display:none;}
.ht-card-box{width:min(520px,86vw);padding:26px 30px;border-radius:16px;background:rgba(18,16,26,0.94);border:1px solid rgba(242,163,94,0.35);box-shadow:0 24px 60px rgba(0,0,0,0.55);}
.ht-card h1{margin:0 0 8px;font-size:34px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.accent};}
.ht-card h2{margin:0 0 10px;font-size:21px;letter-spacing:0.1em;text-transform:uppercase;color:${PALETTE.accent};}
.ht-card p{margin:0 0 12px;font-size:13.5px;line-height:1.6;color:${PALETTE.text};}
.ht-card .ht-hint{margin:0;font-size:11.5px;letter-spacing:0.12em;text-transform:uppercase;color:${PALETTE.muted};}
.ht-card .ht-big{font-size:30px;font-weight:600;color:${PALETTE.cashGreen};}
.ht-keys{display:grid;grid-template-columns:1fr 1fr;gap:5px 20px;margin:16px 0 18px;padding:0;list-style:none;font-size:12.5px;}
.ht-keys kbd{display:inline-block;min-width:62px;padding:1px 6px;margin-right:6px;border-radius:4px;background:rgba(244,239,230,0.12);font-family:inherit;font-size:11.5px;color:${PALETTE.accent};}
#ht-hud.ht-narrow .ht-job{width:46vw;}
#ht-hud.ht-narrow .ht-job-text{display:none;}
#ht-hud.ht-narrow .ht-wanted{font-size:16px;letter-spacing:1px;}
#ht-hud.ht-narrow .ht-speed{min-width:96px;}
#ht-hud.ht-narrow .ht-speed-value{font-size:20px;}
#ht-hud.ht-title-up .ht-job,#ht-hud.ht-title-up .ht-wanted,#ht-hud.ht-title-up .ht-status,#ht-hud.ht-title-up .ht-map-wrap,#ht-hud.ht-title-up .ht-speed,#ht-hud.ht-title-up .ht-toast,#ht-hud.ht-title-up .ht-prompt,#ht-hud.ht-title-up .ht-air{visibility:hidden;}
`;
  document.head.appendChild(style);
}
export function createHud({missions,combat,police,vehicles,player,air,boats,garage}){
  injectStyle();
  const root=element('div','');
  root.id='ht-hud';
  document.body.appendChild(root);
  const jobPanel=element('section','ht-panel ht-job',root),jobTitle=element('h2','ht-job-title',jobPanel);
  const jobText=element('p','ht-job-text',jobPanel),jobMeta=element('p','ht-job-meta',jobPanel);
  const cashLine=element('span','ht-cash',jobMeta),stepLine=element('span','ht-step',jobMeta);
  const repLine=element('p','ht-rep',jobPanel);
  const timerLine=element('p','ht-timer',jobPanel);
  const wanted=element('div','ht-wanted',root),stars=[];
  for(let i=0;i<STAR_COUNT;i++){const s=element('span','ht-star',wanted);s.textContent='☆';stars.push(s);}
  const airLine=element('div','ht-air',root);
  airLine.textContent='▲ Air One — helicopter overhead';
  const statusPanel=element('div','ht-status',root),healthRow=element('div','ht-health-row',statusPanel);
  element('span','ht-heart',healthRow).textContent='♥';
  const healthTrack=element('div','ht-health-track',healthRow);
  const healthFill=element('div','ht-health-fill',healthTrack);
  const ammoLine=element('div','ht-ammo',statusPanel),magValue=element('b','',ammoLine);
  const reserveValue=element('span','',ammoLine);
  magValue.textContent='0';
  reserveValue.textContent=' / 0';
  const weaponLine=element('div','ht-weapons',statusPanel);
  const mapWrap=element('div','ht-map-wrap',root),mapCanvas=element('canvas','ht-map',mapWrap);
  const dpr=Math.min(2,(typeof window!=='undefined'&&window.devicePixelRatio)||1);
  mapCanvas.width=Math.round(HUD.minimapSize*dpr);
  mapCanvas.height=Math.round(HUD.minimapSize*dpr);
  const mapCtx=mapCanvas.getContext('2d'),mapScale=(HUD.minimapSize/2-MAP_MARGIN)/HUD.minimapRange;
  const forward=new Vector3();
  const speedo=element('div','ht-panel ht-speed',root),speedValue=element('span','ht-speed-value',speedo);
  const speedUnit=element('span','ht-speed-unit',speedo);
  speedUnit.textContent='km/h';
  const speedTrack=element('div','ht-speed-track',speedo);
  const speedFill=element('div','ht-speed-fill',speedTrack);
  speedValue.textContent='0';
  const promptLine=element('div','ht-prompt',root);
  const toastLine=element('div','ht-toast',root);
  toastLine.setAttribute('aria-hidden','true');
  const live=document.getElementById('status');
  const cardLayer=element('div','ht-cards',root);
  function makeCard(className){
    const layer=element('div',`ht-card ${className}`,cardLayer);
    layer.classList.add('hidden');
    const box=element('div','ht-card-box',layer);
    return{layer,box};
  }
  const titleCard=makeCard('ht-card-title');
  element('h1','',titleCard.box).textContent='High Tide';
  element('p','',titleCard.box).textContent='Puerto Sol, golden hour. Ten jobs, one debt, a garage, four guns, a helicopter in the sky — and a harbour that never looks away.';
  const keyList=element('ul','ht-keys',titleCard.box);
  for(const [key,action] of CONTROLS){
    const item=element('li','',keyList);
    element('kbd','',item).textContent=key;
    item.appendChild(document.createTextNode(action));
  }
  element('p','ht-hint',titleCard.box).textContent='Click or press Enter to begin';
  const pauseCard=makeCard('ht-card-paused');
  element('h2','',pauseCard.box).textContent='Paused';
  element('p','',pauseCard.box).textContent='The city keeps turning without you.';
  element('p','ht-hint',pauseCard.box).textContent='Esc to resume';
  const deathCard=makeCard('ht-card-dead');
  element('h2','',deathCard.box).textContent='Rico is down';
  element('p','',deathCard.box).textContent='The harbour has its own way of ending an argument. He will be on his feet again in a moment.';
  element('p','ht-hint',deathCard.box).textContent='Respawning';
  const completeCard=makeCard('ht-card-complete');
  element('h2','',completeCard.box).textContent='The story ends';
  element('p','',completeCard.box).textContent='The marina, the promenade, the market, downtown, the heist, the race, the getaway, the smuggle, the boat and the breakwater: ten jobs, and a boat out of Puerto Sol.';
  const completeCash=element('p','ht-big',completeCard.box);
  completeCash.textContent='$0';
  element('p','ht-hint',completeCard.box).textContent='Esc to leave the harbour';
  const cards={title:titleCard,paused:pauseCard,dead:deathCard,complete:completeCard};
  let mode='title',clock=0,toastTimer=0,stepDistance=0,lastWidth=0,lastTitle=null,lastText=null;
  let lastCash=null,lastHealth=null,lastAmmo=null,lastStars=-1,lastSpeed=null,lastRep=null,lastTimer=null,lastWeapons=null,audio=null;
  function showCard(v){
    for(const name of Object.keys(cards))cards[name].layer.classList.toggle('hidden',name!==v);
    root.classList.toggle('ht-title-up',v==='title');
  }
  function createAudio(){
    const Ctor=typeof window!=='undefined'?window.AudioContext||window.webkitAudioContext:null;
    if(!Ctor)return null;
    const ctx=new Ctor(),master=ctx.createGain();
    master.gain.value=0.85;master.connect(ctx.destination);
    const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate),ctx.sampleRate),data=buffer.getChannelData(0);
    let noise=0x2545f491;
    for(let i=0;i<data.length;i++){
      noise^=noise<<13;noise>>>=0;noise^=noise>>>17;noise^=noise<<5;noise>>>=0;
      data[i]=(noise/4294967296)*2-1;
    }
    return{ctx,master,buffer,engine:null,siren:null};
  }
  function ensureEngine(){
    if(audio.engine)return audio.engine;
    const{ctx,master}=audio;
    const osc=ctx.createOscillator();osc.type='sawtooth';osc.frequency.value=ENGINE_IDLE;
    const sub=ctx.createOscillator();sub.type='square';sub.frequency.value=ENGINE_IDLE/2;
    const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=380;filter.Q.value=5;
    const gain=ctx.createGain();gain.gain.value=0;
    osc.connect(filter);sub.connect(filter);filter.connect(gain);gain.connect(master);
    osc.start();sub.start();
    audio.engine={osc,sub,gain};
    return audio.engine;
  }
  function ensureSiren(){
    if(audio.siren)return audio.siren;
    const{ctx,master}=audio;
    const osc=ctx.createOscillator();osc.type='square';osc.frequency.value=620;
    const lfo=ctx.createOscillator();lfo.type='sine';lfo.frequency.value=0.42;
    const depth=ctx.createGain();depth.gain.value=190;
    const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1500;
    const gain=ctx.createGain();gain.gain.value=0;
    lfo.connect(depth);depth.connect(osc.frequency);osc.connect(filter);filter.connect(gain);gain.connect(master);
    osc.start();lfo.start();
    audio.siren={osc,gain};
    return audio.siren;
  }
  function noiseBurst(type,frequency,q,level,seconds,offset){
    const{ctx,master,buffer}=audio,now=ctx.currentTime,source=ctx.createBufferSource();
    source.buffer=buffer;
    const filter=ctx.createBiquadFilter();filter.type=type;filter.frequency.value=frequency;filter.Q.value=q;
    const gain=ctx.createGain();
    gain.gain.setValueAtTime(level,now);gain.gain.exponentialRampToValueAtTime(0.0001,now+seconds);
    source.connect(filter);filter.connect(gain);gain.connect(master);
    source.start(now,offset%0.7,seconds+0.02);
  }
  function tone(type,from,to,level,seconds){
    const{ctx,master}=audio,now=ctx.currentTime,osc=ctx.createOscillator();
    osc.type=type;osc.frequency.setValueAtTime(from,now);osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),now+seconds);
    const gain=ctx.createGain();
    gain.gain.setValueAtTime(level,now);gain.gain.exponentialRampToValueAtTime(0.0001,now+seconds);
    osc.connect(gain);gain.connect(master);osc.start(now);osc.stop(now+seconds+0.02);
  }
  function playStep(){noiseBurst('bandpass',1150,1.1,0.1,0.09,clock*0.37);}
  function playShot(){noiseBurst('bandpass',2400,0.7,0.45,0.15,clock*0.11);tone('sine',150,46,0.3,0.16);}
  function playHit(){tone('sine',190,58,0.28,0.28);noiseBurst('lowpass',420,0.9,0.16,0.22,clock*0.53);}
  function playCrash(){noiseBurst('lowpass',1100,0.8,0.5,0.45,clock*0.71);tone('square',84,34,0.22,0.24);}
  function playCash(){tone('sine',660,660,0.2,0.1);tone('sine',880,880,0.2,0.16);}
  function sound(name){
    if(!audio)return;
    if(name==='engine')ensureEngine();
    else if(name==='siren')ensureSiren();
    else if(name==='step')playStep();
    else if(name==='shot')playShot();
    else if(name==='hit')playHit();
    else if(name==='crash')playCrash();
    else if(name==='cash')playCash();
  }
  function syncPower(){
    if(!audio)return;
    const{ctx}=audio;
    if(mode==='play'){if(ctx.state==='suspended')ctx.resume().catch(()=>{});}
    else if(ctx.state==='running')ctx.suspend().catch(()=>{});
  }
  function unlockAudio(){
    if(!audio)audio=createAudio();
    if(!audio)return;
    syncPower();
  }
  function syncLoops(dt){
    if(!audio)return;
    const now=audio.ctx.currentTime;
    const car=vehicles?vehicles.drivenCar:null;
    const boat=boats&&boats.boarded?boats.boarded:null;
    const moving=car||boat;
    if(moving){
      const engine=ensureEngine(),top=car?car.spec.maxSpeed:12,speed=Math.abs(moving.speed);
      const pace=Math.min(1,speed/Math.max(1,top));
      engine.osc.frequency.setTargetAtTime(ENGINE_IDLE+pace*ENGINE_SPAN,now,0.08);
      engine.sub.frequency.setTargetAtTime((ENGINE_IDLE+pace*ENGINE_SPAN)/2,now,0.08);
      engine.gain.gain.setTargetAtTime(ENGINE_GAIN+pace*ENGINE_DRIVE,now,0.12);
    }else if(audio.engine)audio.engine.gain.gain.setTargetAtTime(0.0001,now,0.15);
    if(police&&police.stars>0)ensureSiren().gain.gain.setTargetAtTime(SIREN_GAIN,now,0.2);
    else if(audio.siren)audio.siren.gain.gain.setTargetAtTime(0.0001,now,0.3);
    const walking=player.state!=='driving'&&player.state!=='sailing'&&player.state!=='dead'&&player.speed>0.4;
    if(walking){
      stepDistance+=player.speed*dt;
      if(stepDistance>=STEP_DISTANCE){stepDistance=0;playStep();}
    }else stepDistance=0;
  }
  function headingOf(camera){
    if(camera&&camera.quaternion){
      forward.set(0,0,-1).applyQuaternion(camera.quaternion);
      const flat=Math.hypot(forward.x,forward.z);
      if(flat>1e-6)return Math.atan2(-forward.x,-forward.z);
    }
    return player.yaw||0;
  }
  function drawMap(camera){
    if(!mapCtx)return;
    const size=HUD.minimapSize,centre=size/2,px=player.position.x,pz=player.position.z;
    const heading=headingOf(camera),cos=Math.cos(heading),sin=Math.sin(heading);
    mapCtx.setTransform(dpr,0,0,dpr,0,0);
    mapCtx.clearRect(0,0,size,size);
    mapCtx.save();
    mapCtx.beginPath();
    mapCtx.arc(centre,centre,centre-1,0,Math.PI*2);
    mapCtx.clip();
    mapCtx.fillStyle='#141220';
    mapCtx.fillRect(0,0,size,size);
    mapCtx.save();
    mapCtx.translate(centre,centre);
    mapCtx.rotate(heading);
    mapCtx.scale(mapScale,mapScale);
    mapCtx.translate(-px,-pz);
    mapCtx.fillStyle='rgba(232,217,189,0.16)';
    for(let j=0;j<CITY.gridZ;j++)for(let i=0;i<CITY.gridX;i++){
      const x=-HALF_X+PITCH/2+i*PITCH,z=-HALF_Z+PITCH/2+j*PITCH;
      mapCtx.fillRect(x-CITY.blockSize/2,z-CITY.blockSize/2,CITY.blockSize,CITY.blockSize);
    }
    mapCtx.strokeStyle='rgba(154,145,132,0.5)';
    mapCtx.lineWidth=CITY.roadWidth;
    mapCtx.beginPath();
    for(let i=0;i<=CITY.gridX;i++){const x=-HALF_X+i*PITCH;mapCtx.moveTo(x,-EDGE_Z);mapCtx.lineTo(x,EDGE_Z);}
    for(let j=0;j<=CITY.gridZ;j++){const z=-HALF_Z+j*PITCH;mapCtx.moveTo(-EDGE_X,z);mapCtx.lineTo(EDGE_X,z);}
    mapCtx.stroke();
    mapCtx.restore();
    const plot=(mx,mz,colour,r)=>{
      const dx=mx-px,dz=mz-pz;
      let sx=(dx*cos-dz*sin)*mapScale,sy=(dx*sin+dz*cos)*mapScale;
      const reach=Math.hypot(sx,sy),rim=centre-MAP_RIM;
      if(reach>rim){sx=(sx/reach)*rim;sy=(sy/reach)*rim;}
      mapCtx.fillStyle=colour;
      mapCtx.beginPath();
      mapCtx.arc(centre+sx,centre+sy,r,0,Math.PI*2);
      mapCtx.fill();
    };
    const marker=missions.state.marker;
    if(marker){
      const pulse=0.5+0.5*Math.sin(clock*3);
      mapCtx.globalAlpha=0.35+pulse*0.4;
      plot(marker.x,marker.z,PALETTE.wantedGold,5+pulse*3);
      mapCtx.globalAlpha=1;
      plot(marker.x,marker.z,PALETTE.wantedGold,MAP_DOT);
    }
    if(garage&&garage.race.active&&garage.marker())plot(garage.marker().x,garage.marker().z,PALETTE.cashGreen,4);
    if(garage)plot(garage.spot.x,garage.spot.z,PALETTE.cashGreen,3);
    if(boats)for(const b of boats.list)plot(b.position.x,b.position.z,'#3fa9c9',3);
    if(air&&air.active)plot(air.position.x,air.position.z,PALETTE.sirenRed,4);
    mapCtx.fillStyle='rgba(244,239,230,0.55)';
    mapCtx.font='9px system-ui, sans-serif';
    mapCtx.textAlign='center';
    mapCtx.textBaseline='middle';
    mapCtx.fillText('N',centre+sin*(centre-10),centre-cos*(centre-10));
    mapCtx.fillStyle=PALETTE.text;
    mapCtx.beginPath();
    mapCtx.moveTo(centre,centre-6);
    mapCtx.lineTo(centre+4.5,centre+5);
    mapCtx.lineTo(centre-4.5,centre+5);
    mapCtx.closePath();
    mapCtx.fill();
    mapCtx.restore();
  }
  function toast(text){
    toastLine.textContent=text;
    toastLine.classList.toggle('show',text!=='');
    toastTimer=text==='' ?0:TOAST_SECONDS;
    if(live)live.textContent=text;
  }
  function withdraw(text){if(toastLine.textContent===text)toast('');}
  function setPrompt(text){
    promptLine.textContent=text?`E — ${text}`:'';
    promptLine.classList.toggle('show',Boolean(text));
  }
  function setVisible(v){root.style.display=v?'':'none';}
  function update(dt,ctx){
    const step=dt>0?dt:0;
    clock+=step;
    const state=missions.state;
    if(state.title!==lastTitle){lastTitle=state.title;jobTitle.textContent=state.title||'No job yet';}
    if(state.text!==lastText){lastText=state.text;jobText.textContent=state.text||'Nobody in Puerto Sol has work for you yet.';}
    if(state.cash!==lastCash){
      if(lastCash!==null&&state.cash>lastCash){
        const paid=state.cash-lastCash;
        toast(state.done?`Paid $${paid}. $${state.cash} and a boat out of here.`:`Paid $${paid}. $${state.cash} in the bag.`);
        sound('cash');
      }
      lastCash=state.cash;
      cashLine.textContent=`$${state.cash}`;
      completeCash.textContent=`$${state.cash}`;
    }
    const steps=missions.jobs.length;
    const stepText=state.done?`${steps} jobs done`:`Job ${state.job+1} of ${steps}`;
    if(stepLine.textContent!==stepText)stepLine.textContent=stepText;
    const repText=`REP ${state.rep} · ${REP.levels[state.level]||'Runner'}`;
    if(repText!==lastRep){lastRep=repText;repLine.textContent=repText;}
    let timerText='';
    if(state.timer>0)timerText=`⏱ ${Math.ceil(state.timer)}s left`;
    else if(state.robHold>0)timerText=`Robbing… ${state.robHold.toFixed(1)}s / 3s`;
    else if(garage&&garage.race.active)timerText=`Race ⏱ ${Math.ceil(garage.race.timer)}s · checkpoint ${garage.race.cp+1}/3`;
    if(timerText!==lastTimer){lastTimer=timerText;timerLine.textContent=timerText;}
    const level=police?police.stars:0;
    if(level!==lastStars){
      for(let i=0;i<STAR_COUNT;i++){
        const earned=i<level;
        stars[i].classList.toggle('on',earned);
        stars[i].textContent=earned?'★':'☆';
      }
      lastStars=level;
    }
    wanted.classList.toggle('ht-fading',level>0&&police&&!police.seen);
    airLine.classList.toggle('show',Boolean(air&&air.active));
    const health=combat?Math.max(0,Math.min(COMBAT.health,combat.state.health)):0;
    const healthPercent=Math.round((100*health)/COMBAT.health);
    if(healthPercent!==lastHealth){healthFill.style.width=`${healthPercent}%`;lastHealth=healthPercent;}
    const ammo=combat?combat.state.ammo:0,reserve=combat?combat.state.reserve:0;
    const wname=combat?combat.weaponName:'Pistol';
    const ammoText=`${wname} ${ammo}/${reserve}`;
    if(ammoText!==lastAmmo){
      magValue.textContent=`${ammo}`;
      reserveValue.textContent=` / ${reserve} · ${wname}`;
      lastAmmo=ammoText;
    }
    if(combat){
      const wtext=combat.weapons.map(w=>w.unlocked?w.name:`${w.name} 🔒${w.rep}`).join(' · ');
      if(wtext!==lastWeapons){lastWeapons=wtext;weaponLine.textContent=wtext;}
    }
    const car=vehicles?vehicles.drivenCar:null;
    const boat=boats&&boats.boarded?boats.boarded:null;
    const moving=car||boat;
    if(moving){
      const top=car?car.spec.maxSpeed:12;
      const kmh=Math.round(Math.abs(moving.speed)*3.6);
      if(kmh!==lastSpeed){speedValue.textContent=`${kmh}`;lastSpeed=kmh;}
      const pace=Math.min(1,Math.abs(moving.speed)/Math.max(1,top));
      speedFill.style.width=`${(pace*100).toFixed(1)}%`;
      speedo.classList.add('show');
    }else{speedo.classList.remove('show');lastSpeed=null;}
    if(toastTimer>0){toastTimer-=step;if(toastTimer<=0)toastLine.classList.remove('show');}
    const width=ctx&&ctx.renderer&&ctx.renderer.domElement?ctx.renderer.domElement.clientWidth:0;
    if(width>0&&width!==lastWidth){lastWidth=width;root.classList.toggle('ht-narrow',width<760);}
    drawMap(ctx?ctx.camera:null);
    if(audio&&mode==='play')syncLoops(step);
  }
  showCard('title');
  return{
    update,setVisible,toast,withdraw,sound,unlockAudio,setPrompt,
    get mode(){return mode;},
    set mode(v){if(v===mode)return;mode=v;showCard(v);syncPower();},
  };
}
