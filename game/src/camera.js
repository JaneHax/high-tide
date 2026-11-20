// Two booms on the one camera: short on foot, long behind a car or a boat.
// Both are pulled in by the first wall in their way.
import {Vector3} from 'three';
import {CAMERA} from './config.js';
import {firstHit} from './geometry.js';
const _dir=new Vector3();
const clampPitch=v=>Math.max(CAMERA.pitchMin,Math.min(CAMERA.pitchMax,v));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function resolveBoom(anchor,point,colliders){
  if(!colliders||colliders.length===0)return;
  _dir.subVectors(point,anchor);
  const span=_dir.length();
  if(span<1e-4)return;
  _dir.divideScalar(span);
  const hit=firstHit(anchor,point,colliders,CAMERA.collisionPadding);
  let boom=hit>=1?span:span*hit-0.05;
  if(hit<1)boom=Math.max(boom,Math.min(CAMERA.minDistance,span));
  boom=Math.max(0,Math.min(span,boom));
  point.copy(anchor).addScaledVector(_dir,boom);
  const hard=firstHit(anchor,point,colliders,CAMERA.near+0.05);
  if(hard<1){const shorter=Math.max(0,boom*hard-0.04);if(shorter<boom)point.copy(anchor).addScaledVector(_dir,shorter);}
}
export function createFollowCamera({camera,player}){
  const anchor=new Vector3(),wanted=new Vector3(),look=new Vector3();
  const follow={
    yaw:player?player.yaw:0,
    pitch:CAMERA.pitch,
    update(dt,input,body){
      follow.yaw+=input.yawDelta;
      follow.pitch=clampPitch(follow.pitch-input.mouse.dy*CAMERA.sensitivity);
      aim(body,1-Math.exp(-CAMERA.followLag*dt));
    },
    snap(body){follow.yaw=body.yaw;aim(body,1);},
    setYaw(v){follow.yaw=v;},
  };
  function aim(body,ease){
    anchor.set(body.position.x,body.position.y+CAMERA.height,body.position.z);
    const cos=Math.cos(follow.pitch);
    wanted.set(anchor.x+Math.sin(follow.yaw)*CAMERA.distance*cos,anchor.y-Math.sin(follow.pitch)*CAMERA.distance,anchor.z+Math.cos(follow.yaw)*CAMERA.distance*cos);
    resolveBoom(anchor,wanted,body.colliders);
    camera.position.lerp(wanted,ease);
    resolveBoom(anchor,camera.position,body.colliders);
    look.set(body.position.x,body.position.y+1.45,body.position.z);
    camera.lookAt(look);
  }
  if(player)aim(player,1);
  return follow;
}
export function createChaseCamera({camera,city}){
  const target=new Vector3(),anchor=new Vector3(),wanted=new Vector3(),look=new Vector3();
  let yaw=0,pitch=CAMERA.pitch;
  function aim(){
    anchor.set(target.x,target.y+CAMERA.chaseHeight,target.z);
    const cos=Math.cos(pitch);
    wanted.set(anchor.x+Math.sin(yaw)*CAMERA.chaseDistance*cos,anchor.y-Math.sin(pitch)*CAMERA.chaseDistance,anchor.z+Math.cos(yaw)*CAMERA.chaseDistance*cos);
    resolveBoom(anchor,wanted,city.colliders);
    camera.position.copy(wanted);
    look.set(target.x,target.y+1,target.z);
    camera.lookAt(look);
  }
  return{
    update(dt,input,car){
      yaw+=input.yawDelta;
      pitch=clampPitch(pitch-input.mouse.dy*CAMERA.sensitivity);
      if(car){target.copy(car.position);yaw+=wrap(car.heading-yaw)*(1-Math.exp(-CAMERA.chaseLag*dt));}
      aim();
    },
    reset(car){if(car){target.copy(car.position);yaw=car.heading;}pitch=CAMERA.pitch;aim();},
  };
}
