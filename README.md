# HIGH TIDE — Puerto Sol

[![make.fun](https://make.fun/c/gta6-01/badge.svg)](https://make.fun/c/gta6-01)
[![gta6-01](https://make.fun/c/gta6-01/entry.svg)](https://make.fun/c/gta6-01)
[![High Tide](https://make.fun/c/gta6-01/play.svg)](https://make.fun/c/gta6-01)

An open-world crime game in Puerto Sol, built for the make.fun bounty
[gta6-01 — Make GTA 6](https://make.fun/c/gta6-01): $1,666 over the top
100 places, free entry. Rico works for Sombra across a sun-soaked coastal
city at golden hour.

## Play

Serve `game/` with any static server (or run `node serve.ts`) and open
`game/index.html` in desktop Chrome. No network requests at runtime.

- **WASD** move · **Shift** sprint · **mouse** look (click to lock)
- **F** take a car / board a boat · **E** interact (context prompt)
- **1–4 / Q** switch weapons · **click** shoot
- **G** Harbor Guide (mission journal) · **H** Harbor Atlas
- **Enter** start / resume · **P** pause

## The game

- A coastal city grid: downtown towers, market square, park, promenade,
  marina pier, beach and sea, with traffic and pedestrians.
- Ten jobs for Sombra ($400–$4,000): walks, a corner-store robbery (hold
  E, +2 stars), a three-checkpoint race, a getaway, a repo run, a
  60-second cargo drive, a clean-plate walk, a split take, and a harbor
  finale by boat — five of them conditional.
- Wanted stars 0–5: foot officers, cruisers, a two-cruiser roadblock at
  3+ stars, and the Air One police helicopter with a searchlight.
- Four weapons (pistol, scattergun, SMG, long rifle) unlocked by
  reputation: Runner, Wheelman, Made, King of Puerto Sol.
- Garage with stored cars, three street races ($800, best time saved),
  a marina boat race (four buoys, 90 seconds), five hidden packages
  ($150 each), district radio and per-district standing, a harbor
  drawbridge that opens and closes, and storms that roll in off the sea.
- Progress saves in local storage.

## Tech

Three.js vendored under `game/vendor/`, ES modules, no build step.
`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to the output directory and writes `dossier.json` with
the kit's `vendor/makefun-game.ts`.

MIT licensed. Original city, characters, story and art — nothing from
any commercial game.
