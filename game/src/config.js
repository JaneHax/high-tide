// High Tide tuning: one table per system. Golden hour now: sun higher and
// warmer than the old dusk, so Puerto Sol reads sun-soaked on the cover.
export const WORLD={boundary:460,gravity:22,step:1/60,fog:{near:100,far:560},sunDistance:260,sunElevation:0.62,sunAzimuth:2.1,sunIntensity:2.9,ambient:0.62,shadowExtent:140};
export const CITY={blockSize:52,roadWidth:14,gridX:8,gridZ:8,sidewalkWidth:3.2,lotInset:2.5,alleyChance:0.22,parkChance:0.12,propChance:0.3,lightSpacing:26,seawallHeight:3.4,dockLength:36,dockWidth:9,seabed:-3.2,kerbHeight:0.2,promenadeWidth:14,promenadeHeight:0.35,pierHeight:0.75,beachWidth:22};
export const PLAYER={walkSpeed:2.6,runSpeed:6.4,acceleration:18,deceleration:24,jumpSpeed:7.2,turnRate:12,radius:0.42,height:1.8,stepHeight:0.45};
export const CAMERA={fov:68,near:0.1,far:900,distance:5.2,height:2.3,pitch:-0.16,pitchMin:-0.95,pitchMax:0.3,minDistance:0.55,followLag:14,sensitivity:0.0022,collisionPadding:0.35,chaseDistance:8.2,chaseHeight:2.8,chaseLag:3.2};
export const VEHICLES={count:18,maxSpeed:26,accel:9,brake:18,reverseMax:7,turnRate:1.6,friction:2.4,wheelRadius:0.36,enterReach:3.2,spawnClearance:6,cruiseMin:0.5,cruiseMax:0.92,grip:9,handbrakeGrip:0.5,stuckSeconds:3};
export const PEDS={count:44,walkSpeed:1.35,fleeSpeed:4.6,radius:0.36,alarmRadius:9,alarmSeconds:7,respawnDistance:90,crossChance:0.45,crossCooldown:11,bodySeconds:22,runOverSpeed:2.2};
export const COMBAT={health:100,ammoReserve:90,magSize:15,fireInterval:0.14,range:90,spread:0.012,damage:34,reviveHealth:50,respawnSeconds:4,cone:0.05,dropReach:1.35,maxDrops:6};
export const WEAPONS={
  pistol:{name:'Pistol',damage:34,fireInterval:0.14,magSize:15,spread:0.012,range:90,pellets:1,auto:false,rep:0},
  shotgun:{name:'Shotgun',damage:14,fireInterval:0.7,magSize:6,spread:0.05,range:40,pellets:8,auto:false,rep:30},
  smg:{name:'SMG',damage:18,fireInterval:0.07,magSize:30,spread:0.03,range:60,pellets:1,auto:true,rep:70},
  rifle:{name:'Rifle',damage:55,fireInterval:0.32,magSize:20,spread:0.004,range:140,pellets:1,auto:false,rep:130},
};
export const WEAPON_ORDER=['pistol','shotgun','smg','rifle'];
export const POLICE={maxStars:5,heatPerStar:40,heatCrime:60,heatShot:8,heatKill:40,decayDelay:6,decayRate:6,escapeSeconds:20,sightRange:55,carCount:3,officerSpeed:4.2,officerShootRange:26,spawnDistance:70,carSpeed:17,carTurnRate:1.9,dismountRange:16,officersPerCar:2,officerHealth:60,officerDamage:7,officerFireInterval:0.75,officerHoldRange:8,heliStars:3,blockStars:3};
export const AIR={height:26,speed:14,spotRange:60,rotorSpeed:28};
export const BOATS={count:3,maxSpeed:12,accel:5,turnRate:0.9,boardReach:3.4,floatY:0.4};
export const GARAGE={racePay:800,raceSeconds:60,raceBest:0};
export const MISSIONS={count:10,payouts:[400,700,1100,1600,900,1400,1800,1200,2200,3000],rep:[10,12,15,18,25,12,16,20,14,30],markerRadius:2.2,markerHeight:4,reachRadius:3,robSeconds:3,raceSeconds:75,getawaySeconds:60};
export const REP={levels:['Runner','Wheelman','Made','King of Puerto Sol'],thresholds:[0,30,70,130]};
export const HUD={font:'system-ui, -apple-system, "Segoe UI", sans-serif',margin:18,panelWidth:260,minimapSize:176,minimapRange:120};
export const PALETTE={skyWarm:'#f7b45e',skyCool:'#4a5a8a',sun:'#ffe0a8',fog:'#d99a68',wallCream:'#e8d9bd',wallTan:'#c9a882',wallStone:'#b4ada0',roof:'#6b5546',asphalt:'#2c2b33',roadLine:'#d9c98f',roadLineYellow:'#d8b45a',sidewalk:'#9a9184',sea:'#2fa6a0',seaDeep:'#12565e',grass:'#6d7a49',sand:'#cfb98d',wetSand:'#9c8a68',hill:'#5a5245',sirenRed:'#e8402f',sirenBlue:'#3f7dff',wantedGold:'#f5c451',healthRed:'#e0453c',cashGreen:'#5fd08a',panel:'rgba(18, 16, 26, 0.72)',accent:'#f2a35e',text:'#f4efe6',muted:'#9a938c'};
