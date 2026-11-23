import { harborAtlas } from './harborAtlas.js';

/*
 * Harbor Guide is an authored field manual for High Tide: Storm Shift.
 *
 * The module owns its data and its presentation so it can be mounted with
 * new HarborGuide(game) without another framework or a template dependency.
 * The prose is intentionally practical. It tells a player where to go,
 * what a vehicle is good at, and how to make a clean decision under heat.
 */

const GUIDE_TABS = [
  { id: 'districts', label: 'DISTRICTS', short: '01' },
  { id: 'vehicles', label: 'VEHICLES', short: '02' },
  { id: 'weapons', label: 'WEAPONS', short: '03' },
  { id: 'missions', label: 'MISSIONS', short: '04' },
  { id: 'heat', label: 'HEAT', short: '05' },
  { id: 'bridge', label: 'BRIDGE', short: '06' },
  { id: 'survival', label: 'SURVIVAL', short: '07' },
];

const text = (value) => String(value ?? '');

const numberOr = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

const safeObject = (value) => value && typeof value === 'object' ? value : {};

const list = (value) => Array.isArray(value) ? value : [];

const upper = (value) => text(value).toUpperCase();

const pretty = (value) => text(value)
  .toLowerCase()
  .replace(/(^|[\s_-])([a-z])/g, (_, lead, letter) => `${lead}${letter.toUpperCase()}`);

