// Keyboard and mouse behind pointer lock. A press is reported until the
// frame ends, and never twice. E is context interact, Enter starts the game
// from the title card and confirms on cards.
import {CAMERA} from './config.js';
const TRACKED=new Set(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space','KeyF','KeyE','KeyR','Escape','Enter','Digit1','Digit2','Digit3','KeyQ']);
export function createInput(canvas){
  const down=new Set(),pressed=new Set(),mouse={left:false,dx:0,dy:0},gestures=[];
  let gestured=false;
  function gesture(){
    if(gestured)return;
    gestured=true;
    for(const fn of gestures)fn();
  }
  window.addEventListener('keydown',e=>{
    gesture();
    if(!TRACKED.has(e.code))return;
    if(e.code!=='Escape')e.preventDefault();
    if(e.repeat)return;
    down.add(e.code);
    pressed.add(e.code);
  });
  window.addEventListener('keyup',e=>{if(TRACKED.has(e.code))down.delete(e.code);});
  window.addEventListener('blur',()=>{down.clear();mouse.left=false;});
  document.addEventListener('pointerlockchange',()=>{
    if(document.pointerLockElement===canvas)return;
    mouse.left=false;pressed.add('Escape');
  });
  canvas.addEventListener('pointerdown',e=>{gesture();if(e.button===0)mouse.left=true;});
  window.addEventListener('pointerup',e=>{if(e.button===0)mouse.left=false;});
  window.addEventListener('mousemove',e=>{
    if(document.pointerLockElement!==canvas)return;
    mouse.dx+=e.movementX;mouse.dy+=e.movementY;
  });
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  return{
    isDown(code){return down.has(code);},
    wasPressed(code){return pressed.has(code);},
    mouse,
    get yawDelta(){return -mouse.dx*CAMERA.sensitivity;},
    requestLock(){if(document.pointerLockElement!==canvas)canvas.requestPointerLock?.();},
    endFrame(){pressed.clear();mouse.dx=0;mouse.dy=0;},
    onGesture(fn){gestures.push(fn);if(gestured)fn();},
  };
}
