# HIGH TIDE

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/JaneHax/high-tide/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/JaneHax/high-tide/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

HIGH TIDE is an open-world crime game set in Puerto Sol, a harbour city at golden hour. It runs in a
desktop browser, in third person, with a keyboard and a mouse. You are Rico: you walk the waterfront
and the city grid, you take cars that are not yours, you keep one in a garage, you sail boats out past
the breakwater, and you work ten jobs for a man called Sombra. The last job is a meeting at the
breakwater, where Sombra is waiting with a boat. The game has no build step and makes no network
request at runtime; the page, every module and the one vendored copy of three.js are files on disk.

## What is in it

- **Ten story jobs, five kinds.** Walk-to-the-ring errands, a shop robbery (hold E at the till, then run),
  a three-checkpoint street race against the clock, a getaway while the law is already on you, a
  smuggler's drive to the pier, and a boat job out on the water. Each job pays cash and REP.
- **Police that answer.** Wanted stars from heat, cruisers that drive the grid to you, officers who get
  out and shoot, roadblocks across the road ahead of you at three stars, and Air One — a helicopter with
  a searchlight that circles above the rooftops and keeps the chase alive at four stars.
- **Four weapons.** Pistol, shotgun, SMG and rifle, switched with 1 / 2 / 3 or cycled with Q. The heavier
  guns unlock as your REP rises: Runner, Wheelman, Made, King of Puerto Sol. Higher REP also makes the
  cars you drive faster.
- **A garage and street races.** The gold-roofed alley lot stores the car you are driving (E) and hands it
  back (E). Three race posts around the grid start a three-checkpoint timed race that pays $800 on a win
  and remembers your best time.
- **Boats.** Three boats tied at the piers. F boards one, W drives it, A/D steer it, F steps back onto the
  pier. The final jobs are built around the water.
- **A living city.** 44 pedestrians who walk the kerbs, cross at corners and flee from gunshots and
  sirens; 36 traffic cars on a lane graph; a minimap, a speedometer, synthesised engine and siren audio,
  health, cash, wanted stars and an AIR ONE warning on the HUD. Progress — cash, jobs, REP, the stored
  car, the best race time and the unlocked weapons — is kept in `localStorage`.

## Play it

The game is `game/index.html`. Open it in a desktop Chrome, or serve the folder and open it over
http:

    node serve.ts        # game/ is on http://localhost:8080

Then go to http://localhost:8080 and click once (or press Enter) to begin. That click starts the story
and hands the mouse to the canvas; `Esc` gives the mouse back and pauses. Serving the folder is the
reliable way in: Chrome will not load ES modules from a `file://` page unless it was started with
`--allow-file-access-from-files`.

| key | what it does |
| --- | --- |
| W A S D | walk on foot; in a car, W is throttle, S is brake and reverse, A and D steer; in a boat, W is throttle, A and D steer |
| Shift | run on foot |
| Space | jump on foot, handbrake in a car |
| mouse | look around; the left button fires the current weapon |
| F | take the car you are standing next to, board the boat you are standing next to, or get out of the one you are in |
| E | interact — the HUD always says what E will do here: store or retrieve a car at the garage, start a street race at a race post, talk to a contact, rob a shop (hold E) |
| 1 / 2 / 3 | pistol / shotgun / SMG (when unlocked by REP); Q cycles weapons, rifle included |
| R | reload |
| Enter | begin from the title card, resume from pause |
| Esc | pause and resume |

`?fresh=1` on the URL discards the saved story and starts again at job 0 with no cash. Otherwise
progress is kept in `localStorage`, under a key that carries the seed it was played on. `?seed=N`
builds a different Puerto Sol; one seed always builds the same city, the same crowd and the same
traffic.

## What the two scripts need

**Node 22.18 or newer.** `main.ts` and `serve.ts` are TypeScript run by Node itself, which strips the
types out; 22.18.0 is the release where that stopped needing a flag, while 22.6 through 22.17 need
`--experimental-strip-types` to do the same thing. Nothing is installed and nothing is compiled.

## The game's files

`game/index.html` is the page: a canvas, an import map that points `three` at the vendored build, and
`./src/main.js`. Everything else is in `game/src/`:

| file | what it is |
| --- | --- |
| `main.js` | the renderer, the golden-hour sky and the fixed-step loop; it creates every system below, saves progress to `localStorage`, and owns `window.game` and the query string |
| `city.js` | `buildPuertoSol(seed)`: the grid of blocks and roads, the buildings, the promenade, the two piers, the sea, the colliders, the garage lot, the race posts, the shops and the boat spots, and `surfaceAt`, the one answer to how high the ground is |
| `player.js` | Rico on foot: walking, running, jumping, and a body that slides along walls instead of through them |
| `camera.js` | the short boom that follows Rico on foot and the long one that follows a car or a boat, each pulled in by the first wall in its way |
| `vehicles.js` | the traffic driving the lane graph, and the car the player takes, drives, leaves, stores in the garage and retrieves |
| `peds.js` | the crowd: walkers going round their blocks, the crossings they take at corners, the flight a shot or a siren sets off, and the bodies a car has knocked down |
| `combat.js` | four weapons with their own damage, fire rate, magazine and spread, the player's health and ammo, the reload, and the rounds an officer drops |
| `police.js` | heat and wanted stars, cruisers that drive the grid to the player, the officers who get out and shoot, and the roadblocks that close the road ahead at three stars |
| `air.js` | Air One: the police helicopter, its rotor, its searchlight, and the spotter that keeps a four-star chase alive |
| `boats.js` | the boats at the piers: boarding, throttle, steering, and the step back onto the pier |
| `garage.js` | the garage lot (store and retrieve) and the street races at the three race posts |
| `missions.js` | the ten jobs in play order — walk, rob, race, getaway, drive and boat — the pulsing ring that marks each one, the payouts, the cash and the REP |
| `hud.js` | the DOM overlay (job panel, cash, REP, health, weapon and ammo, wanted stars, minimap, speedometer, interact prompt, AIR ONE warning, and the title, paused, death and complete cards) and every sound, all synthesised |
| `lifecycle.js` | death and respawn, kept out of the loop so the rule can run without a browser |
| `input.js` | the one module that reads the keyboard and the mouse, and the only place a key press is consumed |
| `config.js` | every tuning number and colour in the game, grouped by the system that owns it |
| `random.js` | the seeded mulberry32 generator the city, the crowd, the traffic and the colours are built from |
| `geometry.js` | tinted boxes, the merge that welds them into one mesh, and the ray test the camera, the bullets and the cars share |

## Building the dossier

    MAKEFUN_OUTPUT_DIR=out node main.ts

That copies `game/` and `screenshots/` into `out/`, checks that the page and every module is present
and non-empty, refuses a screenshot over 256 KiB, and writes `out/dossier.json`. It prints one line:
the file count, how many modules were checked, how many screenshots it took, and the size of the
dossier's text.

## Screenshots

`screenshots/` holds four renders of the game as it is; the first by name, `1-cover.jpg`, is the
cover:

1. `1-cover.jpg` — Puerto Sol from over the water at golden hour: the grid, the waterfront, a boat, the sea and the sun in one frame, with Air One overhead
2. `2-street.jpg` — Rico holding up the harbour shop, the crowd scattering and the traffic behind him
3. `3-driving.jpg` — a street race in a stored car, the speedometer up and the green checkpoint ring ahead
4. `4-chase.jpg` — five wanted stars, Air One above, a roadblock across the road ahead, and the cruisers answering with their light bars on