export const harborGuideData = {
  title: 'HARBOR GUIDE',
  subtitle: 'A field manual for crossing Puerto Sol before the weather turns.',
  districts: [
    {
      name: 'Puerto Sol',
      marker: 'PS',
      mood: 'The old center keeps the city stitched together.',
      route: 'Use the central streets when you need a quiet change of direction.',
      landmark: 'Civic blocks and the road to the bascule house.',
      danger: 'Traffic is thickest where every route seems to meet.',
      advice: 'Park before the corner and finish the last block on foot.',
      color: 'teal',
    },
    {
      name: 'Marina Sol',
      marker: 'MS',
      mood: 'Salt air, bright paint, and the Sombra launch.',
      route: 'The marina is the safest place to prepare for a water job.',
      landmark: 'The launch sits along the southern quay.',
      danger: 'A boat looks conspicuous when patrol lights are moving.',
      advice: 'Board early and leave the dock with a heading in mind.',
      color: 'gold',
    },
    {
      name: 'Marina Promenade',
      marker: 'MP',
      mood: 'A long sea wall with room to breathe between jobs.',
      route: 'Follow the promenade to thread the north and south roads together.',
      landmark: 'Palm lights and the low wall beside the channel.',
      danger: 'Open pavement offers little cover once heat starts climbing.',
      advice: 'Keep a car pointed toward the next exit.',
      color: 'teal',
    },
    {
      name: 'Fish Market',
      marker: 'FM',
      mood: 'Crates, scooters, and people who notice every unfamiliar face.',
      route: 'Approach from the market road and leave by the southern cut.',
      landmark: 'Market sheds sit east of the center road.',
      danger: 'A careless turn can put a vehicle into a crowd or dead end.',
      advice: 'Slow before the sheds and use the alleys for a clean exit.',
      color: 'coral',
    },
    {
      name: 'Sombra Garage',
      marker: 'SG',
      mood: 'A quiet lot where engines wait under patched awnings.',
      route: 'Return here when a job asks for a particular car.',
      landmark: 'The garage rests west of the marina road.',
      danger: 'Taking the wrong car can leave a mission at its first step.',
      advice: 'Read the vehicle name twice before pulling away.',
      color: 'gold',
    },
    {
      name: 'Bascule Channel',
      marker: 'BC',
      mood: 'A working waterway split by the city’s moving bridge.',
      route: 'Hold west of the span while the deck rises.',
      landmark: 'The bridge house watches the central channel.',
      danger: 'A closed span can turn a direct crossing into a coastal loop.',
      advice: 'Call the bridge from the boat and wait for a clear signal.',
      color: 'coral',
    },
    {
      name: 'North Docks',
      marker: 'ND',
      mood: 'Concrete, cargo lamps, and long sight lines toward the storm.',
      route: 'The docks make a fast northbound run when gates are open.',
      landmark: 'Pier roads continue beyond the channel on the east side.',
      danger: 'Few places hide a driver when patrol cars use straightaways.',
      advice: 'Keep speed moderate until you know which gate is free.',
      color: 'teal',
    },
    {
      name: 'Art-Deco Terminal',
      marker: 'AT',
      mood: 'A polished facade hiding a yard full of useful shortcuts.',
      route: 'Reach the terminal by the north road or the bridge approach.',
      landmark: 'The terminal’s tall entrance faces the upper quay.',
      danger: 'A wanted driver attracts attention before reaching the gate.',
      advice: 'Lose heat at the garage before a clean-plate delivery.',
      color: 'gold',
    },
  ],
  vehicles: [
    {
      name: 'Sol Courier',
      key: 'courier',
      kind: 'CAR',
      role: 'Reliable delivery hatchback.',
      speed: 'Balanced acceleration and a forgiving turn.',
      handling: 'Stable on pavement and easy to place beside a dock.',
      weakness: 'It does not have the muscle to bully a blocked road.',
      tip: 'Choose it when a mission asks for a courier or a quiet plate.',
    },
    {
      name: 'Tempest GT',
      key: 'muscle',
      kind: 'CAR',
      role: 'Heavy coupe for a hard run through bad attention.',
      speed: 'The strongest road speed in the harbor.',
      handling: 'Wide turns reward a steady hand and early braking.',
      weakness: 'Its size makes tight market lanes uncomfortable.',
      tip: 'Save it for storm runs, long straights, and confident exits.',
    },
    {
      name: 'Sombra Launch',
      key: 'boat',
      kind: 'BOAT',
      role: 'Fast water transport for channel work.',
      speed: 'Quick enough to cross before a patrol closes in.',
      handling: 'Throttle and helm need a wider arc than a car.',
      weakness: 'A shallow dock is the only safe place to disembark.',
      tip: 'Line up the pier before reducing speed so the bow does not drift.',
    },
    {
      name: 'On Foot',
      key: 'foot',
      kind: 'FOOT',
      role: 'Quiet movement for corners, clinics, and markers.',
      speed: 'A sprint covers short gaps without announcing an engine.',
      handling: 'Small spaces and stairs belong to a person, not a car.',
      weakness: 'Open roads become dangerous when wanted stars are active.',
      tip: 'Leave the vehicle when the final approach needs discretion.',
    },
  ],
  weapons: [
    {
      name: 'Guardia 9',
      key: 'pistol',
      slot: '1',
      range: 'MEDIUM',
      rhythm: 'Measured single shots.',
      profile: 'A dependable sidearm with a twelve-round magazine.',
      handling: 'Low commitment makes it useful while moving through alleys.',
      caution: 'Every shot can begin a wanted level.',
      tip: 'Reload before a job step, not while a patrol is closing.',
    },
    {
      name: 'Breacher',
      key: 'shotgun',
      slot: '2',
      range: 'SHORT',
      rhythm: 'Slow, heavy bursts.',
      profile: 'Eight pellets turn a close threat into a wide problem.',
      handling: 'Keep the target near the center of the sight line.',
      caution: 'The small magazine punishes missed opportunities.',
      tip: 'Use it only when the exit is already in reach.',
    },
    {
      name: 'Sombra SMG',
      key: 'smg',
      slot: '3',
      range: 'SHORT',
      rhythm: 'Fast automatic fire.',
      profile: 'A thirty-round magazine gives room to correct rough aim.',
      handling: 'Short controlled holds keep recoil in the fight.',
      caution: 'A long burst turns a quiet street into a radio call.',
      tip: 'Use brief bursts, then move before the sirens settle.',
    },
    {
      name: 'Faro Rifle',
      key: 'rifle',
      slot: '4',
      range: 'LONG',
      rhythm: 'Slow, decisive shots.',
      profile: 'A five-round magazine reaches across the longest roads.',
      handling: 'Take a breath and let the sight picture settle.',
      caution: 'The reserve is small and the report is impossible to miss.',
      tip: 'Keep it for a clear sight line and a clear escape route.',
    },
  ],
  missions: [
    {
      id: 'dead_drop',
      title: 'Dead Drop',
      giver: 'Mara',
      start: 'Sombra Garage',
      reward: '$320',
      reputation: '+45 REP',
      brief: 'A courier run through the market to the art-deco terminal.',
      route: 'Garage → Fish Market → Art-Deco Terminal',
      advice: 'Take the Sol Courier and keep the delivery lanes wide.',
    },
    {
      id: 'crossing',
      title: 'The Crossing',
      giver: 'Sombra Crew',
      start: 'Marina Sol',
      reward: '$760',
      reputation: '+130 REP',
      brief: 'Two crates cross the channel while the bascule does its work.',
      route: 'Marina → West Buoy → Bridge → East Pier',
      advice: 'Wait west of the span, then clear it without drifting.',
    },
    {
      id: 'storm_run',
      title: 'Storm Run',
      giver: 'Mara',
      start: 'Sombra Garage',
      reward: '$1,250',
      reputation: '+220 REP',
      brief: 'A black box moves while Guardia already knows the plate.',
      route: 'Garage → Lose Heat → North Pier',
      advice: 'Use the Tempest GT and choose bridge or coast early.',
    },
    {
      id: 'quay_race',
      title: 'Quay Circuit',
      giver: 'Elio',
      start: 'Fish Market',
      reward: '$420',
      reputation: '+70 REP',
      brief: 'Five checkpoints make a hundred seconds feel very short.',
      route: 'Market → Palm Boulevard → Storm Wall → Bridge → Market',
      advice: 'Brake before each checkpoint so the next turn starts clean.',
    },
    {
      id: 'repo_run',
      title: 'Repo Run',
      giver: 'Mara',
      start: 'Sombra Garage',
      reward: '$380',
      reputation: '+60 REP',
      brief: 'An impounded sedan is waiting loose in the terminal yard.',
      route: 'Garage → Terminal Weighbridge',
      advice: 'Get into any car before the yard marker can count the handoff.',
    },
    {
      id: 'last_light',
      title: 'Last Light',
      giver: 'Elio',
      start: 'Fish Market',
      reward: '$460',
      reputation: '+80 REP',
      brief: 'An envelope must reach the north quay in forty-eight seconds.',
      route: 'Market → North Quay',
      advice: 'Leave the market pointed north before the clock begins.',
    },
    {
      id: 'clean_hands',
      title: 'Clean Hands',
      giver: 'Mara',
      start: 'Sombra Garage',
      reward: '$540',
      reputation: '+95 REP',
      brief: 'The terminal gate will only trust a plate without heat.',
      route: 'Garage → Terminal Gate',
      advice: 'Respray or hide until every wanted star is gone.',
    },
    {
      id: 'split_take',
      title: 'Split Take',
      giver: 'Sombra Crew',
      start: 'Fish Market',
      reward: '$980',
      reputation: '+160 REP',
      brief: 'A hot bag travels from the market to a launch on the east pier.',
      route: 'Market → East Pier',
      advice: 'Heat begins at the handoff, so keep the launch route in mind.',
    },
    {
      id: 'harbor_ferry',
      title: 'Harbor Ferry',
      giver: 'Elio',
      start: 'Marina Sol',
      reward: '$520',
      reputation: '+90 REP',
      brief: 'A fare waits on open water and will not step onto a quay.',
      route: 'Marina → Mid-Channel Buoy',
      advice: 'Take the Sombra launch and approach the buoy at low speed.',
    },
    {
      id: 'toll_run',
      title: 'Toll Run',
      giver: 'Elio',
      start: 'Fish Market',
      reward: '$430',
      reputation: '+70 REP',
      brief: 'The north gate wants two hundred dollars and a clean manifest.',
      route: 'Market → North Gate',
      advice: 'Count the cash before leaving the market road.',
    },
  ],
  wantedLevels: [
    {
      level: 0,
      name: 'QUIET WATER',
      signal: 'No active patrol response.',
      response: 'The harbor is listening, but nobody is looking.',
      escape: 'Keep weapons holstered and stay on the planned route.',
      color: 'teal',
    },
    {
      level: 1,
      name: 'PATROL ALERT',
      signal: 'A first report has reached Guardia.',
      response: 'Patrols begin checking the nearest roads and docks.',
      escape: 'Break line of sight and leave the center before the search grows.',
      color: 'gold',
    },
    {
      level: 2,
      name: 'ACTIVE SEARCH',
      signal: 'More than one unit has your description.',
      response: 'Road crossings become risky and the channel gets watched.',
      escape: 'Use a garage or a hard turn through the market to reset distance.',
      color: 'coral',
    },
    {
      level: 3,
      name: 'LOCKED GATES',
      signal: 'The city has linked your route to the report.',
      response: 'Roadblocks and fast responders start closing options.',
      escape: 'Take the coast, change vehicles, or wait in cover until silence returns.',
      color: 'coral',
    },
    {
      level: 4,
      name: 'HARBOR MANHUNT',
      signal: 'Every bright road becomes a liability.',
      response: 'Guardia commits units to the bridge, docks, and terminal.',
      escape: 'Stop improvising and follow one deliberate escape route.',
      color: 'coral',
    },
    {
      level: 5,
      name: 'FULL SIREN',
      signal: 'The entire port is awake.',
      response: 'The next mistake can end the shift.',
      escape: 'Reach a garage, cross by water, or abandon the road until silence returns.',
      color: 'coral',
    },
  ],
  bridgeStates: [
    {
      state: 'closed',
      name: 'DECK LOWERED',
      meaning: 'Road traffic can cross. Boats must wait.',
      action: 'Use the bridge house or call from the launch.',
      note: 'The quickest road is available until the deck begins to move.',
    },
    {
      state: 'warning',
      name: 'SIREN WARNING',
      meaning: 'The bridge is preparing to move and the lane is closing.',
      action: 'Clear the span and hold the west side if you are on water.',
      note: 'Do not start a crossing when the warning lights are active.',
    },
    {
      state: 'opening',
      name: 'SPAN RISING',
      meaning: 'The deck is lifting for channel traffic.',
      action: 'Keep a boat west of the bridge until the route is level.',
      note: 'The water route is safe once the raised state settles.',
    },
    {
      state: 'open',
      name: 'DECK RAISED',
      meaning: 'Boats can pass through the central channel.',
      action: 'Throttle through the span and keep the bow aligned.',
      note: 'Road traffic must wait while the deck remains raised.',
    },
    {
      state: 'closing',
      name: 'SPAN LOWERING',
      meaning: 'The bridge is returning to road height.',
      action: 'Clear the channel and do not linger beneath the deck.',
      note: 'A patient boat pilot saves more time than a rushed turn.',
    },
  ],
  survivalTips: [
    { title: 'Read the first step', body: 'A job can ask for a car, a boat, a clean plate, or a specific route. The marker tells you what the next move needs.' },
    { title: 'Keep an exit', body: 'Park facing away from trouble. A clean launch matters more than a perfect parking space.' },
    { title: 'Use the clinic', body: 'Health recovers slowly after a quiet stretch. The clinic is faster when the shift can afford the bill.' },
    { title: 'Watch the storm', body: 'Weather rises as time passes and heat accumulates. Long exposed roads become less forgiving.' },
    { title: 'Call the bridge early', body: 'The Sombra launch can request the bridge before reaching the span. Give the machinery time to answer.' },
    { title: 'Change the station', body: 'Radio stations rotate when you tune them. The sound is a small way to mark a new leg of the route.' },
    { title: 'Reload between scenes', body: 'A full magazine is a quiet advantage. Reload after a handoff, before a gate, or while the weather is calm.' },
    { title: 'Respect the market', body: 'The market rewards a slow approach. A straight line through the sheds is rarely the fastest way out.' },
    { title: 'Take the coast', body: 'When the bridge is busy or watched, the coastal road costs distance but preserves choice.' },
    { title: 'Do not chase every marker', body: 'Unstarted jobs wait for you. Finish the current route before adding another voice to the radio.' },
    { title: 'Save at the garage', body: 'The garage is a place to reset heat, recover, and make a fresh plan before a difficult delivery.' },
    { title: 'Leave the car cleanly', body: 'A vehicle is a tool. Step out when a narrow route or a quiet corner makes the next move safer.' },
    { title: 'Count the cash', body: 'Some gates and repairs ask for money before they can help. A full wallet keeps the route flexible.' },
    { title: 'Use short bursts', body: 'Noise creates heat quickly. Controlled fire is easier to survive than a long argument with the street.' },
    { title: 'Watch the zone name', body: 'The HUD names the ground beneath you. A changed district is a useful cue that a route has opened.' },
    { title: 'Let the bridge finish', body: 'Moving water and moving machinery punish impatience. The status text tells you when the crossing is real.' },
    { title: 'Follow the weather', body: 'Lightning and rain are reminders to choose the route you can still control, not the route that looked fastest.' },
    { title: 'Use the guide anytime', body: 'Press J for a pause in the noise. Escape closes the manual and returns control to the harbor.' },
    { title: 'Keep the nose pointed out', body: 'A vehicle facing an exit turns a surprise patrol into a decision instead of a trap.' },
    { title: 'Leave room at the pier', body: 'Water momentum carries farther than a road car. Approach a dock with space to correct.' },
    { title: 'Trust the dispatch card', body: 'The live objective can change as a mission advances. Check it before choosing a new shortcut.' },
    { title: 'Use cover before speed', body: 'A short wait behind a wall can be faster than a long drive through every patrol route.' },
    { title: 'Spend reputation carefully', body: 'A completed job opens more of the ledger. The hard route often pays in future choices.' },
    { title: 'Mark the bridge state', body: 'The bridge has its own rhythm. Learn the warning, rising, open, and closing calls.' },
    { title: 'Keep a spare magazine', body: 'The next encounter usually starts when the last one has just ended.' },
    { title: 'Read the weather color', body: 'A darker storm reading is a route warning, even when the road looks empty.' },
    { title: 'Use foot movement for detail', body: 'Markers, clinics, and garage controls are easier to read when a bumper is not in the way.' },
    { title: 'Give the launch a wide turn', body: 'Boats do not pivot like cars. Begin the turn before the buoy reaches the bow.' },
    { title: 'Break line of sight', body: 'Guardia follows a visible route. A sharp corner and a quiet pause can reset the search.' },
    { title: 'Keep the manual close', body: 'The guide is a reference, not a loading screen. Open it whenever a decision needs a calm read.' },
  ],
};

