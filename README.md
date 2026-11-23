# HIGH TIDE — Puerto Sol

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/JaneHax/high-tide/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/JaneHax/high-tide/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An open-world crime game in Puerto Sol, built for the make.fun bounty
[gta6-01 — Make GTA 6](https://make.fun/bounty/gta6-01): $1,666 over the top
100 places, free entry. Rico works for Sombra across a sun-soaked coastal
city at golden hour — downtown towers, market square, park, promenade,
marina pier, beach and sea.

## Play

Serve `game/` with any static server (or run `node serve.ts`) and open
`game/index.html` in desktop Chrome. No network requests at runtime.

- **WASD** move · **Shift** sprint · **mouse** look (click to lock)
- **F** take a car / board a boat · **E** interact (context prompt)
- **1–4 / Q** switch weapons · **click** shoot
- **G** Harbor Guide (mission journal) · **H** Harbor Atlas
- **Enter** start / resume · **P** pause

## The game

- A coastal city grid with traffic and pedestrians, lamps glowing at
  golden hour and palms along the promenade and beach.
- Ten jobs for Sombra ($400–$4,000): walks, a corner-store robbery (hold
  E for three seconds, +2 stars), a three-checkpoint race in 75 seconds,
  a getaway, a cargo drive, a boat sail, and a final walk to Sombra —
  five of them conditional (repo run, countdown, clean-plate, split
  take, harbor job).
- Wanted stars 0–5: foot officers, cruisers, a two-cruiser roadblock at
  3+ stars, and the Air One police helicopter with rotor and
  searchlight.
- Four weapons (pistol, eight-pellet shotgun, automatic SMG, long-range
  rifle) unlocked by reputation: Runner, Wheelman, Made, King of
  Puerto Sol.
- Garage with stored cars, three street races ($800, best time saved),
  a marina boat race (four buoys, 90 seconds), five hidden packages
  ($150 each), district radio and per-district standing, a harbor
  drawbridge that opens and closes, and storms that roll in off the sea.
- Harbor Guide journal and Harbor Atlas panel track jobs, packages and
  districts found. Progress saves in local storage.

## Tech

Three.js vendored under `game/vendor/`, ES modules, no build step.
`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to the output directory and writes `dossier.json` with
the kit's `vendor/makefun-game.ts`.

MIT licensed. Original city, characters, story and art — nothing from
any commercial game.

---

<sub>Entered on [make.fun](https://make.fun/?ref=janehax&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
