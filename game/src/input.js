// Keyboard and mouse with pointer lock. Held keys answer isDown; a press is reported by wasPressed
// until the frame ends and never twice; the mouse reports its movement since the last frame, already
// turned into the radians the camera should swing.

import { CAMERA } from './config.js';

const TRACKED = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'Space', 'KeyF', 'KeyE', 'KeyR', 'Escape', 'Enter']);

export function createInput(canvas) {
  const down = new Set();
  const pressed = new Set();
  const mouse = { left: false, dx: 0, dy: 0 };
  const gestures = [];
  let gestured = false;

  // Audio may only start from a real gesture, so the first pointer or key press is reported once.
  function gesture() {
    if (gestured) return;
    gestured = true;
    for (const fn of gestures) fn();
  }

  window.addEventListener('keydown', (event) => {
    gesture();
    if (!TRACKED.has(event.code)) return;
    // Escape is left to the browser: it is the browser that releases the pointer lock.
    if (event.code !== 'Escape') event.preventDefault();
    if (event.repeat) return;
    down.add(event.code);
    pressed.add(event.code);
  });

  window.addEventListener('keyup', (event) => {
    if (TRACKED.has(event.code)) down.delete(event.code);
  });

  // A key released while the tab is hidden never sends keyup, so everything is let go on blur.
  window.addEventListener('blur', () => {
    down.clear();
    mouse.left = false;
  });

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) return;
    // Losing the pointer is the browser's own Escape, and the game must treat it as one.
    mouse.left = false;
    pressed.add('Escape');
  });

  canvas.addEventListener('pointerdown', (event) => {
    gesture();
    if (event.button === 0) mouse.left = true;
  });
  window.addEventListener('pointerup', (event) => {
    if (event.button === 0) mouse.left = false;
  });

  window.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement !== canvas) return;
    mouse.dx += event.movementX;
    mouse.dy += event.movementY;
  });

  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    isDown(code) {
      return down.has(code);
    },
    wasPressed(code) {
      return pressed.has(code);
    },
    mouse,
    get yawDelta() {
      return -mouse.dx * CAMERA.sensitivity;
    },
    requestLock() {
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
    },
    endFrame() {
      pressed.clear();
      mouse.dx = 0;
      mouse.dy = 0;
    },
    onGesture(fn) {
      gestures.push(fn);
      if (gestured) fn();
    },
  };
}
