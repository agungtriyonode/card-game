// Emberfall — a tiny static file server for local play (Node 22, stdlib only).
// Serves game/ on http://localhost:8080 so the game can be opened in desktop
// Chrome exactly as a static host would serve it. Development convenience
// only: it sends a few MIME types, refuses paths outside game/, nothing more.
//
//   node serve.ts [--port 8080]
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const args = process.argv.slice(2);
const portFlag = args.indexOf('--port');
const wanted = portFlag === -1 ? 8080 : Number(args[portFlag + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

createServer((req, res) => {
  const raw = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const target = resolve(join(root, normalize(raw).replace(/^(\.\.[/\\])+/, '')));
  if (target !== root && !target.startsWith(root + sep)) {
    res.writeHead(403);
    res.end('outside game/');
    return;
  }
  const file = target === root ? join(root, 'index.html') : target;
  let info;
  try {
    info = statSync(file);
  } catch {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  if (!info.isFile()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`emberfall: serving game/ at http://localhost:${port}`);
});
