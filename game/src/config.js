// config.js — every number, payout, threshold, timer and colour of High Tide.
export const CFG = {
  world: { size: 400, roadGap: 40, seaZ: -150, beachZ: -138, pierX: 40, marinaX0: 80, marinaX1: 170 },
  sun: { color: 0xffb066, intensity: 2.6, pos: [-140, 90, -60], sky: 0xff9e5e, fog: 0xf2a56b, sea: 0x2e7f9e },
  repLevels: [
    { at: 0, name: 'Runner' }, { at: 30, name: 'Wheelman' },
    { at: 70, name: 'Made' }, { at: 130, name: 'King of Puerto Sol' },
  ],
  weapons: {
    pistol: { name: 'Pistol', dmg: 25, rate: 0.28, mag: 12, startAmmo: 48, rep: 0, auto: false, pellets: 1, range: 60, spread: 0.01, heat: 4 },
    shotgun: { name: 'Scattergun', dmg: 14, rate: 0.8, mag: 6, startAmmo: 24, rep: 30, auto: false, pellets: 8, range: 28, spread: 0.09, heat: 7 },
    smg: { name: 'SMG', dmg: 12, rate: 0.09, mag: 30, startAmmo: 120, rep: 70, auto: true, pellets: 1, range: 45, spread: 0.05, heat: 3 },
    rifle: { name: 'Long Rifle', dmg: 80, rate: 1.1, mag: 5, startAmmo: 20, rep: 130, auto: false, pellets: 1, range: 160, spread: 0.002, heat: 9 },
  },
  // Ten jobs for Sombra. cond: null = always open; else a key checked by missions.js.
  jobs: [
    { id: 'errand', kind: 'walk', title: 'First Errand', story: 'Sombra needs a package moved across the market. Walk it over, no noise.', pay: 400, rep: 10, cond: null, at: [-80, 40] },
    { id: 'drop', kind: 'walk', title: 'The Drop', story: 'Leave the envelope at the end of the pier. Someone is watching the water.', pay: 600, rep: 10, cond: null, at: [40, -200] },
    { id: 'store', kind: 'robbery', title: 'Corner Store', story: 'Hold E at the till for three seconds. It will cost you two stars.', pay: 900, rep: 15, cond: null, at: [-40, 80] },
    { id: 'sprint', kind: 'race', title: 'Sunset Sprint', story: 'Three checkpoints, 75 seconds, on foot or by car. Beat the clock.', pay: 1200, rep: 15, cond: null, at: [0, 0] },
    { id: 'wheels', kind: 'getaway', title: 'Hot Wheels', story: 'The job starts hot: two stars already on you. Reach the safehouse in 60 seconds.', pay: 1500, rep: 20, cond: null, at: [120, 120] },
    { id: 'repo', kind: 'repo', title: 'Repo Run', story: 'A debtor kept Sombra\u2019s car. Fetch it and bring it back to the garage.', pay: 1400, rep: 15, cond: 'job:errand', at: [-120, 120] },
    { id: 'sixty', kind: 'countdown', title: 'Sixty Seconds', story: 'Drive the cargo car across town in 60 seconds. The timer is already running.', pay: 2000, rep: 20, cond: 'time:60', at: [80, -40] },
    { id: 'clean', kind: 'clean', title: 'Clean Hands', story: 'Walk the ledger to the park bench with no stars on you. Stay clean.', pay: 1600, rep: 15, cond: 'stars:0', at: [-120, -60] },
    { id: 'split', kind: 'split', title: 'Split Take', story: 'The take is split across two drops. Hit both and keep the cut.', pay: 2500, rep: 25, cond: 'job:store', at: [-80, 120] },
    { id: 'harbor', kind: 'harbor', title: 'Harbor Lights', story: 'Sail to the harbor buoy, then walk to Sombra at the port. The last job pays $4,000.', pay: 4000, rep: 40, cond: 'district:Harbor', at: [140, -190] },
  ],
  garage: { lot: [60, 100], racePay: 800, raceTime: 60, posts: [[-20, 140], [100, 40], [-140, 0]] },
  boatRace: { post: [100, -150], pay: 1000, time: 90, buoys: [[110, -230], [160, -240], [170, -180], [110, -170]] },
  packages: [
    { name: 'Rooftop stash', at: [-40, 20, 9] },
    { name: 'Pier-end stash', at: [40, -205, 1] },
    { name: 'Park stash', at: [-120, -60, 1] },
    { name: 'Market stash', at: [-80, 40, 1] },
    { name: 'Beach stash', at: [-60, -142, 1] },
  ],
  districts: [
    { name: 'Downtown', x0: -40, z0: -40, x1: 80, z1: 80, station: 'SOL FM — city pop', color: 0x8a7f8d },
    { name: 'Marina', x0: 80, z0: -150, x1: 180, z1: -40, station: 'MARINA WAVE — yacht rock', color: 0x4f7fa8 },
    { name: 'Market', x0: -140, z0: 0, x1: -40, z1: 100, station: 'MERCADO — street cumbia', color: 0xc98a4b },
    { name: 'Parkside', x0: -160, z0: -120, x1: -40, z1: 0, station: 'PARQUE — acoustic dusk', color: 0x5f9e6a },
    { name: 'Beachfront', x0: -160, z0: -150, x1: 80, z1: -120, station: 'PLAYA — surf guitars', color: 0xd9c27a },
    { name: 'Harbor', x0: 100, z0: -220, x1: 180, z1: -150, station: 'PUERTO — dockside blues', color: 0x6b7f8a },
  ],
  traffic: 16, peds: 24,
  bridge: { at: [120, -150], openFor: 40, closedFor: 20 },
  storm: { cycle: 70, rain: 900 },
  start: { pos: [0, 0, 40], cash: 200, health: 100 },
};
