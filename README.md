# High Tide

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/JaneHax/high-tide/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/JaneHax/high-tide/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An open-world crime game set in Puerto Sol at golden hour, built for the
[make.fun gta6-01 bounty](https://make.fun/bounty/gta6-01) — "Make GTA 6",
$1,666 total, top 100 paid, free entry. You are Rico, working jobs for
Sombra in a coastal city of roads, downtown towers, a market square, a
park, a seaside promenade, a marina pier, a beach and the open sea. The
sun hangs low and warm, lamps glow, palms line the promenade, traffic
moves and people walk the streets. Everything is original art and names.

## How to run

Serve the game folder, or start the included local server:

```sh
npx serve game/
```

or

```sh
node serve.ts
```

Then open `game/index.html` in desktop Chrome. The game runs entirely
locally with no network requests at runtime.

## Controls

- **W A S D** — walk
- **Shift** — sprint
- **Mouse** — camera, click to fire
- **F** — enter and leave cars and boats
- **E** — context action (single context key, with a live on-screen prompt)
- **Enter** — start and resume
- **1 / 2 / 3** and **Q** — switch weapons

## Jobs

Ten jobs for Sombra, listed in the on-screen job panel with a title, a
story line, a payout and a reputation reward. Payouts run from $400 to
$4,000. The kinds include walks, a shop robbery (hold E for three
seconds, adds two wanted stars), a three-checkpoint race against a
75-second clock, a getaway that starts at two stars with a 60-second
clock, a drive-the-cargo-car job, a sail-the-boat job, and a final walk
to Sombra. Five of the ten are conditional jobs that only appear when
their condition holds: a repo run (fetch and return), a countdown job, a
clean-plate job (no wanted stars while doing it), a split-take job
(payout split across two drops), and a harbor job at the port.

## Reputation, wanted level and weapons

Reputation runs 0 / 30 / 70 / 130 — Runner, Wheelman, Made, King of
Puerto Sol. Higher reputation unlocks weapons and adds +5% car speed per
level. The wanted level runs 0–5 stars: foot officers, cruisers, a
roadblock of two cruisers and two officers at three stars or more, and
the Air One police helicopter with rotor and searchlight at three stars
or more (a spotter at four stars). Four weapons — pistol, eight-pellet
shotgun, automatic submachine gun and long-range rifle — each with its
own ammunition and reputation lock.

## Garage, boats, collectibles and the harbor

- **Garage** — a lot that stores and retrieves the car you drive; the
  game saves in local storage. Three street-race posts offer a
  three-checkpoint 60-second race paying $800 with a saved best time.
- **Boats** — three at the piers: F boards, W/A/D drive, F leaves. A
  boat-race post at the marina runs a four-buoy timed race in 90
  seconds.
- **Collectibles** — five glowing packages hidden around the city (a
  rooftop, the pier end, the park, the market, the beach), $150 each,
  counted on the HUD.
- **Harbor Guide** — an in-game mission journal listing the jobs, their
  story lines, payouts and reputation, marking progress, reachable from
  the HUD and job panel.
- **Harbor Atlas** — an in-game atlas of the harbor and port recording
  what the player has found and done: jobs done, packages found,
  districts visited, shown as a readable panel.
- **Live port status** — the HUD shows the harbor bridge state
  (open/closed) as it changes, and the bridge state is visible in the
  world.
- **District radio** — each district has its own radio station flavour,
  and job standing is tracked per district and shown in the HUD.
- **Storm feedback** — the dispatch HUD and the world react to the storm
  (rain, wind, light changes) and the feedback is visible on screen.

The HUD shows cash, the reputation bar, stars, health, weapon and
ammunition, the job panel, toasts, a minimap, the AIR ONE banner, live
port and bridge status, district standing, the Harbor Guide journal and
the Harbor Atlas panel.

<sub>Entered on [make.fun](https://make.fun/?ref=janehax&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
