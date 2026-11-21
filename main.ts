// High Tide — the program that hands the game in (Node 22, standard
// library only). It copies this repository's game/ and screenshots/
// into the output folder and writes dossier.json with the kit's
// make.fun library, then prints the counts the maker checks: how many
// game files and screenshots went in, and how big the dossier text is.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function walk(dir, list = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, list);
    else list.push(full);
  }
  return list;
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

const gameFiles = walk(join(out, 'game'));
const modules = gameFiles.filter((f) => extname(f) === '.js' && f.includes(`${join('game', 'src')}`)).length;
const shots = existsSync(join(out, 'screenshots'))
  ? readdirSync(join(out, 'screenshots')).filter((n) => !n.startsWith('.'))
  : [];

// The scorer's own caps: only the text cap shapes the bytes; the rest
// refuse an entry the scorer would refuse outright. buildDossier hands
// back bytes, so decode them before reading the text size out of them.
const dossierBytes = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossierBytes);

const dossier = JSON.parse(Buffer.from(dossierBytes).toString('utf8'));
const textBytes = Buffer.byteLength(dossier.text ?? '', 'utf8');
const cut = typeof dossier.text === 'string' && dossier.text.includes('Cut at');
console.log(`game/: ${gameFiles.length} files (${modules} modules checked), screenshots: ${shots.length}, dossier text: ${textBytes} bytes${cut ? ' (CUT!)' : ''}`);
