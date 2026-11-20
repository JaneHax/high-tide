// Puerto Sol, the static harbour city. One seed lays one city from the
// seeded stream, so a screenshot and a bug are both repeatable, and every
// height is answered by surfaceAt — the player, the cars and a mission
// marker must all agree on where the ground is.
import {BoxGeometry,BufferGeometry,Color,ConeGeometry,Float32BufferAttribute,Group,InstancedMesh,Mesh,MeshBasicMaterial,MeshLambertMaterial,Object3D,PlaneGeometry,ShaderMaterial} from 'three';
import {CITY,PALETTE,WORLD} from './config.js';
import {createRandom} from './random.js';
import {merge,paint,tintedBox} from './geometry.js';
const PITCH=CITY.blockSize+CITY.roadWidth,HALF_X=(CITY.gridX*PITCH)/2,HALF_Z=(CITY.gridZ*PITCH)/2;
const EDGE_X=HALF_X+CITY.roadWidth/2,EDGE_Z=HALF_Z+CITY.roadWidth/2,ROAD_HALF=CITY.roadWidth/2,KERB=CITY.kerbHeight;
const LOT_HALF=CITY.blockSize/2-CITY.sidewalkWidth-CITY.lotInset;
const PROMENADE_Z=-EDGE_Z-CITY.promenadeWidth,PROMENADE_Y=CITY.promenadeHeight;
const WALL_THICKNESS=1.4,WALL_Z=PROMENADE_Z-WALL_THICKNESS;
const BEACH_TOP_Y=0.3,WET_Z=WALL_Z-CITY.beachWidth*0.55,WET_Y=0.06,BEACH_END_Z=WET_Z-CITY.beachWidth*0.25,BEACH_EDGE_Y=-0.18,DEEP_Z=BEACH_END_Z-26,SHORE_X=560;
const PIER_Y=CITY.pierHeight,PIER_X=[-2*PITCH,2*PITCH],PIER_END_Z=PROMENADE_Z-CITY.dockLength;
const HILL_COLOUR=PALETTE.hill,SCRUB_COLOUR='#7c7259';
function beachHeight(z){
  if(z>=WET_Z)return BEACH_TOP_Y+(WET_Y-BEACH_TOP_Y)*((WALL_Z-z)/(WALL_Z-WET_Z));
  if(z>=BEACH_END_Z)return WET_Y+(BEACH_EDGE_Y-WET_Y)*((WET_Z-z)/(WET_Z-BEACH_END_Z));
  if(z>=DEEP_Z)return BEACH_EDGE_Y+(CITY.seabed-BEACH_EDGE_Y)*((BEACH_END_Z-z)/(BEACH_END_Z-DEEP_Z));
  return CITY.seabed;
}
function surfaceAt(x,z){
  if(z<PROMENADE_Z){
    for(let i=0;i<PIER_X.length;i++)if(z>=PIER_END_Z&&Math.abs(x-PIER_X[i])<=CITY.dockWidth/2)return PIER_Y;
    return beachHeight(z);
  }
  if(z<=-EDGE_Z)return PROMENADE_Y;
  if(z>EDGE_Z||Math.abs(x)>EDGE_X)return 0;
  const ix=Math.round((x+HALF_X)/PITCH);
  if(ix>=0&&ix<=CITY.gridX&&Math.abs(x-(-HALF_X+ix*PITCH))<=ROAD_HALF)return 0;
  const iz=Math.round((z+HALF_Z)/PITCH);
  if(iz>=0&&iz<=CITY.gridZ&&Math.abs(z-(-HALF_Z+iz*PITCH))<=ROAD_HALF)return 0;
  return KERB;
}
function quad(a,b,c,d,colour){
  const g=new BufferGeometry();
  g.setAttribute('position',new Float32BufferAttribute([...a,...b,...c,...a,...c,...d],3));
  g.computeVertexNormals();
  paint(g,colour);
  return g;
}
function runsBetween(from,to,cuts,clear){
  const out=[];
  let at=from;
  for(const cut of cuts){
    const s=cut-clear,e=cut+clear;
    if(e<=at)continue;
    if(s>=to)break;
    if(s>at)out.push([at,s]);
    at=Math.max(at,e);
  }
  if(at<to)out.push([at,to]);
  return out;
}
const shade=(colour,f)=>new Color(colour).multiplyScalar(f);
export function buildPuertoSol(seed){
  const rng=createRandom(seed),group=new Group();
  const solid=new MeshLambertMaterial({vertexColors:true,flatShading:true});
  const zRoads=Array.from({length:CITY.gridX+1},(_,i)=>-HALF_X+i*PITCH);
  const xRoads=Array.from({length:CITY.gridZ+1},(_,j)=>-HALF_Z+j*PITCH);
  const blocks=[];
  for(let j=0;j<CITY.gridZ;j++)for(let i=0;i<CITY.gridX;i++){
    const x=-HALF_X+PITCH/2+i*PITCH,z=-HALF_Z+PITCH/2+j*PITCH,roll=rng.next();
    let kind='built';
    if(roll<CITY.parkChance)kind='park';
    else if(roll<CITY.parkChance+CITY.alleyChance)kind='alley';
    if(kind==='built'&&j===0)kind='dock';
    blocks.push({x,z,width:CITY.blockSize,depth:CITY.blockSize,kind,carpark:false});
  }
  for(const b of blocks)if(b.kind==='alley')b.carpark=rng.chance(CITY.propChance);
  const parkCount=()=>blocks.filter(b=>b.kind==='park').length;
  if(parkCount()<4){
    const spare=blocks.filter(b=>b.kind==='built'||b.kind==='dock').sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z));
    for(let k=0;k<4-parkCount()&&k<spare.length;k++)spare[k].kind='park';
  }
  const garageBlock=blocks.find(b=>b.kind==='alley'&&b.carpark)||blocks.find(b=>b.kind==='alley')||blocks[0];
  const buildingParts=[],pavingParts=[],markingParts=[],propParts=[],waterfrontParts=[],hillParts=[];
  const buildings=[],colliders=[];
  const windowMatrices=[],windowColours=[],dummy=new Object3D();
  const litColour=new Color('#ffd7a1'),dimColour=new Color('#39415a'),darkColour=new Color('#161d2e');
  const addWindows=b=>{
    const top=KERB+b.height,floors=Math.floor((b.height-2.2)/3.1);
    if(floors<1)return;
    const faces=[
      {ox:b.width/2+0.09,oz:0,rot:Math.PI/2,span:b.depth,alongZ:true},
      {ox:-b.width/2-0.09,oz:0,rot:-Math.PI/2,span:b.depth,alongZ:true},
      {ox:0,oz:b.depth/2+0.09,rot:0,span:b.width,alongZ:false},
      {ox:0,oz:-b.depth/2-0.09,rot:Math.PI,span:b.width,alongZ:false}];
    for(const f of faces){
      const cols=Math.max(1,Math.floor((f.span-1.6)/2.7));
      for(let fl=0;fl<floors;fl++){
        const y=KERB+2.4+fl*3.1;
        if(y+0.8>top)break;
        for(let c=0;c<cols;c++){
          if(windowMatrices.length>11000)return;
          const along=(c-(cols-1)/2)*2.7;
          dummy.position.set(b.x+f.ox+(f.alongZ?0:along),y,b.z+f.oz+(f.alongZ?along:0));
          dummy.rotation.set(0,f.rot,0);
          dummy.updateMatrix();
          windowMatrices.push(dummy.matrix.clone());
          const roll=rng.next(),col=roll<0.3?litColour:roll<0.55?dimColour:darkColour;
          windowColours.push(col.clone().multiplyScalar(0.85+rng.next()*0.3));
        }
      }
    }
  };
  const addBuildings=block=>{
    const nx=rng.chance(0.5)?2:1,nz=rng.chance(0.5)?2:1,gap=2.2;
    const cellW=(LOT_HALF*2-gap*(nx-1))/nx,cellD=(LOT_HALF*2-gap*(nz-1))/nz;
    const core=Math.max(0,1-Math.hypot(block.x,block.z)/300),tall=0.8+1.7*Math.pow(core,1.5);
    for(let cz=0;cz<nz;cz++)for(let cx=0;cx<nx;cx++){
      if(nx*nz>1&&rng.chance(0.14))continue;
      const x=block.x-LOT_HALF+cellW/2+cx*(cellW+gap),z=block.z-LOT_HALF+cellD/2+cz*(cellD+gap);
      const width=cellW*rng.range(0.7,0.94),depth=cellD*rng.range(0.7,0.94);
      let kind;
      if(block.kind==='dock')kind='warehouse';
      else if(core>0.3&&rng.chance(0.08+0.6*core))kind='tower';
      else kind=rng.chance(0.55)?'shop':'house';
      let height;
      if(kind==='tower')height=rng.range(17,27)*tall;
      else if(kind==='shop')height=rng.range(6.5,10)*(0.9+0.6*core);
      else if(kind==='house')height=rng.range(5,8.5)*(0.9+0.5*core);
      else height=rng.range(6,9.5);
      const face=rng.pick([PALETTE.wallCream,PALETTE.wallTan,PALETTE.wallStone]);
      const body=shade(face,rng.range(0.92,1.04)),roof=shade(PALETTE.roof,rng.range(0.9,1.12)),plinth=shade(face,0.82);
      buildingParts.push(tintedBox(width,height,depth,body,x,KERB+height/2,z));
      buildingParts.push(tintedBox(width+0.5,0.45,depth+0.5,roof,x,KERB+height+0.2,z));
      buildingParts.push(tintedBox(width+0.2,1.1,depth+0.2,plinth,x,KERB+0.55,z));
      const rec={x,z,width,depth,height,kind};
      buildings.push(rec);
      colliders.push({minX:x-width/2,maxX:x+width/2,minZ:z-depth/2,maxZ:z+depth/2,height:KERB+height+0.45});
      addWindows(rec);
    }
  };
  const lotColour=b=>{
    if(b.kind==='park')return shade(PALETTE.grass,0.95);
    if(b.kind==='alley')return shade(PALETTE.asphalt,1.12);
    if(b.kind==='dock')return shade(PALETTE.sidewalk,0.94);
    return shade(PALETTE.sidewalk,1.06);
  };
  for(const b of blocks){
    const inner=CITY.blockSize-CITY.sidewalkWidth*2,edge=CITY.blockSize/2-CITY.sidewalkWidth/2;
    const strips=[[CITY.blockSize,CITY.sidewalkWidth,0,edge],[CITY.blockSize,CITY.sidewalkWidth,0,-edge],[CITY.sidewalkWidth,inner,-edge,0],[CITY.sidewalkWidth,inner,edge,0]];
    for(const [w,d,dx,dz] of strips)pavingParts.push(tintedBox(w,0.3,d,PALETTE.sidewalk,b.x+dx,KERB-0.15,b.z+dz));
    pavingParts.push(tintedBox(inner,0.3,inner,lotColour(b),b.x,KERB-0.16,b.z));
    if(b.kind==='built'||b.kind==='dock')addBuildings(b);
  }
  // Garage canopy: a gold roof over the alley lot so the garage reads on sight.
  propParts.push(tintedBox(16,0.5,12,PALETTE.wantedGold,garageBlock.x,KERB+3.4,garageBlock.z));
  for(const s of [-1,1]){
    propParts.push(tintedBox(0.4,3.4,0.4,PALETTE.asphalt,garageBlock.x+s*7.5,KERB+1.7,garageBlock.z-5));
    propParts.push(tintedBox(0.4,3.4,0.4,PALETTE.asphalt,garageBlock.x+s*7.5,KERB+1.7,garageBlock.z+5));
  }
  const markingY=0.015,clearOfJunction=ROAD_HALF+3.6,laneOffset=ROAD_HALF/2;
  for(const alongX of [true,false]){
    const roads=alongX?xRoads:zRoads,cuts=alongX?zRoads:xRoads,span=alongX?EDGE_X:EDGE_Z;
    for(const centre of roads){
      for(const run of runsBetween(-span,span,cuts,clearOfJunction)){
        for(let a=run[0]+1.6;a+1.6<=run[1];a+=8){
          for(const side of [-1,1]){
            const at=centre+side*laneOffset;
            markingParts.push(alongX?tintedBox(3,0.03,0.3,PALETTE.roadLine,a,markingY,at):tintedBox(0.3,0.03,3,PALETTE.roadLine,at,markingY,a));
          }
        }
        const mid=(run[0]+run[1])/2,len=run[1]-run[0];
        for(const side of [-0.22,0.22]){
          markingParts.push(alongX?tintedBox(len,0.03,0.16,PALETTE.roadLineYellow,mid,markingY,centre+side):tintedBox(0.16,0.03,len,PALETTE.roadLineYellow,centre+side,markingY,mid));
        }
      }
    }
  }
  for(const xc of zRoads)for(const zc of xRoads){
    for(const side of [-1,1]){
      const zBand=zc+side*(ROAD_HALF+1.9),xBand=xc+side*(ROAD_HALF+1.9);
      for(let k=0;k<5;k++){
        markingParts.push(tintedBox(0.62,0.03,2.6,PALETTE.roadLine,xc-5.2+k*2.6,markingY,zBand));
        markingParts.push(tintedBox(2.6,0.03,0.62,PALETTE.roadLine,xBand,markingY,zc-5.2+k*2.6));
      }
    }
  }
  for(const b of blocks){
    if(b.kind!=='alley'||!b.carpark)continue;
    for(let k=0;k<6;k++)markingParts.push(tintedBox(0.12,0.03,5,PALETTE.roadLine,b.x-7.5+k*3,markingY,b.z-9));
    markingParts.push(tintedBox(15.12,0.03,0.12,PALETTE.roadLine,b.x,markingY,b.z-11.5));
  }
  const bench=(x,z,alongX)=>{
    const seat=0.62;
    propParts.push(tintedBox(alongX?2:0.62,0.14,alongX?0.62:2,PALETTE.roof,x,seat,z));
    propParts.push(tintedBox(alongX?2:0.12,0.55,alongX?0.12:2,shade(PALETTE.roof,1.15),x-(alongX?0:0.22),seat+0.32,z-(alongX?0.22:0)));
    propParts.push(tintedBox(alongX?0.16:0.5,0.46,alongX?0.5:0.16,'#4a4640',x-(alongX?0.8:0),seat-0.3,z-(alongX?0:0.8)));
    propParts.push(tintedBox(alongX?0.16:0.5,0.46,alongX?0.5:0.16,'#4a4640',x+(alongX?0.8:0),seat-0.3,z+(alongX?0:0.8)));
  };
  const palmSpots=[],lampSpots=[];
  for(const b of blocks){
    if(b.kind==='park'){
      const palms=rng.intRange(3,6);
      for(let k=0;k<palms;k++)palmSpots.push({x:b.x+rng.range(-LOT_HALF+2,LOT_HALF-2),z:b.z+rng.range(-LOT_HALF+2,LOT_HALF-2),scale:rng.range(0.85,1.15),yaw:rng.range(0,Math.PI*2)});
      const benches=rng.intRange(2,4);
      for(let k=0;k<benches;k++)bench(b.x+rng.range(-LOT_HALF+4,LOT_HALF-4),b.z+rng.range(-LOT_HALF+4,LOT_HALF-4),rng.pick([0,Math.PI/2,Math.PI,-Math.PI/2])===0);
    }else if(b.kind==='alley'){
      if(b.carpark){
        propParts.push(tintedBox(1.6,1.2,1.6,PALETTE.wallTan,b.x+6,KERB+0.6,b.z+9));
        propParts.push(tintedBox(1.2,1.0,1.2,shade(PALETTE.roof,1.2),b.x+8.2,KERB+0.5,b.z+9.6));
      }else{
        propParts.push(tintedBox(2.4,1.4,1.4,shade(PALETTE.roof,0.85),b.x-4,KERB+0.7,b.z+12));
        propParts.push(tintedBox(1.1,1.1,1.1,PALETTE.wallTan,b.x+2,KERB+0.55,b.z-6));
      }
    }else if(b.kind==='dock'){
      const containers=rng.intRange(2,4);
      for(let k=0;k<containers;k++){
        const cx=b.x+rng.range(-12,12),cz=b.z+rng.range(-12,12);
        const colour=rng.pick([PALETTE.wallTan,PALETTE.roof,shade(PALETTE.sea,0.7),shade(PALETTE.sirenRed,0.55)]);
        propParts.push(tintedBox(6,2.6,2.5,colour,cx,KERB+1.3,cz));
      }
    }
  }
  for(let x=-SHORE_X+26;x<=SHORE_X-26;x+=17){
    if(PIER_X.some(px=>Math.abs(x-px)<CITY.dockWidth/2+3))continue;
    palmSpots.push({x,z:-274.5,scale:rng.range(0.95,1.2),yaw:rng.range(0,Math.PI*2)});
  }
  for(let x=-SHORE_X+30;x<=SHORE_X-30;x+=CITY.lightSpacing){
    if(PIER_X.some(px=>Math.abs(x-px)<CITY.dockWidth/2+2))continue;
    lampSpots.push({x,z:-282.2,yaw:-Math.PI/2});
  }
  for(let x=-SHORE_X+44;x<=SHORE_X-44;x+=46){
    if(PIER_X.some(px=>Math.abs(x-px)<CITY.dockWidth/2+3))continue;
    bench(x,-277.5,true);
  }
  for(const zc of xRoads)for(let x=-HALF_X+PITCH/2;x<=HALF_X;x+=PITCH){
    lampSpots.push({x,z:zc+ROAD_HALF+1.5,yaw:-Math.PI/2});
    lampSpots.push({x,z:zc-ROAD_HALF-1.5,yaw:Math.PI/2});
  }
  waterfrontParts.push(tintedBox(SHORE_X*2,0.45,CITY.promenadeWidth,shade(PALETTE.sidewalk,1.08),0,PROMENADE_Y-0.225,(PROMENADE_Z-EDGE_Z)/2));
  const promenadeZ=(PROMENADE_Z-EDGE_Z)/2,jointColour=shade(PALETTE.sidewalk,0.82),kerbColour=shade(PALETTE.wallCream,0.94);
  for(let x=-SHORE_X+2;x<SHORE_X;x+=4)waterfrontParts.push(tintedBox(0.18,0.03,CITY.promenadeWidth-1.2,jointColour,x,PROMENADE_Y+0.015,promenadeZ));
  for(const z of [-EDGE_Z-0.45,PROMENADE_Z+0.45])waterfrontParts.push(tintedBox(SHORE_X*2,0.09,0.9,kerbColour,0,PROMENADE_Y+0.04,z));
  const wallRuns=[];
  let wallCursor=-SHORE_X;
  for(const px of PIER_X){wallRuns.push([wallCursor,px-CITY.dockWidth/2]);wallCursor=px+CITY.dockWidth/2;}
  wallRuns.push([wallCursor,SHORE_X]);
  for(const run of wallRuns){
    const len=run[1]-run[0],cx=(run[0]+run[1])/2;
    waterfrontParts.push(tintedBox(len,CITY.seawallHeight,WALL_THICKNESS,shade(PALETTE.wallStone,0.9),cx,CITY.seawallHeight/2,PROMENADE_Z-WALL_THICKNESS/2));
    waterfrontParts.push(tintedBox(len,0.22,WALL_THICKNESS+0.36,PALETTE.wallCream,cx,CITY.seawallHeight+0.02,PROMENADE_Z-WALL_THICKNESS/2));
    colliders.push({minX:run[0],maxX:run[1],minZ:PROMENADE_Z-WALL_THICKNESS,maxZ:PROMENADE_Z,height:CITY.seawallHeight+0.2});
  }
  for(const px of PIER_X){
    const half=CITY.dockWidth/2;
    for(let z=PROMENADE_Z-0.5;z>PIER_END_Z;z-=1.1)waterfrontParts.push(tintedBox(CITY.dockWidth,0.12,0.94,shade(PALETTE.roof,1.1),px,PIER_Y-0.06,z));
    waterfrontParts.push(tintedBox(CITY.dockWidth-1,0.35,CITY.dockLength,shade(PALETTE.roof,0.75),px,PIER_Y-0.3,PROMENADE_Z-CITY.dockLength/2));
    for(let z=PROMENADE_Z-3;z>PIER_END_Z+1;z-=6){
      for(const side of [-1,1]){
        const bottom=beachHeight(z),h=PIER_Y-0.35-bottom;
        waterfrontParts.push(tintedBox(0.55,h,0.55,shade(PALETTE.roof,0.6),px+side*(half-0.55),bottom+h/2,z));
      }
    }
    for(const side of [-1,1]){
      const rx=px+side*(half-0.18);
      for(let z=PROMENADE_Z-2;z>=PIER_END_Z;z-=3)waterfrontParts.push(tintedBox(0.14,1.05,0.14,'#3d3a36',rx,PIER_Y+0.52,z));
      waterfrontParts.push(tintedBox(0.12,0.1,CITY.dockLength,'#3d3a36',rx,PIER_Y+1.05,PROMENADE_Z-CITY.dockLength/2));
      colliders.push({minX:rx-0.3,maxX:rx+0.3,minZ:PIER_END_Z,maxZ:PROMENADE_Z,height:PIER_Y+1.1});
    }
    waterfrontParts.push(tintedBox(CITY.dockWidth,1.05,0.14,'#3d3a36',px,PIER_Y+0.52,PIER_END_Z));
    colliders.push({minX:px-half,maxX:px+half,minZ:PIER_END_Z-0.3,maxZ:PIER_END_Z+0.3,height:PIER_Y+1.1});
  }
  const bands=[
    [BEACH_TOP_Y,WALL_Z,WET_Y,WET_Z,PALETTE.sand],
    [WET_Y,WET_Z,BEACH_EDGE_Y,BEACH_END_Z,PALETTE.wetSand],
    [BEACH_EDGE_Y,BEACH_END_Z,CITY.seabed,DEEP_Z,shade(PALETTE.wetSand,0.55)],
    [CITY.seabed,DEEP_Z,CITY.seabed,-820,shade(PALETTE.wetSand,0.4)]];
  const sandParts=bands.map(([ya,za,yb,zb,colour])=>quad([-SHORE_X,ya,za],[SHORE_X,ya,za],[SHORE_X,yb,zb],[-SHORE_X,yb,zb],colour));
  const boundary=WORLD.boundary,rock=new Color(HILL_COLOUR),farRock=new Color(HILL_COLOUR).lerp(new Color(PALETTE.fog),0.55);
  const ridge=(x,z,radius,height,colour)=>{
    const cone=new ConeGeometry(radius,height,7);
    paint(cone,colour);
    cone.translate(x,height/2-1,z);
    hillParts.push(cone);
  };
  for(let i=0;i<15;i++){
    const x=-boundary-40+(i/14)*(boundary*2+80);
    ridge(x,boundary-20+rng.range(0,45),rng.range(55,95),rng.range(26,58),rock);
  }
  for(const side of [-1,1])for(let i=0;i<8;i++){
    const z=boundary*0.9-i*78;
    ridge(side*(boundary*0.88+rng.range(0,40)),z,rng.range(50,90),rng.range(22,52),rock);
  }
  for(let i=0;i<11;i++){
    const x=-boundary-120+(i/10)*(boundary*2+240);
    ridge(x,boundary+120+rng.range(0,90),rng.range(120,200),rng.range(50,95),farRock);
  }
  colliders.push({minX:-boundary-60,maxX:boundary+60,minZ:boundary-130,maxZ:boundary+60,height:40});
  colliders.push({minX:-boundary-60,maxX:-310,minZ:-110,maxZ:boundary+60,height:40});
  colliders.push({minX:310,maxX:boundary+60,minZ:-110,maxZ:boundary+60,height:40});
  const instance=(geometry,material,count,name,fill)=>{
    const mesh=new InstancedMesh(geometry,material,Math.max(1,count));
    fill(mesh);mesh.count=count;mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;mesh.name=name;
    group.add(mesh);return mesh;
  };
  const add=(geometry,name)=>{const m=new Mesh(geometry,solid);m.name=name;group.add(m);return m;};
  const ground=new PlaneGeometry(1700,1150);
  ground.rotateX(-Math.PI/2);ground.translate(0,-0.04,275);paint(ground,SCRUB_COLOUR);
  add(ground,'ground');
  add(merge([tintedBox(EDGE_X*2,0.2,EDGE_Z*2,PALETTE.asphalt,0,-0.1,0)]),'asphalt');
  add(merge(pavingParts),'paving');
  add(merge(markingParts),'markings');
  add(merge(buildingParts),'buildings');
  add(merge(waterfrontParts),'waterfront');
  add(merge(sandParts),'sand');
  add(merge(propParts),'props');
  add(merge(hillParts),'hills');
  const windowGeometry=new BoxGeometry(1.1,1.5,0.16);
  const windowMaterial=new MeshBasicMaterial({color:0xffffff});
  instance(windowGeometry,windowMaterial,windowMatrices.length,'windows',mesh=>{
    for(let i=0;i<windowMatrices.length;i++){mesh.setMatrixAt(i,windowMatrices[i]);mesh.setColorAt(i,windowColours[i]);}
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  });
  const palmParts=[tintedBox(0.34,5.4,0.34,PALETTE.roof,0,2.7,0)];
  for(let i=0;i<7;i++){
    const angle=(i/7)*Math.PI*2,frond=new BoxGeometry(3,0.12,0.62);
    paint(frond,i%2?PALETTE.grass:shade(PALETTE.grass,0.82));
    frond.translate(1.5,0,0);frond.rotateZ(-0.3);frond.rotateY(angle);frond.translate(0,5.3,0);
    palmParts.push(frond);
  }
  const palmGeometry=merge(palmParts),palmMaterial=new MeshLambertMaterial({vertexColors:true,flatShading:true});
  instance(palmGeometry,palmMaterial,palmSpots.length,'palms',mesh=>{
    palmSpots.forEach((spot,i)=>{
      dummy.position.set(spot.x,surfaceAt(spot.x,spot.z),spot.z);
      dummy.rotation.set(0,spot.yaw,0);
      dummy.scale.set(spot.scale,spot.scale,spot.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
    });
  });
  const poleParts=[tintedBox(0.16,5.6,0.16,'#3b3a40',0,2.8,0),tintedBox(1.6,0.12,0.14,'#3b3a40',0.75,5.56,0)];
  const lampGeometry=merge(poleParts),headGeometry=new BoxGeometry(0.55,0.24,0.42);
  headGeometry.translate(1.35,5.4,0);
  const lampMaterial=new MeshLambertMaterial({vertexColors:true,flatShading:true});
  const headMaterial=new MeshBasicMaterial({color:PALETTE.sun});
  const fillLamp=mesh=>lampSpots.forEach((spot,i)=>{
    dummy.position.set(spot.x,surfaceAt(spot.x,spot.z),spot.z);
    dummy.rotation.set(0,spot.yaw,0);
    dummy.scale.set(1,1,1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i,dummy.matrix);
  });
  instance(lampGeometry,lampMaterial,lampSpots.length,'lamps',fillLamp);
  instance(headGeometry,headMaterial,lampSpots.length,'lampHeads',fillLamp);
  const seaGeometry=new PlaneGeometry(2600,1300,80,40);
  seaGeometry.rotateX(-Math.PI/2);seaGeometry.translate(0,0,-952);
  const seaUniforms={
    time:{value:0},
    shallow:{value:new Color(PALETTE.sea)},deep:{value:new Color(PALETTE.seaDeep)},
    fogColour:{value:new Color(PALETTE.fog)},fogNear:{value:WORLD.fog.near},fogFar:{value:WORLD.fog.far},
    sunColour:{value:new Color(PALETTE.sun)},shoreZ:{value:BEACH_END_Z},offshoreZ:{value:BEACH_END_Z-320}};
  const seaMaterial=new ShaderMaterial({
    uniforms:seaUniforms,
    vertexShader:`
uniform float time;
varying vec3 vWorld;
varying float vSwell;
void main(){
  vec3 p=position;
  float swell=sin(p.x*0.045+time*0.9)*0.16+sin(p.z*0.071-time*1.3)*0.12+sin((p.x+p.z)*0.021+time*0.5)*0.2;
  p.y+=swell;vSwell=swell;
  vec4 world=modelMatrix*vec4(p,1.0);vWorld=world.xyz;
  gl_Position=projectionMatrix*viewMatrix*world;
}`,
    fragmentShader:`
uniform vec3 shallow;
uniform vec3 deep;
uniform vec3 fogColour;
uniform vec3 sunColour;
uniform float fogNear;
uniform float fogFar;
uniform float shoreZ;
uniform float offshoreZ;
varying vec3 vWorld;
varying float vSwell;
void main(){
  float depth=1.0-smoothstep(offshoreZ,shoreZ,vWorld.z);
  vec3 colour=mix(shallow,deep,depth);
  colour+=vec3(0.1,0.13,0.12)*smoothstep(0.08,0.4,vSwell);
  float glint=pow(max(0.0,sin(vWorld.x*0.035+vWorld.z*0.055)),12.0);
  colour=mix(colour,sunColour,glint*0.16);
  float fog=smoothstep(fogNear,fogFar,length(vWorld-cameraPosition));
  gl_FragColor=vec4(mix(colour,fogColour,fog),1.0);
}`});
  const seaMesh=new Mesh(seaGeometry,seaMaterial);
  seaMesh.name='sea';
  group.add(seaMesh);
  const spawnPoints=[{x:8,z:-278,yaw:Math.PI,kind:'player',area:'promenade'}];
  const streetBlocks=blocks.filter(b=>b.kind==='built'||b.kind==='dock');
  for(let k=0;k<3;k++){
    const b=streetBlocks[Math.floor((k+0.5)*streetBlocks.length/3)];
    spawnPoints.push({x:b.x+(k-1)*6,z:b.z+CITY.blockSize/2-CITY.sidewalkWidth/2,yaw:Math.PI,kind:'job',area:'street'});
  }
  for(const x of [-186,62,214])spawnPoints.push({x,z:-278,yaw:Math.PI/2,kind:'job',area:'promenade'});
  for(const [x,z] of [[PIER_X[0],-292],[PIER_X[1],-300],[PIER_X[0],-310]])spawnPoints.push({x,z,yaw:0,kind:'job',area:'pier'});
  const parks=blocks.filter(b=>b.kind==='park');
  for(let k=0;k<3&&k<parks.length;k++){
    const b=parks[k];
    spawnPoints.push({x:b.x,z:b.z,yaw:Math.atan2(b.x,b.z),kind:'job',area:'park'});
  }
  const segments=[];
  for(const zc of xRoads)segments.push({x1:-EDGE_X,z1:zc,x2:EDGE_X,z2:zc,width:CITY.roadWidth});
  for(const xc of zRoads)segments.push({x1:xc,z1:-EDGE_Z,x2:xc,z2:EDGE_Z,width:CITY.roadWidth});
  const shops=buildings.filter(b=>b.kind==='shop').sort((a,b)=>a.z-b.z).slice(0,2).map(b=>({x:b.x,z:b.z+b.depth/2+2}));
  const racePosts=[
    {x:zRoads[2],z:xRoads[1]},{x:zRoads[5],z:xRoads[4]},{x:zRoads[3],z:xRoads[6]}];
  const boatSpots=[
    {x:PIER_X[0]-14,z:PIER_END_Z-10},{x:PIER_X[1]+14,z:PIER_END_Z-6},{x:PIER_X[0]+20,z:PIER_END_Z-16}];
  return{
    group,roads:{xRoads,zRoads,segments},blocks,buildings,colliders,spawnPoints,surfaceAt,sea:seaUniforms,
    garage:{x:garageBlock.x,z:garageBlock.z},racePosts,shops,boatSpots,
    piers:{x:PIER_X,endZ:PIER_END_Z,promenadeZ:PROMENADE_Z},
    tick(dt){seaUniforms.time.value+=dt;},
  };
}
