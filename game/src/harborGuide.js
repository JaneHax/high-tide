const GUIDE_VERSION = 'FIELD NOTES / 01';

const CATEGORIES = [
  { id: 'districts', label: 'DISTRICTS', eyebrow: 'READ THE WATERLINE' },
  { id: 'vehicles', label: 'VEHICLES', eyebrow: 'PICK THE RIGHT HULL' },
  { id: 'weapons', label: 'WEAPONS', eyebrow: 'KEEP IT CONTROLLED' },
  { id: 'missions', label: 'MISSIONS', eyebrow: 'MAKE THE DROP' },
  { id: 'wanted', label: 'WANTED', eyebrow: 'HEAT HAS A RHYTHM' },
  { id: 'bridge', label: 'BRIDGE', eyebrow: 'WATCH THE SPAN' },
  { id: 'survival', label: 'SURVIVAL', eyebrow: 'STAY ABOVE WATER' },
];

const DISTRICTS = [
  {
    id: 'marina-sol',
    name: 'Marina Sol',
    short: 'WESTERN MARINA',
    tag: 'SAFE START',
    tone: 'teal',
    coordinates: 'WEST QUAY / 18° SOUTH',
    read: 'The launch is moored here, and the first jobs tend to be clean enough to learn the tides.',
    streets: ['Sombra Garage', 'Marina Promenade', 'West Quay'],
    landmarks: ['Garage save point', 'Sombra launch', 'South market approach'],
    approach: 'Arrive on foot from the south road, or slip in by launch when the bridge is under watch.',
    danger: 'Traffic compresses around the garage. A wanted driver can lose a tail by turning north into the service lane.',
    route: 'For a fast start, take the Courier west, cut through the market, then return along the promenade.',
    voice: 'Mara: “If you can see the orange garage light, you are not lost yet.”',
  },
  {
    id: 'fish-market',
    name: 'Fish Market',
    short: 'SOUTHERN QUAY',
    tag: 'JOB BOARD',
    tone: 'gold',
    coordinates: 'SOUTH QUAY / 06° WEST',
    read: 'Ice carts, loading bays, and too many witnesses. This is where Elio tests whether a courier can keep a line.',
    streets: ['Market Straight', 'Palm Boulevard', 'South Quay'],
    landmarks: ['Blue fish sheds', 'Elio’s marker', 'Market service road'],
    approach: 'Use the broad east road for speed. A car can turn around behind the sheds if the main lane is blocked.',
    danger: 'A gunshot in the open market makes Guardia notice quickly. Keep the pistol holstered until the job demands otherwise.',
    route: 'The market is a useful waypoint between the garage and the bridge. It is also the cleanest place to change direction.',
    voice: 'Elio: “The market hears everything. Pay the fishers with time, not noise.”',
  },
  {
    id: 'bascule-channel',
    name: 'Bascule Channel',
    short: 'THE CENTRAL SPAN',
    tag: 'TIDAL CROSSING',
    tone: 'coral',
    coordinates: 'CHANNEL / BRIDGE CONTROL',
    read: 'The water cuts Puerto Sol in two. The span is a shortcut, a trap, and sometimes the only honest route east.',
    streets: ['Bridge Control Road', 'West Approach', 'East Approach'],
    landmarks: ['Control pedestal', 'Bascule deck', 'North and south buoys'],
    approach: 'On foot, use the control pedestal near the west approach. By boat, call the bridge with B or approach slowly.',
    danger: 'Cars stop at the deck when it is raised. Boats that linger in the center channel become easy silhouettes for patrols.',
    route: 'If the bridge is closed, use the coastal road when wanted heat is low. If the bridge is open, cross the gap before it begins to lower.',
    voice: 'Harbor radio: “Span is steel. Water is patient. Do not confuse the two.”',
  },
  {
    id: 'north-docks',
    name: 'North Docks',
    short: 'NORTH FREIGHT BELT',
    tag: 'COLD STORAGE',
    tone: 'teal',
    coordinates: 'NORTH SHORE / 14° EAST',
    read: 'Long sightlines and hard corners make the docks good for a fast car and bad for a stand-up fight.',
    streets: ['North Gate', 'Terminal Yard', 'Storm Wall'],
    landmarks: ['Art-Deco Terminal', 'Weighbridge', 'North pier'],
    approach: 'The north gate is fastest from the bridge. The coastal loop is slower but keeps you away from the terminal cameras.',
    danger: 'A pursuit can become a straight-line race here. Break line of sight behind the cold stores before changing vehicles.',
    route: 'For the Dead Drop, load at the market, cross the bridge if it is down, then enter the terminal from the south-west yard.',
    voice: 'Mara: “The docks do not hide you. They only give you more places to turn.”',
  },
  {
    id: 'art-deco-terminal',
    name: 'Art-Deco Terminal',
    short: 'WESTERN TERMINAL',
    tag: 'DELIVERY END',
    tone: 'gold',
    coordinates: 'WEST END / OLD CUSTOMS',
    read: 'The old terminal is a polished façade over a maze of ramps. It pays well because nobody wants to wait there.',
    streets: ['Terminal Front', 'Customs Ramp', 'Old Rail Cut'],
    landmarks: ['Deco clock', 'Terminal yard', 'Customs gate'],
    approach: 'A courier car can enter from the market side. Approach the front slowly if the job asks for a clean plate.',
    danger: 'Guardia have an uninterrupted view across the plaza. A wanted vehicle should use the old rail cut and arrive from the side.',
    route: 'The terminal is the safest destination once heat is at zero. Finish the delivery, then save at the garage before starting another chain.',
    voice: 'Mara: “The clock is decorative. The gate is not.”',
  },
  {
    id: 'sombra-garage',
    name: 'Sombra Garage',
    short: 'SOUTHWEST LOT',
    tag: 'RESET POINT',
    tone: 'teal',
    coordinates: 'SOUTHWEST / SERVICE LOT',
    read: 'Paint, plates, and a quiet corner. The garage is the closest thing Rico has to a home base.',
    streets: ['Garage Lane', 'Service Lot', 'Westbound Spur'],
    landmarks: ['Respray bay', 'Sol Courier', 'Tempest GT'],
    approach: 'Come in from the south road to keep the lot between you and a trailing patrol. The save point works even when the city is loud.',
    danger: 'A respray costs $180. Do not spend the fee before a storm run if the job still needs a toll or clinic visit.',
    route: 'The Courier is the reliable mission car. The Tempest is the escape answer, but its speed creates longer braking zones.',
    voice: 'Mara: “Fresh paint is not innocence. It is a new question.”',
  },
  {
    id: 'fish-market-east',
    name: 'Marina Promenade',
    short: 'EASTERN WATERFRONT',
    tag: 'OPEN VISTA',
    tone: 'gold',
    coordinates: 'EAST QUAY / 22° NORTH',
    read: 'A broad waterfront with room to turn and nowhere to disappear. It rewards calm hands and punishes panic.',
    streets: ['Promenade Drive', 'East Pier Road', 'Ferry Cut'],
    landmarks: ['East pier', 'Ferry buoy', 'Water taxi landing'],
    approach: 'Use the launch for the cleanest line to the pier. Cars can reach it by the north loop when the bridge is passable.',
    danger: 'There are no cover corners on the promenade. If wanted, commit to the water or leave before the patrol has a straight view.',
    route: 'The Harbor Ferry ends here. Dock close enough to trigger the handoff, then hold position until the job confirms completion.',
    voice: 'Sombra crew: “Open water is honest. It tells everyone where you are.”',
  },
  {
    id: 'clinic-hill',
    name: 'Clinic Hill',
    short: 'EAST SERVICE RIDGE',
    tag: 'RECOVERY',
    tone: 'teal',
    coordinates: 'EAST RIDGE / 10° NORTH',
    read: 'A small service district above the quay. It is where Rico wakes up after the harbor has made its point.',
    streets: ['Clinic Steps', 'Ridge Road', 'East Service Lane'],
    landmarks: ['Clinic door', 'Ridge overlook', 'Southbound ramp'],
    approach: 'The clinic is easiest to reach on foot after respawn. A vehicle can use the ridge road, but the final turn is narrow.',
    danger: 'The $120 clinic bill comes out of cash after a washout. Keep a reserve if a timed mission is still active.',
    route: 'Use the ridge as a reset for your camera and your plan. It is a good place to wait for a bridge state to settle.',
    voice: 'Clinic radio: “Breathe first. Count the stars after.”',
  },
  {
    id: 'north-pier',
    name: 'North Pier',
    short: 'OUTER HARBOR',
    tag: 'DEEP WATER',
    tone: 'coral',
    coordinates: 'OUTER CHANNEL / 26° EAST',
    read: 'The outer pier is where the jobs get expensive and the water gets deep. A launch has more room here than a car.',
    streets: ['Pier Road', 'Tide Gate', 'Outer Service Track'],
    landmarks: ['Black-box handoff', 'Deep-water quay', 'East customs buoy'],
    approach: 'Boats can dock at the east pier. Cars should use the north gate and stay clear of the waterline until the objective updates.',
    danger: 'Do not disembark in deep water. Bring the launch alongside a quay first, or the exit will refuse the request.',
    route: 'For Storm Run, arrive with the bridge already open or choose the coastal road. The objective rewards a clean, deliberate approach.',
    voice: 'Sombra crew: “The outer pier pays for distance. Do not make it pay for a rescue.”',
  },
];