export class HarborGuide {
  constructor(game) {
    this.game = game || {};
    this.data = harborGuideData;
    this.atlas = harborAtlas;
    this.districts = this.data.districts;
    this.vehicles = this.data.vehicles;
    this.weapons = this.data.weapons;
    this.missions = this.data.missions;
    this.wantedLevels = this.data.wantedLevels;
    this.bridgeStates = this.data.bridgeStates;
    this.survivalTips = this.data.survivalTips;
    this.tabs = GUIDE_TABS;
    this.activeTab = 0;
    this.page = 0;
    this.pageSize = 3;
    this.isOpen = false;
    this.wasPlaying = false;
    this.refreshTimer = 0;
    this.listeners = [];
    this.panel = null;
    this.tabStrip = null;
    this.content = null;
    this.live = null;
    this.status = null;
    this.buildOverlay();
    this.bindKeyboard();
    this.render();
    this.refreshTimer = window.setInterval(() => this.refreshLiveReadout(), 450);
  }

  buildOverlay() {
    const panel = document.createElement('section');
    panel.className = 'harbor-guide hidden';
    panel.id = 'harborGuide';
    panel.setAttribute('aria-label', 'Harbor Guide');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div class="guide-shell" role="dialog" aria-modal="true" aria-labelledby="guideTitle">
        <div class="guide-rule" aria-hidden="true"></div>
        <header class="guide-header">
          <div>
            <div class="guide-eyebrow">PUERTO SOL // FIELD MANUAL</div>
            <h2 id="guideTitle">${this.data.title}</h2>
            <p>${this.data.subtitle}</p>
          </div>
          <button class="guide-close" type="button" data-guide-action="close" aria-label="Close Harbor Guide">CLOSE <b>ESC</b></button>
        </header>
        <nav class="guide-tabs" data-guide-tabs aria-label="Harbor Guide sections" role="tablist"></nav>
        <div class="guide-layout">
          <aside class="guide-live" data-guide-live aria-label="Live harbor status"></aside>
          <main class="guide-content" data-guide-content tabindex="-1" aria-live="polite"></main>
        </div>
        <footer class="guide-footer">
          <div class="guide-footer-copy"><span>HARBOR AUTHORITY</span><b>OFFLINE REFERENCE</b><small>ATLAS ${this.atlas.edition}</small></div>
          <div class="guide-controls"><span><b>J</b> OPEN</span><span><b>ESC</b> CLOSE</span><span><b>← →</b> PAGE</span></div>
        </footer>
        <div class="guide-status" data-guide-status aria-live="polite"></div>
      </div>`;
    document.body.appendChild(panel);
    this.panel = panel;
    this.tabStrip = panel.querySelector('[data-guide-tabs]');
    this.content = panel.querySelector('[data-guide-content]');
    this.live = panel.querySelector('[data-guide-live]');
    this.status = panel.querySelector('[data-guide-status]');
    const click = (event) => this.handleClick(event);
    panel.addEventListener('click', click);
    this.listeners.push(() => panel.removeEventListener('click', click));
  }

  handleClick(event) {
    const actionTarget = event.target.closest('[data-guide-action]');
    if (actionTarget) {
      this.handleAction(actionTarget.dataset.guideAction);
      return;
    }
    const tabTarget = event.target.closest('[data-guide-tab]');
    if (tabTarget) {
      this.selectTab(Number(tabTarget.dataset.guideTab));
      tabTarget.focus();
      return;
    }
    const entryTarget = event.target.closest('[data-guide-entry]');
    if (entryTarget) {
      this.focusEntry(Number(entryTarget.dataset.guideEntry));
    }
  }

  bindKeyboard() {
    const handler = (event) => {
      const key = event.key.toLowerCase();
      if (key === 'j' && !this.isOpen) {
        event.preventDefault();
        event.stopPropagation();
        this.open();
        return;
      }
      if (!this.isOpen) return;
      const focusedTab = event.target.closest?.('[data-guide-tab]');
      if (focusedTab && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault();
        const current = Number(focusedTab.dataset.guideTab);
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        this.focusTab((current + direction + this.tabs.length) % this.tabs.length);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.close();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.previousPage();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.nextPage();
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        this.firstPage();
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        this.lastPage();
      }
    };
    document.addEventListener('keydown', handler, true);
    this.listeners.push(() => document.removeEventListener('keydown', handler, true));
  }

  handleAction(action) {
    if (action === 'close') this.close();
    if (action === 'previous') this.previousPage();
    if (action === 'next') this.nextPage();
    if (action === 'first') this.firstPage();
    if (action === 'last') this.lastPage();
  }

  open() {
    if (!this.panel || this.isOpen) return;
    this.isOpen = true;
    this.wasPlaying = this.game.state === 'playing';
    if (this.wasPlaying && this.game.input) {
      this.game.input.enabled = false;
      if (typeof this.game.input.releaseLock === 'function') this.game.input.releaseLock();
    }
    this.panel.classList.remove('hidden');
    this.panel.setAttribute('aria-hidden', 'false');
    this.render();
    this.panel.querySelector('[data-guide-action="close"]')?.focus();
  }

  close() {
    if (!this.panel || !this.isOpen) return;
    this.isOpen = false;
    this.panel.classList.add('hidden');
    this.panel.setAttribute('aria-hidden', 'true');
    if (this.wasPlaying && this.game.input) {
      this.game.input.enabled = true;
      if (typeof this.game.input.requestLock === 'function') this.game.input.requestLock();
    }
    this.wasPlaying = false;
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  selectTab(index) {
    this.activeTab = clamp(Number(index), 0, this.tabs.length - 1);
    this.page = 0;
    this.renderTabs();
    this.renderContent();
  }

  focusTab(index) {
    this.selectTab(index);
    const tab = this.tabStrip?.querySelector(`[data-guide-tab="${index}"]`);
    if (tab) tab.focus();
  }

  focusEntry(index) {
    const total = this.pageCount();
    const page = Math.floor(clamp(index, 0, Math.max(0, this.itemsForTab().length - 1)) / this.pageSize);
    this.page = clamp(page, 0, total - 1);
    this.renderContent();
    this.content?.focus({ preventScroll: true });
  }

  previousPage() {
    if (!this.isOpen) return;
    this.page = Math.max(0, this.page - 1);
    this.renderContent();
  }

  nextPage() {
    if (!this.isOpen) return;
    this.page = Math.min(this.pageCount() - 1, this.page + 1);
    this.renderContent();
  }

  firstPage() {
    if (!this.isOpen) return;
    this.page = 0;
    this.renderContent();
  }

  lastPage() {
    if (!this.isOpen) return;
    this.page = Math.max(0, this.pageCount() - 1);
    this.renderContent();
  }

  pageCount() {
    return Math.max(1, Math.ceil(this.itemsForTab().length / this.pageSize));
  }

  itemsForTab() {
    const tab = this.tabs[this.activeTab]?.id;
    if (tab === 'districts') return this.data.districts;
    if (tab === 'vehicles') return this.data.vehicles;
    if (tab === 'weapons') return this.data.weapons;
    if (tab === 'missions') return this.data.missions;
    if (tab === 'heat') return this.data.wantedLevels;
    if (tab === 'bridge') return this.data.bridgeStates;
    return this.data.survivalTips;
  }

  render() {
    this.renderTabs();
    this.renderLiveReadout();
    this.renderContent();
  }

  renderTabs() {
    if (!this.tabStrip) return;
    this.tabStrip.innerHTML = this.tabs.map((tab, index) => `
      <button class="guide-tab${index === this.activeTab ? ' active' : ''}"
        type="button" role="tab" id="guideTab-${tab.id}"
        aria-controls="guidePanel" aria-selected="${index === this.activeTab}"
        tabindex="${index === this.activeTab ? '0' : '-1'}"
        data-guide-tab="${index}"><span>${tab.short}</span>${tab.label}</button>`).join('');
  }

  renderContent() {
    if (!this.content) return;
    const items = this.itemsForTab();
    const total = this.pageCount();
    this.page = clamp(this.page, 0, total - 1);
    const start = this.page * this.pageSize;
    const visible = items.slice(start, start + this.pageSize);
    const tab = this.tabs[this.activeTab];
    const body = visible.map((item, offset) => this.renderItem(item, start + offset)).join('');
    const previousDisabled = this.page <= 0 ? ' disabled' : '';
    const nextDisabled = this.page >= total - 1 ? ' disabled' : '';
    this.content.innerHTML = `
      <div id="guidePanel" role="tabpanel" aria-labelledby="guideTab-${tab.id}">
        <div class="guide-content-head">
          <div><div class="guide-content-kicker">REFERENCE ${tab.short}</div><h3>${tab.label}</h3></div>
          <div class="guide-pager" aria-label="${tab.label} pages">
            <button type="button" data-guide-action="previous" aria-label="Previous page"${previousDisabled}>‹</button>
            <button type="button" data-guide-action="next" aria-label="Next page"${nextDisabled}>›</button>
          </div>
        </div>
        <div class="guide-entry-strip"><span class="tone-dot tone-${this.toneForTab(tab.id)}"></span><b>${this.page + 1} / ${total}</b><span>${this.pageSummary(tab.id, visible)}</span></div>
        <div class="guide-entry-list" aria-label="${tab.label} entries">${this.renderEntryLinks(items, start)}</div>
        <div class="guide-card-list">${body}</div>
      </div>`;
    this.updateStatus(`${tab.label}, page ${this.page + 1} of ${total}.`);
  }

  renderEntryLinks(items, start) {
    return items.map((item, index) => {
      const label = item.name || item.title;
      const selected = start + index === start;
      return `<button class="guide-entry-link${selected ? ' active' : ''}" type="button" data-guide-entry="${start + index}"><span>${String(start + index + 1).padStart(2, '0')}</span>${label}</button>`;
    }).join('');
  }

  renderItem(item, index) {
    const tab = this.tabs[this.activeTab].id;
    if (tab === 'districts') return this.renderDistrict(item, index);
    if (tab === 'vehicles') return this.renderVehicle(item, index);
    if (tab === 'weapons') return this.renderWeapon(item, index);
    if (tab === 'missions') return this.renderMission(item, index);
    if (tab === 'heat') return this.renderHeat(item, index);
    if (tab === 'bridge') return this.renderBridge(item, index);
    return this.renderTip(item, index);
  }

  renderDistrict(item, index) {
    return `<article class="guide-entry guide-district"><div class="guide-entry-top"><span class="guide-section-label">DISTRICT ${String(index + 1).padStart(2, '0')}</span><b>${item.marker}</b></div><h4>${item.name}</h4><p class="guide-lead">${item.mood}</p><div class="guide-fact-grid"><div class="guide-fact"><span>ROUTE</span><p>${item.route}</p></div><div class="guide-fact"><span>LANDMARK</span><p>${item.landmark}</p></div><div class="guide-fact"><span>RISK</span><p>${item.danger}</p></div><div class="guide-fact"><span>FIELD NOTE</span><p>${item.advice}</p></div></div></article>`;
  }

  renderVehicle(item, index) {
    const speed = 44 + index * 15;
    const control = 76 - index * 7;
    return `<article class="guide-entry guide-vehicle"><div class="guide-entry-top"><span class="guide-section-label">${item.kind} // ${String(index + 1).padStart(2, '0')}</span><b>${upper(item.key)}</b></div><h4>${item.name}</h4><p class="guide-lead">${item.role}</p><div class="guide-stat-grid"><div class="guide-stat"><div><span>SPEED</span><b>${speed}%</b></div><i><em style="width:${speed}%"></em></i></div><div class="guide-stat"><div><span>CONTROL</span><b>${control}%</b></div><i><em style="width:${control}%"></em></i></div></div><div class="guide-columns"><div><span class="guide-section-label">STRENGTH</span><p class="guide-copy">${item.speed}</p><p class="guide-copy">${item.handling}</p></div><div><span class="guide-section-label">LIMIT</span><p class="guide-copy">${item.weakness}</p><div class="guide-callout"><span>DRIVER NOTE</span><p>${item.tip}</p></div></div></div></article>`;
  }

