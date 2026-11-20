// Air One, the police helicopter. It only flies once the wanted level hits
// three stars: it circles above the rooftops with a searchlight on Rico, and
// at four stars its spotter keeps the chase alive, so breaking sight no
// longer drops the heat on its own.
import {ConeGeometry,Group,Mesh,MeshBasicMaterial,MeshLambertMaterial,Vector3} from 'three';
import {AIR,PALETTE,POLICE} from './config.js';
import {merge,tintedBox} from './geometry.js';
const BODY_MATERIAL=new MeshLambertMaterial({vertexColors:true,flatShading:true});
const SHELL=merge([
  tintedBox(1.6,1.1,3.4,PALETTE.wallCream,0,0,0),
  tintedBox(1.2,0.7,1.4,'#232a36',0,0.35,-0.9),
  tintedBox(0.5,0.5,2.6,PALETTE.sirenBlue,0,0.1,2.6),
  tintedBox(1.7,0.18,0.5,PALETTE.sirenRed,0,0.62,0.4)]);
const ROTOR=merge([
  tintedBox(7.2,0.08,0.3,PALETTE.asphalt,0,0,0),
  tintedBox(0.3,0.08,7.2,PALETTE.asphalt,0,0,0)]);
const CONE=new ConeGeometry(4.5,26,12,1,true);
export function createAir({scene,player,police}){
  const group=new Group();
  const body=new Mesh(SHELL,BODY_MATERIAL);
  body.castShadow=true;
  group.add(body);
  const rotor=new Mesh(ROTOR,BODY_MATERIAL);
  rotor.position.y=0.75;
  group.add(rotor);
  const tail=new Mesh(ROTOR,BODY_MATERIAL);
  tail.scale.set(0.4,1,0.4);
  tail.position.set(0,0.2,4.4);
  group.add(tail);
  const lightMat=new MeshBasicMaterial({color:PALETTE.sun,transparent:true,opacity:0.16,depthWrite:false,side:2});
  const cone=new Mesh(CONE,lightMat);
  cone.position.y=-13.4;
  cone.rotation.x=Math.PI;
  group.add(cone);
  group.visible=false;
  scene.add(group);
  const pos=new Vector3(0,-100,0);
  let angle=0,spotted=false;
  const api={
    group,active:false,spotted:false,
    get position(){return pos;},
    update(dt){
      if(!(dt>0))return;
      const on=police.stars>=POLICE.heliStars;
      api.active=on;
      group.visible=on;
      if(!on){spotted=false;api.spotted=false;return;}
      angle+=dt*0.55;
      const px=player.position.x,pz=player.position.z;
      pos.set(px+Math.sin(angle)*16,AIR.height+player.position.y,pz+Math.cos(angle)*16);
      group.position.copy(pos);
      group.rotation.y=Math.atan2(-(px-pos.x),-(pz-pos.z));
      rotor.rotation.y+=dt*AIR.rotorSpeed;
      tail.rotation.y+=dt*AIR.rotorSpeed*0.6;
      cone.lookAt(px,player.position.y+1,pz);
      const dx=px-pos.x,dz=pz-pos.z;
      const inRange=Math.hypot(dx,dz)<=AIR.spotRange;
      if(police.stars>=4&&inRange){
        if(!spotted){spotted=true;api.spotted=true;}
        police.spot();
      }else if(spotted&&!inRange){spotted=false;api.spotted=false;}
    },
  };
  return api;
}
