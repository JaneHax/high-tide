import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const game = join(here, 'game');
const shots = join(here, 'screenshots');

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function fail(message: string): never {
  console.error(`high-tide: ${message}`);
  process.exit(1);
}

function walk(dir: string): { path: string; bytes: number; dir: boolean }[] {
  const entries: { path: string; bytes: number; dir: boolean }[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = lstatSync(full);
    if (st.isSymbolicLink()) fail(`game/ contains a symbolic link: ${relative(here, full)}`);
    if (st.isDirectory()) {
      entries.push({ path: full, bytes: 0, dir: true });
      entries.push(...walk(full));
    } else if (st.isFile()) {
      entries.push({ path: full, bytes: st.size, dir: false });
    } else {
      fail(`game/ contains a special file: ${relative(here, full)}`);
    }
  }
  return entries;
}

if (!existsSync(join(here, 'LICENSE'))) fail('LICENSE is missing');
if (!existsSync(join(here, 'vendor', 'makefun-game.ts'))) fail('vendor/makefun-game.ts is missing');
if (!existsSync(game)) fail('game/ is missing');
if (!existsSync(join(game, 'index.html'))) fail('game/index.html is missing');
const indexStat = statSync(join(game, 'index.html'));
if (!indexStat.isFile()) fail('game/index.html is not a regular file');
if (indexStat.size > 1024 * 1024) fail('game/index.html exceeds 1 MiB');

const tree = walk(game);
if (tree.length > caps.game_max_files) fail(`game/ has ${tree.length} entries, over the ${caps.game_max_files} cap`);
const gameBytes = tree.reduce((n, e) => n + e.bytes, 0);
if (gameBytes > caps.game_max_bytes) fail(`game/ is ${gameBytes} bytes, over the ${caps.game_max_bytes} cap`);
for (const e of tree) {
  const bytes = Buffer.byteLength(relative(game, e.path).replaceAll('\\', '/'), 'utf8');
  if (bytes > caps.game_path_max_bytes) fail(`game path over ${caps.game_path_max_bytes} bytes: ${relative(game, e.path)}`);
}

if (!existsSync(shots)) fail('screenshots/ is missing');
const images = readdirSync(shots).filter((n) => !n.startsWith('.')).sort();
if (images.length < 3 || images.length > caps.screenshots.max) fail(`screenshots/ must hold 3 or 4 images, found ${images.length}`);
for (const name of images) {
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(name)) fail(`bad screenshot name: ${name}`);
  const full = join(shots, name);
  const st = lstatSync(full);
  if (!st.isFile()) fail(`screenshot is not a regular file: ${name}`);
  if (!/\.(png|jpe?g)$/i.test(name)) fail(`screenshot is not PNG or JPEG: ${name}`);
  if (st.size > caps.screenshots.max_bytes) fail(`screenshot over 256 KiB: ${name} (${st.size} bytes)`);
}

rmSync(join(out, 'game'), { recursive: true, force: true });
rmSync(join(out, 'screenshots'), { recursive: true, force: true });
rmSync(join(out, 'dossier.json'), { force: true });
mkdirSync(out, { recursive: true });
cpSync(game, join(out, 'game'), { recursive: true });
cpSync(shots, join(out, 'screenshots'), { recursive: true });
const dossier = buildDossier(out, caps);
writeFileSync(join(out, 'dossier.json'), dossier);

const screenshotBytes = images.reduce((n, name) => n + statSync(join(shots, name)).size, 0);
console.log(`high-tide: packaged ${tree.length} game entries (${gameBytes} bytes), ${images.length} screenshots (${screenshotBytes} bytes)`);
console.log(`high-tide: dossier ${dossier.byteLength} bytes -> ${join(out, 'dossier.json')}`);