  renderWeapon(item, index) {
    return `<article class="guide-entry guide-weapon"><div class="guide-entry-top"><span class="guide-section-label">SLOT ${item.slot} // ${String(index + 1).padStart(2, '0')}</span><b>${item.range}</b></div><h4>${item.name}</h4><p class="guide-lead">${item.profile}</p><div class="guide-fact-grid"><div class="guide-fact"><span>RHYTHM</span><p>${item.rhythm}</p></div><div class="guide-fact"><span>HANDLING</span><p>${item.handling}</p></div><div class="guide-fact"><span>CAUTION</span><p>${item.caution}</p></div><div class="guide-fact"><span>FIELD NOTE</span><p>${item.tip}</p></div></div><div class="guide-callout compact"><span>REPORT</span><p>${item.name} is ready on number ${item.slot}. Press ${item.slot} to select it in the field.</p></div></article>`;
  }

  renderMission(item, index) {
    const missions = safeObject(this.game.missions);
    const completed = missions.completed instanceof Set && missions.completed.has(item.id);
    const active = missions.active === item.id;
    const state = completed ? 'PAID' : active ? 'ACTIVE' : 'AVAILABLE';
    const stateClass = completed ? 'done' : active ? 'current' : '';
    return `<article class="guide-entry guide-mission ${stateClass}"><div class="guide-entry-top"><span class="guide-section-label">JOB ${String(index + 1).padStart(2, '0')} // ${upper(item.giver)}</span><b>${state}</b></div><h4>${item.title}</h4><p class="guide-lead">${item.brief}</p><div class="guide-mission-route"><span>ROUTE</span><strong>${item.route}</strong><b>${item.reward}</b></div><div class="guide-columns"><div><span class="guide-section-label">START</span><p class="guide-copy">${item.start}</p><span class="guide-section-label">REPUTATION</span><p class="guide-copy">${item.reputation}</p></div><div><span class="guide-section-label">FIELD NOTE</span><p class="guide-copy">${item.advice}</p><div class="guide-callout compact"><span>STATUS</span><p>${this.missionStatus(item, state)}</p></div></div></div></article>`;
  }

