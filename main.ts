// HIGH TIDE, an open-world crime game in Puerto Sol, played in a desktop browser from static files:
// this directory's game/ folder is the game itself and this program hands it in.
// Puerto Sol is a golden-hour harbour city of cream walls, turquoise water and one crooked police force,
// where Rico works ten jobs for Sombra — on foot, behind the wheel, and out on the water.
//
// The plumbing: copy game/ and screenshots/ from beside this file to the output directory and write
// output/dossier.json, the summary the judge reads, with the vendored make.fun library.
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import {cpSync,existsSync,mkdirSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildDossier} from './vendor/makefun-game.ts';
const here=fileURLToPath(new URL('.',import.meta.url));
const out=process.env.MAKEFUN_OUTPUT_DIR??'/output';
const SHOT_MAX=4,SHOT_MAX_BYTES=262144;
function fail(message:string):never{console.error(`main.ts: ${message}`);process.exit(1);}
function filesUnder(dir:string):string[]{
  const found:string[]=[];
  const walk=(rel:string):void=>{
    for(const entry of readdirSync(rel==='' ? dir : join(dir,rel),{withFileTypes:true})){
      const path=rel==='' ? entry.name : `${rel}/${entry.name}`;
      if(entry.isDirectory())walk(path);
      else if(entry.isFile())found.push(path);
    }
  };
  walk('');
  return found.sort();
}
mkdirSync(out,{recursive:true});
cpSync(join(here,'game'),join(out,'game'),{recursive:true});
mkdirSync(join(out,'screenshots'),{recursive:true});
if(existsSync(join(here,'screenshots')))cpSync(join(here,'screenshots'),join(out,'screenshots'),{recursive:true});
const gameDir=join(out,'game');
// The page and the modules are read back from the copy, never listed here: a module added in a later
// session is then checked by existing code, and this program cannot fall out of step with game/src/.
if(!existsSync(join(gameDir,'index.html'))||!statSync(join(gameDir,'index.html')).isFile())fail('game/index.html is missing from the output: a game is a page at game/index.html, its scripts beside it');
if(!existsSync(join(gameDir,'src'))||!statSync(join(gameDir,'src')).isDirectory())fail('game/src/ is missing from the output: the game\'s modules live there and index.html imports them');
const modules=filesUnder(join(gameDir,'src')).filter(path=>/\.m?js$/.test(path));
const sources=['index.html',...modules.map(path=>`src/${path}`)];
for(const rel of sources){
  const file=join(gameDir,rel);
  if(!existsSync(file)||!statSync(file).isFile())fail(`game/${rel} is missing: every module under game/src/ is part of the game`);
  if(statSync(file).size===0)fail(`game/${rel} is empty: a module with no text is a module that failed to load`);
}
const shotsDir=join(out,'screenshots');
const shots=existsSync(shotsDir)?filesUnder(shotsDir).filter(path=>/\.(png|jpe?g)$/i.test(path)):[];
if(shots.length<1||shots.length>SHOT_MAX)fail(`screenshots/ holds ${shots.length} image files: the entry needs 1 to ${SHOT_MAX} PNG or JPEG renders, the first by name the cover`);
for(const name of shots){
  const size=statSync(join(shotsDir,name)).size;
  if(size>SHOT_MAX_BYTES)fail(`screenshots/${name} is ${size} bytes, over the ${SHOT_MAX_BYTES} one image may be`);
}
// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes). 163840 is the whole dossier, headers included, so the
// source itself has to stay near 158 KiB: a function added to game/src/ is a function the judge never reads.
const dossier=buildDossier(out,{
  text_max_bytes:163840,
  screenshots:{max:4,max_bytes:262144},
  game_max_files:993,
  game_max_bytes:50331648,
  game_path_max_bytes:1000,
});
writeFileSync(join(out,'dossier.json'),dossier);
const textBytes=Buffer.byteLength((JSON.parse(Buffer.from(dossier).toString('utf8')) as {text:string}).text,'utf8');
console.log(`game/: ${filesUnder(gameDir).length} files (${modules.length} modules checked), screenshots: ${shots.length}, dossier text: ${textBytes} bytes`);
