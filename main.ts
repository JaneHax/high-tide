// main.ts — High Tide's entry program (Node 22, standard library only).
// Copies game/ and screenshots/ to the output directory, writes the
// dossier with the kit's buildDossier, and writes a package manifest.
import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR || '/output';
mkdirSync(out, { recursive: true });

function listFiles(dir, base = '') {
  const outFiles = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) outFiles.push(...listFiles(join(dir, e.name), rel));
    else if (e.isFile()) outFiles.push(rel);
  }
  return outFiles.sort();
}

const gameFiles = listFiles(join(root, 'game'));
const shotFiles = existsSync(join(root, 'screenshots')) ? listFiles(join(root, 'screenshots')) : [];
cpSync(join(root, 'game'), join(out, 'game'), { recursive: true });
if (shotFiles.length > 0) cpSync(join(root, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(out, 'dossier.json'), dossier);

const parsed = JSON.parse(new TextDecoder().decode(dossier));
const manifest = {
  name: 'High Tide',
  competition: 'gta6-01',
  gameFiles: gameFiles.length,
  gameBytes: gameFiles.reduce((n, f) => n + statSync(join(root, 'game', f)).size, 0),
  screenshots: shotFiles,
  dossierTextBytes: new TextEncoder().encode(parsed.text).length,
  files: gameFiles.map((f) => ({ path: `game/${f}`, sha256: createHash('sha256').update(readFileSync(join(root, 'game', f))).digest('hex') })),
};
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(`game files: ${gameFiles.length}`);
console.log(`screenshots: ${shotFiles.length}`);
console.log(`dossier text bytes: ${manifest.dossierTextBytes}`);
console.log(`dossier bytes: ${dossier.length}`);