  renderHeat(item, index) {
    const current = this.wantedLevel();
    const active = current === item.level;
    const stars = Array.from({ length: 5 }, (_, star) => `<i class="guide-star${star < item.level ? ' on' : ''}" aria-hidden="true"></i>`).join('');
    return `<article class="guide-entry guide-heat${active ? ' current' : ''}"><div class="guide-entry-top"><span class="guide-section-label">HEAT LEVEL ${item.level}</span><b>${active ? 'CURRENT' : upper(item.color)}</b></div><h4>${item.name}</h4><div class="guide-stars large" aria-label="${item.level} of 5 wanted stars">${stars}</div><p class="guide-lead">${item.signal}</p><div class="guide-columns"><div class="wanted-reading"><span>GUARDIA RESPONSE</span><strong>${item.response}</strong><span>ESCAPE WINDOW</span><p>${item.escape}</p></div><div class="guide-callout"><span>LIVE READING</span><p>${active ? 'This is your current heat. Find a quieter line before taking another job.' : 'The guide keeps this level ready for the next shift.'}</p></div></div></article>`;
  }

  renderBridge(item, index) {
    const bridge = safeObject(this.game.bridge);
    const active = bridge.state === item.state;
    return `<article class="guide-entry guide-bridge${active ? ' current' : ''}"><div class="guide-entry-top"><span class="guide-section-label">BRIDGE STATE ${String(index + 1).padStart(2, '0')}</span><b>${active ? 'CURRENT' : upper(item.state)}</b></div><h4>${item.name}</h4><p class="guide-lead">${item.meaning}</p><div class="bridge-reading${active ? ' current' : ''}"><span>CONTROL NOTE</span><strong>${item.action}</strong><p>${item.note}</p></div><div class="guide-fact-grid"><div class="guide-fact"><span>LIVE STATE</span><p>${active ? text(bridge.statusText || item.name) : 'Available reference state'}</p></div><div class="guide-fact"><span>SECONDS</span><p>${active ? this.bridgeSeconds(bridge) : '—'}</p></div></div></article>`;
  }

