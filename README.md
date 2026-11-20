# HIGH TIDE

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/JaneHax/high-tide/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/JaneHax/high-tide/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

HIGH TIDE is an open-world crime game set in the harbour city of Puerto Sol, played in a desktop
browser in third person with a keyboard and a mouse. You walk Rico along the waterfront and the city
grid, take cars that are not his, and work five jobs for a man called Sombra that end with a boat out
of the harbour. There is no build step and no network request at runtime: the page, the modules and
the one vendored copy of three.js are all files on disk.

## Play it

The game is `game/index.html`, and it is opened in a desktop Chrome. Chrome will not load ES modules
from a `file://` page unless it is started with `--allow-file-access-from-files`, so the reliable way
in is to serve the folder and open it over http:

    node serve.ts        # game/ is on http://localhost:8080

Then open http://localhost:8080 and click once to begin. The mouse is captured by the canvas; `Esc`
releases it and pauses.

| key | what it does |
| --- | --- |
| W A S D | walk, and steer while driving |
| Shift | run |
| Space | jump on foot, handbrake in a car |
| mouse | look around; left click fires the pistol |
| F | take the car you are standing next to, or leave the one you are in |
| E | interact (bound, but no job in this build asks for it) |
| R | reload |
| Esc | pause and resume |

`?fresh=1` on the URL throws the saved story away and starts again at job 0 with no cash. Progress is
otherwise kept in `localStorage` under the seed it was played on. `?seed=N` builds a different Puerto
Sol; the same seed always builds the same city, the same crowd and the same traffic.

## What the two scripts need

**Node 22.18 or newer.** `main.ts` and `serve.ts` are TypeScript run straight through Node's own type
stripping, which strips the types without a flag from 22.18.0; on 22.6 to 22.17 the same thing needs
`--experimental-strip-types`. Nothing is installed and nothing is compiled.

## The game's files

`game/index.html` is the page: a canvas, an import map that points `three` at the vendored build, and
`./src/main.js`. Everything else lives in `game/src/`:

| file | what it is |
| --- | --- |
| `main.js` | builds the renderer, the sky and the fixed-step loop, calls every factory below, and owns `window.game` and the query string |
| `city.js` | `buildPuertoSol(seed)`: the grid of blocks and roads, the buildings, the promenade, the piers, the sea, and `surfaceAt`, the one answer to how high the ground is |
| `player.js` | Rico on foot: walking, running, jumping, and sliding along walls instead of through them |
| `camera.js` | the short boom that follows Rico and the long one that follows a car, both pulled in by the first wall they meet |
| `vehicles.js` | the traffic driving the lane graph, and the car the player takes, drives and leaves |
| `peds.js` | the crowd: walkers going round the block rings, crossings, panic, and bodies a car has knocked down |
| `combat.js` | the pistol, the player's health and ammo, the reload, and the rounds an officer drops |
| `police.js` | heat and stars, cruisers that drive the grid to the player, and officers who get out and shoot |
| `missions.js` | the five jobs in play order, the ring that marks each one, the payouts and the cash |
| `hud.js` | the DOM overlay (job panel, cash, health, ammo, wanted stars, minimap, speedometer, the four cards) and every synthesised sound |
| `lifecycle.js` | death and respawn, kept out of the loop so the rule can run without a browser |
| `input.js` | the one module that reads the keyboard and the mouse, and the only place a key press is consumed |
| `config.js` | every tuning number and colour in the game, grouped by the system that owns it |
| `random.js` | the seeded generator the city, the crowd, the traffic and the colours are built from |
| `geometry.js` | tinted boxes, the merge that welds them into one mesh, and the ray test the camera, the bullets and the cars share |

## Building the dossier

    MAKEFUN_OUTPUT_DIR=out node main.ts

That copies `game/` and `screenshots/` into `out/`, checks the page and every module is present and
non-empty, refuses a screenshot over 256 KiB, and writes `out/dossier.json`. It prints one line: the
file count, how many modules were checked, how many screenshots it took, and the size of the dossier's
text.

## Screenshots

`screenshots/` holds four renders of the game as it is, taken through `window.game` at
`?manual=1&seed=1` in headless Chromium on a software GL backend:

1. `1-cover.jpg` — Puerto Sol from over the water: the grid, the waterfront, the sea and the sunset in
   one frame
2. `2-street.jpg` — Rico on the sidewalk with the crowd ahead and the traffic on the road
3. `3-driving.jpg` — a stolen car at 73 km/h on the waterfront road, speedometer showing
4. `4-chase.jpg` — five wanted stars, three cruisers and their light bars