const VEHICLES = [
  {
    id: 'courier',
    name: 'Sol Courier',
    kind: 'COMPACT RUNNER',
    badge: 'TRUSTED',
    tone: 'teal',
    stats: { speed: 68, grip: 82, armor: 42, turn: 86 },
    notes: ['Balanced acceleration for market streets.', 'Stable enough for a clean terminal approach.', 'The mission default for Dead Drop.'],
    use: 'Take this when the route has several tight turns or when a job checks for a specific courier car.',
    handling: 'Brake before the corner, then roll into the throttle. It is forgiving when the bridge approach gets crowded.',
    unlock: 'Parked at Sombra Garage from the start of a shift.',
  },
  {
    id: 'muscle',
    name: 'Tempest GT',
    kind: 'MUSCLE ESCAPE CAR',
    badge: 'FASTEST ROAD',
    tone: 'coral',
    stats: { speed: 94, grip: 58, armor: 62, turn: 52 },
    notes: ['Best top speed on the coastal road.', 'Wide turns need early braking.', 'The mission car for Storm Run.'],
    use: 'Choose it when the job is about distance, not precision. It can turn a three-star escape into a manageable straight line.',
    handling: 'Feather the throttle over bridge approaches. Full power out of a corner can put the rear wheels into a wall.',
    unlock: 'Parked at Sombra Garage beside the Courier.',
  },
  {
    id: 'sedan',
    name: 'Harbor Sedan',
    kind: 'EVERYDAY FOUR-DOOR',
    badge: 'COMMON',
    tone: 'gold',
    stats: { speed: 61, grip: 67, armor: 54, turn: 72 },
    notes: ['Appears in traffic and terminal lots.', 'Predictable size around service roads.', 'Good when a mission only requires any car.'],
    use: 'Use one to improvise a route after losing your original vehicle. It is unremarkable, which is valuable at low heat.',
    handling: 'The sedan holds a line better than the muscle car. Keep momentum through the broad east bends.',
    unlock: 'Found parked around the city or moving in traffic.',
  },
  {
    id: 'pickup',
    name: 'Quay Pickup',
    kind: 'UTILITY TRUCK',
    badge: 'HEAVY',
    tone: 'gold',
    stats: { speed: 55, grip: 62, armor: 72, turn: 58 },
    notes: ['Takes a little more punishment in a chase.', 'Longer body catches corners.', 'Useful for broad quay roads.'],
    use: 'Pick it when you expect contact and do not need a timed record. It is a rolling buffer, not a race car.',
    handling: 'Start your turns early and leave space behind the rear axle. The truck needs room to rotate.',
    unlock: 'Common parked vehicle at the market and north docks.',
  },
  {
    id: 'van',
    name: 'Cold-Store Van',
    kind: 'CARGO BOX',
    badge: 'BLENDS IN',
    tone: 'teal',
    stats: { speed: 49, grip: 64, armor: 66, turn: 50 },
    notes: ['Looks at home near loading bays.', 'Slowest response on the bridge approaches.', 'Useful visual cover in the terminal yard.'],
    use: 'Take it for roleplay and short deliveries. Its profile can make a quiet arrival feel plausible, but it will not outrun a patrol.',
    handling: 'Use the outside lane and avoid emergency direction changes. Plan the exit before entering a yard.',
    unlock: 'Parked near market loading areas and terminal service roads.',
  },
  {
    id: 'taxi',
    name: 'Sol Taxi',
    kind: 'CITY CAB',
    badge: 'AGILE',
    tone: 'gold',
    stats: { speed: 64, grip: 74, armor: 38, turn: 80 },
    notes: ['Quick turn-in for city blocks.', 'Light body loses a collision.', 'Easy to find during a long shift.'],
    use: 'A strong replacement when the Courier is gone. It is agile enough to route around a closed span.',
    handling: 'Use short throttle taps. The taxi responds quickly, especially when leaving the market straight.',
    unlock: 'Moves through traffic and appears in several parked spots.',
  },
  {
    id: 'launch',
    name: 'Sombra Launch',
    kind: 'HARBOR BOAT',
    badge: 'WATERLINE',
    tone: 'teal',
    stats: { speed: 76, grip: 70, armor: 34, turn: 78 },
    notes: ['Only reliable vehicle for open-channel jobs.', 'Can call the bridge with B.', 'Needs a quay before disembarking.'],
    use: 'Take the launch for The Crossing and Harbor Ferry. The water route avoids road traffic but exposes you on the channel.',
    handling: 'Approach buoys with small steering corrections. Slow before a pier, because momentum carries farther than it looks.',
    unlock: 'Moored at Marina Sol at the start of every shift.',
  },
];