  renderTip(item, index) {
    return `<article class="guide-entry guide-tip"><div class="guide-entry-top"><span class="guide-section-label">SURVIVAL NOTE ${String(index + 1).padStart(2, '0')}</span><b>KEEP</b></div><div class="guide-tip-card"><span>FIELD MANUAL</span><strong>${item.title}</strong><p>${item.body}</p></div></article>`;
  }

  missionStatus(item, state) {
    if (state === 'PAID') return `${item.title} is in the completed ledger.`;
    if (state === 'ACTIVE') {
      const missions = safeObject(this.game.missions);
      const step = numberOr(missions.stepIndex, 0) + 1;
      const definition = safeObject(missions.defs?.[item.id]);
      const count = list(definition.steps).length || 'several';
      return `Active step ${step} of ${count}. Follow the dispatch card for the live target.`;
    }
    if (item.id === 'storm_run' && !this.completedMission('dead_drop')) {
      return 'Complete Dead Drop before this marker becomes available.';
    }
    return 'The marker is waiting in the district named above.';
  }

  completedMission(id) {
    const completed = this.game.missions?.completed;
    return completed instanceof Set && completed.has(id);
  }

  pageSummary(tab, visible) {
    if (tab === 'missions') {
      const active = safeObject(this.game.missions).active;
      return active ? `LIVE JOB // ${pretty(active)}` : `${this.data.missions.length} routes in the ledger`;
    }
    if (tab === 'heat') return `Current heat ${this.wantedLevel()} / 5`;
    if (tab === 'bridge') return `Bridge ${this.bridgeState().replaceAll('_', ' ')}`;
    return `${visible.length} entries in view`;
  }

