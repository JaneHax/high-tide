// High Tide — every number that tunes the game lives here, in one place.
// Golden hour: low warm sun, long shadows, a bright warm sea.
export const WORLD = {
  size: 400,
  half: 200,
  seaZ: 120,          // sea starts south of this line
  beachZ: 104,        // sand strip just north of the water
  pierX: -40,         // pier runs south from the promenade
  pierZ0: 112,
  pierZ1: 196,
  pierY: 0.6,
  roadGap: 40,        // distance between parallel roads
  roadWidth: 11,
};

export const SUN = {
  elevation: 0.62,    // radians above the horizon, low and warm
  azimuth: 0.85,
  intensity: 2.9,
  color: 0xffb45e,
  skyTop: 0x7fb4d8,
  skyLow: 0xffc98a,
  fog: 0xf2b27a,
  sea: 0x2e7f9e,
  sand: 0xd9b380,
  grass: 0x6f9e4f,
  asphalt: 0x3c3f46,
};

export const PALETTE = {
  wantedGold: 0xffc93c,
  accent: 0x37e0a0,
  danger: 0xff4d4d,
  policeBlue: 0x2f6df6,
  policeWhite: 0xf2f2f2,
  heliDark: 0x22303c,
  buildingA: 0xd8c9a8,
  buildingB: 0xc9b18a,
  buildingC: 0xb98d6e,
  towerGlass: 0x7fa8c9,
  roof: 0x8a6f5c,
  stallRed: 0xd95050,
  stallGreen: 0x4d9e6a,
  stallYellow: 0xe0b93c,
  tree: 0x4d8a4a,
  lamp: 0xffe9a8,
};

export const PLAYER = {
  walk: 6,
  sprint: 10,
  radius: 0.7,
  height: 1.8,
  health: 100,
};

export const CAR = {
  accel: 22,
  brake: 34,
  maxSpeed: 34,
  reverse: 10,
  turn: 2.1,
  enterRange: 3.5,
};

export const REP = {
  thresholds: [0, 30, 70, 130],
  levels: ['Runner', 'Wheelman', 'Made', 'King of Puerto Sol'],
  speedBonus: 0.05, // +5% car speed per level
};

export const MISSIONS = {
  payouts: [400, 500, 600, 700, 1300, 1500, 1800, 2000, 2500, 3000],
  rep: [10, 12, 14, 16, 20, 22, 26, 28, 32, 40],
  raceSeconds: 75,
  getawaySeconds: 60,
  robSeconds: 3,
  markerRadius: 4,
  markerHeight: 26,
  reachRadius: 5,
};

export const WEAPONS = {
  pistol:   { name: 'Pistol',   damage: 25, rate: 0.28, auto: false, ammo: 120, range: 55,  spread: 0.012, pellets: 1, rep: 0, slot: 1 },
  shotgun:  { name: 'Shotgun',  damage: 13, rate: 0.85, auto: false, ammo: 40,  range: 26,  spread: 0.14,  pellets: 8, rep: 1, slot: 2 },
  smg:      { name: 'SMG',      damage: 11, rate: 0.09, auto: true,  ammo: 220, range: 42,  spread: 0.05,  pellets: 1, rep: 2, slot: 3 },
  rifle:    { name: 'Rifle',    damage: 85, rate: 1.15, auto: false, ammo: 30,  range: 110, spread: 0.004, pellets: 1, rep: 3, slot: 4 },
};

export const POLICE = {
  maxStars: 5,
  heatPerShot: 6,
  robHeat: 80,
  decayRange: 46,     // heat falls only when no officer is this close
  decayRate: 9,
  officerSpeed: 5.4,
  officerShootRange: 26,
  officerDamage: 6,
  cruiserSpeed: 24,
  cruiserRam: 10,
  spotterStars: 4,
};

export const GARAGE = {
  x: 96, z: 56, w: 30, d: 22,
  raceWin: 800,
  raceRep: 10,
  raceSeconds: 60,
};

export const BOAT = {
  speed: 14,
  turn: 1.6,
  count: 3,
};

export const SAVE_KEY = 'hightide-save-v1';
