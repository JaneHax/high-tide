// Every tuning number and colour in one place, grouped by the system that owns it, so a later session
// changes the game by editing a number here and never by hunting a magic value inside a module.
// Distances are metres, angles radians, times seconds; CONTRACT.md names the module that reads each group.

export const WORLD = {
  boundary: 460,
  gravity: 22,
  step: 1 / 60,
  fog: { near: 90, far: 520 },
  sunDistance: 260,
  sunElevation: 0.42,
  sunAzimuth: 2.1,
  sunIntensity: 2.4,
  ambient: 0.55,
  shadowExtent: 140,
};

export const CITY = {
  blockSize: 52,
  roadWidth: 14,
  gridX: 8,
  gridZ: 8,
  sidewalkWidth: 3.2,
  lotInset: 2.5,
  alleyChance: 0.22,
  parkChance: 0.12,
  propChance: 0.3,
  lightSpacing: 26,
  seawallHeight: 3.4,
  dockLength: 36,
  dockWidth: 9,
  seabed: -3.2,
  // The waterfront's steps above the road. Every one of them stays under PLAYER.stepHeight so the
  // walker climbs the kerb, the promenade and the pier without a jump.
  kerbHeight: 0.2,
  promenadeWidth: 14,
  promenadeHeight: 0.35,
  pierHeight: 0.75,
  beachWidth: 22,
};

export const PLAYER = {
  walkSpeed: 2.6,
  runSpeed: 6.4,
  acceleration: 18,
  deceleration: 24,
  jumpSpeed: 7.2,
  turnRate: 12,
  radius: 0.42,
  height: 1.8,
  stepHeight: 0.45,
};

export const CAMERA = {
  fov: 68,
  near: 0.1,
  far: 900,
  distance: 5.2,
  height: 2.3,
  pitch: -0.16,
  // How far the mouse may swing the view, and the shortest boom the wall test will allow before it
  // parks the near plane inside Rico's head.
  pitchMin: -0.95,
  pitchMax: 0.3,
  minDistance: 0.55,
  followLag: 14,
  sensitivity: 0.0022,
  collisionPadding: 0.35,
  // The car's boom is longer, higher and slower to agree with the heading, which is what makes a
  // turn felt instead of teleported.
  chaseDistance: 8.2,
  chaseHeight: 2.8,
  chaseLag: 3.2,
};

export const VEHICLES = {
  count: 18,
  maxSpeed: 26,
  accel: 9,
  brake: 18,
  reverseMax: 7,
  turnRate: 1.6,
  friction: 2.4,
  wheelRadius: 0.36,
  enterReach: 3.2,
  spawnClearance: 6,
};

export const PEDS = {
  count: 44,
  walkSpeed: 1.35,
  fleeSpeed: 4.6,
  radius: 0.36,
  alarmRadius: 9,
  alarmSeconds: 7,
  respawnDistance: 90,
};

export const COMBAT = {
  health: 100,
  ammoReserve: 90,
  magSize: 15,
  fireInterval: 0.14,
  range: 90,
  spread: 0.012,
  damage: 34,
  reviveHealth: 50,
  respawnSeconds: 4,
};

export const POLICE = {
  maxStars: 5,
  heatPerStar: 40,
  heatCrime: 12,
  heatShot: 8,
  heatKill: 40,
  decayDelay: 6,
  decayRate: 6,
  escapeSeconds: 20,
  sightRange: 55,
  carCount: 3,
  officerSpeed: 4.2,
  officerShootRange: 26,
  spawnDistance: 70,
};

export const MISSIONS = {
  count: 5,
  payouts: [400, 700, 1100, 1600, 2200],
  markerRadius: 2.2,
  markerHeight: 4,
  reachRadius: 3,
};

export const HUD = {
  font: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  margin: 18,
  panelWidth: 260,
  minimapSize: 176,
  minimapRange: 120,
};

// A dusk harbour: warm sky over turquoise water, cream and tan walls against dark asphalt, and one
// saturated colour per signal so a siren, a star and a health bar never read as decoration.
export const PALETTE = {
  skyWarm: '#f2a35e',
  skyCool: '#3d4a7a',
  sun: '#ffd9a0',
  fog: '#c98d6b',
  wallCream: '#e8d9bd',
  wallTan: '#c9a882',
  wallStone: '#b4ada0',
  roof: '#6b5546',
  asphalt: '#2c2b33',
  roadLine: '#d9c98f',
  roadLineYellow: '#d8b45a',
  sidewalk: '#9a9184',
  sea: '#2fa6a0',
  seaDeep: '#12565e',
  grass: '#6d7a49',
  sand: '#cfb98d',
  wetSand: '#9c8a68',
  hill: '#5a5245',
  sirenRed: '#e8402f',
  sirenBlue: '#3f7dff',
  wantedGold: '#f5c451',
  healthRed: '#e0453c',
  cashGreen: '#5fd08a',
  panel: 'rgba(18, 16, 26, 0.72)',
  accent: '#f2a35e',
  text: '#f4efe6',
  muted: '#9a938c',
};
