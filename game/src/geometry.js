// Welded tinted boxes, and the one ray test shared by the camera, the
// bullets and the cars. A collider is a flat box: min/max on x and z, a top.
import {BoxGeometry,BufferAttribute,BufferGeometry,Color} from 'three';
const WHITE=new Color(1,1,1);
// Paint every vertex of a geometry one flat colour.
export function paint(g,colour){
  const t=new Color(colour),n=g.getAttribute('position').count,d=new Float32Array(n*3);
  for(let i=0;i<n*3;i+=3){d[i]=t.r;d[i+1]=t.g;d[i+2]=t.b;}
  g.setAttribute('color',new BufferAttribute(d,3));
  return g;
}
export function tintedBox(w,h,d,colour,x,y,z){
  const g=new BoxGeometry(w,h,d);
  paint(g,colour);
  g.translate(x,y,z);
  return g;
}
// Weld a list of geometries into a single mesh-ready geometry.
export function merge(list){
  const parts=list.map(g=>g.index===null?g:g.toNonIndexed());
  let count=0;
  for(const p of parts)count+=p.getAttribute('position').count;
  const pos=new Float32Array(count*3),nor=new Float32Array(count*3),col=new Float32Array(count*3);
  let at=0;
  for(const p of parts){
    if(p.getAttribute('normal')===undefined)p.computeVertexNormals();
    if(p.getAttribute('color')===undefined)paint(p,WHITE);
    pos.set(p.getAttribute('position').array,at*3);
    nor.set(p.getAttribute('normal').array,at*3);
    col.set(p.getAttribute('color').array,at*3);
    at+=p.getAttribute('position').count;
  }
  const m=new BufferGeometry();
  m.setAttribute('position',new BufferAttribute(pos,3));
  m.setAttribute('normal',new BufferAttribute(nor,3));
  m.setAttribute('color',new BufferAttribute(col,3));
  m.computeBoundingSphere();
  for(const p of parts)if(!list.includes(p))p.dispose();
  for(const g of list)g.dispose();
  return m;
}
// Push a circle out of any collider it overlaps, taking the shortest exit.
export function unstick(x,z,radius,top,colliders){
  for(const c of colliders){
    if(c.height<=top)continue;
    const minX=c.minX-radius,maxX=c.maxX+radius,minZ=c.minZ-radius,maxZ=c.maxZ+radius;
    if(x<=minX||x>=maxX||z<=minZ||z>=maxZ)continue;
    const w=x-minX,e=maxX-x,s=z-minZ,n=maxZ-z,least=Math.min(w,e,s,n);
    if(least===w)x=minX;else if(least===e)x=maxX;else if(least===s)z=minZ;else z=maxZ;
  }
  return{x,z};
}
// Fraction along from->to where the first collider is met, or 1 when the line
// is clear. A collider whose top sits below the ray where it crosses is
// passed over, so low walls never block a high shot.
export function firstHit(from,to,colliders,padding=0){
  const dx=to.x-from.x,dz=to.z-from.z;
  let best=1;
  for(const c of colliders){
    const minX=c.minX-padding,maxX=c.maxX+padding,minZ=c.minZ-padding,maxZ=c.maxZ+padding;
    let enter=0,exit=1;
    if(Math.abs(dx)<1e-9){if(from.x<minX||from.x>maxX)continue;}
    else{
      let t1=(minX-from.x)/dx,t2=(maxX-from.x)/dx;
      if(t1>t2)[t1,t2]=[t2,t1];
      enter=Math.max(enter,t1);exit=Math.min(exit,t2);
    }
    if(Math.abs(dz)<1e-9){if(from.z<minZ||from.z>maxZ)continue;}
    else{
      let t1=(minZ-from.z)/dz,t2=(maxZ-from.z)/dz;
      if(t1>t2)[t1,t2]=[t2,t1];
      enter=Math.max(enter,t1);exit=Math.min(exit,t2);
    }
    if(enter>exit||enter>best)continue;
    if(c.height<=from.y+(to.y-from.y)*enter)continue;
    best=enter;
  }
  return best;
}