  toneForTab(id) {
    if (id === 'heat') return 'coral';
    if (id === 'vehicles' || id === 'bridge') return 'gold';
    return 'teal';
  }

  wantedLevel() {
    const police = safeObject(this.game.police);
    return clamp(Math.round(numberOr(this.game.wanted ?? this.game.wantedLevel ?? police.stars, 0)), 0, 5);
  }

  bridgeState() {
    const state = text(this.game.bridge?.state || 'closed');
    return this.data.bridgeStates.some((item) => item.state === state) ? state : 'closed';
  }

  bridgeSeconds(bridge) {
    const seconds = numberOr(bridge.secondsLeft, 0);
    return seconds > 0 ? `${Math.ceil(seconds)}s` : 'READY';
  }

  liveZone() {
    return upper(this.game.zoneName || 'PUERTO SOL');
  }

  liveMode() {
    const mode = text(this.game.mode || 'foot');
    if (mode === 'car') return 'ROAD';
    if (mode === 'boat') return 'WATER';
    return 'ON FOOT';
  }

  liveVehicle() {
    if (this.game.mode === 'car' && this.game.car) return upper(this.game.car.name || this.game.car.typeKey || 'CAR');
    if (this.game.mode === 'boat') return 'SOMBRA LAUNCH';
    return 'ON FOOT';
  }

