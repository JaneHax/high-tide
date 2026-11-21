// Keyboard and mouse state. The game reads keys by their physical code
// (KeyW, KeyE, Digit1 ...), so layouts do not matter. Mouse movement is
// collected only while the pointer is locked to the canvas.
export function createInput(canvas) {
  const down = new Set();
  const pressed = new Set();
  let mouseDX = 0;
  let mouseDY = 0;
  let mouseHeld = false;
  let clicked = false;
  let locked = false;

  function onKeyDown(e) {
    if (e.repeat) return;
    down.add(e.code);
    pressed.add(e.code);
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
  }
  function onKeyUp(e) { down.delete(e.code); }
  function onMouseMove(e) {
    if (!locked) return;
    mouseDX += e.movementX || 0;
    mouseDY += e.movementY || 0;
  }
  function onMouseDown(e) {
    if (e.button === 0) { mouseHeld = true; clicked = true; }
  }
  function onMouseUp(e) {
    if (e.button === 0) mouseHeld = false;
  }
  function onLockChange() { locked = document.pointerLockElement === canvas; }
  function onClick() {
    if (!locked && canvas.requestPointerLock) {
      try { canvas.requestPointerLock(); } catch { /* pointer lock is optional */ }
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  document.addEventListener('pointerlockchange', onLockChange);
  canvas.addEventListener('click', onClick);

  return {
    isDown(code) { return down.has(code); },
    wasPressed(code) { return pressed.has(code); },
    axis() {
      // -1..1 strafing / forward from WASD, relative to the camera.
      let x = 0, y = 0;
      if (down.has('KeyW') || down.has('ArrowUp')) y += 1;
      if (down.has('KeyS') || down.has('ArrowDown')) y -= 1;
      if (down.has('KeyA') || down.has('ArrowLeft')) x -= 1;
      if (down.has('KeyD') || down.has('ArrowRight')) x += 1;
      return { x, y };
    },
    sprint() { return down.has('ShiftLeft') || down.has('ShiftRight'); },
    mouseDelta() {
      const d = { x: mouseDX, y: mouseDY };
      mouseDX = 0; mouseDY = 0;
      return d;
    },
    mouseDown() { return mouseHeld; },
    wasClicked() { return clicked; },
    endFrame() { pressed.clear(); clicked = false; },
  };
}
