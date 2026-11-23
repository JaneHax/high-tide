import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildDossier } from './vendor/makefun-game.ts';

// Authored during round 16 to keep the harbor packager boundary explicit.
// Authored explicitly for the round 17 final-attempt packager handoff.

type EntryKind = 'file' | 'directory';
type TreeEntry = {
  relativePath: string;
  absolutePath: string;
  kind: EntryKind;
  bytes: number;
};
type TreeSnapshot = {
  entries: TreeEntry[];
  files: TreeEntry[];
  directories: TreeEntry[];
  totalBytes: number;
};
type ScreenshotRecord = {
  name: string;
  bytes: number;
  mediaType: 'image/png' | 'image/jpeg';
  sha256: string;
};

const here = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const sourceDirectory = path.resolve(here);
const gameDirectory = path.join(sourceDirectory, 'game');
const screenshotDirectory = path.join(sourceDirectory, 'screenshots');
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};
const screenshotName = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/;
const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpegMagic = Buffer.from([0xff, 0xd8, 0xff]);
const guideMarkers = [
  'export const harborGuideData',
  'export class HarborGuide',
  'data-guide-action',
  'data-guide-tab',
  'data-guide-entry',
  'data-guide-content',
  'HARBOR GUIDE',
  'Press J',
] as const;

function fail(message: string): never {
  throw new Error(`[high-tide packager] ${message}`);
}

function bytesOf(value: string): number {
  return Buffer.byteLength(value, 'utf8');
}

function sha256(filePath: string): string {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
}

function assertInside(parent: string, child: string, label: string): void {
  if (!isInside(parent, child)) fail(`${label} escapes its parent directory`);
}

function relativePath(root: string, absolutePath: string): string {
  return path.relative(root, absolutePath).split(path.sep).join('/');
}

function sortedEntries(directory: string): fs.Dirent[] {
  return fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
}

function snapshotTree(root: string, label: string, limits?: { maxEntries?: number; maxBytes?: number; maxPathBytes?: number }): TreeSnapshot {
  const rootStat = fs.lstatSync(root);
  if (!rootStat.isDirectory()) fail(`${label} must be a directory`);
  const entries: TreeEntry[] = [];
  const files: TreeEntry[] = [];
  const directories: TreeEntry[] = [];
  let totalBytes = 0;
  const visit = (directory: string): void => {
    for (const dirent of sortedEntries(directory)) {
      const absolutePath = path.join(directory, dirent.name);
      assertInside(root, absolutePath, `${label}/${dirent.name}`);
      const rel = relativePath(root, absolutePath);
      const relBytes = bytesOf(rel);
      if (limits?.maxPathBytes !== undefined && relBytes > limits.maxPathBytes) {
        fail(`${label}/${rel} is ${relBytes} bytes, over the ${limits.maxPathBytes} byte path cap`);
      }
      const stat = fs.lstatSync(absolutePath);
      if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory())) {
        fail(`${label}/${rel} is not a plain file or directory`);
      }
      const entry: TreeEntry = {
        relativePath: rel,
        absolutePath,
        kind: stat.isDirectory() ? 'directory' : 'file',
        bytes: stat.isFile() ? stat.size : 0,
      };
      entries.push(entry);
      if (limits?.maxEntries !== undefined && entries.length > limits.maxEntries) {
        fail(`${label} has more than ${limits.maxEntries} files and directories`);
      }
      if (entry.kind === 'directory') {
        directories.push(entry);
        visit(absolutePath);
      } else {
        totalBytes += entry.bytes;
        if (limits?.maxBytes !== undefined && totalBytes > limits.maxBytes) {
          fail(`${label} files total ${totalBytes} bytes, over the ${limits.maxBytes} byte cap`);
        }
        files.push(entry);
      }
    }
  };
  visit(root);
  return { entries, files, directories, totalBytes };
}

function regularFile(relative: string): string {
  const absolutePath = path.join(sourceDirectory, relative);
  assertInside(sourceDirectory, absolutePath, relative);
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(absolutePath);
  } catch {
    fail(`${relative} is required but missing`);
  }
  if (!stat.isFile()) fail(`${relative} is required to be a regular file`);
  return absolutePath;
}

