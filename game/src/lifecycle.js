// Game flow: the start screen, pause, resume, and the ending line when
// the tenth job is done. Enter starts the game and resumes from pause;
// P pauses while playing. The overlay text is plain DOM, swapped by
// state, so the game never needs a menu framework.
export function createLifecycle(document) {
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayText = document.getElementById('overlay-text');
  const overlayHint = document.getElementById('overlay-hint');
  let state = 'menu'; // menu | playing | paused | done

  function show(title, text, hint) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayHint.textContent = hint;
    overlay.style.display = 'flex';
  }
  function hide() { overlay.style.display = 'none'; }

  function showMenu() {
    state = 'menu';
    show(
      'HIGH TIDE',
      'Puerto Sol at golden hour. Rico works for Sombra: ten jobs, the law on his tail, and a city full of cars, boats and trouble.',
      'Press Enter to start — WASD to walk, F to take a car or boat, E does what the prompt says, 1-3 and Q switch weapons.',
    );
  }

  function start() {
    state = 'playing';
    hide();
  }

  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    show('Paused', 'The city waits. Your cash, reputation and stored car are saved.', 'Press Enter to keep playing.');
  }

  function resume() {
    if (state !== 'paused') return;
    state = 'playing';
    hide();
  }

  function finish() {
    state = 'done';
    show('The Breakwater', 'All ten jobs are done. Sombra has the last word, and Rico is the King of Puerto Sol.', 'Press Enter to keep roaming the city.');
  }

  function update(input, missionsDone) {
    if (missionsDone && state === 'playing') finish();
    if (input.wasPressed('Enter')) {
      if (state === 'menu' || state === 'done') start();
      else if (state === 'paused') resume();
    }
    if (input.wasPressed('KeyP') && state === 'playing') pause();
    if (input.wasPressed('Escape') && state === 'playing') pause();
  }

  return {
    showMenu, start, pause, resume, finish, update,
    get state() { return state; },
    get playing() { return state === 'playing'; },
  };
}