  liveHealth() {
    const player = safeObject(this.game.player);
    return clamp(Math.round(numberOr(player.health, 100)), 0, numberOr(player.maxHealth, 100));
  }

  liveStorm() {
    return clamp(Math.round(numberOr(this.game.stormLevel, 0) * 100), 0, 100);
  }

  liveMission() {
    const missions = safeObject(this.game.missions);
    if (!missions.active) return 'NO ACTIVE JOB';
    const definition = safeObject(missions.defs?.[missions.active]);
    return upper(definition.title || missions.active);
  }

  renderLiveReadout() {
    if (!this.live) return;
    const health = this.liveHealth();
    const storm = this.liveStorm();
    const wanted = this.wantedLevel();
    const bridge = safeObject(this.game.bridge);
    const completed = this.game.missions?.completed instanceof Set ? this.game.missions.completed.size : 0;
    const total = Object.keys(safeObject(this.game.missions?.defs)).length || this.data.missions.length;
    const stars = Array.from({ length: 5 }, (_, index) => `<i class="guide-star${index < wanted ? ' on' : ''}" aria-hidden="true"></i>`).join('');
    this.live.innerHTML = `
      <div class="live-kicker"><span class="live-pip"></span><span>LIVE HARBOR FEED</span><b>${this.liveMode()}</b></div>
      <div class="live-zone"><span>CURRENT DISTRICT</span><strong>${this.liveZone()}</strong></div>
      <div class="live-card"><span class="live-label">VEHICLE</span><strong>${this.liveVehicle()}</strong><small>${this.liveMission()}</small></div>
      <div class="live-metrics"><div><span>VITALS</span><b>${health}%</b></div><div><span>STORM</span><b>${storm}%</b></div><div><span>JOBS</span><b>${completed}/${total}</b></div></div>
      <div class="live-section"><div class="live-label"><span>WANTED</span><b>${wanted} / 5</b></div><div class="guide-stars">${stars}</div></div>
      <div class="live-section"><div class="live-label"><span>BRIDGE</span><b>${upper(bridge.statusText || this.bridgeState())}</b></div><div class="live-progress"><i style="width:${this.bridgeProgress(bridge)}%"></i></div></div>
      <div class="live-section"><div class="live-label"><span>FIELD REMINDER</span><b>J</b></div><p>Press J to return to this manual. Escape hands the harbor back to you.</p><small>ATLAS ${this.atlas.edition}</small></div>`;
  }

  bridgeProgress(bridge) {
    const state = text(bridge.state || 'closed');
    if (state === 'open') return 100;
    if (state === 'opening') return 70;
    if (state === 'closing') return 35;
    if (state === 'warning') return 15;
    return 0;
  }

  refreshLiveReadout() {
    if (!this.isOpen) return;
    this.renderLiveReadout();
    if (this.activeTab === 3 || this.activeTab === 4 || this.activeTab === 5) this.renderContent();
  }

  updateStatus(message) {
    if (this.status) this.status.textContent = text(message);
  }

  destroy() {
    if (this.refreshTimer) window.clearInterval(this.refreshTimer);
    this.refreshTimer = 0;
    this.listeners.forEach((remove) => remove());
    this.listeners = [];
    if (this.panel) this.panel.remove();
    this.panel = null;
    this.tabStrip = null;
    this.content = null;
    this.live = null;
    this.status = null;
    this.isOpen = false;
  }
}

// provenance: witnessed in the high-tide session
// high-tide round 16 authorship provenance
