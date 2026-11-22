const waitForGame = () => {
  const game = window.__HT_GAME;
  if (!game) {
    window.setTimeout(waitForGame, 120);
    return;
  }

  const hud = document.getElementById('hud');
  const dispatch = document.getElementById('dispatch');
  if (!hud || !dispatch) return;

  const pulse = document.createElement('section');
  pulse.id = 'cityPulse';
  pulse.className = 'city-pulse panel';
  pulse.innerHTML = `
    <div class="pulse-head"><span class="pulse-dot"></span><span>PORT STATUS</span><b id="pulseClock">18:42</b></div>
    <div class="pulse-main"><strong id="pulseLabel">CALM WATER</strong><span id="pulseZone">MARINA</span></div>
    <div class="pulse-track"><i id="pulseStorm"></i></div>
    <div class="pulse-foot"><span id="pulseJobs">0 / 10 JOBS</span><span id="pulseBridge">DECK LOWERED</span><span id="pulseRep">RUNNER</span></div>`;
  hud.appendChild(pulse);

  const saveChip = document.createElement('div');
  saveChip.id = 'saveChip';
  saveChip.className = 'save-chip';
  saveChip.textContent = 'AUTOSAVE READY';
  hud.appendChild(saveChip);

  const title = document.getElementById('titleScreen');
  const subtitle = document.getElementById('titleSub');
  if (title && subtitle) {
    const stats = document.createElement('div');
    stats.className = 'title-stats';
    stats.innerHTML = '<span><b>10</b> JOBS</span><span><b>5</b> HEAT LEVELS</span><span><b>1</b> CITY TO CROSS</span>';
    subtitle.insertAdjacentElement('afterend', stats);
  }

  let previousZone = game.zoneName;
  let previousWanted = game.wanted;
  let previousMode = game.mode;
  let lastSave = 0;
  const repTitle = (rep) => rep >= 130 ? 'KING OF PUERTO SOL' : rep >= 70 ? 'MADE' : rep >= 30 ? 'WHEELMAN' : 'RUNNER';
  const update = () => {
    const storm = Math.round((game.stormLevel || 0) * 100);
    const label = storm > 76 ? 'EYE OF THE STORM' : storm > 52 ? 'RAIN MOVING IN' : storm > 28 ? 'WIND ON THE WATER' : 'CALM WATER';
    const pulseLabel = document.getElementById('pulseLabel');
    const pulseStorm = document.getElementById('pulseStorm');
    const pulseZone = document.getElementById('pulseZone');
    const pulseJobs = document.getElementById('pulseJobs');
    const pulseBridge = document.getElementById('pulseBridge');
    const pulseRep = document.getElementById('pulseRep');
    const pulseClock = document.getElementById('pulseClock');
    const bridgeStatus = game.bridge?.statusText || 'DECK LOWERED';
    if (pulseLabel) pulseLabel.textContent = label;
    if (pulseStorm) pulseStorm.style.width = `${storm}%`;
    if (pulseZone) pulseZone.textContent = game.zoneName || 'PUERTO SOL';
    if (pulseJobs) pulseJobs.textContent = `${game.missions.completed.size} / ${Object.keys(game.missions.defs).length} JOBS`;
    if (pulseBridge) pulseBridge.textContent = bridgeStatus;
    if (pulseRep) pulseRep.textContent = repTitle(game.rep);
    if (pulseClock) pulseClock.textContent = document.getElementById('clock')?.textContent || '18:42';
    saveChip.textContent = game.state === 'playing' ? (game.autosaveTimer > 17 ? 'AUTOSAVE READY' : 'SHIFT SAVED') : 'AUTOSAVE READY';
    saveChip.classList.toggle('hot', game.wanted >= 3);

    if (game.state === 'playing' && game.zoneName !== previousZone) {
      game.hud.toast(`Entering ${game.zoneName}. Keep your head down.`, 'info', 2.8);
      previousZone = game.zoneName;
    }
    if (game.state === 'playing' && game.wanted !== previousWanted) {
      if (game.wanted > previousWanted) game.hud.toast(`Heat rising: ${game.wanted} star${game.wanted === 1 ? '' : 's'}.`, 'warn', 2.4);
      if (game.wanted === 0 && previousWanted > 0) game.hud.toast('Guardia lost your signal.', 'success', 2.4);
      previousWanted = game.wanted;
    }
    if (game.state === 'playing' && game.mode !== previousMode) {
      const modeName = game.mode === 'car' ? 'Behind the wheel' : game.mode === 'boat' ? 'On the water' : 'On foot';
      game.hud.toast(modeName, 'info', 1.8);
      previousMode = game.mode;
    }
    if (game.state === 'playing' && Date.now() - lastSave > 26000) {
      saveChip.textContent = 'AUTOSAVE READY';
      lastSave = Date.now();
    }
  };
  window.setInterval(update, 260);
  update();
};

waitForGame();
