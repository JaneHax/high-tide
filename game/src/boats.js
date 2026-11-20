// Boats on the harbour. Two tied at the piers and one drifting off the
// breakwater: F boards the nearest one like a car, W drives it, A/D steer it,
// and it floats on the water the city already built.
import {Group,Mesh,MeshLambertMaterial,Vector3} from 'three';
import {BOATS,PALETTE} from './config.js';
import {merge,tintedBox} from './geometry.js';
const MATERIAL=new MeshLambertMaterial({vertexColors:true,flatShading:true});
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function hull(colour){
  return merge([
    tintedBox(2.2,0.7,6.4,colour,0,0.35,0),
    tintedBox(1.9,0.5,5.6,PALETTE.wallCream,0,0.85,0.2),
    tintedBox(1.4,0.9,1.6,'#232a36',0,1.3,0.9),
    tintedBox(2.3,0.14,0.5,PALETTE.roof,0,0.72,-3.1),
    tintedBox(0.3,1.1,0.3,PALETTE.asphalt,0,1.6,-1.4)]);
}
export function createBoats({city,scene,player}){
  const list=[];
  const colours=[PALETTE.sea,PALETTE.wallCream,PALETTE.sirenRed];
  city.boatSpots.forEach((spot,i)=>{
    const body=new Group();
    const mesh=new Mesh(hull(colours[i%colours.length]),MATERIAL);
    mesh.castShadow=true;body.add(mesh);scene.add(body);
    list.push({
      position:new Vector3(spot.x,BOATS.floatY,spot.z),heading:i*1.3,speed:0,
      body,mesh,boarded:false,wake:0,
    });
  });
  let boarded=null,clock=0;
  function nearest(point,reach){
    let best=null,bestD=reach;
    for(const b of list){
      const d=Math.hypot(b.position.x-point.x,b.position.z-point.z);
      if(d<=bestD){bestD=d;best=b;}
    }
    return best;
  }
  function board(){
    if(boarded)return null;
    const b=nearest(player.position,BOATS.boardReach);
    if(!b)return null;
    b.boarded=true;boarded=b;b.speed=0;
    player.state='sailing';player.velocity.set(0,0,0);
    player.position.copy(b.position);player.yaw=b.heading;
    return b;
  }
  function leave(){
    if(!boarded)return null;
    const b=boarded;
    b.boarded=false;b.speed=0;boarded=null;
    // Step Rico onto the nearest pier deck if he is beside one, else the beach.
    const pier=city.piers.x.reduce((best,px)=>Math.abs(px-b.position.x)<Math.abs(best-b.position.x)?px:best,city.piers.x[0]);
    const onPier=Math.abs(b.position.x-pier)<=6&&b.position.z>=city.piers.endZ-2;
    const x=onPier?pier:b.position.x,z=onPier?Math.max(b.position.z,city.piers.endZ+2):Math.min(b.position.z,-286);
    player.position.set(x,city.surfaceAt(x,z),z);
    player.velocity.set(0,0,0);player.state='idle';
    return b;
  }
  function update(dt,input){
    clock+=dt;
    if(boarded){
      const throttle=input?input.isDown('KeyW'):false,brake=input?input.isDown('KeyS'):false;
      const steer=(input&&input.isDown('KeyA')?1:0)-(input&&input.isDown('KeyD')?1:0);
      if(throttle)boarded.speed=Math.min(BOATS.maxSpeed,boarded.speed+BOATS.accel*dt);
      else if(brake)boarded.speed=Math.max(0,boarded.speed-BOATS.accel*1.4*dt);
      else boarded.speed=Math.max(0,boarded.speed-1.2*dt);
      const bite=Math.min(1,Math.abs(boarded.speed)/3);
      boarded.heading=wrap(boarded.heading+steer*BOATS.turnRate*bite*Math.sign(boarded.speed||1)*dt);
      boarded.position.x+=-Math.sin(boarded.heading)*boarded.speed*dt;
      boarded.position.z+=-Math.cos(boarded.heading)*boarded.speed*dt;
      boarded.position.x=Math.max(-540,Math.min(540,boarded.position.x));
      boarded.position.z=Math.max(-430,Math.min(-284,boarded.position.z));
      player.position.copy(boarded.position);player.yaw=boarded.heading;
    }
    for(const b of list){
      b.position.y=BOATS.floatY+Math.sin(clock*1.1+b.position.x*0.05)*0.12;
      b.body.position.copy(b.position);
      b.body.rotation.set(Math.sin(clock*0.9+b.position.z*0.04)*0.03,b.heading,Math.sin(clock*0.7+b.position.x*0.03)*0.04);
    }
  }
  return{
    list,
    get boarded(){return boarded;},
    nearest,board,leave,update,
  };
}
