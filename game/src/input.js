// input.js — keyboard + mouse state with edge detection.
export function createInput(canvas) {
  const keys = {}, hit = {};
  const mouse = { dx: 0, dy: 0, down: false, locked: false };
  const code = (e) => e.code;
  addEventListener('keydown', (e) => {
    if (!keys[code(e)]) hit[code(e)] = true;
    keys[code(e)] = true;
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(code(e))) e.preventDefault();
  });
  addEventListener('keyup', (e) => { keys[code(e)] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  canvas.addEventListener('mousedown', (e) => {
    mouse.down = true;
    if (!hit['Mouse0']) hit['Mouse0'] = true;
    try { const p = canvas.requestPointerLock?.(); p && p.catch && p.catch(() => {}); } catch { /* pointer lock unavailable */ }
  });
  addEventListener('mouseup', () => { mouse.down = false; });
  addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) { mouse.dx += e.movementX; mouse.dy += e.movementY; }
    else if (mouse.down) { mouse.dx += e.movementX; mouse.dy += e.movementY; }
  });
  document.addEventListener('pointerlockchange', () => { mouse.locked = document.pointerLockElement === canvas; });
  return {
    keys, mouse,
    down: (c) => !!keys[c],
    pressed: (c) => { const v = !!hit[c]; hit[c] = false; return v; },
    consumeMouse: () => { const d = { dx: mouse.dx, dy: mouse.dy }; mouse.dx = 0; mouse.dy = 0; return d; },
    endFrame: () => { for (const k in hit) hit[k] = false; },
  };
}
