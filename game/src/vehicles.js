// The traffic that fills the streets and the car Rico can take. Every car
// is welded primitives with four wheels; every wheel reads its height from
// the city. The road graph cuts every segment at every crossing, because two
// roads that cross must share a node or a turning car teleports.
import {CylinderGeometry,Group,Mesh,MeshBasicMaterial,MeshLambertMaterial,Vector3} from 'three';
import {PALETTE,VEHICLES} from './config.js';
import {createRandom} from './random.js';
import {firstHit,merge,paint,tintedBox,unstick} from './geometry.js';
const BODY_MATERIAL=new MeshLambertMaterial({vertexColors:true,flatShading:true});
const LAMP_MATERIAL=new MeshBasicMaterial({vertexColors:true});
const GLASS='#232a36',TRIM='#191b22';
const TYPES=[
  ['sedan',4.4,1.86,1.3,0.8,0.95,1,[PALETTE.wallCream,PALETTE.wallTan,PALETTE.wallStone,PALETTE.sea]],
  ['coupe',4.2,1.84,1.16,1,1.1,1.1,[PALETTE.sirenRed,PALETTE.wallCream,PALETTE.sea]],
  ['van',5.6,2.05,2.05,0.62,0.7,0.8,[PALETTE.sea,PALETTE.wallTan,PALETTE.wallCream]],
  ['pickup',5.1,2,1.66,0.74,0.85,0.9,[PALETTE.wallTan,PALETTE.wallStone,PALETTE.roof]],
  ['taxi',4.6,1.9,1.4,0.78,1,1,[PALETTE.roadLineYellow]],
].map(([name,length,width,height,speed,accel,turn,colours])=>({name,length,width,height,maxSpeed:VEHICLES.maxSpeed*speed,accel:VEHICLES.accel*accel,turnRate:VEHICLES.turnRate*turn,colours}));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function approach(v,t,s){if(v<t)return Math.min(t,v+s);return Math.max(t,v-s);}
const headingOf=(dx,dz)=>Math.atan2(-dx,-dz);
function buildGraph(segments){
  const nodes=[],edges=[],lanes=[],lanesByNode=[],keys=new Map();
  const nodeAt=(x,z)=>{
    const key=`${Math.round(x*50)}:${Math.round(z*50)}`;
    let id=keys.get(key);
    if(id===undefined){id=nodes.length;nodes.push({x,z});lanesByNode.push([]);keys.set(key,id);}
    return id;
  };
  const addLane=(from,to,x1,z1,x2,z2,offset)=>{
    const len=Math.hypot(x2-x1,z2-z1);
    if(len<1e-6)return;
    const dx=(x2-x1)/len,dz=(z2-z1)/len,rx=-dz,rz=dx;
    const lane={from,to,x1:x1+rx*offset,z1:z1+rz*offset,x2:x2+rx*offset,z2:z2+rz*offset,dirX:dx,dirZ:dz,length:len,heading:headingOf(dx,dz)};
    lanes.push(lane);
    lanesByNode[from].push(lane);
  };
  for(const seg of segments){
    const dx=seg.x2-seg.x1,dz=seg.z2-seg.z1,len=Math.hypot(dx,dz);
    if(len<1e-6)continue;
    const cuts=[0,1];
    for(const o of segments){
      if(o===seg)continue;
      const ox=o.x2-o.x1,oz=o.z2-o.z1,den=dx*oz-dz*ox;
      if(Math.abs(den)<1e-9)continue;
      const t=((o.x1-seg.x1)*oz-(o.z1-seg.z1)*ox)/den,u=((o.x1-seg.x1)*dz-(o.z1-seg.z1)*dx)/den;
      if(t>1e-5&&t<1-1e-5&&u>-1e-5&&u<1+1e-5)cuts.push(t);
    }
    cuts.sort((a,b)=>a-b);
    const off=seg.width/4;
    let prev=null;
    for(const t of cuts){
      if(prev!==null&&t-prev.t<1e-5)continue;
      const x=seg.x1+dx*t,z=seg.z1+dz*t,id=nodeAt(x,z);
      if(prev!==null&&prev.id!==id){
        edges.push({a:prev.id,b:id,length:Math.hypot(x-prev.x,z-prev.z)});
        addLane(prev.id,id,prev.x,prev.z,x,z,off);
        addLane(id,prev.id,x,z,prev.x,prev.z,off);
      }
      prev={id,x,z,t};
    }
  }
  return{nodes,edges,lanes,lanesByNode};
}
function shellGeometry(spec){
  const r=VEHICLES.wheelRadius,bh=(spec.height-r)*0.52,ch=(spec.height-r)*0.48,cz=spec.length*0.03;
  const parts=[
    tintedBox(spec.width,bh,spec.length,spec.colour,0,r+bh/2,0),
    tintedBox(spec.width*0.86,ch,spec.length*0.46,GLASS,0,r+bh+ch/2,cz),
    tintedBox(spec.width*0.8,0.1,spec.length*0.4,spec.colour,0,r+bh+ch+0.03,cz),
    tintedBox(spec.width*0.9,0.12,spec.length*0.9,TRIM,0,r-0.02,0)];
  for(const s of [-1,1])parts.push(tintedBox(spec.width*1.02,0.22,0.3,TRIM,0,r+0.12,s*(spec.length/2-0.12)));
  return merge(parts);
}
function lampGeometry(spec){
  const r=VEHICLES.wheelRadius,y=r+(spec.height-r)*0.42,x=spec.width/2-0.3,parts=[];
  for(const s of [-1,1]){
    parts.push(tintedBox(0.36,0.16,0.08,PALETTE.sun,s*x,y,-spec.length/2+0.02));
    parts.push(tintedBox(0.34,0.14,0.08,PALETTE.sirenRed,s*x,y,spec.length/2-0.02));
  }
  return merge(parts);
}
function wheelGeometry(){
  const g=new CylinderGeometry(VEHICLES.wheelRadius,VEHICLES.wheelRadius,0.26,10);
  paint(g,'#14151a');
  g.rotateZ(Math.PI/2);
  return g;
}
const wheelSpots=spec=>{const x=spec.width/2-0.12,z=spec.length/2-1;return[[-x,-z],[x,-z],[-x,z],[x,z]];};
let sharedWheel=null;
export function createVehicles({city,scene,seed,player}){
  const rng=createRandom(seed),graph=buildGraph(city.roads.segments),lanes=graph.lanes,lanesByNode=graph.lanesByNode;
  const cars=[],meshes=new Map();
  let driven=null,hitCallback=null,trafficView=[],viewDirty=true,boost=1;
  function meshesFor(spec){
    const key=`${spec.name}:${spec.colour}`;
    let e=meshes.get(key);
    if(!e){
      if(!sharedWheel)sharedWheel=wheelGeometry();
      e={shell:shellGeometry(spec),lamps:lampGeometry(spec),wheel:sharedWheel};
      meshes.set(key,e);
    }
    return e;
  }
  function addCar(spec){
    const p=meshesFor(spec),body=new Group();
    body.rotation.order='YXZ';
    const shell=new Mesh(p.shell,BODY_MATERIAL);
    shell.castShadow=true;
    body.add(shell);
    const wheels=[];
    for(const [x,z] of wheelSpots(spec)){
      const w=new Mesh(p.wheel,BODY_MATERIAL);
      w.position.set(x,VEHICLES.wheelRadius,z);
      w.castShadow=true;
      body.add(w);
      wheels.push(w);
    }
    body.add(new Mesh(p.lamps,LAMP_MATERIAL));
    scene.add(body);
    const car={position:new Vector3(0,0,0),heading:0,speed:0,limit:spec.maxSpeed,spec,body,stolen:false,wheels,lane:null,piece:null,along:0,travel:0,cruise:0,pending:null,pushX:0,pushZ:0,still:0,cooldown:0,ai:true};
    cars.push(car);
    return car;
  }
  const lanePiece=lane=>({x1:lane.x1,z1:lane.z1,x2:lane.x2,z2:lane.z2,length:lane.length,heading:lane.heading,lane});
  function placeOnLane(car,lane,along){
    car.lane=lane;car.piece=lanePiece(lane);car.along=Math.max(0,Math.min(lane.length,along));
    car.pending=null;car.pushX=0;car.pushZ=0;car.heading=lane.heading;car.travel=lane.heading;
    const t=lane.length>1e-6?car.along/lane.length:0;
    car.position.x=lane.x1+(lane.x2-lane.x1)*t;car.position.z=lane.z1+(lane.z2-lane.z1)*t;
  }
  function syncPiece(car){
    const p=car.piece,t=p.length>1e-6?car.along/p.length:0;
    car.position.x=p.x1+(p.x2-p.x1)*t+car.pushX;
    car.position.z=p.z1+(p.z2-p.z1)*t+car.pushZ;
  }
  function beginLane(car,lane,fx,fz){
    const gap=Math.hypot(lane.x1-fx,lane.z1-fz);
    if(gap>0.08){
      car.lane=null;car.pending=lane;
      car.piece={x1:fx,z1:fz,x2:lane.x1,z2:lane.z1,length:gap,heading:headingOf((lane.x1-fx)/gap,(lane.z1-fz)/gap),lane:null};
      car.along=0;
      return;
    }
    car.lane=lane;car.pending=null;car.piece=lanePiece(lane);car.along=0;
  }
  function chooseLane(car,node){
    const opts=lanesByNode[node];
    if(!opts||opts.length===0)return null;
    const came=car.lane?car.lane.from:-1;
    const usable=opts.filter(l=>!(l.to===came)||opts.length===1);
    const pool=usable.length>0?usable:opts;
    if(pool.length===1)return pool[0];
    let total=0;
    const weights=pool.map(l=>{const w=Math.abs(wrap(l.heading-car.heading))<0.4?3:1;total+=w;return w;});
    let roll=rng.next()*total;
    for(let i=0;i<pool.length;i++){roll-=weights[i];if(roll<=0)return pool[i];}
    return pool[pool.length-1];
  }
  function advance(car,dist){
    let rem=dist,guard=0;
    while(rem>1e-5&&guard++<8){
      const left=car.piece.length-car.along;
      if(rem<left){car.along+=rem;break;}
      rem-=left;
      const ex=car.piece.x2,ez=car.piece.z2;
      car.along=car.piece.length;
      if(car.piece.lane){const n=chooseLane(car,car.piece.lane.to);if(!n)break;beginLane(car,n,ex,ez);}
      else if(car.pending)beginLane(car,car.pending,ex,ez);
      else break;
    }
    syncPiece(car);
  }
  function nearestLane(x,z,heading){
    let best=null;
    for(const lane of lanes){
      const dx=lane.x2-lane.x1,dz=lane.z2-lane.z1,l2=dx*dx+dz*dz;
      if(l2<1e-9)continue;
      let t=((x-lane.x1)*dx+(z-lane.z1)*dz)/l2;
      t=Math.max(0.02,Math.min(0.98,t));
      const px=lane.x1+dx*t,pz=lane.z1+dz*t;
      const cost=Math.hypot(x-px,z-pz)+Math.abs(wrap(lane.heading-heading))*2;
      if(!best||cost<best.cost)best={lane,t,cost};
    }
    return best;
  }
  function snapToLane(car){
    const s=nearestLane(car.position.x,car.position.z,car.heading);
    if(s)placeOnLane(car,s.lane,s.t*s.lane.length);
  }
  function clearAt(x,z,clearance,ignore){
    for(const o of cars)if(o!==ignore&&Math.hypot(o.position.x-x,o.position.z-z)<clearance)return false;
    return true;
  }
  function putOnNetwork(car,clearance){
    for(let a=0;a<60;a++){
      const lane=lanes[rng.intRange(0,lanes.length-1)],along=rng.range(1.5,Math.max(2,lane.length-1.5));
      const t=along/lane.length,x=lane.x1+(lane.x2-lane.x1)*t,z=lane.z1+(lane.z2-lane.z1)*t;
      if(!clearAt(x,z,clearance,car))continue;
      placeOnLane(car,lane,along);
      return true;
    }
    return false;
  }
  for(let i=0;i<VEHICLES.count*2;i++){
    const type=rng.pick(TYPES),{colours,...base}=type;
    const spec={...base,colour:rng.pick(colours)},car=addCar(spec);
    car.cruise=spec.maxSpeed*rng.range(VEHICLES.cruiseMin,VEHICLES.cruiseMax);
    car.limit=car.cruise;
    car.speed=car.cruise*0.7;
    if(!putOnNetwork(car,VEHICLES.spawnClearance))placeOnLane(car,lanes[0],2);
    car.still=0;
  }
  function carAhead(car){
    const fx=-Math.sin(car.heading),fz=-Math.cos(car.heading),rx=Math.cos(car.heading),rz=-Math.sin(car.heading);
    let best=null;
    for(const o of cars){
      if(o===car||!o.spec)continue;
      const dx=o.position.x-car.position.x,dz=o.position.z-car.position.z;
      const ahead=dx*fx+dz*fz;
      if(ahead<=0)continue;
      const lat=Math.abs(dx*rx+dz*rz);
      if(lat>(car.spec.width+o.spec.width)*0.5+0.3)continue;
      const gap=ahead-(car.spec.length+o.spec.length)*0.5;
      if(gap>16)continue;
      if(!best||gap<best.gap)best={gap,speed:o.speed,lane:o.lane};
    }
    return best;
  }
  function junctionBusy(car,x,z){
    for(const o of cars){
      if(o===car||o.lane===car.lane)continue;
      if(Math.hypot(o.position.x-x,o.position.z-z)<8)return true;
    }
    return false;
  }
  function driveTraffic(car,dt){
    let target=car.cruise;
    const ahead=carAhead(car);
    if(ahead){
      if(ahead.gap<=3)target=0;
      else target=Math.min(target,ahead.speed+(ahead.gap-3)*0.9);
    }
    const left=car.piece.length-car.along;
    if(left<11&&junctionBusy(car,car.piece.x2,car.piece.z2))target=Math.min(target,5);
    const rate=target>car.speed?car.spec.accel:VEHICLES.brake;
    car.speed=approach(car.speed,Math.max(0,target),rate*dt);
    car.limit=car.cruise;
    advance(car,car.speed*dt);
    const turn=Math.min(6,Math.max(1.6,Math.abs(car.speed)*0.45))*dt;
    car.heading+=Math.max(-turn,Math.min(turn,wrap(car.piece.heading-car.heading)));
    const decay=Math.max(0,1-2.2*dt);
    car.pushX*=decay;
    car.pushZ*=decay;
    if(car.cooldown>0)car.cooldown-=dt;
    const queued=ahead&&car.lane&&ahead.lane===car.lane;
    if(car.speed<0.5&&!queued)car.still+=dt;
    else car.still=0;
    if(car.still>VEHICLES.stuckSeconds){car.still=0;putOnNetwork(car,VEHICLES.spawnClearance);}
  }
  function drivePlayerCar(car,dt,input){
    const spec=car.spec,throttle=input?input.isDown('KeyW'):false,brake=input?input.isDown('KeyS'):false;
    const steer=(input&&input.isDown('KeyA')?1:0)-(input&&input.isDown('KeyD')?1:0);
    const handbrake=input?input.isDown('Space'):false;
    car.limit=spec.maxSpeed*boost;
    if(handbrake)car.speed=approach(car.speed,0,VEHICLES.brake*0.35*dt);
    else if(throttle)car.speed=Math.min(spec.maxSpeed*boost,car.speed+spec.accel*dt);
    else if(brake){
      if(car.speed>0.1)car.speed=Math.max(0,car.speed-VEHICLES.brake*dt);
      else car.speed=Math.max(-VEHICLES.reverseMax,car.speed-spec.accel*0.6*dt);
    }
    else car.speed=approach(car.speed,0,VEHICLES.friction*dt);
    const bite=Math.min(1,Math.abs(car.speed)/3);
    const grip=1-0.55*Math.min(1,Math.abs(car.speed)/spec.maxSpeed);
    const rate=spec.turnRate*grip*bite*(handbrake?1.7:1)*Math.sign(car.speed||1);
    car.heading=wrap(car.heading+steer*rate*dt);
    const follow=(handbrake?VEHICLES.handbrakeGrip:VEHICLES.grip)*dt;
    car.travel+=Math.max(-follow,Math.min(follow,wrap(car.heading-car.travel)));
    const dirX=-Math.sin(car.travel),dirZ=-Math.cos(car.travel),sx=dirX*car.speed*dt,sz=dirZ*car.speed*dt;
    if(sx!==0||sz!==0){
      from.set(car.position.x,car.position.y+0.7,car.position.z);
      to.set(from.x+sx,from.y,from.z+sz);
      const hit=firstHit(from,to,city.colliders,spec.width*0.45);
      if(hit<1){
        car.position.x=from.x+sx*Math.max(0,hit-0.01);
        car.position.z=from.z+sz*Math.max(0,hit-0.01);
        car.speed=0;
      }
      else{car.position.x=to.x;car.position.z=to.z;}
    }
    if(car.cooldown>0)car.cooldown-=dt;
  }
  function boxOverlap(a,b){    const sa=Math.sin(a.heading),ca=Math.cos(a.heading),sb=Math.sin(b.heading),cb=Math.cos(b.heading);
    const axes=[[-sa,-ca],[ca,-sa],[-sb,-cb],[cb,-sb]];
    const dx=b.position.x-a.position.x,dz=b.position.z-a.position.z;
    let smallest=null;
    const out=[];
    for(const axis of axes){
      const ax=axis[0],az=axis[1];
      const ra=(a.spec.length/2)*Math.abs(-sa*ax+-ca*az)+(a.spec.width/2)*Math.abs(ca*ax+-sa*az);
      const rb=(b.spec.length/2)*Math.abs(-sb*ax+-cb*az)+(b.spec.width/2)*Math.abs(cb*ax+-sb*az);
      const dist=dx*ax+dz*az,depth=ra+rb-Math.abs(dist);
      if(depth<=0)return null;
      const side=dist<0?-1:1,hit={depth,nx:ax*side,nz:az*side};
      out.push(hit);
      if(!smallest||depth<smallest.depth)smallest=hit;
    }
    return{axes:out,smallest};
  }
  function pushAxis(hit,vx,vz){
    const speed=Math.hypot(vx,vz);
    if(speed<0.5)return hit.smallest;
    let best=hit.smallest,bestDot=-Infinity;
    for(const axis of hit.axes){
      const dot=(axis.nx*vx+axis.nz*vz)/speed;
      if(dot>bestDot){bestDot=dot;best=axis;}
    }
    return best;
  }
  function shove(car,dx,dz){
    car.position.x+=dx;
    car.position.z+=dz;
    if(car.ai){car.pushX+=dx;car.pushZ+=dz;}
  }
  function resolveCollisions(){
    for(let i=0;i<cars.length;i++){
      const a=cars[i];
      if(!a.spec)continue;
      for(let j=i+1;j<cars.length;j++){
        const b=cars[j];
        if(!b.spec)continue;
        const reach=(a.spec.length+b.spec.length)*0.5,dx=b.position.x-a.position.x,dz=b.position.z-a.position.z;
        if(dx*dx+dz*dz>reach*reach)continue;
        const hit=boxOverlap(a,b);
        if(!hit)continue;
        const vx=-Math.sin(a.heading)*a.speed+Math.sin(b.heading)*b.speed;
        const vz=-Math.cos(a.heading)*a.speed+Math.cos(b.heading)*b.speed,axis=pushAxis(hit,vx,vz);
        const closing=Math.max(0,vx*axis.nx+vz*axis.nz);
        if(a===driven||b===driven){
          const winner=a===driven?a:b,other=a===driven?b:a,side=a===driven?1:-1;
          shove(other,axis.nx*side*(axis.depth+0.02),axis.nz*side*(axis.depth+0.02));
          winner.speed*=0.55;
          other.speed*=0.35;
          if(hitCallback&&other.cooldown<=0){other.cooldown=0.3;hitCallback(other,closing);}
        }else{
          shove(a,-axis.nx*axis.depth*0.5,-axis.nz*axis.depth*0.5);
          shove(b,axis.nx*axis.depth*0.5,axis.nz*axis.depth*0.5);
          a.speed*=0.7;
          b.speed*=0.7;
        }
      }
    }
  }
  function keepOffWalls(car){
    const s=unstick(car.position.x,car.position.z,car.spec.width*0.5,car.position.y+0.5,city.colliders);
    if(s.x!==car.position.x||s.z!==car.position.z)car.speed=0;
    car.position.x=s.x;
    car.position.z=s.z;
  }
  function sitOnGround(car,dt){
    const spec=car.spec,s=Math.sin(car.heading),c=Math.cos(car.heading),fx=-s,fz=-c,rx=c,rz=-s;
    const half=spec.length*0.36,side=spec.width*0.42,x=car.position.x,z=car.position.z;
    const fl=city.surfaceAt(x+fx*half-rx*side,z+fz*half-rz*side);
    const fr=city.surfaceAt(x+fx*half+rx*side,z+fz*half+rz*side);
    const rl=city.surfaceAt(x-fx*half-rx*side,z-fz*half-rz*side);
    const rr=city.surfaceAt(x-fx*half+rx*side,z-fz*half+rz*side);
    car.position.y=(fl+fr+rl+rr)/4;
    const pitch=Math.max(-0.22,Math.min(0.22,Math.atan2((fl+fr)/2-(rl+rr)/2,half*2)));
    const roll=Math.max(-0.22,Math.min(0.22,Math.atan2((fr+rr)/2-(fl+rl)/2,side*2)));
    car.body.position.copy(car.position);
    car.body.rotation.set(pitch,car.heading,roll);
    const spin=(car.speed*dt)/VEHICLES.wheelRadius;
    for(const w of car.wheels)w.rotation.x-=spin;
  }
  const from=new Vector3(),to=new Vector3();
  function blockedAt(x,z){
    const g=city.surfaceAt(x,z);
    for(const c of city.colliders){
      if(c.height<=g+0.3)continue;
      if(x>c.minX-0.5&&x<c.maxX+0.5&&z>c.minZ-0.5&&z<c.maxZ+0.5)return true;
    }
    return false;
  }
  function nearest(point,reach){
    let best=null,bestD=reach;
    for(const car of cars){
      const d=Math.hypot(car.position.x-point.x,car.position.z-point.z);
      if(d<=bestD){bestD=d;best=car;}
    }
    return best;
  }
  function enter(){
    if(driven)return null;
    const car=nearest(player.position,VEHICLES.enterReach);
    if(!car)return null;
    car.stolen=true;car.speed=0;car.travel=car.heading;car.limit=car.spec.maxSpeed*boost;
    car.pushX=0;car.pushZ=0;car.ai=false;driven=car;viewDirty=true;
    player.state='driving';player.velocity.set(0,0,0);
    player.position.copy(car.position);player.yaw=car.heading;
    return car;
  }
  function exit(){
    if(!driven)return null;
    const car=driven;
    car.speed=0;car.travel=car.heading;driven=null;viewDirty=true;car.ai=true;
    snapToLane(car);sitOnGround(car,0);
    const s=Math.sin(car.heading),c=Math.cos(car.heading),side=car.spec.width/2+0.9,behind=car.spec.length/2+0.9;
    const spots=[
      [car.position.x+c*side,car.position.z-s*side],
      [car.position.x-c*side,car.position.z+s*side],
      [car.position.x+s*behind,car.position.z+c*behind],
      [car.position.x-s*behind,car.position.z-c*behind]];
    let spot=spots[0];
    for(const cand of spots)if(!blockedAt(cand[0],cand[1])){spot=cand;break;}
    player.position.set(spot[0],city.surfaceAt(spot[0],spot[1]),spot[1]);
    player.velocity.set(0,0,0);
    player.state='idle';
    return car;
  }
  // Garage: park the driven car away and bring a stored one back.
  function stash(){
    if(!driven)return null;
    const car=driven,spec={name:car.spec.name,colour:car.spec.colour};
    scene.remove(car.body);
    cars.splice(cars.indexOf(car),1);
    driven=null;viewDirty=true;
    player.position.set(city.garage.x,city.surfaceAt(city.garage.x,city.garage.z),city.garage.z);
    player.velocity.set(0,0,0);player.state='idle';
    return spec;
  }
  function spawnStored(spec,x,z){
    const type=TYPES.find(t=>t.name===spec.name)||TYPES[0];
    const {colours,...base}=type;
    const car=addCar({...base,colour:spec.colour||colours[0]});
    car.position.set(x,city.surfaceAt(x,z),z);car.heading=0;car.travel=0;car.speed=0;
    car.cruise=car.spec.maxSpeed*0.7;car.limit=car.cruise;
    snapToLane(car);sitOnGround(car,0);
    return car;
  }
  function update(dt,input,onFoot){
    if(!(dt>0))return;
    if(driven)drivePlayerCar(driven,dt,input);
    for(const car of cars){
      if(car===driven||!car.ai)continue;
      driveTraffic(car,dt);
    }
    resolveCollisions();
    for(const car of cars){
      if(!car.spec)continue;
      keepOffWalls(car);
      sitOnGround(car,dt);
    }
    if(driven){
      player.position.copy(driven.position);
      player.yaw=driven.heading;
    }
  }
  const vehicles={
    cars,
    get traffic(){if(viewDirty){trafficView=cars.filter(c=>c!==driven);viewDirty=false;}return trafficView;},
    get drivenCar(){return driven;},
    update,enter,exit,nearest,stash,spawnStored,
    setBoost(level){boost=1+0.05*Math.max(0,level);},
    onHit(fn){hitCallback=fn;},
    roads:graph,
  };
  for(const car of cars)sitOnGround(car,0);
  return vehicles;
}