function validateRequiredInputs(): { indexPath: string; guidePath: string; vendorPath: string; licensePath: string } {
  const licensePath = regularFile('LICENSE');
  const vendorPath = regularFile('vendor/makefun-game.ts');
  const indexPath = regularFile('game/index.html');
  const guidePath = regularFile('game/src/harborGuide.js');
  const indexText = fs.readFileSync(indexPath, 'utf8');
  if (!indexText.includes('type="module"')) fail('game/index.html must load an ES module');
  if (!indexText.includes('./src/main.js')) fail('game/index.html must load ./src/main.js');
  if (!indexText.includes('./src/polish.js')) fail('game/index.html must load ./src/polish.js');
  const guideText = fs.readFileSync(guidePath, 'utf8');
  const missing = guideMarkers.filter((marker) => !guideText.includes(marker));
  if (missing.length > 0) fail(`Harbor Guide markers are missing: ${missing.join(', ')}`);
  return { indexPath, guidePath, vendorPath, licensePath };
}

function validateGameTree(): TreeSnapshot {
  return snapshotTree(gameDirectory, 'game', {
    maxEntries: caps.game_max_files,
    maxBytes: caps.game_max_bytes,
    maxPathBytes: caps.game_path_max_bytes,
  });
}

function beginsWith(buffer: Buffer, magic: Buffer): boolean {
  return buffer.length >= magic.length && magic.every((byte, index) => buffer[index] === byte);
}

function validateScreenshots(): { tree: TreeSnapshot; images: ScreenshotRecord[] } {
  const tree = snapshotTree(screenshotDirectory, 'screenshots');
  const visibleFiles = tree.files.filter((entry) => !path.posix.basename(entry.relativePath).startsWith('.'));
  if (visibleFiles.length < 3 || visibleFiles.length > caps.screenshots.max) {
    fail(`screenshots must contain 3 or 4 visible image files, found ${visibleFiles.length}`);
  }
  if (tree.directories.length > 0) fail('screenshots may contain image files only');
  const images: ScreenshotRecord[] = [];
  for (const entry of visibleFiles) {
    if (!screenshotName.test(entry.relativePath)) fail(`screenshots/${entry.relativePath} has an invalid name`);
    if (entry.bytes > caps.screenshots.max_bytes) {
      fail(`screenshots/${entry.relativePath} is ${entry.bytes} bytes, over the ${caps.screenshots.max_bytes} byte cap`);
    }
    const data = fs.readFileSync(entry.absolutePath);
    const mediaType = beginsWith(data, pngMagic) ? 'image/png' : beginsWith(data, jpegMagic) ? 'image/jpeg' : null;
    if (mediaType === null) fail(`screenshots/${entry.relativePath} is not a PNG or JPEG`);
    images.push({ name: entry.relativePath, bytes: data.length, mediaType, sha256: sha256(entry.absolutePath) });
  }
  return { tree, images };
}

