// The crowd on the sidewalks. A walker knows one thing: the kerb ring of his
// block and the road he may step across at a corner.
import {Mesh,MeshLambertMaterial,Vector3} from 'three';
import {CITY,PALETTE,PEDS} from './config.js';
import {createRandom} from './random.js';
import {merge,tintedBox,unstick} from './geometry.js';
const HALF=CITY.blockSize/2-CITY.sidewalkWidth/2,EDGE=HALF*2,PERIMETER=EDGE*4,PITCH=CITY.blockSize+CITY.roadWidth,CROSSING=PITCH-EDGE,HIP=0.86;
const SKIN=[PALETTE.sand,PALETTE.wallTan,PALETTE.wallCream];
const SHIRTS=[PALETTE.sea,PALETTE.sirenRed,PALETTE.wallStone,PALETTE.roadLineYellow,PALETTE.grass,PALETTE.wallCream,PALETTE.wallTan];
const TROUSERS=[PALETTE.asphalt,PALETTE.roof,PALETTE.wallStone,PALETTE.sea];
const HAIR=[PALETTE.roof,PALETTE.asphalt,PALETTE.wallTan];
const MATERIAL=new MeshLambertMaterial({vertexColors:true,flatShading:true});
const EDGE_DIR=[{x:1,z:0},{x:0,z:1},{x:-1,z:0},{x:0,z:-1}];
const norm=s=>{const t=s%PERIMETER;return t<0?t+PERIMETER:t;};
function ringPoint(b,s){
  const t=norm(s),e=Math.min(3,Math.floor(t/EDGE)),a=t-e*EDGE,minX=b.x-HALF,maxX=b.x+HALF,minZ=b.z-HALF,maxZ=b.z+HALF;
  if(e===0)return{x:minX+a,z:minZ};
  if(e===1)return{x:maxX,z:minZ+a};
  if(e===2)return{x:maxX-a,z:maxZ};
  return{x:minX,z:maxZ-a};
}
function ringS(b,x,z){
  const minX=b.x-HALF,maxX=b.x+HALF,minZ=b.z-HALF,maxZ=b.z+HALF;
  const cx=Math.min(maxX,Math.max(minX,x)),cz=Math.min(maxZ,Math.max(minZ,z));
  const w=cx-minX,e=maxX-cx,s=cz-minZ,n=maxZ-cz,least=Math.min(w,e,s,n);
  if(least===s)return w;
  if(least===e)return EDGE+s;
  if(least===n)return 2*EDGE+e;
  return 3*EDGE+n;
}
function nextCorner(s,dir){
  if(dir>0){const k=Math.floor(s/EDGE+1e-9);return Math.min(PERIMETER,(k+1)*EDGE);}
  const k=Math.ceil(s/EDGE-1e-9);return Math.max(0,(k-1)*EDGE);
}
function ringHeading(b,s,dir){
  const e=Math.min(3,Math.floor(norm(s)/EDGE)),d=EDGE_DIR[e];
  return Math.atan2(-d.x*dir,-d.z*dir);
}
const centreKey=(x,z)=>`${Math.round(x*10)}:${Math.round(z*10)}`;
function shell(skin,shirt,trousers,hair){
  return merge([
    tintedBox(0.44,0.5,0.27,shirt,0,HIP+0.27,0),tintedBox(0.52,0.14,0.29,shirt,0,HIP+0.5,0),
    tintedBox(0.46,0.1,0.28,trousers,0,HIP+0.02,0),
    tintedBox(0.15,0.34,0.17,shirt,-0.31,HIP+0.33,0),tintedBox(0.15,0.34,0.17,shirt,0.31,HIP+0.33,0),
    tintedBox(0.12,0.28,0.13,skin,-0.31,HIP+0.02,0),tintedBox(0.12,0.28,0.13,skin,0.31,HIP+0.02,0),
    tintedBox(0.24,0.26,0.24,skin,0,HIP+0.74,0),tintedBox(0.26,0.09,0.26,hair,0,HIP+0.9,0),
    tintedBox(0.2,0.05,0.03,PALETTE.asphalt,0,HIP+0.76,-0.12)]);
}
function legG(trousers,hair){
  return merge([tintedBox(0.17,0.72,0.2,trousers,0,-0.36,0),tintedBox(0.19,0.14,0.3,hair,0,-0.79,-0.05)]);
}
export function createPeds({city,scene,seed,player}){
  const rng=createRandom(seed),blocks=city.blocks,byCentre=new Map();
  for(const b of blocks)byCentre.set(centreKey(b.x,b.z),b);
  const variants=[];
  for(let i=0;i<7;i++)variants.push({shell:shell(rng.pick(SKIN),rng.pick(SHIRTS),rng.pick(TROUSERS),rng.pick(HAIR)),leg:legG(rng.pick(TROUSERS),rng.pick(HAIR))});
  const list=[];
  let runOver=null;
  const slideOut=(x,z)=>unstick(x,z,PEDS.radius,city.surfaceAt(x,z)+0.3,city.colliders);
  const nearestRing=(b,x,z)=>{const s=ringS(b,x,z),p=ringPoint(b,s);return{x:p.x,z:p.z,s};};
  const blockDist=(b,x,z)=>{const p=ringPoint(b,ringS(b,x,z));return Math.hypot(p.x-x,p.z-z);};
  function nearBlocks(){
    const out=[];let best=null;
    for(const b of blocks){
      const d=blockDist(b,player.position.x,player.position.z);
      if(d<=PEDS.respawnDistance*0.9)out.push({block:b,d});
      if(!best||d<best.d)best={block:b,d};
    }
    if(out.length===0&&best)out.push(best);
    return out;
  }
  function reset(ped,block,s){
    ped.block=block;ped.s=norm(s);ped.dir=rng.chance(0.5)?1:-1;ped.mode='ring';ped.state='walk';
    ped.health=100;ped.timer=0;ped.flee=0;ped.crossBlock=null;ped.crossCooldown=0;
    const p=ringPoint(block,ped.s);
    ped.position.x=p.x;ped.position.z=p.z;ped.position.y=city.surfaceAt(p.x,p.z);
    ped.heading=ringHeading(block,ped.s,ped.dir);
  }
  function crowded(x,z){
    for(const o of list)if(Math.hypot(o.position.x-x,o.position.z-z)<PEDS.radius*3)return true;
    return false;
  }
  function recycle(ped){
    const near=nearBlocks(),block=near.length?rng.pick(near).block:ped.block;
    for(let a=0;a<12;a++){
      const s=rng.range(0,PERIMETER),p=ringPoint(block,s);
      if(Math.hypot(p.x-player.position.x,p.z-player.position.z)>PEDS.respawnDistance*0.85)continue;
      if(crowded(p.x,p.z))continue;
      reset(ped,block,s);return;
    }
    const spot=nearestRing(block,player.position.x,player.position.z);
    for(let step=1;step<48;step++){
      const s=spot.s+step*PEDS.radius*3,p=ringPoint(block,s);
      if(crowded(p.x,p.z))continue;
      reset(ped,block,s);return;
    }
    reset(ped,block,spot.s);
  }
  function revive(ped){
    const spot=nearestRing(ped.block,ped.position.x,ped.position.z);
    ped.state='walk';ped.health=100;ped.timer=0;ped.flee=0;ped.mode='ring';ped.s=spot.s;
    ped.position.x=spot.x;ped.position.z=spot.z;ped.heading=ringHeading(ped.block,ped.s,ped.dir);
  }
  function knockDown(ped,car){
    ped.health=0;ped.state='down';ped.mode='ring';ped.flee=0;ped.timer=0;ped.crossBlock=null;
    if(car&&runOver)runOver(ped,car);
  }
  function beginCross(ped,corner){
    const e=ped.dir>0?(corner+3)%4:corner,d=EDGE_DIR[e],dx=d.x*ped.dir,dz=d.z*ped.dir;
    const next=byCentre.get(centreKey(ped.block.x+dx*PITCH,ped.block.z+dz*PITCH));
    if(!next)return false;
    const p=ringPoint(ped.block,corner*EDGE);
    ped.mode='cross';ped.crossBlock=next;ped.crossX=p.x+dx*CROSSING;ped.crossZ=p.z+dz*CROSSING;
    ped.crossCooldown=PEDS.crossCooldown;ped.position.x=p.x;ped.position.z=p.z;
    ped.heading=Math.atan2(-dx,-dz);
    return true;
  }
  function arriveCross(ped){
    ped.block=ped.crossBlock;ped.s=ringS(ped.block,ped.crossX,ped.crossZ);ped.mode='ring';ped.crossBlock=null;
    ped.position.x=ped.crossX;ped.position.z=ped.crossZ;
  }
  function walkRing(ped,dt){
    let s=norm(ped.s),left=PEDS.walkSpeed*dt,guard=0;
    while(left>1e-9&&guard++<4){
      if(ped.dir<0&&s<=1e-9)s=PERIMETER;
      const corner=nextCorner(s,ped.dir),gap=Math.abs(corner-s);
      if(left<gap){s+=ped.dir*left;break;}
      s=corner;left-=gap;
      const k=Math.round(norm(s)/EDGE)%4;
      if(ped.crossCooldown<=0&&rng.chance(PEDS.crossChance)&&beginCross(ped,k))return;
      s=norm(s);
    }
    ped.s=norm(s);
    const p=ringPoint(ped.block,ped.s),c=slideOut(p.x,p.z);
    ped.position.x=c.x;ped.position.z=c.z;ped.heading=ringHeading(ped.block,ped.s,ped.dir);
  }
  function walkCross(ped,dt){
    const dx=ped.crossX-ped.position.x,dz=ped.crossZ-ped.position.z,d=Math.hypot(dx,dz);
    if(d<1e-3){arriveCross(ped);return;}
    const step=Math.min(d,PEDS.walkSpeed*dt),c=slideOut(ped.position.x+(dx/d)*step,ped.position.z+(dz/d)*step);
    ped.position.x=c.x;ped.position.z=c.z;ped.heading=Math.atan2(-dx,-dz);
    if(Math.hypot(ped.crossX-c.x,ped.crossZ-c.z)<1e-3)arriveCross(ped);
  }
  function runFrom(ped,dt){
    let dx=ped.position.x-ped.alarmX,dz=ped.position.z-ped.alarmZ,d=Math.hypot(dx,dz);
    if(d<0.3){dx=ped.fleeX;dz=ped.fleeZ;d=1;}
    const step=PEDS.fleeSpeed*dt,c=slideOut(ped.position.x+(dx/d)*step,ped.position.z+(dz/d)*step);
    ped.position.x=c.x;ped.position.z=c.z;ped.heading=Math.atan2(-dx,-dz);
  }
  function returnToBeat(ped,dt){
    const spot=nearestRing(ped.block,ped.position.x,ped.position.z),dx=spot.x-ped.position.x,dz=spot.z-ped.position.z,d=Math.hypot(dx,dz);
    if(d<0.3){ped.mode='ring';ped.s=spot.s;ped.position.x=spot.x;ped.position.z=spot.z;ped.heading=ringHeading(ped.block,ped.s,ped.dir);return;}
    const step=Math.min(d,PEDS.walkSpeed*dt),c=slideOut(ped.position.x+(dx/d)*step,ped.position.z+(dz/d)*step);
    ped.position.x=c.x;ped.position.z=c.z;ped.heading=Math.atan2(-dx,-dz);
  }
  function scare(x,z,radius){
    for(const ped of list){
      if(ped.state==='down')continue;
      const dx=ped.position.x-x,dz=ped.position.z-z,d=Math.hypot(dx,dz);
      if(d>radius)continue;
      ped.state='flee';ped.flee=PEDS.alarmSeconds;ped.alarmX=x;ped.alarmZ=z;
      if(d>0.3){ped.fleeX=dx/d;ped.fleeZ=dz/d;}
      else{const a=rng.range(0,Math.PI*2);ped.fleeX=Math.sin(a);ped.fleeZ=Math.cos(a);}
    }
  }
  const sirenOn=car=>car.siren!==undefined?Boolean(car.siren):car.sirenOn!==undefined?Boolean(car.sirenOn):true;
  function reaches(car,ped){
    if(Math.abs(car.speed||0)<=PEDS.runOverSpeed)return false;
    if(Math.abs(ped.position.y-car.position.y)>1.2)return false;
    const s=Math.sin(car.heading||0),c=Math.cos(car.heading||0),dx=ped.position.x-car.position.x,dz=ped.position.z-car.position.z;
    const along=-s*dx-c*dz,across=c*dx-s*dz;
    const hw=(car.spec?car.spec.width:1.9)*0.5,hl=(car.spec?car.spec.length:4.6)*0.5;
    return Math.abs(along)<=hl+PEDS.radius&&Math.abs(across)<=hw+PEDS.radius;
  }
  function runDown(car){
    if(!car||!car.position)return;
    for(const ped of list)if(ped.state!=='down'&&reaches(car,ped))knockDown(ped,car);
  }
  function place(ped,dt){
    ped.position.y=city.surfaceAt(ped.position.x,ped.position.z);
    ped.mesh.position.copy(ped.position);
    if(ped.state==='down'){
      ped.mesh.position.y+=0.2;ped.mesh.rotation.set(-Math.PI/2,ped.heading,0);
      ped.legLeft.rotation.x=0;ped.legRight.rotation.x=0;return;
    }
    ped.mesh.rotation.set(0,ped.heading,0);
    ped.phase=(ped.phase+(ped.state==='flee'?PEDS.fleeSpeed:PEDS.walkSpeed)*2.6*dt)%(Math.PI*2);
    const sw=Math.sin(ped.phase)*0.5;
    ped.legLeft.rotation.x=sw;ped.legRight.rotation.x=-sw;
  }
  function update(dt,cars,policeCars){
    if(!(dt>0))return;
    for(const car of policeCars||[]){
      if(!car||!car.position||!sirenOn(car))continue;
      scare(car.position.x,car.position.z,PEDS.alarmRadius*0.5);
    }
    for(const ped of list){
      if(ped.state==='down'){
        ped.timer+=dt;
        if(ped.timer<PEDS.bodySeconds)continue;
        revive(ped);
      }
      if(ped.health<=0){knockDown(ped,null);continue;}
      if(ped.state==='flee'){
        ped.flee-=dt;
        if(ped.flee>0)runFrom(ped,dt);
        else{ped.state='walk';ped.mode='return';}
      }
      if(ped.state==='walk'){
        if(ped.mode==='cross')walkCross(ped,dt);
        else if(ped.mode==='return')returnToBeat(ped,dt);
        else walkRing(ped,dt);
      }
      if(ped.crossCooldown>0)ped.crossCooldown-=dt;
    }
    for(const car of cars||[])runDown(car);
    for(const car of policeCars||[])runDown(car);
    for(const ped of list){
      const far=Math.hypot(ped.position.x-player.position.x,ped.position.z-player.position.z);
      if(far>PEDS.respawnDistance)recycle(ped);
      place(ped,dt);
    }
  }
  for(let i=0;i<PEDS.count;i++){
    const v=rng.pick(variants),mesh=new Mesh(v.shell,MATERIAL);
    mesh.rotation.order='YXZ';mesh.castShadow=true;
    const legL=new Mesh(v.leg,MATERIAL),legR=new Mesh(v.leg,MATERIAL);
    legL.position.set(-0.13,HIP,0);legR.position.set(0.13,HIP,0);
    mesh.add(legL);mesh.add(legR);scene.add(mesh);
    const ped={position:new Vector3(),heading:0,state:'walk',health:100,mesh,legLeft:legL,legRight:legR,block:blocks[0],s:0,dir:1,mode:'ring',timer:0,flee:0,alarmX:0,alarmZ:0,fleeX:0,fleeZ:0,crossX:0,crossZ:0,crossBlock:null,crossCooldown:0,phase:rng.range(0,Math.PI*2)};
    recycle(ped);place(ped,0);list.push(ped);
  }
  return{list,update,alarm(x,z){scare(x,z,PEDS.alarmRadius);},onRunOver(fn){runOver=fn;}};
}
