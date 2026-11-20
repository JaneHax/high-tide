# HIGH TIDE — interface contract

HIGH TIDE is an open-world crime game in a harbour city called Puerto Sol, played in a desktop browser
from static files: `game/index.html` and the ES modules under `game/src/`, no build step and no network
request at runtime. Third person, keyboard and mouse. Later sessions add the city, the character,
traffic, pedestrians, police and five jobs.

This file is the interface every later session codes against. A later session may read this file and
nothing else of the others' work: if a fact is not here, it is not agreed, and the module that owns the
fact decides it — not the module that wants it.

**State of the build.** Written and committed: `game/index.html`, `game/src/config.js`,
`game/src/random.js`, `game/src/geometry.js`, `game/src/input.js`. `index.html` already imports
`./src/main.js`; that file and every module below are written by later sessions.

---

## 1. Shared vocabulary

- **three.js** is imported as the bare specifier `three`, mapped by `game/index.html`'s import map to
  `./vendor/three.module.min.js`. That vendored pair is never replaced and no other library is added.
- **Positions** are `THREE.Vector3`, metres, y up, and are **live**: a module mutates its own vectors in
  place and other modules read them. A field documented as a `Vector3` is never reassigned to a new one.
- **Angles** (`yaw`, `heading`, `pitch`) are radians. `yaw = 0` faces −Z. A positive `yaw` turns left seen
  from above (three.js's +Y rotation); a positive `pitch` looks up.
- **Units**: metres and seconds. Speeds are m/s, accelerations m/s².
- **Collider**: `{ minX, maxX, minZ, maxZ, height }`. The footprint is the XZ box; `height` is its top
  above y = 0. Only `city.colliders` holds them, and `geometry.firstHit` is the only ray test in the game.
- **Live state**: every factory returns a plain object whose documented fields are mutable and read by
  the frame. Nobody replaces `state`, `position` or a list; they write into it.
- **Every factory takes one options object** and returns one plain object, as written below. Extra keys
  are not passed and not expected.

---

## 2. The modules

| file | export | written by |
| --- | --- | --- |
| `game/src/city.js` | `buildPuertoSol(seed)` | city session |
| `game/src/player.js` | `createPlayer({ city, scene, spawn })` | character session |
| `game/src/camera.js` | `createFollowCamera({ camera, player })`, `createChaseCamera({ camera, city })` | character session |
| `game/src/vehicles.js` | `createVehicles({ city, scene, seed, player })` | traffic session |
| `game/src/peds.js` | `createPeds({ city, scene, seed, player })` | traffic session |
| `game/src/combat.js` | `createCombat({ scene, player, camera, peds, city })` | combat session |
| `game/src/police.js` | `createPolice({ city, scene, player, combat })` | police session |
| `game/src/missions.js` | `createMissions({ city, scene, player, vehicles, police, hud })` | missions session |
| `game/src/hud.js` | `createHud({ missions, combat, police, vehicles, player })` | hud session |
| `game/src/lifecycle.js` | `createLifecycle({ player, vehicles, police, combat, spawn, followCamera })` | lifecycle session |
| `game/src/main.js` | none: it runs on import | this session's `index.html` expects it |

Each module imports `three` (if it needs it), `./config.js`, `./random.js` and `./geometry.js`, and the
modules its row below says it reads. It imports no module that is not listed there.

### 2.1 `city.js`

```js
export function buildPuertoSol(seed)
```

`seed` is a number. Returns:

```
{
  group:        THREE.Group,        // the whole city, added to the scene by main.js
  roads: {
    xRoads:     number[],           // centre-line z of every road running east–west (parallel to X)
    zRoads:     number[],           // centre-line x of every road running north–south (parallel to Z)
    segments:   { x1, z1, x2, z2, width }[]
  },
  blocks:       { x, z, width, depth, kind }[],
  buildings:    { x, z, width, depth, height, kind }[],
  colliders:    { minX, maxX, minZ, maxZ, height }[],
  spawnPoints:  { x, z, yaw, kind, area }[],
  surfaceAt(x, z): number,
  sea:          { time: { value: number } },   // the water shader's uniform holder
  tick(dt):     void
}
```

- `xRoads` and `zRoads` are **centre lines**: `xRoads` holds z values (roads you drive along X), `zRoads`
  holds x values. Every crossing of the two is an intersection; a car turns at one, a block sits between four.
- `segments` is one straight run per road, `width` = `CITY.roadWidth`, in world coordinates.
- `blocks` is one entry per city block, `x` and `z` its centre, `kind` one of `'built'`, `'park'`,
  `'alley'`, `'dock'`.
- `buildings` is one entry per building: footprint centre, `width`/`depth` in X/Z, `height` above the
  ground, `kind` one of `'house'`, `'shop'`, `'tower'`, `'warehouse'`. The meshes are already welded into
  `group`; this list exists so peds, police and missions can pick a doorway without raycasting the world.
- `colliders` holds one box per solid thing that blocks a walker, a wheel or a bullet: every building
  footprint, the seawall and the dock sheds. The ground is not a collider; `surfaceAt` is the ground.
- `spawnPoints` holds exactly one entry with `kind: 'player'` (the default spawn) and at least
  `MISSIONS.count` entries with `kind: 'job'`, so each of the five jobs can take a point in the district
  its own text names; the city session lays out more than five for that reason. `area` names the district
  the point actually stands in — `'street'`, `'promenade'`, `'pier'` or `'park'` — and missions picks by
  it, so a point whose `area` lies about where it stands puts a job marker in the wrong part of town.
- `surfaceAt(x, z)` answers the height a walker or a wheel stands on there: `0` on streets, lots,
  sidewalks and parks, the sidewalk lip included; the dock deck height on a dock; `CITY.seabed` over open
  water. It is total and side-effect free: every x, z has an answer, and calling it never moves anything.
- `sea` is the `THREE.ShaderMaterial`'s `uniforms` object, holding at least `time: { value }` in seconds.
  `tick(dt)` advances `sea.time.value` by `dt`; main.js calls it once per fixed step.

Reads: `CITY`, `WORLD.boundary`, `PALETTE`, `createRandom(seed)`, `tintedBox`/`merge`/`paint`.
Read by: everything — `city.group` into the scene, `colliders` by player, camera, vehicles, combat and
police, `spawnPoints` by main/lifecycle/missions, `surfaceAt` by player, vehicles, peds and police.

### 2.2 `player.js`

```js
export function createPlayer({ city, scene, spawn })
```

`spawn` is one `city.spawnPoints` entry. Returns:

```
{
  group:     THREE.Group,        // the welded body, added to scene here
  position:  THREE.Vector3,      // the feet; y = city.surfaceAt(x, z) while on foot
  velocity:  THREE.Vector3,      // m/s, world space
  yaw:       number,
  speed:     number,             // horizontal m/s this step, for the HUD's pace and the animator
  state:     'idle' | 'walk' | 'run' | 'jump' | 'driving' | 'dead',
  radius:    number,             // PLAYER.radius
  height:    number,             // PLAYER.height
  update(dt, input, cameraYaw): void
}
```

- `update` reads `input.isDown('KeyW'|'KeyA'|'KeyS'|'KeyD')`, `input.isDown('ShiftLeft')` and
  `input.wasPressed('Space')`; it steers relative to `cameraYaw` (the camera's `yaw`), calls
  `city.surfaceAt` for the ground and `firstHit` against `city.colliders` to slide along walls, and sets
  `state`. It does nothing to `position` while `state` is `'driving'` (vehicles moves the car and the
  player rides it) or `'dead'`.
- `group` is positioned from `position` and rotated from `yaw` at the end of `update`; the body is
  hidden while `'driving'`.
- `stepHeight` from `PLAYER` is how far up `update` may lift the player without a jump.

Reads: `PLAYER`, `WORLD.gravity`, `city.surfaceAt`, `city.colliders`, `firstHit`, `merge`.
Read by: camera, vehicles (`enter`/`exit` place the player), combat (aim origin), police, missions, HUD,
lifecycle (which writes `position` and `state` directly on respawn).

### 2.3 `camera.js`

```js
export function createFollowCamera({ camera, player })
export function createChaseCamera({ camera, city })
```

`createFollowCamera` returns:

```
{
  yaw:   number,
  pitch: number,
  update(dt, input, player): void,
  snap(player): void,
  setYaw(v): void
}
```

- `update` adds `input.yawDelta` to `yaw`, adds `-input.mouse.dy * CAMERA.sensitivity` to `pitch`
  (clamped to `CAMERA.pitchMin…pitchMax`), and writes `camera.position` / `camera.quaternion` to stand
  `CAMERA.distance` behind and `CAMERA.height` above the player. It reads the `player` argument, not a
  captured one, so it can follow another body.
- `snap(player)` places it at once with no easing: spawn, respawn, teleport.
- `setYaw(v)` sets the heading and is what lifecycle and missions call to face the player somewhere.
- The follow camera **collides**. It casts its own boom with `firstHit` against the player's colliders
  and pulls in to the first face it meets, keeping `CAMERA.minDistance` of gap, so standing against a
  wall does not put the camera inside it. `createFollowCamera` takes no `city`, so it reads the boxes
  from `player.colliders`, which `createPlayer` fills with `city.colliders`; a body without that field
  is followed without collision.

`createChaseCamera` returns:

```
{
  update(dt, input, car): void,   // car is a vehicles car, or null for a parked view
  reset(car): void
}
```

- `update` orbits behind `car` from `input.yawDelta` and `input.mouse.dy`, then pulls the camera in to
  `firstHit(car.position + height, camera.position, city.colliders, CAMERA.collisionPadding)` so a wall
  never hides the car.
- `reset(car)` snaps it behind the car: entering a vehicle, respawning.

Reads: `CAMERA`, `city.colliders` (chase only), `firstHit`.
Read by: main.js (which passes the one `THREE.PerspectiveCamera` and swaps which of the two updates).

### 2.4 `vehicles.js`

```js
export function createVehicles({ city, scene, seed, player })
```

Returns:

```
{
  cars:        car[],
  traffic:     car[],            // live getter: the cars the AI is driving now (cars minus drivenCar)
  drivenCar:   car | null,       // live getter: the car the player is in, or null
  update(dt, input, onFoot): void,
  enter():     car | null,
  exit():      car | null,
  nearest(point, reach): car | null,
  onHit(fn):   void
}
```

`car` is:

```
{
  position: THREE.Vector3,       // centre of the chassis at road level
  heading:  number,              // radians, 0 faces −Z
  speed:    number,              // m/s, signed: negative is reverse
  limit:    number,              // the top speed this car may reach now, m/s
  spec:     { length, width, height, maxSpeed, colour },
  body:     THREE.Group,         // the welded mesh, already in scene
  stolen:   boolean
}
```

- `update` drives the traffic AI along `city.roads.segments`, keeps `VEHICLES.spawnClearance` from other
  cars, and — when `drivenCar` is set — reads the keyboard for throttle, brake, reverse and steer. It keeps
  every car on `city.surfaceAt` and out of `city.colliders`. `onFoot` is true when the player is not in a
  car, which is when `KeyF`/`KeyE` mean something to `enter()`.
- `enter()` takes the nearest car within `VEHICLES.enterReach` of `player.position`, sets `stolen` and
  `drivenCar`, sets `player.state = 'driving'`, and returns it (null when nothing is in reach).
- `exit()` stops the car, puts `player.position` beside it at `city.surfaceAt`, sets
  `player.state = 'idle'`, clears `drivenCar`, and returns the car left (null when not driving).
- `nearest(point, reach)` is the same search without side effects: used by the HUD's prompt.
- `onHit(fn)` registers `fn(car, impact)` where `impact` is the closing speed in m/s; hud plays the crash,
  police adds heat. One callback; a second call replaces it.

Reads: `VEHICLES`, `WORLD.gravity`, `city.surfaceAt`, `city.roads`, `city.colliders`, `firstHit`,
`createRandom(seed)`, `tintedBox`/`merge`, `PALETTE`.
Read by: missions (a job may need a car), police (chases the driven car), HUD (speedometer, enter prompt),
lifecycle (exits the car on death), main (`traffic`, `drivenCar`).

### 2.5 `peds.js`

```js
export function createPeds({ city, scene, seed, player })
```

Returns:

```
{
  list:        ped[],
  update(dt, cars, policeCars): void,
  alarm(x, z): void,
  onRunOver(fn): void
}
```

`ped` is:

```
{
  position: THREE.Vector3,       // feet
  heading:  number,
  state:    'walk' | 'flee' | 'down',
  health:   number,              // starts at 100; 0 means 'down'
  mesh:     THREE.Mesh           // one welded mesh, already in scene
}
```

- `PEDS.count` (44) peds walk the sidewalks and crossings. A ped who strays past `PEDS.respawnDistance`
  from the player, or whose body has lain for `PEDS.bodySeconds`, is put back on a block ring near the
  player. Peds do not read `city.spawnPoints`: those are for the player and the jobs.
- `update` walks them, turns them to flee from `alarm` or from a car within `PEDS.alarmRadius` for
  `PEDS.alarmSeconds`, and knocks down anyone a car in `cars` or `policeCars` reaches.
- `alarm(x, z)` sets everyone within `PEDS.alarmRadius` of the point to `'flee'` for `PEDS.alarmSeconds`:
  called on a gunshot and on a body found.
- `onRunOver(fn)` registers `fn(ped, car)` when a car knocks a ped down. One callback.

Reads: `PEDS`, `city.surfaceAt`, `city.blocks`, `createRandom(seed)`, `tintedBox`/`merge`, `PALETTE`.
Read by: combat (a bullet's target), police (a body raises heat), HUD (minimap dots), main.

### 2.6 `combat.js`

```js
export function createCombat({ scene, player, camera, peds, city })
```

Returns:

```
{
  state:   { health, dead, ammo, reserve },   // live: ammo is the magazine, reserve the rounds behind it
  update(dt): void,
  shoot(): boolean,
  reload(): void,
  damage(amount): void,
  revive(): void,
  onFire(fn): void,
  dropAmmo(x, z): void
}
```

- `state.health` starts at `COMBAT.health`; `ammo` at `COMBAT.magSize`; `reserve` at `COMBAT.ammoReserve`;
  `dead` false. Every field is written in place.
- `shoot()` returns true when a round left the barrel: it needs `ammo > 0` and `COMBAT.fireInterval`
  elapsed. The round is a ray from `camera.position` along the camera's forward, spread by `COMBAT.spread`,
  cut at `COMBAT.range`; `firstHit` against `city.colliders` decides the wall, and the nearest ped before
  it takes `COMBAT.damage`. It calls the `onFire` callback and `peds.alarm` at the shooter.
- `reload()` moves rounds from `reserve` into the magazine up to `COMBAT.magSize`.
- `damage(amount)` subtracts health and sets `dead` at 0. It is the only way the player loses health.
- `revive()` sets health to `COMBAT.reviveHealth`, `dead` false; lifecycle calls it.
- `dropAmmo(x, z)` puts a pickup on the ground; `update` collects it when the player is within reach and
  adds to `reserve`.
- `update` advances the fire cooldown, the pickups, and reads `player.position` for reach.

Reads: `COMBAT`, `city.colliders`, `player.position`, `camera`, `peds.list`, `firstHit`.
Read by: police (a shot adds heat), missions (a job may need a kill), HUD (health, ammo), lifecycle (death
and revive), main.

### 2.7 `police.js`

```js
export function createPolice({ city, scene, player, combat })
```

Returns:

```
{
  cars:     { position, heading, speed, body }[],
  officers: { position, heading, health, mesh }[],
  heat:     number,
  stars:    number,      // 0 … POLICE.maxStars
  escape:   number,      // seconds left before the level drops, 0 when not wanted
  seen:     boolean,     // an officer can see the player this step
  shots:    number,      // rounds fired at the player this chase
  update(dt): void,
  addHeat(n): void,
  clear():  void,
  onDrop(fn): void
}
```

- `stars` is `Math.min(POLICE.maxStars, Math.floor(heat / POLICE.heatPerStar))` and is written by `update`.
- `update` spawns up to `POLICE.carCount` cars and their officers at `POLICE.spawnDistance` when the
  wanted level rises, drives them at the player, and shoots inside `POLICE.officerShootRange` for
  `combat.damage`. Heat decays `POLICE.decayRate` a second after `POLICE.decayDelay` unseen, and after
  `POLICE.escapeSeconds` out of sight the level drops a star.
- `addHeat(n)` is what everything else calls: `POLICE.heatCrime` for a crime, `POLICE.heatShot` a shot,
  `POLICE.heatKill` a kill.
- `clear()` sets heat, stars, escape and shots to 0 and sends the cars away: death, respawn, mission end.
- `onDrop(fn)` registers `fn(x, z)`, called with the spot where an officer falls. One callback; the game
  points it at `combat.dropAmmo`, which is how a dead officer's rounds end up on the ground. It is a
  method, not a property: call it, do not assign over it.

Reads: `POLICE`, `city.roads`, `city.surfaceAt`, `city.colliders`, `player.position`, `combat`,
`firstHit`, `tintedBox`/`merge`, `PALETTE.sirenRed`/`sirenBlue`.
Read by: missions (a job may want the police called), HUD (stars, siren sound), lifecycle (clear on death),
main.

### 2.8 `missions.js`

```js
export function createMissions({ city, scene, player, vehicles, police, hud })
```

Returns:

```
{
  jobs:  { id, title, text, area, x, z, pay }[],
  state: { cash, job, objective, active, done, paid, title, text, marker },
  update(dt): void,
  start(): void,
  next(): void,
  completeObjective(): void
}
```

- `jobs` holds `MISSIONS.count` (5) jobs in play order, one `city.spawnPoints` point of `kind: 'job'` each;
  `pay` is `MISSIONS.payouts[id]`. `id` is 0-based.
- `state` is live: `cash` starts at 0; `job` is the current job's index; `objective` the index within it;
  `active` whether a job is running; `done` and `paid` the job's own flags; `title` and `text` the lines
  the HUD shows; `marker` is `{ x, y, z }` or `null` when nothing is marked.
- `start()` begins the job at `state.job`, sets `active` and the first `marker` from the job's point.
- `next()` pays `jobs[job].pay` into `cash`, sets `paid`, clears the marker and moves `state.job` on; the
  fifth job's completion sets `done`.
- `completeObjective()` marks the current objective done and either moves the marker to the next one or
  calls the end-of-job path (pay, then `next()`).
- `update` checks the player's distance to `marker` against `MISSIONS.reachRadius` and calls
  `completeObjective()` on arrival, then redraws the marker column at `MISSIONS.markerRadius` /
  `MISSIONS.markerHeight`. It calls `hud.toast` on each change of `title`/`text`.

Reads: `MISSIONS`, `city.spawnPoints`, `player.position`, `vehicles.drivenCar`, `police.stars`, `hud.toast`.
Read by: HUD (job panel, cash, marker), main.

### 2.9 `hud.js`

```js
export function createHud({ missions, combat, police, vehicles, player })
```

Returns:

```
{
  update(dt, ctx): void,
  setVisible(bool): void,
  toast(text): void,
  sound(name): void,
  unlockAudio(): void,
  mode: 'title' | 'play' | 'paused' | 'dead' | 'complete'
}
```

- The HUD is DOM laid over the canvas: job panel, cash, health bar, wanted stars, minimap, speedometer,
  ammo. It also owns the pause, title, death and completion cards, so the game needs no menus module.
- `ctx` is `{ input, camera, renderer }`: `input` for the pause key, `camera` (the live
  `THREE.PerspectiveCamera`) for the minimap's heading, `renderer` for the viewport size. Nothing else.
- `mode` is written by main.js (title, play, paused, dead, complete) and read by the HUD to show the
  right card; the HUD never changes it.
- `toast(text)` shows a transient line and writes the same text into `#status`, the off-screen
  `role="status"` paragraph, which is how a screen reader hears the game.
- `sound(name)` plays one synthesised cue: `'engine'`, `'siren'`, `'step'`, `'shot'`, `'hit'`, `'crash'`.
  The WebAudio graph is built inside this file; no audio file is loaded.
- `unlockAudio()` creates or resumes the `AudioContext`. main.js calls it from `input.onGesture`.

Reads: `HUD`, `PALETTE`, `missions.state`, `combat.state`, `police.stars`/`escape`/`seen`,
`vehicles.drivenCar`, `player.speed`/`state`.
Read by: missions (`toast`), main (mode, update, sound cues), lifecycle (dead card), police (siren).

### 2.10 `lifecycle.js`

```js
export function createLifecycle({ player, vehicles, police, combat, spawn, followCamera })
```

Returns:

```
{
  update(): void,
  wasDead: boolean        // live getter
}
```

- It owns death and respawn, and it runs without a browser: main calls `update()` once per fixed step,
  before `player.update`.
- On the step `combat.state.dead` turns true it sets `wasDead` and starts `COMBAT.respawnSeconds`. Each
  later `update()` counts down; at zero it calls `combat.revive()`, writes `player.position` to `spawn`
  and `player.state = 'idle'`, calls `vehicles.exit()` if a car is driven, `police.clear()` and
  `followCamera.snap(player)`, then clears `wasDead`.
- `wasDead` is true from the death until the respawn finishes; main keeps the HUD in `'dead'` mode and
  freezes input while it is true.

Reads: `combat.state.dead`, `COMBAT.respawnSeconds`, `player`, `vehicles`, `police`, `followCamera`.
Read by: main.

### 2.11 `main.js`

Builds the renderer, scene, sun, fog and sky; calls every factory above; owns the fixed-step loop,
`window.game`, and the query string.

- `?seed=N` seeds `createRandom` for the city, peds and traffic. Without it the seed is a constant, so
  the first screenshot of a session is repeatable.
- `?manual=1` builds everything and starts no loop: a harness drives `window.game.step(dt)` and
  `window.game.render()`.
- `?fresh=1` ignores saved progress (cash and jobs) and starts from job 0 with no cash.
- The loop steps at `WORLD.step` with an accumulator, drops a frame longer than 0.25 s rather than
  replaying it, and calls `input.endFrame()` once per frame after the steps.
- `window.game` exposes exactly:

```
{
  THREE, scene, renderer, camera, city, player, followCamera, chaseCamera, input,
  vehicles, peds, combat, police, missions, hud,
  step(dt), render(),                       // one fixed step; one paint
  traffic, drivenCar, mode                  // live getters, forwarded from vehicles and hud
}
```

`traffic` and `drivenCar` forward `vehicles.traffic` and `vehicles.drivenCar`; `mode` forwards
`hud.mode`. They are getters, not copies, so a harness reads the same objects the game is using.

---

## 3. `input.js`, as every module sees it

```js
const input = createInput(canvas);
```

```
{
  isDown(code): boolean,        // held now
  wasPressed(code): boolean,    // pressed since the last endFrame, never twice
  mouse: { left, dx, dy },      // left held; movement in pixels since the last endFrame
  yawDelta: number,             // radians to add to the camera's yaw for that movement, already
                                // scaled by CAMERA.sensitivity; positive turns left
  requestLock(): void,          // asks the browser for pointer lock on the canvas
  endFrame(): void,             // clears presses and mouse movement; main calls it once per frame
  onGesture(fn): void           // fn once, on the first pointer or key gesture (audio needs it)
}
```

Bound codes: `KeyW` `KeyA` `KeyS` `KeyD` move, `ShiftLeft` run, `Space` jump, `KeyF` enter/leave a
vehicle, `KeyE` interact, `KeyR` reload, `Escape` pause. `Escape` is never `preventDefault`ed — the
browser needs it to release pointer lock — and losing the pointer is reported as a press of `Escape`.
Every held key is released on window blur.

---

## 4. `config.js`, and who reads each group

One constant is added only when a module reads it. If a later session needs a new number, it adds it to
the group that owns the system and names the reader here.

| group | read by |
| --- | --- |
| `WORLD.boundary` | city.js |
| `WORLD.gravity` | player.js, vehicles.js |
| `WORLD.step` | main.js |
| `WORLD.fog`, `WORLD.sunDistance`, `sunElevation`, `sunAzimuth`, `sunIntensity`, `ambient`, `shadowExtent` | main.js |
| `CITY.*` (block size, road width, grid counts, sidewalk width, lot inset, alley/park/prop chances, light spacing, seawall, dock, seabed) | city.js |
| `PLAYER.*` | player.js |
| `CAMERA.*` | camera.js; `CAMERA.sensitivity` also input.js |
| `VEHICLES.*` | vehicles.js |
| `PEDS.*` | peds.js |
| `COMBAT.*` | combat.js; `COMBAT.respawnSeconds` also lifecycle.js |
| `POLICE.*` | police.js |
| `MISSIONS.*` | missions.js; `markerRadius`, `markerHeight` also hud.js |
| `HUD.*` | hud.js |
| `PALETTE.skyWarm`, `skyCool`, `sun`, `fog` | main.js |
| `PALETTE.wallCream`, `wallTan`, `roof`, `asphalt`, `roadLine`, `sidewalk`, `sea`, `seaDeep` | city.js |
| `PALETTE.sirenRed`, `sirenBlue` | police.js |
| `PALETTE.wantedGold`, `healthRed`, `cashGreen`, `panel`, `accent`, `text`, `muted` | hud.js |

`random.js` exports `createRandom(seed)` returning `{ next, range, intRange, pick, chance }`:
`next()` in [0, 1), `range(min, max)` in [min, max), `intRange(min, max)` whole with both ends included,
`pick(list)` one element, `chance(p)` true with probability p.

`geometry.js` exports `tintedBox(w, h, d, colour, x, y, z)` (a tinted box geometry already placed),
`paint(geometry, colour)` (bakes one colour into the vertex colours), `merge(list)` (welds position,
normal and colour of several geometries into one and disposes the inputs), and
`firstHit(from, to, colliders, padding)` (the fraction along from → to of the first collider met, or 1 for
a clear line; a collider whose `height` is below the ray at the crossing point is passed over).

---

## 5. House rules

1. **No `Math.random`, no clock, in world shaping.** The city, peds, traffic, colours and jobs come from
   `createRandom(seed)`. The loop may read `performance.now`; nothing that shapes the world may read
   `Date.now` or a random number generator other than `random.js`.
2. **No network request at runtime.** Every file is relative under `game/`; `three` comes from the import
   map; audio is synthesised, not loaded. No CDN, no fetch, no font file.
3. **No new dependency.** `game/vendor/three.module.min.js` and `three.core.min.js` stay as they are;
   nothing else is vendored and nothing is installed.
4. **No build step.** Plain ES modules and plain CSS that the browser runs as they sit on disk.
5. **One material per kind of thing, and welded meshes.** A pedestrian or a car is one geometry from
   `merge` with one `MeshLambertMaterial`-style vertex-colour material, not twenty `Mesh`es; the city
   merges per kind, not per brick. `tintedBox` + `merge` is the way to build anything with more than one
   part.
6. **One look.** Low-poly flat-shaded primitives (`flatShading: true`), the `PALETTE` colours, a dusk
   harbour: warm sky, cream and tan walls, dark asphalt, turquoise sea.
7. **Comments say why, never what.** No JSDoc, no banner or divider comments. A comment exists to record
   the reason a rule is there — the thing a later session would otherwise undo.
8. **Ownership.** A module writes only its own state and the fields this contract hands it:
   lifecycle writes `player.position`/`player.state`, vehicles writes `player.state` and the driven car,
   combat writes `peds` health through `peds.list`, police writes heat, and `hud.mode` belongs to
   main.js alone. Anything else is read-only across a module boundary.
9. **The same seed builds the same city.** `?seed=N` twice gives the same blocks, the same spawn points
   and the same traffic, which is what makes a screenshot and a bug both repeatable.
