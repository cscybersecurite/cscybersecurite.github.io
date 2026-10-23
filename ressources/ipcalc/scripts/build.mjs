import { cp, mkdir, rm, readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = resolve(root, 'dist');
const assets = ['index.html', 'styles.css', 'print.css', 'professional-report.css', 'manifest.webmanifest', 'sw.js', 'js', 'icons'];
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const sw = await readFile(resolve(root, 'sw.js'), 'utf8');
if (!sw.includes(`const VERSION = '${pkg.version}';`)) throw new Error('La version du cache doit correspondre à celle de package.json.');
for (const icon of ['icon-192.png', 'icon-512.png', 'maskable-512.png']) await access(resolve(root, 'icons', icon), constants.R_OK);
await rm(destination, { recursive: true, force: true });
await mkdir(destination);
for (const asset of assets) await cp(resolve(root, asset), resolve(destination, asset), { recursive: true });
await readFile(resolve(destination, 'index.html'));
console.log(`IPcalc ${pkg.version} : ressources statiques prêtes dans dist/`);