const WEAPONS = [
  {
    id: 'pistol',
    name: 'Guardia 9',
    kind: 'SIDEARM',
    badge: 'DEFAULT',
    tone: 'teal',
    stats: { damage: 42, control: 86, capacity: 12, reach: 54 },
    notes: ['Reliable 12-round magazine.', 'Lowest heat footprint per encounter.', 'Best for deliberate single shots.'],
    advice: 'The sidearm is a route tool, not a loud solution. It draws patrol attention after the first shot, so use cover and move immediately.',
    rhythm: 'Tap, relocate, reload. Do not empty the magazine while standing in a market lane.',
  },
  {
    id: 'shotgun',
    name: 'Breacher',
    kind: 'CLOSE RANGE',
    badge: 'ROOM MAKER',
    tone: 'coral',
    stats: { damage: 88, control: 48, capacity: 6, reach: 28 },
    notes: ['Wide pellet spread at short range.', 'Hard stop when a patrol reaches a corner.', 'Reload window is costly under pursuit.'],
    advice: 'Keep it for a committed corner or a close vehicle stop. It is strongest when the target has already chosen the distance.',
    rhythm: 'Fire once, move through the opening, then reload behind a wall or vehicle.',
  },
  {
    id: 'smg',
    name: 'Sombra SMG',
    kind: 'CLOSE CONTROL',
    badge: 'FAST HANDS',
    tone: 'gold',
    stats: { damage: 53, control: 67, capacity: 30, reach: 47 },
    notes: ['High rate of fire for moving threats.', 'Consumes reserve ammo quickly.', 'Useful when a chase compresses.'],
    advice: 'Short bursts keep the reticle useful. Full-auto panic turns a narrow escape into a city-wide announcement.',
    rhythm: 'Burst, strafe, check the magazine. Keep an exit lane behind your shoulder.',
  },
  {
    id: 'rifle',
    name: 'Faro Rifle',
    kind: 'LONG REACH',
    badge: 'SIGHTLINE',
    tone: 'teal',
    stats: { damage: 74, control: 72, capacity: 20, reach: 92 },
    notes: ['Strongest across the terminal yard.', 'Useful before a patrol closes distance.', 'Long sightlines are its advantage.'],
    advice: 'The rifle belongs on the edge of a district, not in a doorway. Make the first shot count and leave before the second patrol arrives.',
    rhythm: 'Scan, place one controlled burst, break the sightline. Distance is the rifle’s armor.',
  },
];

