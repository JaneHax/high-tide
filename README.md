[![Make GTA 6](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/JaneHax/high-tide/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/JaneHax/high-tide/reward.svg)](https://make.fun/bounty/gta6-01)

# HIGH TIDE — an open-world crime game in Puerto Sol

High Tide is a browser game set in Puerto Sol, a sun-soaked coastal city at golden hour. You are Rico, a driver and runner working for Sombra. The city is yours to cross on foot, by stolen car, and by boat — while the police, the wanted stars, and ten jobs keep pulling you back into trouble.

Built for the [Make GTA 6 bounty](https://make.fun/bounty/gta6-01) on make.fun. It runs entirely from static files, with three.js vendored locally and no network requests while playing.

## How to play

Serve the game folder with any static server — `node serve.ts` works — and open `game/index.html` in a desktop browser. Press Enter on the start screen. There is nothing to install and no build step.

## Controls

- **W A S D** — walk (hold **Shift** to sprint). The mouse steers the camera; click the game to lock the pointer.
- **F** — enter or leave a nearby car, board or leave a boat.
- **E** — the context key: it does whatever the prompt at the bottom of the screen says — store a car, start a race, hold it to rob a shop.
- **Enter** — start the game, resume from pause. **P** or **Esc** pauses.
- **1 / 2 / 3 / 4** — select a weapon; **Q** cycles to the next one. Click the mouse to fire.

## The ten jobs

Sombra's jobs run in order, one at a time. A gold ring and a tall green column mark the objective, and the job panel on the left shows the title, the story, and the payout. Finishing a job pays its dollars and reputation, then the next one starts.

1. **The Marina Errand** — walk to a duffel hidden at the marina pier. $400.
2. **Word on the Promenade** — walk to a fence drinking at the far end of the promenade. $500.
3. **Market Money** — walk to a buyer counting cash in the market square. $600.
4. **Downtown Drop** — walk to a handover downtown by a glass tower. $700.
5. **Harbour Heist** — hold E for three seconds at a shop door on the harbour road, then run: the robbery adds two wanted stars at once. $1,300.
6. **Golden Mile** — drive a car through three checkpoints within 75 seconds. $1,500.
7. **The Getaway** — starts with two wanted stars already on you and a 60-second clock; reach the far marker. $1,800.
8. **Smuggler's Run** — take a car full of cargo and drive it to the pier; it only counts while you are behind the wheel. $2,000.
9. **The Fence's Boat** — take a boat from the pier and sail it out past the breakwater. $2,500.
10. **The Breakwater** — walk to Sombra waiting at the end of the pier. $3,000.

## Reputation

Every paid job and every street race raises reputation. At 0 you are a Runner, at 30 a Wheelman, at 70 Made, and at 130 King of Puerto Sol. Each level makes cars 5% faster and unlocks a weapon. The HUD shows the reputation number, a progress bar to the next level, and your current title.

## Wanted level and the police

The wanted level runs from zero to five stars. Crime and shooting raise it; it falls slowly when you stay out of sight and far from officers. Officers patrol on foot, chase you, and shoot when close. Police cruisers drive in and ram your car. At three stars or more, the police set roadblocks ahead of you on the road — two cruisers parked across it with two officers standing by — and a police helicopter, Air One, circles above with a spinning rotor and a sweeping searchlight, with an AIR ONE banner on screen. At four stars or more the helicopter spots you and resets your escape progress. Break line of sight and put distance between yourself and the police until the stars fall.

## Weapons

Four weapons, each with its own ammunition, shown on screen with the selected weapon's name. The HUD also shows which weapons are still locked behind reputation.

- **Pistol** — the starting weapon: medium damage, semi-automatic, plenty of ammunition.
- **Shotgun** — eight pellets in a spread with each shot, strong up close. Unlocks at Wheelman.
- **SMG** — fires automatically while the mouse button is held. Unlocks at Made.
- **Rifle** — long range, high damage, slow between shots. Unlocks at King of Puerto Sol.

Shooting shows a short tracer line. Officers and crashes can reduce your health bar.

## The garage and street races

A fenced garage lot sits in the city. Stand in it with a driven car and the prompt offers to store the car; press E and it is remembered between sessions, along with your cash, reputation and unlocked weapons, in the browser's local storage. Stand in the lot without a car and the prompt offers to retrieve the stored one. Three street-race posts stand near the garage: press E at one to start a three-checkpoint race against a 60-second clock. Winning pays $800 and saves your best time.

## Boats

Three boats are tied at the piers. Stand near one and the prompt offers to board with F. On a boat, W drives forward, A and D steer, and F leaves the boat. Boats move on the water and cannot drive on land. The ninth job needs one.

## The city

Puerto Sol is roughly four hundred units across: a road grid with block buildings, a downtown of glass towers, a market square with stalls, a park with trees and a fountain, a long promenade with lamps and palms, a beach, a marina pier reaching into the sea, and a breakwater. Traffic drives the roads and people walk the streets; at golden hour the sun sits low and warm, the shadows run long, and the sea is bright.

## Files

- `game/index.html` — the page; `game/src/` — the eighteen modules, one per system (city, player, vehicles, police, air, combat, missions, garage, boats, pedestrians, HUD, input, lifecycle, camera, configuration, random numbers, geometry helpers, and the entry module).
- `game/vendor/` — three.js, vendored as minified files, and the make.fun game helper in `vendor/`.
- `main.ts` — the Node 22 program that copies `game/` and `screenshots/` to the output folder and writes `dossier.json`.
- `serve.ts` — a small static server for local play-testing.
- `screenshots/` — four real renders of the game running in a headless browser.

## License

MIT. See `LICENSE`.
