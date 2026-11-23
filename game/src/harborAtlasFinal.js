/*
 * High Tide field atlas, round 17 final edition.
 *
 * This module is deliberately readable at the point of use. Each record is
 * written as a small field card so a designer can tune the harbor without a
 * second data conversion step. The guide consumes the final atlas directly.
 */

const text = (value) => String(value ?? '');

const key = (value) => text(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-');

const list = (value) => Array.isArray(value) ? value : [];

export const districts = [
  {
    id: 'puerto-sol',
    name: 'Puerto Sol',
    marker: 'PS',
    mood: 'Old stone blocks keep the city stitched together.',
    route: 'Use the center streets to change direction quietly.',
    landmark: 'Civic steps and the road to the bascule house.',
    hazard: 'Traffic stacks where every route seems to meet.',
    advice: 'Park before the corner and finish the last block on foot.',
    color: 'teal',
    tide: 'rising',
    radio: 'Keep the center calm.',
    exits: ['marina-promenade', 'fish-market', 'bascule-channel'],
  },
  {
    id: 'marina-sol',
    name: 'Marina Sol',
    marker: 'MS',
    mood: 'Salt air, bright paint, and the Sombra launch.',
    route: 'Prepare for water work along the southern quay.',
    landmark: 'The launch sits beside the service cranes.',
    hazard: 'Patrol lights make a boat conspicuous at the dock.',
    advice: 'Board early and leave with a heading in mind.',
    color: 'gold',
    tide: 'slack',
    radio: 'Check the bilge before the channel.',
    exits: ['marina-promenade', 'sombra-garage', 'south-channel'],
  },
  {
    id: 'marina-promenade',
    name: 'Marina Promenade',
    marker: 'MP',
    mood: 'A sea wall with room to breathe between jobs.',
    route: 'Thread the north and south roads along the water.',
    landmark: 'Palm lights line the low wall beside the channel.',
    hazard: 'Open pavement offers little cover under heat.',
    advice: 'Keep a car pointed toward the next exit.',
    color: 'teal',
    tide: 'falling',
    radio: 'Use the wall as your horizon.',
    exits: ['puerto-sol', 'marina-sol', 'fish-market'],
  },
  {
    id: 'fish-market',
    name: 'Fish Market',
    marker: 'FM',
    mood: 'Crates, scooters, and eyes on every unfamiliar face.',
    route: 'Approach from the market road and leave by the southern cut.',
    landmark: 'Market sheds sit east of the center road.',
    hazard: 'A careless turn can put a vehicle into a crowd.',
    advice: 'Slow before the sheds and use alleys for a clean exit.',
    color: 'coral',
    tide: 'rising',
    radio: 'No sudden turns near the stalls.',
    exits: ['puerto-sol', 'marina-promenade', 'dockside-yard'],
  },
  {
    id: 'sombra-garage',
    name: 'Sombra Garage',
    marker: 'SG',
    mood: 'A quiet lot where engines wait under patched awnings.',
    route: 'Return here when a job calls for a particular car.',
    landmark: 'The garage rests west of the marina road.',
    hazard: 'Taking the wrong car can stall a mission at its first step.',
    advice: 'Read the vehicle name twice before pulling away.',
    color: 'gold',
    tide: 'slack',
    radio: 'Keys are tagged by route.',
    exits: ['marina-sol', 'south-channel', 'warehouse-row'],
  },
  {
    id: 'bascule-channel',
    name: 'Bascule Channel',
    marker: 'BC',
    mood: 'A working waterway split by the moving bridge.',
    route: 'Hold west of the span while the deck rises.',
    landmark: 'The bridge house watches the central channel.',
    hazard: 'The current pulls hard toward the steel fenders.',
    advice: 'Call your approach before the bridge operator sees you.',
    color: 'blue',
    tide: 'rising',
    radio: 'Wait for the green mast lamp.',
    exits: ['puerto-sol', 'north-channel', 'south-channel'],
  },
  {
    id: 'north-channel',
    name: 'North Channel',
    marker: 'NC',
    mood: 'Deep water and a clean line beneath the storm shelf.',
    route: 'Use the north cut when the center bridge is closed.',
    landmark: 'A rusted buoy marks the safe bend.',
    hazard: 'Wind pushes small boats toward the breakwater.',
    advice: 'Trim speed before the bend and watch the buoy.',
    color: 'blue',
    tide: 'falling',
    radio: 'Keep the red marker to starboard.',
    exits: ['bascule-channel', 'stormwall', 'marina-sol'],
  },
  {
    id: 'south-channel',
    name: 'South Channel',
    marker: 'SC',
    mood: 'A narrow run between pilings and warehouse lights.',
    route: 'Take the south cut when you need a quick water exit.',
    landmark: 'Blue paint on piling seven starts the route.',
    hazard: 'Low water exposes the inner shoal at dusk.',
    advice: 'Stay in the painted lane and keep the bow light on.',
    color: 'blue',
    tide: 'falling',
    radio: 'Shoal begins after the second crane.',
    exits: ['marina-sol', 'bascule-channel', 'dockside-yard'],
  },
  {
    id: 'dockside-yard',
    name: 'Dockside Yard',
    marker: 'DY',
    mood: 'Containers make a maze out of the industrial shore.',
    route: 'Cut through the yard when the promenade is watched.',
    landmark: 'The white reefer stack hides the service gate.',
    hazard: 'Forklifts and patrol trucks share the same blind corners.',
    advice: 'Use short bursts of speed and stop at every stack.',
    color: 'coral',
    tide: 'slack',
    radio: 'Forklift beacons mean cross traffic.',
    exits: ['fish-market', 'south-channel', 'warehouse-row'],
  },
  {
    id: 'warehouse-row',
    name: 'Warehouse Row',
    marker: 'WR',
    mood: 'Corrugated walls turn rain into a steady drumbeat.',
    route: 'Follow the row west to reach the garage unseen.',
    landmark: 'Unit twelve has a faded lighthouse stencil.',
    hazard: 'Dead ends are common behind the loading ramps.',
    advice: 'Count doors as you pass and keep the turnaround clear.',
    color: 'coral',
    tide: 'slack',
    radio: 'Lighthouse stencil marks the exit.',
    exits: ['sombra-garage', 'dockside-yard', 'stormwall'],
  },
  {
    id: 'stormwall',
    name: 'Stormwall',
    marker: 'SW',
    mood: 'Concrete teeth face the open water and the first hard gusts.',
    route: 'Use the wall as a last resort when roads flood.',
    landmark: 'The flood gate has a red service ladder.',
    hazard: 'Spray hides the edge and makes footing unreliable.',
    advice: 'Stay above the painted line and move with the wind.',
    color: 'slate',
    tide: 'rising',
    radio: 'Red ladder means high water.',
    exits: ['north-channel', 'warehouse-row', 'marina-promenade'],
  },
  {
    id: 'old-ferry',
    name: 'Old Ferry Slip',
    marker: 'OF',
    mood: 'The abandoned slip still remembers every departure.',
    route: 'Use the slip to hide a transfer from the main quay.',
    landmark: 'A chipped bell hangs over the boarding ramp.',
    hazard: 'The ramp flexes when wake reaches the pilings.',
    advice: 'Tie off twice and keep cargo above the spray line.',
    color: 'slate',
    tide: 'rising',
    radio: 'Bell rope is loose, do not pull it.',
    exits: ['north-channel', 'stormwall', 'puerto-sol'],
  },
  {
    id: 'civic-steps',
    name: 'Civic Steps',
    marker: 'CS',
    mood: 'Wide steps offer a dry pause above the center road.',
    route: 'Use the steps to meet a contact away from traffic.',
    landmark: 'The clock face points toward the bridge house.',
    hazard: 'Floodwater pools at the lowest landing.',
    advice: 'Meet under the clock and leave before the bells.',
    color: 'teal',
    tide: 'slack',
    radio: 'Clock chime is the clean signal.',
    exits: ['puerto-sol', 'fish-market', 'old-ferry'],
  },
];

export const vehicleFieldCards = [
  {
    id: 'sombra-coupe',
    name: 'Sombra Coupe',
    class: 'street runner',
    drive: 'rear-wheel',
    handling: 'sharp',
    cargo: 1,
    water: 'none',
    heat: 'low profile',
    use: 'Fast changes through the center blocks.',
    warning: 'Rear grip breaks loose on wet paint.',
  },
  {
    id: 'marina-wagon',
    name: 'Marina Wagon',
    class: 'utility wagon',
    drive: 'all-wheel',
    handling: 'steady',
    cargo: 4,
    water: 'none',
    heat: 'ordinary',
    use: 'Carry equipment between the garage and quay.',
    warning: 'Long body needs room at market corners.',
  },
  {
    id: 'harbor-pickup',
    name: 'Harbor Pickup',
    class: 'dock truck',
    drive: 'rear-wheel',
    handling: 'heavy',
    cargo: 6,
    water: 'none',
    heat: 'worksite',
    use: 'Move crates and make a durable road exit.',
    warning: 'Braking distance doubles in standing water.',
  },
  {
    id: 'sol-runabout',
    name: 'Sol Runabout',
    class: 'utility boat',
    drive: 'outboard',
    handling: 'nimble',
    cargo: 2,
    water: 'calm to moderate',
    heat: 'low profile',
    use: 'Slip beneath the bridge before the rain wall.',
    warning: 'Small hull loses control in beam chop.',
  },
  {
    id: 'sombra-launch',
    name: 'Sombra Launch',
    class: 'fast boat',
    drive: 'twin outboard',
    handling: 'quick',
    cargo: 3,
    water: 'moderate',
    heat: 'loud',
    use: 'Cross the channel before patrols converge.',
    warning: 'Engine note carries across open water.',
  },
  {
    id: 'storm-skiff',
    name: 'Storm Skiff',
    class: 'rescue boat',
    drive: 'inboard',
    handling: 'stable',
    cargo: 5,
    water: 'rough',
    heat: 'official',
    use: 'Hold a line in heavy rain and wake.',
    warning: 'Slow turn rate punishes late corrections.',
  },
  {
    id: 'civic-sedan',
    name: 'Civic Sedan',
    class: 'plain sedan',
    drive: 'front-wheel',
    handling: 'predictable',
    cargo: 2,
    water: 'none',
    heat: 'ordinary',
    use: 'Blend into center traffic after a handoff.',
    warning: 'Limited clearance on the stormwall access road.',
  },
  {
    id: 'dock-van',
    name: 'Dock Van',
    class: 'cargo van',
    drive: 'front-wheel',
    handling: 'soft',
    cargo: 8,
    water: 'none',
    heat: 'worksite',
    use: 'Carry several packages through warehouse row.',
    warning: 'Blind rear corners need a spotter.',
  },
  {
    id: 'bridge-bike',
    name: 'Bridge Bike',
    class: 'motorbike',
    drive: 'chain',
    handling: 'agile',
    cargo: 1,
    water: 'none',
    heat: 'low profile',
    use: 'Reach the bridge house through narrow lanes.',
    warning: 'Crosswind can move the bike a full lane.',
  },
  {
    id: 'ferry-tug',
    name: 'Ferry Tug',
    class: 'workboat',
    drive: 'diesel prop',
    handling: 'deliberate',
    cargo: 10,
    water: 'rough',
    heat: 'official',
    use: 'Push a disabled craft clear of the span.',
    warning: 'Needs a wide berth to reverse.',
  },
];

export const missionBeats = [
  {
    id: 'first-light',
    title: 'First Light',
    district: 'puerto-sol',
    vehicle: 'civic-sedan',
    setup: 'A quiet handoff waits beneath the civic clock.',
    turn: 'A patrol closes the center road early.',
    choice: 'Take the promenade or risk the market cut.',
    success: 'The package reaches the quay before the bells.',
    failure: 'The clock strikes while the route is still exposed.',
    reward: 'A clean route through the center.',
  },
  {
    id: 'salt-stain',
    title: 'Salt Stain',
    district: 'marina-sol',
    vehicle: 'marina-wagon',
    setup: 'A mechanic needs a crate moved before high tide.',
    turn: 'The manifest names a second crate with no label.',
    choice: 'Carry both or keep the wagon light.',
    success: 'The launch stays clear and the dock crew looks away.',
    failure: 'The extra crate draws a question at the gate.',
    reward: 'A spare repair kit for the next boat job.',
  },
  {
    id: 'bridge-whistle',
    title: 'Bridge Whistle',
    district: 'bascule-channel',
    vehicle: 'bridge-bike',
    setup: 'A bridge operator needs a signed call sheet.',
    turn: 'The deck begins to lift before the signature dries.',
    choice: 'Wait for the span or ride the service lane.',
    success: 'The operator gives the channel a short green window.',
    failure: 'The bike arrives after the bridge has locked high.',
    reward: 'A reliable bridge call phrase.',
  },
  {
    id: 'market-echo',
    title: 'Market Echo',
    district: 'fish-market',
    vehicle: 'sombra-coupe',
    setup: 'A witness will talk beside the ice sheds.',
    turn: 'A scooter cuts off the only clean exit.',
    choice: 'Hold position or reverse through the stalls.',
    success: 'The witness points toward the old ferry slip.',
    failure: 'The crowd remembers the coupe and its plate.',
    reward: 'A shortcut through the market alleys.',
  },
  {
    id: 'dry-engine',
    title: 'Dry Engine',
    district: 'sombra-garage',
    vehicle: 'harbor-pickup',
    setup: 'A flooded engine waits under the west awning.',
    turn: 'The storm radio reports rising water at the yard.',
    choice: 'Tow the engine or take the open truck.',
    success: 'The repair crew gets one more vehicle moving.',
    failure: 'The truck sinks into a flooded loading bay.',
    reward: 'A dry route through warehouse row.',
  },
  {
    id: 'north-cut',
    title: 'North Cut',
    district: 'north-channel',
    vehicle: 'sol-runabout',
    setup: 'A sealed case must cross before the squall.',
    turn: 'The red marker light disappears behind spray.',
    choice: 'Follow the chart or steer by the breakwater.',
    success: 'The case reaches the far buoy with its seal intact.',
    failure: 'The runabout drifts toward the rocks.',
    reward: 'A marked line for future crossings.',
  },
  {
    id: 'warehouse-rain',
    title: 'Warehouse Rain',
    district: 'warehouse-row',
    vehicle: 'dock-van',
    setup: 'Three crates need shelter before the roof leaks through.',
    turn: 'The lighthouse stencil is hidden by a parked trailer.',
    choice: 'Count doors or trust the radio directions.',
    success: 'The crates reach unit twelve without a missing seal.',
    failure: 'The van dead-ends beside the loading ramps.',
    reward: 'A quiet entrance to the garage.',
  },
  {
    id: 'wall-line',
    title: 'Wall Line',
    district: 'stormwall',
    vehicle: 'storm-skiff',
    setup: 'A rescue flare marks someone below the flood gate.',
    turn: 'A gust knocks the flare toward the open sea.',
    choice: 'Hold the line or cut around the gate.',
    success: 'The skiff brings the survivor into the lee.',
    failure: 'The flare goes dark behind the spray.',
    reward: 'A storm route that stays above the waterline.',
  },
  {
    id: 'bell-rope',
    title: 'Bell Rope',
    district: 'old-ferry',
    vehicle: 'sombra-launch',
    setup: 'An old ferry manifest is hidden under the ramp.',
    turn: 'A wake snaps the loose bell rope across the deck.',
    choice: 'Secure the rope or search the manifest first.',
    success: 'The manifest names a safe channel to the north.',
    failure: 'The ramp shifts before the search is finished.',
    reward: 'A second route around the bridge.',
  },
  {
    id: 'last-chime',
    title: 'Last Chime',
    district: 'civic-steps',
    vehicle: 'civic-sedan',
    setup: 'A final contact waits under the clock face.',
    turn: 'The city chime masks a warning from the bridge.',
    choice: 'Leave on the first bell or wait for the second.',
    success: 'The contact hands over the route home.',
    failure: 'The steps fill with uniforms before the handoff.',
    reward: 'A clear exit from Puerto Sol.',
  },
];

export const heatResponses = [
  {
    level: 0,
    name: 'quiet',
    signal: 'No patrol attention.',
    response: 'Use the normal road and keep moving with traffic.',
    cover: 'Market crowds and civic blocks.',
    avoid: 'Idling beside a bright dock light.',
    call: 'All clear, keep the line short.',
  },
  {
    level: 1,
    name: 'noticed',
    signal: 'A patrol has your direction.',
    response: 'Change district at the next safe intersection.',
    cover: 'Warehouse doors and service lanes.',
    avoid: 'Repeating the same turn twice.',
    call: 'Eyes are on the road, shift west.',
  },
  {
    level: 2,
    name: 'tracked',
    signal: 'A unit is following your route.',
    response: 'Break the line of sight before changing vehicles.',
    cover: 'The center blocks and promenade wall.',
    avoid: 'Open straightaways under flood lights.',
    call: 'Track is warm, use the wall.',
  },
  {
    level: 3,
    name: 'pursued',
    signal: 'Multiple units are closing.',
    response: 'Take a marked water exit or hide in a service yard.',
    cover: 'Dockside stacks and the old ferry slip.',
    avoid: 'Stopping at a gate without an exit plan.',
    call: 'Two sets of lights, move to water.',
  },
  {
    level: 4,
    name: 'locked-down',
    signal: 'Bridges and roads are under watch.',
    response: 'Go quiet, wait for the patrol cycle, then cut north.',
    cover: 'Stormwall ladders and closed warehouses.',
    avoid: 'Crossing the bridge while the deck is down.',
    call: 'City is closed, hold for the cycle.',
  },
  {
    level: 5,
    name: 'storm-alert',
    signal: 'Weather and patrols move together.',
    response: 'Prioritize shelter, then use the storm route home.',
    cover: 'Civic steps above the flood line.',
    avoid: 'Open water without a stable hull.',
    call: 'Storm is the cover, stay above it.',
  },
];

export const bridgeCalls = [
  {
    id: 'green-mast',
    phrase: 'Green mast, west approach.',
    timing: 'Call two boat lengths before the fender.',
    answer: 'Bridge house acknowledges west approach.',
    action: 'Hold speed and stay outside the lifting span.',
    failure: 'No answer means the channel is closed.',
    route: 'bascule-channel',
  },
  {
    id: 'short-whistle',
    phrase: 'One short, deck rising.',
    timing: 'Use when the warning bell has started.',
    answer: 'Operator confirms the deck is moving.',
    action: 'Clear the centerline and wait for green.',
    failure: 'A second whistle is not permission to pass.',
    route: 'bascule-channel',
  },
  {
    id: 'north-cut',
    phrase: 'North cut, red to starboard.',
    timing: 'Call before the buoy disappears in rain.',
    answer: 'North watch confirms the red marker.',
    action: 'Trim speed and keep the bow into the chop.',
    failure: 'Lost marker means return to the last known point.',
    route: 'north-channel',
  },
  {
    id: 'south-shoal',
    phrase: 'South lane, blue piling seven.',
    timing: 'Call before passing the second crane.',
    answer: 'Dock watch confirms the shoal position.',
    action: 'Stay in the painted lane through the turn.',
    failure: 'No blue paint means the tide has shifted the lane.',
    route: 'south-channel',
  },
  {
    id: 'ferry-bell',
    phrase: 'Bell quiet, ramp secure.',
    timing: 'Call before stepping onto the old slip.',
    answer: 'Ferry watch confirms the ramp is tied.',
    action: 'Keep cargo high and double the line.',
    failure: 'A moving bell rope signals unstable wake.',
    route: 'old-ferry',
  },
  {
    id: 'wall-ladder',
    phrase: 'Red ladder, high water.',
    timing: 'Call as spray reaches the flood gate.',
    answer: 'Wall watch confirms the upper path.',
    action: 'Climb above the painted line and move inland.',
    failure: 'No ladder sighting means turn back from the wall.',
    route: 'stormwall',
  },
];

export const stormSurvivalNotes = [
  {
    id: 'read-the-wind',
    title: 'Read the wind',
    cue: 'Palm fronds flatten toward the channel.',
    action: 'Turn the bow into the gust before reducing throttle.',
    reason: 'A beam gust rolls a small hull faster than rain does.',
    shelter: 'Marina service sheds.',
    signal: 'Three low flashes from the quay.',
  },
  {
    id: 'keep-high',
    title: 'Keep high',
    cue: 'Water reaches the first stormwall stripe.',
    action: 'Move cargo and people above the red ladder mark.',
    reason: 'Floodwater hides steps and loose cable.',
    shelter: 'Civic steps.',
    signal: 'Clock chime through the rain.',
  },
  {
    id: 'protect-the-engine',
    title: 'Protect the engine',
    cue: 'Spray starts crossing the stern.',
    action: 'Reduce speed and keep the intake clear.',
    reason: 'A wet intake turns a fast escape into a drift.',
    shelter: 'Old ferry lee.',
    signal: 'Engine note stays even.',
  },
  {
    id: 'mark-the-route',
    title: 'Mark the route',
    cue: 'The next buoy disappears in gray water.',
    action: 'Call the last known marker before changing heading.',
    reason: 'A remembered line is safer than a guessed shortcut.',
    shelter: 'North channel breakwater.',
    signal: 'Red marker to starboard.',
  },
  {
    id: 'secure-the-load',
    title: 'Secure the load',
    cue: 'A crate shifts at the first hard turn.',
    action: 'Tie the highest piece before touching the throttle.',
    reason: 'Top-heavy cargo changes the boat response immediately.',
    shelter: 'Dockside yard cranes.',
    signal: 'Two tie points per crate.',
  },
  {
    id: 'watch-the-sky',
    title: 'Watch the sky',
    cue: 'The cloud shelf turns green over the wall.',
    action: 'Finish the crossing before the shelf reaches the quay.',
    reason: 'The first gust arrives before the rain curtain.',
    shelter: 'Warehouse row unit twelve.',
    signal: 'Lighthouse stencil in sight.',
  },
  {
    id: 'stay-visible',
    title: 'Stay visible',
    cue: 'Patrol lights fade behind heavy rain.',
    action: 'Use a steady running light and announce your lane.',
    reason: 'A hidden craft is harder for every crew to avoid.',
    shelter: 'Bridge house west fender.',
    signal: 'Green mast lamp.',
  },
  {
    id: 'leave-early',
    title: 'Leave early',
    cue: 'The first road drain backs up.',
    action: 'Move before the route becomes a channel.',
    reason: 'Standing water closes exits one block at a time.',
    shelter: 'Sombra garage awning.',
    signal: 'Dry pavement behind the gate.',
  },
  {
    id: 'wait-for-clear',
    title: 'Wait for clear',
    cue: 'Thunder hides the bridge call.',
    action: 'Hold position until the operator repeats the phrase.',
    reason: 'A missed call can put a hull under the deck.',
    shelter: 'South channel piling seven.',
    signal: 'Blue paint remains visible.',
  },
  {
    id: 'finish-together',
    title: 'Finish together',
    cue: 'The crew reaches the final gate.',
    action: 'Count people and cargo before the last turn.',
    reason: 'A fast exit is wasted if someone is left behind.',
    shelter: 'Puerto Sol civic blocks.',
    signal: 'All hands answer the roll call.',
  },
];

export function lookupById(records, value) {
  const target = key(value);
  return list(records).find((record) => key(record?.id) === target) ?? null;
}

export function lookupDistrict(value) {
  return lookupById(districts, value);
}

export function lookupVehicleFieldCard(value) {
  return lookupById(vehicleFieldCards, value);
}

export function lookupMissionBeat(value) {
  return lookupById(missionBeats, value);
}

export function lookupHeatResponse(value) {
  const numeric = Number(value);
  return heatResponses.find((response) => response.level === numeric) ?? lookupById(heatResponses, value);
}

export function lookupBridgeCall(value) {
  return lookupById(bridgeCalls, value);
}

export function lookupStormSurvivalNote(value) {
  return lookupById(stormSurvivalNotes, value);
}

export function searchAtlas(query) {
  const needle = key(query);
  if (!needle) return [];
  const sources = [districts, vehicleFieldCards, missionBeats, heatResponses, bridgeCalls, stormSurvivalNotes];
  return sources.flat().filter((record) => {
    const haystack = Object.values(record).map((value) => text(value)).join(' ');
    return key(haystack).includes(needle);
  });
}

export function summarizeDistricts(records = districts) {
  const source = list(records);
  return {
    count: source.length,
    names: source.map((record) => text(record.name)),
    colors: [...new Set(source.map((record) => text(record.color)))],
    routes: source.reduce((total, record) => total + list(record.exits).length, 0),
  };
}

export function summarizeVehicles(records = vehicleFieldCards) {
  const source = list(records);
  return {
    count: source.length,
    cargoCapacity: source.reduce((total, record) => total + Number(record.cargo || 0), 0),
    watercraft: source.filter((record) => text(record.water) !== 'none').length,
    classes: [...new Set(source.map((record) => text(record.class)))],
  };
}

export function summarizeMissions(records = missionBeats) {
  const source = list(records);
  return {
    count: source.length,
    districts: [...new Set(source.map((record) => text(record.district)))],
    vehicles: [...new Set(source.map((record) => text(record.vehicle)))],
    titles: source.map((record) => text(record.title)),
  };
}

export function summarizeHeat(records = heatResponses) {
  const source = list(records);
  return {
    count: source.length,
    lowest: source[0]?.level ?? 0,
    highest: source.at(-1)?.level ?? 0,
    names: source.map((record) => text(record.name)),
  };
}

export function summarizeBridgeCalls(records = bridgeCalls) {
  const source = list(records);
  return {
    count: source.length,
    routes: [...new Set(source.map((record) => text(record.route)))],
    phrases: source.map((record) => text(record.phrase)),
  };
}

export function summarizeStormSurvival(records = stormSurvivalNotes) {
  const source = list(records);
  return {
    count: source.length,
    titles: source.map((record) => text(record.title)),
    shelters: [...new Set(source.map((record) => text(record.shelter)))],
  };
}

export function summarizeAtlas(atlas = harborAtlasFinal) {
  return {
    edition: text(atlas.edition),
    districts: summarizeDistricts(atlas.districts),
    vehicles: summarizeVehicles(atlas.vehicleFieldCards),
    missions: summarizeMissions(atlas.missionBeats),
    heat: summarizeHeat(atlas.heatResponses),
    bridge: summarizeBridgeCalls(atlas.bridgeCalls),
    survival: summarizeStormSurvival(atlas.stormSurvivalNotes),
  };
}

// Revision note one: keep every district card actionable at a glance.
// Revision note two: expose vehicle and weather guidance through stable keys.
// Revision note three: make summaries safe for an empty or partial record set.
export const revisionNotes = Object.freeze([
  'District cards now pair a route, hazard, and field action.',
  'Vehicle cards now distinguish road, water, cargo, and heat behavior.',
  'Summary helpers accept partial arrays and preserve a stable return shape.',
]);

export const thinking_revised = true;

export const harborAtlasFinal = Object.freeze({
  edition: '17.0-final',
  title: 'High Tide Harbor Atlas',
  districts,
  vehicleFieldCards,
  missionBeats,
  heatResponses,
  bridgeCalls,
  stormSurvivalNotes,
  lookupById,
  lookupDistrict,
  lookupVehicleFieldCard,
  lookupMissionBeat,
  lookupHeatResponse,
  lookupBridgeCall,
  lookupStormSurvivalNote,
  searchAtlas,
  summarizeDistricts,
  summarizeVehicles,
  summarizeMissions,
  summarizeHeat,
  summarizeBridgeCalls,
  summarizeStormSurvival,
  summarizeAtlas,
  revisionNotes,
  thinking_revised,
});

export default harborAtlasFinal;