const MISSIONS = [
  {
    id: 'dead_drop',
    name: 'Dead Drop',
    giver: 'MARA',
    tone: 'teal',
    payout: '$320 / REP +45',
    start: 'Sombra Garage',
    route: 'Garage → Fish Market → Art-Deco Terminal',
    brief: 'A three-stop courier run that teaches the city’s west-to-north line.',
    beats: ['Take the Sol Courier from the garage.', 'Load crates at the market.', 'Deliver them to the terminal.'],
    fieldcraft: 'Keep the Courier moving but do not turn the terminal plaza into a race. This job is a route lesson: learn where the service road rejoins the main lane.',
    failure: 'A damaged route is recoverable; a high wanted level is not. If shots are fired, finish the drop and save before taking Storm Run.',
  },
  {
    id: 'crossing',
    name: 'The Crossing',
    giver: 'SOMBRA CREW',
    tone: 'coral',
    payout: '$760 / REP +130',
    start: 'Marina Sol',
    route: 'Marina → West Buoy → Bascule Channel → East Pier',
    brief: 'A water run built around the bridge: two crates, one opening, no wasted turns.',
    beats: ['Board the Sombra launch.', 'Collect the west buoy crate.', 'Hold west while the span raises.', 'Clear the span and take the east crate.', 'Dock at the east pier.'],
    fieldcraft: 'Approach the west buoy slowly, then wait outside the bridge’s moving pieces. Once the span clears, cross the center channel in a straight line.',
    failure: 'The bridge can reopen itself during the run. If the deck starts lowering, stay on the correct side rather than trying to squeeze through.',
  },
  {
    id: 'storm_run',
    name: 'Storm Run',
    giver: 'MARA',
    tone: 'coral',
    payout: '$1,250 / REP +220',
    start: 'Sombra Garage',
    route: 'Garage → Escape line → North Pier',
    brief: 'A black box, a Tempest GT, and three wanted stars from the first turn.',
    beats: ['Take the Tempest GT.', 'Lose the Guardia.', 'Deliver the black box to the north pier.'],
    fieldcraft: 'The bridge begins open for a reason. Use the span if it is clear, or commit to the coastal road early. Do not reverse direction at the bridge mouth.',
    failure: 'Heat only falls when the patrol loses your signal. Break sightlines, change direction, and never wait in the open north yard.',
  },
  {
    id: 'quay_race',
    name: 'Quay Circuit',
    giver: 'ELIO',
    tone: 'gold',
    payout: '$420 / REP +70',
    start: 'Fish Market',
    route: 'Market → East Quay → Storm Wall → Bridge → Market',
    brief: 'A timed five-checkpoint lap for drivers who know how to carry speed.',
    beats: ['Get into any car.', 'Hit market straight.', 'Cut through Palm Boulevard.', 'Reach the storm wall.', 'Cross at the marina bridge.', 'Return to the market.'],
    fieldcraft: 'Use the Sedan or Taxi if available. The Tempest is fast but can waste the timer in a wide turn; keep the route compact.',
    failure: 'A missed checkpoint is usually a route error, not a speed problem. Turn around safely and let the next straight recover the clock.',
  },
  {
    id: 'repo_run',
    name: 'Repo Run',
    giver: 'MARA',
    tone: 'teal',
    payout: '$380 / REP +60',
    start: 'Garage Lane',
    route: 'Garage → Terminal Weighbridge',
    brief: 'A one-leg vehicle recovery that tests the north-dock approach.',
    beats: ['Drive a sedan onto the terminal weighbridge.'],
    fieldcraft: 'Any car will do, but a Sedan makes the final alignment simple. Take the south-west yard entrance and leave the plaza clear.',
    failure: 'If you are on foot at the marker, the guide will remind you to take a car. The objective will not accept a boat or a van.',
  },
  {
    id: 'last_light',
    name: 'Last Light',
    giver: 'ELIO',
    tone: 'gold',
    payout: '$460 / REP +80',
    start: 'Market Straight',
    route: 'Fish Market → North Quay',
    brief: 'A short timed envelope run where the clean line matters more than the payout.',
    beats: ['Reach the north quay in 48 seconds.'],
    fieldcraft: 'Take the broad east road, then use the north loop. A Taxi is ideal; avoid the bridge mouth if it is already congested.',
    failure: 'The timer starts when the job enters. A clean, early turn is worth more than a risky shortcut through traffic.',
  },
  {
    id: 'clean_hands',
    name: 'Clean Hands',
    giver: 'MARA',
    tone: 'teal',
    payout: '$540 / REP +95',
    start: 'Garage Service Lot',
    route: 'Garage → Terminal Gate',
    brief: 'A gate only opens for a car the Guardia is not hunting.',
    beats: ['Reach the terminal gate with zero wanted stars.'],
    fieldcraft: 'Respray at the garage if the fee is affordable, or park and let patrols lose the signal before approaching the gate.',
    failure: 'This is a patience mission. The clean plate check is more important than the vehicle’s speed or armor.',
  },
  {
    id: 'split_take',
    name: 'Split Take',
    giver: 'SOMBRA CREW',
    tone: 'coral',
    payout: '$980 / REP +160',
    start: 'Market Service Road',
    route: 'Fish Market → East Pier',
    brief: 'One hot bag, one east-pier handoff, and a patrol that knows the direction.',
    beats: ['Collect the bag behind the market.', 'Get the bag to the launch at the east pier.'],
    fieldcraft: 'The handoff raises heat to two stars. Keep your car pointed toward the east route before taking the bag so the first move is already progress.',
    failure: 'Do not stop for a vehicle change after the handoff unless you have broken sight. The launch area is the destination, not a safehouse.',
  },
  {
    id: 'harbor_ferry',
    name: 'Harbor Ferry',
    giver: 'ELIO',
    tone: 'teal',
    payout: '$520 / REP +90',
    start: 'Marina Sol',
    route: 'Marina → Mid-Channel Buoy',
    brief: 'A quiet fare who will only board on open water.',
    beats: ['Bring the launch alongside the mid-channel buoy.'],
    fieldcraft: 'Throttle down before the buoy. The handoff radius is generous, but speed makes the launch overshoot the target.',
    failure: 'This job wants the boat, not a car near the shore. If you disembark, board again and return to the waterline.',
  },
  {
    id: 'toll_run',
    name: 'Toll Run',
    giver: 'ELIO',
    tone: 'gold',
    payout: '$430 / REP +70',
    start: 'Market East Lot',
    route: 'Market → North Gate',
    brief: 'A manifest run with a $200 gate toll and no appetite for empty pockets.',
    beats: ['Pay the north gate toll and hand over the manifest.'],
    fieldcraft: 'Check your cash before leaving. The guide’s recommended reserve is $320: enough for the toll and a later clinic bill if the road goes bad.',
    failure: 'Cash is checked at the gate. Do not spend the toll at the respray bay immediately before this run.',
  },
];

const WANTED_LEVELS = [
  {
    level: 0,
    name: 'CLEAR WATER',
    tone: 'teal',
    signal: 'No active search. Patrols follow routine routes.',
    response: 'You can start jobs, respray, and approach clean-plate objectives without waiting.',
    escape: 'Keep it quiet. The best reset is simply not creating a signal.',
    note: 'A clean state matters for Clean Hands and several terminal approaches.',
  },
  {
    level: 1,
    name: 'A LOOK',
    tone: 'gold',
    signal: 'The nearest patrol is curious and the radio has your direction.',
    response: 'Move out of the first sightline. A change of street is usually enough if you stop firing.',
    escape: 'Break around a building, then reduce speed. The harbor is easier to disappear in when you are not broadcasting motion.',
    note: 'One star is manageable, but it can grow when a job adds heat.',
  },
  {
    level: 2,
    name: 'ACTIVE SEARCH',
    tone: 'gold',
    signal: 'Guardia are routing toward your last known position.',
    response: 'Use the market service road or waterline to create a second angle before crossing the open quay.',
    escape: 'Change direction after every broken sightline. Do not park in the terminal plaza.',
    note: 'Split Take begins here; the east-pier route should already be in your head.',
  },
  {
    level: 3,
    name: 'LOCKED HARBOR',
    tone: 'coral',
    signal: 'Patrols are persistent and the city routes become dangerous.',
    response: 'Commit to a vehicle advantage: Tempest on the road or Sombra Launch on the water.',
    escape: 'Bridge open? Cross immediately. Bridge closed? Take the coast and use hard corners, not the open terminal yard.',
    note: 'Storm Run deliberately begins at three stars and asks you to return to zero.',
  },
  {
    level: 4,
    name: 'RED CHANNEL',
    tone: 'coral',
    signal: 'The whole route feels watched. Every open straight is a liability.',
    response: 'Break contact before attempting any objective. A mission target is not a shelter.',
    escape: 'Use the bridge only if the deck is already safe; otherwise take the longest coastal loop and vary speed.',
    note: 'The guide recommends patience here. There is no reward for turning an escape into a firefight.',
  },
  {
    level: 5,
    name: 'FULL SIREN',
    tone: 'coral',
    signal: 'Maximum heat. Patrol response is immediate and every mistake compounds.',
    response: 'Leave the open road. Seek a waterline, a hard corner, or a vehicle swap only after sight is broken.',
    escape: 'The harbor is built for route changes. Use the span, the terminal cut, and the garage approach as separate chapters.',
    note: 'There is no shame in a clinic reset if health is already low and the run is not timed.',
  },
];

