# HIGH TIDE

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/JaneHax/high-tide/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/JaneHax/high-tide/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

HIGH TIDE is an open-world crime game set in Puerto Sol, a harbour city at dusk. It is played in a
desktop browser, in third person, with a keyboard and a mouse. You are Rico: you walk the waterfront
and the city grid, you take cars that are not yours, and you work five jobs for a man called Sombra.
The fifth and last is a meeting at the breakwater, where Sombra is waiting with a boat. The game has
no build step and makes no network request at runtime; the page, every module and the one vendored
copy of three.js are files on disk.

## Play it

The game is `game/index.html`. Open it in a desktop Chrome, or serve the folder and open it over
http:

    node serve.ts        # game/ is on http://localhost:8080

Then go to http://localhost:8080 and click once to begin. That click starts the story and hands the
mouse to the canvas; `Esc` gives the mouse back and pauses. Serving the folder is the reliable way in:
Chrome will not load ES modules from a `file://` page unless it was started with
`--allow-file-access-from-files`.

| key | what it does |
| --- | --- |
| W A S D | walk on foot; in a car, W is throttle, S is brake and reverse, A and D steer |
| Shift | run on foot |
| Space | jump on foot, handbrake in a car |
| mouse | look around; the left button fires the pistol |
| F | take the car you are standing next to, or get out of the one you are in |
| E | bound in `input.js`, and the title card labels it "interact", but no job or system reads it; the same is true of Enter |
| R | reload |
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
| `main.js` | the renderer, the sky and the fixed-step loop; it creates every system below, saves progress to `localStorage`, and owns `window.game` and the query string |
| `city.js` | `buildPuertoSol(seed)`: the grid of blocks and roads, the buildings, the promenade, the two piers, the sea, the colliders, and `surfaceAt`, the one answer to how high the ground is |
| `player.js` | Rico on foot: walking, running, jumping, and a body that slides along walls instead of through them |
| `camera.js` | the short boom that follows Rico on foot and the long one that follows a car, each pulled in by the first wall in its way |
| `vehicles.js` | the traffic driving the lane graph, and the car the player takes, drives and leaves |
| `peds.js` | the crowd: walkers going round their blocks, the crossings they take at corners, the flight a shot or a siren sets off, and the bodies a car has knocked down |
| `combat.js` | the pistol, the player's health and ammo, the reload, and the rounds an officer drops |
| `police.js` | heat and wanted stars, cruisers that drive the grid to the player, and the officers who get out and shoot |
| `missions.js` | the five jobs in play order, the pulsing ring that marks each one, the payouts and the cash |
| `hud.js` | the DOM overlay (job panel, cash, health, ammo, wanted stars, minimap, speedometer, and the title, paused, death and complete cards) and every sound, all synthesised |
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

1. `1-cover.jpg` — Puerto Sol from over the water: the grid, the waterfront, the sea and the sunset in
   one frame
2. `2-street.jpg` — Rico on the sidewalk with the crowd ahead of him and the traffic on the road
3. `3-driving.jpg` — a car on the waterfront road, the speedometer at 73 km/h
4. `4-chase.jpg` — five wanted stars, and the cruisers answering them with their light bars on
