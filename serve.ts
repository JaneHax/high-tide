// serve.ts — a small local static server for play-testing High Tide.
// Serves game/ at http://localhost:8080 (or $PORT).
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const port = Number(process.env.PORT || 8080);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url || '/', 'http://x').pathname).replace(/^\/+/, '');
  if (path === 'favicon.ico') { res.writeHead(204); res.end(); return; }
  const file = join(root, path === '' ? 'index.html' : path);
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404); res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
server.listen(port, () => console.log(`High Tide at http://localhost:${port}/`));
