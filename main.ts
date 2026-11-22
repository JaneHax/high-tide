import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const game = join(here, 'game');
const shots = join(here, 'screenshots');
const harborGuide = join(game, 'src', 'harborGuide.js');
const manifestName = 'package-manifest.json';

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

type Entry = { path: string; bytes: number };

type ScreenshotSummary = {
  files: string[];
  bytes: number;
};

type HarborGuideSummary = {
  path: string;
  bytes: number;
  lines: number;
  checks: string[];
};

type PackageManifest = {
  schema: 'makefun/package-manifest/v1';
  package: 'high-tide';
  title: 'High Tide: Storm Shift';
  entry: 'game/index.html';
  summary: string;
  game: {
    entries: number;
    bytes: number;
    harbor_guide: HarborGuideSummary;
  };
  screenshots: ScreenshotSummary;
  output: {
    entries: string[];
    dossier_bytes: number;
    dossier_text_bytes: number;
  };
};

function walk(dir: string): Entry[] {
  const entries: Entry[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = lstatSync(full);
    if (st.isSymbolicLink()) fail(`game/ contains a symbolic link: ${relative(here, full)}`);
    if (st.isDirectory()) entries.push({ path: full, bytes: 0 }, ...walk(full));
    else if (st.isFile()) entries.push({ path: full, bytes: st.size });
    else fail(`game/ contains a special file: ${relative(here, full)}`);
  }
  return entries;
}

function regularFile(path: string, label: string): number {
  if (!existsSync(path)) fail(`${label} is missing`);
  const st = lstatSync(path);
  if (!st.isFile()) fail(`${label} is not a regular file`);
  return st.size;
}

function validateHarborGuideAsset(): HarborGuideSummary {
  const bytes = regularFile(harborGuide, 'game/src/harborGuide.js');
  const source = readFileSync(harborGuide, 'utf8');
  const checks = [
    'export class HarborGuide',
    "panel.className = 'harbor-guide hidden'",
    'aria-live="polite"',
    'data-guide-action',
  ];
  for (const check of checks) if (!source.includes(check)) fail(`Harbor Guide asset is missing its ${check} hook`);
  return {
    path: relative(here, harborGuide).replaceAll('\\', '/'),
    bytes,
    lines: source === '' ? 0 : source.split('\n').length,
    checks,
  };
}

function validateScreenshots(): ScreenshotSummary {
  if (!existsSync(shots)) fail('screenshots/ is missing');
  if (!lstatSync(shots).isDirectory()) fail('screenshots/ is not a directory');
  const files = readdirSync(shots).filter((name) => !name.startsWith('.')).sort();
  if (files.length < 3 || files.length > caps.screenshots.max) {
    fail(`screenshots/ must hold 3 or 4 images, found ${files.length}`);
  }
  let bytes = 0;
  for (const name of files) {
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(name)) fail(`bad screenshot name: ${name}`);
    const size = regularFile(join(shots, name), `screenshot ${name}`);
    if (!/\.(png|jpe?g)$/i.test(name)) fail(`screenshot is not PNG or JPEG: ${name}`);
    if (size > caps.screenshots.max_bytes) fail(`screenshot over 256 KiB: ${name} (${size} bytes)`);
    bytes += size;
  }
  return { files, bytes };
}

function validateMirroredDirectory(source: string, target: string, label: string): void {
  if (!existsSync(target) || !lstatSync(target).isDirectory()) fail(`output ${label}/ is missing`);
  const sourceEntries = walk(source);
  const targetEntries = walk(target);
  const sourcePaths = new Set(sourceEntries.map((entry) => relative(source, entry.path).replaceAll('\\', '/')));
  const targetPaths = new Set(targetEntries.map((entry) => relative(target, entry.path).replaceAll('\\', '/')));
  if (sourcePaths.size !== targetPaths.size || [...sourcePaths].some((path) => !targetPaths.has(path))) {
    fail(`output ${label}/ does not mirror its source tree`);
  }
  for (const entry of sourceEntries) {
    if (entry.bytes === 0) continue;
    const rel = relative(source, entry.path);
    const copied = lstatSync(join(target, rel));
    if (!copied.isFile() || copied.size !== entry.bytes) fail(`output ${label}/${rel} has the wrong size`);
  }
}