const BRIDGE_STATES = [
  {
    id: 'closed',
    name: 'DECK LOWERED',
    tone: 'teal',
    cue: 'Steel deck is aligned with the road.',
    road: 'Cars and foot traffic can cross the central channel.',
    water: 'Boats must wait outside the span or approach the control rhythmically.',
    action: 'On foot, use E at the control pedestal. In the launch, B requests an opening.',
  },
  {
    id: 'warning',
    name: 'WARNING LIGHTS',
    tone: 'gold',
    cue: 'The harbor has accepted an open or close request.',
    road: 'Stop short of the deck. Traffic will compress at both approaches.',
    water: 'Hold outside the moving zone. The safest water position is west of the span.',
    action: 'Do not force a crossing. Let the state advance, then read the deck again.',
  },
  {
    id: 'opening',
    name: 'RAISING SPAN',
    tone: 'coral',
    cue: 'The deck is leaving the road and exposing the channel.',
    road: 'A car cannot cross while the deck is moving. Reverse early, not at the edge.',
    water: 'Keep a clear lane down the center after the deck reaches its raised state.',
    action: 'The guide’s rule: wait for the all-clear, then use one clean throttle line.',
  },
  {
    id: 'open',
    name: 'CHANNEL OPEN',
    tone: 'gold',
    cue: 'The bascule is raised and the channel is passable for boats.',
    road: 'Road traffic is stopped at the approaches.',
    water: 'The launch can clear the span. Do not linger underneath the mechanism.',
    action: 'Cross first, dock second. If wanted, take the first hard turn after the east pier.',
  },
  {
    id: 'closing',
    name: 'LOWERING SPAN',
    tone: 'coral',
    cue: 'The deck is returning to the road after the water window.',
    road: 'Cars still wait until the deck settles.',
    water: 'Clear the bridge immediately; the channel is closing behind you.',
    action: 'Never stop on the center line. A moving bridge is a warning, not a checkpoint.',
  },
];

const SURVIVAL_TIPS = [
  { id: 'route-first', title: 'Draw the route before the heat', tag: 'ROUTING', text: 'Every job is easier when the first turn is chosen before the marker disappears. Notice whether the destination wants the market, the bridge, or the coast.' },
  { id: 'save-often', title: 'Garage is a punctuation mark', tag: 'PROGRESS', text: 'A completed job, a garage interaction, and a pause save progress. Use the garage after a risky mission chain so the next failure does not erase the whole evening.' },
  { id: 'cash-reserve', title: 'Keep a harbor reserve', tag: 'MONEY', text: 'The $180 respray, $200 toll, and $120 clinic bill all compete for the same wallet. A comfortable reserve is $320 before a timed or wanted mission.' },
  { id: 'health-break', title: 'Low health changes the plan', tag: 'VITALS', text: 'Health recovers slowly after a quiet stretch, but a clinic is immediate. Do not enter the terminal yard with a red bar just because the target is close.' },
  { id: 'line-of-sight', title: 'Sightlines are the real enemy', tag: 'HEAT', text: 'Wanted levels fall when the patrol loses your signal. A building corner, a hard turn, or a vehicle change after cover is worth more than raw speed.' },
  { id: 'bridge-clock', title: 'Treat the bridge as a clock', tag: 'BRIDGE', text: 'The span is stateful. Read the warning lights, wait outside the mechanism, and choose your crossing side before requesting a change.' },
  { id: 'water-dock', title: 'A boat needs a home edge', tag: 'BOAT', text: 'The launch cannot disembark in deep water. Bring it alongside the east pier or a shallow quay, then ask E to dock.' },
  { id: 'vehicle-fit', title: 'Match the vehicle to the sentence', tag: 'VEHICLE', text: '“Timed” favors the Taxi or Tempest. “Clean plate” favors the Courier or Sedan. “Open water” means the Sombra Launch. The objective text tells you the answer.' },
  { id: 'ammo-discipline', title: 'A reload is a route decision', tag: 'COMBAT', text: 'Reload behind a corner, beside a vehicle, or after a sightline break. Standing still to refill is how a small alert becomes a locked harbor.' },
  { id: 'bridge-alternative', title: 'There is always a second road', tag: 'ESCAPE', text: 'If the bascule blocks the middle, the coastal route remains slower but legible. Choose it early and stop fighting the city’s geometry.' },
  { id: 'mission-order', title: 'Build the evening in layers', tag: 'MISSIONS', text: 'Dead Drop teaches the west-to-north line. The Crossing teaches the bridge. Storm Run spends that knowledge. Let the mission chain teach you before it tests you.' },
  { id: 'quiet-reset', title: 'Silence is an active tool', tag: 'MINDSET', text: 'Radio, traffic, storm, and patrols make Puerto Sol feel busy. You do not need to answer every signal. A quiet reset is often the fastest route to the next payout.' },
  { id: 'camera-check', title: 'Use the camera at corners', tag: 'DRIVING', text: 'Pull the camera wide before a blind turn, especially in the Tempest. The game rewards knowing where the road ends, not just holding the throttle.' },
  { id: 'water-escape', title: 'The channel is a lane, not a hiding place', tag: 'BOAT', text: 'Open water removes traffic but makes your silhouette obvious. Keep moving toward a named pier, and do not idle under the bridge with heat active.' },
  { id: 'read-objective', title: 'The dispatch card is honest', tag: 'HUD', text: 'If the objective says “clean plate,” lower heat. If it says “get in a car,” walking will never satisfy it. Read the short sentence before changing the whole route.' },
];