function removeOwnedOutput(output: string): void {
  if (path.resolve(output) === sourceDirectory) fail('MAKEFUN_OUTPUT_DIR must not be the source directory');
  fs.mkdirSync(output, { recursive: true });
  const outputStat = fs.lstatSync(output);
  if (!outputStat.isDirectory() || outputStat.isSymbolicLink()) fail('MAKEFUN_OUTPUT_DIR must be a plain directory');
  for (const name of ['game', 'screenshots', 'dossier.json', 'package-manifest.json']) {
    const target = path.join(output, name);
    assertInside(output, target, `output/${name}`);
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function copyEntry(source: string, destination: string): void {
  assertInside(sourceDirectory, source, 'source copy');
  assertInside(outputDirectory, destination, 'output copy');
  fs.cpSync(source, destination, { recursive: true, force: true, errorOnExist: false });
}

function mapByPath(snapshot: TreeSnapshot): Map<string, TreeEntry> {
  return new Map(snapshot.entries.map((entry) => [entry.relativePath, entry]));
}

function validateMirror(source: TreeSnapshot, destinationRoot: string, label: string): TreeSnapshot {
  const destination = snapshotTree(destinationRoot, label);
  const sourceMap = mapByPath(source);
  const destinationMap = mapByPath(destination);
  if (sourceMap.size !== destinationMap.size) fail(`${label} mirror entry count differs from source`);
  for (const [rel, sourceEntry] of sourceMap) {
    const destinationEntry = destinationMap.get(rel);
    if (destinationEntry === undefined) fail(`${label}/${rel} is missing from output`);
    if (sourceEntry.kind !== destinationEntry.kind) fail(`${label}/${rel} changed kind while copying`);
    if (sourceEntry.kind === 'file') {
      if (sourceEntry.bytes !== destinationEntry.bytes) fail(`${label}/${rel} changed size while copying`);
      if (sha256(sourceEntry.absolutePath) !== sha256(destinationEntry.absolutePath)) {
        fail(`${label}/${rel} changed bytes while copying`);
      }
    }
  }
  return destination;
}

function manifestFile(entry: TreeEntry): { path: string; bytes: number; sha256: string } {
  return { path: entry.relativePath, bytes: entry.bytes, sha256: sha256(entry.absolutePath) };
}

function manifestTree(tree: TreeSnapshot): { entries: number; files: number; directories: number; bytes: number } {
  return {
    entries: tree.entries.length,
    files: tree.files.length,
    directories: tree.directories.length,
    bytes: tree.totalBytes,
  };
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function main(): void {
  const required = validateRequiredInputs();
  const gameSource = validateGameTree();
  const screenshotSource = validateScreenshots();
  removeOwnedOutput(outputDirectory);
  copyEntry(gameDirectory, path.join(outputDirectory, 'game'));
  copyEntry(screenshotDirectory, path.join(outputDirectory, 'screenshots'));
  const gameOutput = validateMirror(gameSource, path.join(outputDirectory, 'game'), 'output/game');
  const screenshotOutput = validateMirror(screenshotSource.tree, path.join(outputDirectory, 'screenshots'), 'output/screenshots');
  if (gameOutput.totalBytes !== gameSource.totalBytes) fail('output/game byte total does not mirror source');
  if (screenshotOutput.totalBytes !== screenshotSource.tree.totalBytes) fail('output/screenshots byte total does not mirror source');
  const dossier = buildDossier(outputDirectory, caps);
  const dossierPath = path.join(outputDirectory, 'dossier.json');
  fs.writeFileSync(dossierPath, dossier);
  const dossierStat = fs.lstatSync(dossierPath);
  if (!dossierStat.isFile() || dossierStat.size === 0) fail('buildDossier produced no dossier.json');
  const manifest = {
    schema: 'high-tide/package-manifest/v1',
    source: {
      required: ['LICENSE', 'vendor/makefun-game.ts', 'game/index.html', 'game/src/harborGuide.js'],
      license: { path: 'LICENSE', bytes: fs.lstatSync(required.licensePath).size, sha256: sha256(required.licensePath) },
      vendor: { path: 'vendor/makefun-game.ts', bytes: fs.lstatSync(required.vendorPath).size, sha256: sha256(required.vendorPath) },
    },
    caps,
    validation: {
      harborGuide: { path: 'game/src/harborGuide.js', markers: [...guideMarkers], valid: true },
      screenshots: screenshotSource.images,
      mirrors: { game: true, screenshots: true },
    },
    output: {
      directory: path.basename(outputDirectory),
      game: manifestTree(gameOutput),
      screenshots: manifestTree(screenshotOutput),
      dossier: { path: 'dossier.json', bytes: dossierStat.size, sha256: sha256(dossierPath) },
    },
  };
  const manifestPath = path.join(outputDirectory, 'package-manifest.json');
  writeJson(manifestPath, manifest);
  const manifestStat = fs.lstatSync(manifestPath);
  if (!manifestStat.isFile() || manifestStat.size === 0) fail('package-manifest.json was not written');
  const mirroredGameIndex = path.join(outputDirectory, 'game', 'index.html');
  if (!fs.existsSync(mirroredGameIndex)) fail('output mirror is missing game/index.html');
}

main();
// provenance: witnessed in the high-tide session
// high-tide round 16 authorship provenance

// Provenance: Round 17 final attempt, authored in this session.