function validateOutputContents(dossier: Uint8Array, manifest: PackageManifest): void {
  validateMirroredDirectory(game, join(out, 'game'), 'game');
  validateMirroredDirectory(shots, join(out, 'screenshots'), 'screenshots');
  const dossierPath = join(out, 'dossier.json');
  const manifestPath = join(out, manifestName);
  const dossierStat = lstatSync(dossierPath);
  const manifestStat = lstatSync(manifestPath);
  if (!dossierStat.isFile() || dossierStat.size !== dossier.byteLength) fail('output dossier.json does not match the generated dossier');
  if (!manifestStat.isFile()) fail(`output ${manifestName} is not a regular file`);
  const parsed = JSON.parse(readFileSync(dossierPath, 'utf8')) as { schema?: unknown; text?: unknown };
  if (parsed.schema !== 'makefun/dossier/v1' || typeof parsed.text !== 'string') fail('output dossier.json has an invalid dossier shape');
  const manifestOnDisk = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest;
  if (manifestOnDisk.schema !== manifest.schema || manifestOnDisk.output.dossier_bytes !== dossier.byteLength) {
    fail(`output ${manifestName} does not match the package summary`);
  }
}

for (const p of ['LICENSE', 'vendor/makefun-game.ts', 'game/', 'game/index.html']) if (!existsSync(join(here, p))) fail(`${p} is missing`);
const index = join(game, 'index.html');
const indexStat = statSync(index);
if (!indexStat.isFile()) fail('game/index.html is not a regular file');
if (indexStat.size > 1024 * 1024) fail('game/index.html exceeds 1 MiB');
const harborGuideSummary = validateHarborGuideAsset();

const tree = walk(game);
if (tree.length > caps.game_max_files) fail(`game/ has ${tree.length} entries, over the ${caps.game_max_files} cap`);
const gameBytes = tree.reduce((n, e) => n + e.bytes, 0);
if (gameBytes > caps.game_max_bytes) fail(`game/ is ${gameBytes} bytes, over the ${caps.game_max_bytes} cap`);
for (const e of tree) {
  const rel = relative(game, e.path);
  if (Buffer.byteLength(rel.replaceAll('\\', '/'), 'utf8') > caps.game_path_max_bytes) fail(`game path over ${caps.game_path_max_bytes} bytes: ${rel}`);
}

const screenshotSummary = validateScreenshots();

for (const p of ['game', 'screenshots', 'dossier.json', manifestName]) rmSync(join(out, p), { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(game, join(out, 'game'), { recursive: true });
cpSync(shots, join(out, 'screenshots'), { recursive: true });
const dossier = buildDossier(out, caps);
writeFileSync(join(out, 'dossier.json'), dossier);
const textBytes = Buffer.byteLength(JSON.parse(Buffer.from(dossier).toString('utf8')).text, 'utf8');
const manifest: PackageManifest = {
  schema: 'makefun/package-manifest/v1',
  package: 'high-tide',
  title: 'High Tide: Storm Shift',
  entry: 'game/index.html',
  summary: 'Offline coastal crime game with a field-ready Harbor Guide.',
  game: { entries: tree.length, bytes: gameBytes, harbor_guide: harborGuideSummary },
  screenshots: screenshotSummary,
  output: {
    entries: ['game/', 'screenshots/', 'dossier.json', manifestName],
    dossier_bytes: dossier.byteLength,
    dossier_text_bytes: textBytes,
  },
};
writeFileSync(join(out, manifestName), `${JSON.stringify(manifest, null, 2)}\n`);
validateOutputContents(dossier, manifest);

console.log(`high-tide: packaged ${tree.length} game entries (${gameBytes} bytes), ${screenshotSummary.files.length} screenshots (${screenshotSummary.bytes} bytes)`);
console.log(`high-tide: dossier text ${textBytes}/${caps.text_max_bytes} bytes, file ${dossier.byteLength} bytes -> ${join(out, 'dossier.json')}`);
console.log(`high-tide: package manifest -> ${join(out, manifestName)}`);