const QUICK_FACTS = [
  { label: 'OPEN GUIDE', value: 'J', note: 'Toggle the field notes without leaving the shift.' },
  { label: 'INTERACT', value: 'E', note: 'Jobs, cars, boat, bridge control, clinic, and garage.' },
  { label: 'BRIDGE CALL', value: 'B', note: 'Request the span from the Sombra Launch.' },
  { label: 'SAVE', value: 'ESC', note: 'Pause and save when the route needs a reset.' },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safe(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function percent(value) {
  return `${clamp(Number(value) || 0, 0, 100)}%`;
}

function currentPosition(game) {
  const pos = game?.activePos || game?.player?.pos;
  return pos ? { x: pos.x, z: pos.z } : { x: 0, z: 0 };
}

function titleCase(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

const GUIDE_DATA = {
  districts: DISTRICTS,
  vehicles: VEHICLES,
  weapons: WEAPONS,
  missions: MISSIONS,
  wanted: WANTED_LEVELS,
  bridge: BRIDGE_STATES,
  survival: SURVIVAL_TIPS,
};

export class HarborGuide {
  constructor(game) {
    this.game = game;
    this.categoryIndex = 0;
    this.entryIndex = 0;
    this.opened = false;
    this.wasLocked = false;
    this.refreshTimer = 0;
    this.panel = this.createPanel();
    this.bind();
  }

  createPanel() {
    const panel = document.createElement('aside');
    panel.id = 'harborGuide';
    panel.className = 'harbor-guide hidden';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div class="guide-shell">
        <div class="guide-rule"></div>
        <header class="guide-header">
          <div>
            <div class="guide-eyebrow">PUERTO SOL // HARBOR AUTHORITY</div>
            <h2>HARBOR GUIDE</h2>
            <p id="guideSubtitle">${GUIDE_VERSION} · FIELD NOTES FOR THE STORM SHIFT</p>
          </div>
          <button class="guide-close" type="button" data-guide-action="close" aria-label="Close Harbor Guide">CLOSE <b>J</b></button>
        </header>
        <nav class="guide-tabs" aria-label="Harbor Guide sections"></nav>
        <div class="guide-layout">
          <section class="guide-live" aria-label="Live shift readout"></section>
          <section class="guide-content" aria-live="polite"></section>
        </div>
        <footer class="guide-footer"></footer>
      </div>`;
    document.body.appendChild(panel);
    return panel;
  }

  bind() {
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyJ') {
        event.preventDefault();
        event.stopPropagation();
        if (this.opened || this.game?.state === 'playing') this.toggle();
        return;
      }
      if (!this.opened) return;
      if (['Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'].includes(event.code)) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (event.code === 'Escape') this.close();
      if (event.code === 'ArrowLeft') this.shiftCategory(-1);
      if (event.code === 'ArrowRight') this.shiftCategory(1);
      if (event.code === 'ArrowUp') this.shiftEntry(-1);
      if (event.code === 'ArrowDown') this.shiftEntry(1);
      if (event.code === 'Home') this.selectEntry(0);
      if (event.code === 'End') this.selectEntry(this.entries().length - 1);
      if (event.code === 'Enter') this.panel.querySelector('.guide-content')?.focus();
    }, true);

    this.panel.addEventListener('click', (event) => {
      const action = event.target.closest('[data-guide-action]')?.dataset.guideAction;
      const category = event.target.closest('[data-guide-category]')?.dataset.guideCategory;
      const entry = event.target.closest('[data-guide-entry]')?.dataset.guideEntry;
      if (action === 'close') this.close();
      if (action === 'previous') this.shiftEntry(-1);
      if (action === 'next') this.shiftEntry(1);
      if (category) this.selectCategory(category);
      if (entry !== undefined) this.selectEntry(Number(entry));
    });
  }

  categories() {
    return CATEGORIES;
  }

  category() {
    return this.categories()[this.categoryIndex] || this.categories()[0];
  }

  entries() {
    return GUIDE_DATA[this.category().id] || [];
  }

  entry() {
    const entries = this.entries();
    return entries[this.entryIndex] || entries[0];
  }

  open() {
    if (this.opened || this.game?.state !== 'playing') return;
    this.opened = true;
    this.wasLocked = Boolean(this.game.input?.locked);
    if (this.game.input) {
      this.game.input.enabled = false;
      this.game.input.releaseLock();
      this.game.input.clear();
    }
    this.panel.classList.remove('hidden');
    this.panel.setAttribute('aria-hidden', 'false');
    this.render(true);
    this.refreshTimer = window.setInterval(() => this.render(false), 300);
  }

  close() {
    if (!this.opened) return;
    this.opened = false;
    window.clearInterval(this.refreshTimer);
    this.refreshTimer = 0;
    this.panel.classList.add('hidden');
    this.panel.setAttribute('aria-hidden', 'true');
    if (this.game?.state === 'playing' && this.game.input) {
      this.game.input.enabled = true;
      if (this.wasLocked) this.game.input.requestLock();
    }
  }

  toggle() {
    if (this.opened) this.close();
    else this.open();
  }

  selectCategory(id) {
    const next = this.categories().findIndex((category) => category.id === id);
    if (next < 0) return;
    this.categoryIndex = next;
    this.entryIndex = 0;
    this.render(true);
  }

  shiftCategory(amount) {
    const count = this.categories().length;
    this.categoryIndex = (this.categoryIndex + amount + count) % count;
    this.entryIndex = 0;
    this.render(true);
  }

  selectEntry(index) {
    this.entryIndex = clamp(index, 0, Math.max(0, this.entries().length - 1));
    this.render(true);
  }

  shiftEntry(amount) {
    const count = this.entries().length;
    if (!count) return;
    this.entryIndex = (this.entryIndex + amount + count) % count;
    this.render(true);
  }

  liveSnapshot() {
    const game = this.game;
    const bridge = game?.bridge;
    const activeMission = game?.missions?.active;
    const missionDef = activeMission ? game.missions.defs[activeMission] : null;
    const position = currentPosition(game);
    return {
      zone: game?.zoneName || 'PUERTO SOL',
      mode: game?.mode || 'foot',
      vehicle: game?.mode === 'car' ? game.car?.name : game?.mode === 'boat' ? 'SOMBRA LAUNCH' : 'ON FOOT',
      wanted: Number(game?.wanted ?? game?.police?.stars ?? 0),
      bridge: bridge?.state || 'closed',
      bridgeLabel: bridge?.statusText || 'DECK LOWERED',
      cash: Number(game?.cash || 0),
      rep: Number(game?.rep || 0),
      health: Number(game?.player?.health || 0),
      weapon: game?.weapon || 'pistol',
      mission: missionDef?.title || (game?.missions?.completed?.size ? 'READY FOR ANOTHER RUN' : 'NO ACTIVE JOB'),
      missionStep: missionDef && game?.missions ? `${game.missions.stepIndex + 1} / ${missionDef.steps.length}` : '—',
      missionStepIndex: missionDef && game?.missions ? game.missions.stepIndex : -1,
      position,
    };
  }

  render(force = false) {
    if (!this.opened && !force) return;
    const live = this.liveSnapshot();
    const category = this.category();
    const item = this.entry();
    const subtitle = this.panel.querySelector('#guideSubtitle');
    if (subtitle) subtitle.textContent = `${category.eyebrow} · ${live.zone} · ${live.bridgeLabel}`;
    this.renderTabs();
    this.renderLive(live);
    this.renderContent(category, item, live);
    this.renderFooter(category, item);
  }

  renderTabs() {
    const tabs = this.panel.querySelector('.guide-tabs');
    if (!tabs) return;
    tabs.innerHTML = this.categories().map((category, index) => `
      <button type="button" class="guide-tab ${index === this.categoryIndex ? 'active' : ''}" data-guide-category="${safe(category.id)}" aria-current="${index === this.categoryIndex ? 'page' : 'false'}">
        <span>${safe(String(index + 1).padStart(2, '0'))}</span>${safe(category.label)}
      </button>`).join('');
  }

  renderLive(live) {
    const liveEl = this.panel.querySelector('.guide-live');
    if (!liveEl) return;
    const weaponName = WEAPONS.find((weapon) => weapon.id === live.weapon)?.name || titleCase(live.weapon);
    const modeLabel = live.mode === 'boat' ? 'ON WATER' : live.mode === 'car' ? 'DRIVING' : 'ON FOOT';
    const stars = Array.from({ length: 5 }, (_, index) => `<i class="guide-star ${index < live.wanted ? 'on' : ''}"></i>`).join('');
    liveEl.innerHTML = `
      <div class="live-kicker"><span class="live-pip"></span> LIVE SHIFT READOUT <b>${safe(modeLabel)}</b></div>
      <div class="live-zone"><span>POSITION</span><strong>${safe(live.zone)}</strong></div>
      <div class="live-card">
        <span class="live-label">CURRENT RIDE</span>
        <strong>${safe(live.vehicle)}</strong>
        <small>${safe(this.routeHint(live))}</small>
      </div>
      <div class="live-metrics">
        <div><span>CASH</span><b>$${live.cash.toLocaleString()}</b></div>
        <div><span>REP</span><b>${live.rep.toLocaleString()}</b></div>
        <div><span>VITALS</span><b>${Math.round(live.health)}%</b></div>
      </div>
      <div class="live-section">
        <div class="live-label">WANTED <b>${live.wanted}/5</b></div>
        <div class="guide-stars">${stars}</div>
        <p>${safe(this.wantedRead(live.wanted))}</p>
      </div>
      <div class="live-section">
        <div class="live-label">BRIDGE <b>${safe(live.bridgeLabel)}</b></div>
        <div class="live-progress"><i style="width:${percent(this.bridgeProgress(live.bridge))}"></i></div>
        <p>${safe(this.bridgeRead(live.bridge))}</p>
      </div>
      <div class="live-section live-mission">
        <div class="live-label">DISPATCH <b>${safe(live.missionStep)}</b></div>
        <strong>${safe(live.mission)}</strong>
      </div>`;
  }

  routeHint(live) {
    if (live.mode === 'boat') return 'B calls the span · E docks at a quay';
    if (live.mode === 'car') return 'E exits · R reloads · J returns here';
    return 'E interacts · J opens field notes';
  }

  wantedRead(level) {
    const wanted = WANTED_LEVELS[clamp(level, 0, WANTED_LEVELS.length - 1)];
    return wanted?.escape || 'Keep the route quiet and read the next corner.';
  }

  bridgeRead(state) {
    const bridge = BRIDGE_STATES.find((entry) => entry.id === state) || BRIDGE_STATES[0];
    return bridge.cue;
  }

  bridgeProgress(state) {
    return { closed: 18, warning: 40, opening: 64, open: 100, closing: 78 }[state] || 18;
  }

  renderContent(category, item, live) {
    const content = this.panel.querySelector('.guide-content');
    if (!content || !item) return;
    const entries = this.entries();
    const index = this.entryIndex;
    const prev = (index - 1 + entries.length) % entries.length;
    const next = (index + 1) % entries.length;
    content.innerHTML = `
      <div class="guide-content-head">
        <div><span class="guide-content-kicker">${safe(category.eyebrow)} / ${String(index + 1).padStart(2, '0')} OF ${String(entries.length).padStart(2, '0')}</span><h3>${safe(this.itemTitle(category.id, item))}</h3></div>
        <div class="guide-pager"><button type="button" data-guide-action="previous" aria-label="Previous entry">←</button><button type="button" data-guide-action="next" aria-label="Next entry">→</button></div>
      </div>
      <div class="guide-entry-strip"><span class="tone-dot tone-${safe(item.tone || 'teal')}"></span><b>${safe(this.itemTag(category.id, item))}</b><span>${safe(this.itemMeta(category.id, item, live))}</span></div>
      ${this.renderBody(category.id, item, live)}
      <div class="guide-entry-list">${entries.map((entry, entryIndex) => `<button type="button" class="guide-entry-link ${entryIndex === index ? 'active' : ''}" data-guide-entry="${entryIndex}"><span>${String(entryIndex + 1).padStart(2, '0')}</span>${safe(this.itemTitle(category.id, entry))}</button>`).join('')}</div>`;
  }

  itemTitle(category, item) {
    if (category === 'districts') return item.name;
    if (category === 'vehicles' || category === 'weapons') return item.name;
    if (category === 'missions') return item.name;
    if (category === 'wanted') return `${item.level} · ${item.name}`;
    if (category === 'bridge') return item.name;
    return item.title;
  }

  itemTag(category, item) {
    if (category === 'districts') return item.tag;
    if (category === 'vehicles' || category === 'weapons') return item.badge;
    if (category === 'missions') return item.giver;
    if (category === 'wanted') return `LEVEL ${item.level}`;
    if (category === 'bridge') return 'SPAN STATE';
    return item.tag;
  }

  itemMeta(category, item, live) {
    if (category === 'districts') return item.coordinates;
    if (category === 'vehicles') return item.kind;
    if (category === 'weapons') return item.kind;
    if (category === 'missions') return live.mission === item.name ? 'ACTIVE NOW' : item.payout;
    if (category === 'wanted') return item.signal;
    if (category === 'bridge') return live.bridge === item.id ? 'CURRENT STATE' : item.cue;
    return 'FIELD NOTE';
  }

  renderBody(category, item, live) {
    if (category === 'districts') return this.renderDistrict(item);
    if (category === 'vehicles') return this.renderVehicle(item);
    if (category === 'weapons') return this.renderWeapon(item);
    if (category === 'missions') return this.renderMission(item, live);
    if (category === 'wanted') return this.renderWanted(item);
    if (category === 'bridge') return this.renderBridge(item, live);
    return this.renderTip(item);
  }

  renderDistrict(item) {
    return `
      <p class="guide-lead">${safe(item.read)}</p>
      <div class="guide-fact-grid">
        ${this.fact('STREETS', item.streets.join(' · '))}
        ${this.fact('LANDMARKS', item.landmarks.join(' · '))}
        ${this.fact('APPROACH', item.approach)}
        ${this.fact('DANGER', item.danger)}
      </div>
      <div class="guide-callout"><span>ROUTE NOTE</span><p>${safe(item.route)}</p><small>${safe(item.voice)}</small></div>`;
  }

  renderVehicle(item) {
    return `
      <p class="guide-lead">${safe(item.use)}</p>
      <div class="guide-stat-grid">${this.stat('SPEED', item.stats.speed)}${this.stat('GRIP', item.stats.grip)}${this.stat('ARMOR', item.stats.armor)}${this.stat('TURN', item.stats.turn)}</div>
      <div class="guide-columns"><div><span class="guide-section-label">FIELD PROFILE</span><ul class="guide-list">${item.notes.map((note) => `<li>${safe(note)}</li>`).join('')}</ul></div><div><span class="guide-section-label">HANDLING</span><p class="guide-copy">${safe(item.handling)}</p><span class="guide-section-label">WHERE TO FIND IT</span><p class="guide-copy">${safe(item.unlock)}</p></div></div>`;
  }

  renderWeapon(item) {
    return `
      <p class="guide-lead">${safe(item.advice)}</p>
      <div class="guide-stat-grid">${this.stat('DAMAGE', item.stats.damage)}${this.stat('CONTROL', item.stats.control)}${this.stat('CAPACITY', item.stats.capacity, item.stats.capacity > 20 ? 100 : 60)}${this.stat('REACH', item.stats.reach)}</div>
      <div class="guide-columns"><div><span class="guide-section-label">WHAT IT DOES</span><ul class="guide-list">${item.notes.map((note) => `<li>${safe(note)}</li>`).join('')}</ul></div><div><span class="guide-section-label">FIELD RHYTHM</span><p class="guide-copy">${safe(item.rhythm)}</p><div class="guide-callout compact"><span>RULE OF THUMB</span><p>${safe(item.advice.split('. ')[0])}.</p></div></div></div>`;
  }

  renderMission(item, live) {
    const active = live.mission === item.name;
    return `
      <p class="guide-lead">${safe(item.brief)}</p>
      <div class="guide-mission-route"><span>ROUTE</span><strong>${safe(item.route)}</strong><b>${safe(item.payout)}</b></div>
      <div class="guide-timeline">${item.beats.map((beat, index) => `<div class="guide-beat ${active && index < live.missionStepIndex ? 'done' : ''}"><i>${String(index + 1).padStart(2, '0')}</i><span>${safe(beat)}</span></div>`).join('')}</div>
      <div class="guide-columns"><div><span class="guide-section-label">FIELDCRAFT</span><p class="guide-copy">${safe(item.fieldcraft)}</p></div><div><span class="guide-section-label">IF IT GOES WRONG</span><p class="guide-copy">${safe(item.failure)}</p></div></div>`;
  }

  renderWanted(item) {
    const stars = Array.from({ length: 5 }, (_, index) => `<i class="guide-star ${index < item.level ? 'on' : ''}"></i>`).join('');
    return `
      <p class="guide-lead">${safe(item.signal)}</p>
      <div class="wanted-reading"><div class="guide-stars large">${stars}</div><strong>${safe(item.name)}</strong><span>${safe(item.response)}</span></div>
      <div class="guide-columns"><div><span class="guide-section-label">BREAK CONTACT</span><p class="guide-copy">${safe(item.escape)}</p></div><div><span class="guide-section-label">FIELD NOTE</span><p class="guide-copy">${safe(item.note)}</p></div></div>`;
  }

  renderBridge(item, live) {
    const current = live.bridge === item.id;
    return `
      <p class="guide-lead">${safe(item.cue)}</p>
      <div class="bridge-reading ${current ? 'current' : ''}"><span>${current ? 'CURRENT STATE' : 'STATE GUIDE'}</span><strong>${safe(item.name)}</strong><p>${safe(item.road)}</p></div>
      <div class="guide-fact-grid">${this.fact('BY BOAT', item.water)}${this.fact('WHAT TO DO', item.action)}</div>`;
  }

  renderTip(item) {
    return `
      <p class="guide-lead">${safe(item.text)}</p>
      <div class="guide-tip-card"><span>${safe(item.tag)}</span><strong>${safe(item.title)}</strong><p>${safe(item.text)}</p></div>
      <div class="guide-callout"><span>KEEP IN MIND</span><p>Puerto Sol is compact, but every district offers a different answer to the same question: do you need speed, cover, or patience?</p></div>`;
  }

  fact(label, value) {
    return `<div class="guide-fact"><span>${safe(label)}</span><p>${safe(value)}</p></div>`;
  }

  stat(label, value, scale = 100) {
    const width = clamp((Number(value) / scale) * 100, 6, 100);
    return `<div class="guide-stat"><div><span>${safe(label)}</span><b>${safe(value)}</b></div><i><em style="width:${percent(width)}"></em></i></div>`;
  }

  renderFooter(category, item) {
    const footer = this.panel.querySelector('.guide-footer');
    if (!footer) return;
    const index = this.entryIndex;
    footer.innerHTML = `
      <div class="guide-footer-copy"><span>FIELD NOTES ${GUIDE_VERSION.replace('FIELD NOTES / ', '')}</span><b>${safe(category.label)} · ${String(index + 1).padStart(2, '0')} / ${String(this.entries().length).padStart(2, '0')}</b></div>
      <div class="guide-controls"><span><b>← →</b> section</span><span><b>↑ ↓</b> entry</span><span><b>J</b> close</span></div>`;
  }
}

export const harborGuideData = Object.freeze({
  categories: CATEGORIES,
  districts: DISTRICTS,
  vehicles: VEHICLES,
  weapons: WEAPONS,
  missions: MISSIONS,
  wanted: WANTED_LEVELS,
  bridge: BRIDGE_STATES,
  survival: SURVIVAL_TIPS,
  quickFacts: QUICK_FACTS,
});
