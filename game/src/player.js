// Rico on foot: a welded body, a circle that slides along walls instead of
// through them, and a stride driven by the speed he is actually doing.
// The city owns the ground; every height comes from surfaceAt.
import {Group,Mesh,MeshLambertMaterial,Vector3} from 'three';
import {PALETTE,PLAYER,WORLD} from './config.js';
import {firstHit,merge,tintedBox,unstick} from './geometry.js';
const HIP=0.86,SHOULDER=0.5,HEAD=0.74;
const MATERIAL=new MeshLambertMaterial({vertexColors:true,flatShading:true});
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function torso(){
  return merge([
    tintedBox(0.44,0.5,0.27,PALETTE.sea,0,0.27,0),
    tintedBox(0.52,0.14,0.29,PALETTE.sea,0,0.5,0),
    tintedBox(0.46,0.1,0.28,PALETTE.roof,0,0.02,0)]);
}
function head(){
  return merge([
    tintedBox(0.24,0.26,0.24,PALETTE.sand,0,0,0),
    tintedBox(0.26,0.09,0.26,PALETTE.roof,0,0.16,0),
    tintedBox(0.2,0.05,0.03,PALETTE.asphalt,0,0.02,-0.12)]);
}
function arm(){
  return merge([
    tintedBox(0.15,0.34,0.17,PALETTE.sea,0,-0.17,0),
    tintedBox(0.12,0.28,0.13,PALETTE.sand,0,-0.46,0),
    tintedBox(0.13,0.1,0.15,PALETTE.sand,0,-0.65,0)]);
}
function leg(){
  return merge([
    tintedBox(0.17,0.72,0.2,PALETTE.asphalt,0,-0.36,0),
    tintedBox(0.19,0.14,0.3,PALETTE.roof,0,-0.79,-0.05)]);
}
function part(g){
  const m=new Mesh(g,MATERIAL);
  m.castShadow=true;
  return m;
}
const POSES={jump:[0.55,-0.35,-0.85,-0.85,-0.1],dead:[0.22,0.12,0.45,0.3,0.38]};
export function createPlayer({city,scene,spawn}){
  const group=new Group(),body=part(torso()),headM=part(head());
  const armL=part(arm()),armR=part(arm()),legL=part(leg()),legR=part(leg());
  body.position.y=HIP;
  headM.position.y=HEAD;
  armL.position.set(-0.31,SHOULDER,0);
  armR.position.set(0.31,SHOULDER,0);
  legL.position.set(-0.13,HIP,0);
  legR.position.set(0.13,HIP,0);
  body.add(headM,armL,armR);
  group.add(body,legL,legR);
  scene.add(group);
  const player={
    group,position:new Vector3(spawn.x,city.surfaceAt(spawn.x,spawn.z),spawn.z),
    velocity:new Vector3(),yaw:spawn.yaw,speed:0,state:'idle',
    radius:PLAYER.radius,height:PLAYER.height,colliders:city.colliders,update(){},
  };
  const from=new Vector3(),to=new Vector3();
  let grounded=true,stride=0;
  function slide(dx,dz){
    const len=Math.hypot(dx,dz);
    if(len<1e-7)return;
    from.set(player.position.x,player.position.y+PLAYER.stepHeight,player.position.z);
    to.set(from.x+dx,from.y,from.z+dz);
    const hit=firstHit(from,to,city.colliders,PLAYER.radius);
    if(hit>=1){player.position.x=to.x;player.position.z=to.z;return;}
    const safe=Math.max(0,hit-0.002/len);
    player.position.x=from.x+dx*safe;
    player.position.z=from.z+dz*safe;
  }
  function pushOut(){
    const s=unstick(player.position.x,player.position.z,PLAYER.radius,player.position.y+PLAYER.stepHeight,city.colliders);
    player.position.x=s.x;
    player.position.z=s.z;
  }
  function pose(dt){
    const speed=player.speed,swing=0.45*Math.min(1.6,speed/PLAYER.walkSpeed);
    stride=(stride+speed*2.2*dt)%(Math.PI*2);
    const a=Math.sin(stride)*swing,fixed=POSES[player.state];
    if(fixed){[legL.rotation.x,legR.rotation.x,armL.rotation.x,armR.rotation.x,body.rotation.x]=fixed;return;}
    legL.rotation.x=a;legR.rotation.x=-a;armL.rotation.x=-a*0.8;armR.rotation.x=a*0.8;
    body.rotation.x=-0.16*Math.min(1,speed/PLAYER.runSpeed);
  }
  function sync(){group.position.copy(player.position);group.rotation.y=player.yaw;}
  player.update=function update(dt,input,cameraYaw){
    if(player.state==='dead'){player.velocity.set(0,0,0);player.speed=0;pose(dt);sync();return;}
    if(player.state==='driving'||player.state==='sailing'){group.visible=false;sync();return;}
    group.visible=true;
    const floor=city.surfaceAt(player.position.x,player.position.z);
    if(player.position.y<=floor+0.02&&player.velocity.y<=0){player.position.y=floor;player.velocity.y=0;grounded=true;}
    const fwd=(input.isDown('KeyW')?1:0)-(input.isDown('KeyS')?1:0);
    const str=(input.isDown('KeyD')?1:0)-(input.isDown('KeyA')?1:0);
    let wx=0,wz=0;
    if(fwd||str){
      const s=Math.sin(cameraYaw),c=Math.cos(cameraYaw);
      wx=-s*fwd+c*str;
      wz=-c*fwd-s*str;
      const l=Math.hypot(wx,wz);
      wx/=l;wz/=l;
    }
    const running=input.isDown('ShiftLeft')||input.isDown('ShiftRight');
    const top=running?PLAYER.runSpeed:PLAYER.walkSpeed;
    const rate=wx||wz?PLAYER.acceleration:PLAYER.deceleration;
    const cx=wx*top-player.velocity.x,cz=wz*top-player.velocity.z,ch=Math.hypot(cx,cz),step=rate*dt;
    if(ch>step&&ch>1e-6){player.velocity.x+=(cx/ch)*step;player.velocity.z+=(cz/ch)*step;}
    else{player.velocity.x=wx*top;player.velocity.z=wz*top;}
    if(grounded&&input.wasPressed('Space')){player.velocity.y=PLAYER.jumpSpeed;grounded=false;}
    const sx=player.position.x,sz=player.position.z;
    slide(player.velocity.x*dt,0);
    slide(0,player.velocity.z*dt);
    pushOut();
    const here=city.surfaceAt(player.position.x,player.position.z);
    if(grounded){
      if(here>player.position.y+PLAYER.stepHeight){
        player.position.x=sx;player.position.z=sz;
        player.velocity.x=0;player.velocity.z=0;
      }
      else if(here>=player.position.y-PLAYER.stepHeight)player.position.y=here;
      else grounded=false;
    }
    if(!grounded){
      player.velocity.y-=WORLD.gravity*dt;player.position.y+=player.velocity.y*dt;
      const g=city.surfaceAt(player.position.x,player.position.z);
      if(player.position.y<=g&&player.velocity.y<=0){player.position.y=g;player.velocity.y=0;grounded=true;}
    }
    player.speed=Math.hypot(player.velocity.x,player.velocity.z);
    player.state=!grounded?'jump':player.speed>PLAYER.runSpeed*0.55?'run':player.speed>0.15?'walk':'idle';
    if(player.speed>0.2){
      const facing=Math.atan2(-player.velocity.x,-player.velocity.z),turn=PLAYER.turnRate*dt;
      player.yaw+=Math.max(-turn,Math.min(turn,wrap(facing-player.yaw)));
    }
    pose(dt);
    sync();
  };
  sync();
  return player;
}
