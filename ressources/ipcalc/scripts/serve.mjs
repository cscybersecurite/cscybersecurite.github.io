import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, extname, relative, isAbsolute } from 'node:path';

// Le même serveur est utilisé pour les ressources sources et le dossier dist.
const root = await realpath(resolve(process.argv[2] ?? '.'));
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? '0.0.0.0';
const basePath = process.env.BASE_PATH ?? '/';
if (!basePath.startsWith('/') || !basePath.endsWith('/')) throw new Error('BASE_PATH doit commencer et finir par /.');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const originalPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    if (!originalPath.startsWith(basePath)) throw new Error('Outside base path');
    const pathname = originalPath.slice(basePath.length - 1);
    if (pathname.split('/').some(part => part.startsWith('.'))) throw new Error('Hidden path');
    const candidate = resolve(root, `.${pathname}`, pathname.endsWith('/') ? 'index.html' : '');
    const path = await realpath(candidate);
    const rel = relative(root, path);
    if (rel.startsWith('..') || isAbsolute(rel) || !(await stat(path)).isFile()) throw new Error('Invalid path');
    const content = await readFile(path);
    response.writeHead(200, {
      'Content-Type': types[extname(path)] ?? 'application/octet-stream',
      'Content-Length': content.length,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Ressource introuvable.');
  }
});

server.listen(port, host, () => console.log(`IPcalc : port ${port}, dossier ${root}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
