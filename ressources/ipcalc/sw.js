// Incrémenter VERSION à chaque livraison modifiant une ressource de l’application.
const VERSION = '2.0.0-step3.32';
const CACHE_PREFIX = `ipcalc:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const ASSETS = [
  './', './index.html', './styles.css', './print.css', './professional-report.css', './manifest.webmanifest',
  './js/address-classification.js', './js/vlsm.js', './js/ipv6.js', './js/pdf-a4.js', './js/pdf-a3-flsm.js', './js/ipv4.js', './js/exports.js', './js/app.js', './js/pwa.js', './js/report-profiles.js', './js/professional-flsm.js', './js/professional-ipv4.js', './js/professional-ipv6.js', './js/professional-ipv6-subnets.js', './js/professional-vlsm.js',
  './icons/ipcalc-subnets.svg', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png',
];
const assetURLs = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));

// Précharger atomiquement tous les fichiers de la version, sans réutiliser
// le cache HTTP du navigateur. Une installation incomplète ne remplace pas l'ancienne.
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS.map(path => new Request(new URL(path, self.registration.scope), { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const previous=names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME);
    await Promise.all(previous.map(name => caches.delete(name)));
    await self.clients.claim();
    // Pont de migration depuis les anciennes versions : leur pwa.js ne savait
    // pas toujours rafraîchir après une activation automatique.
    if(previous.length){
      const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
      await Promise.all(windows.filter(client=>client.url.startsWith(self.registration.scope))
        .map(client=>client.navigate(client.url).catch(()=>{})));
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  const cleanURL = new URL(url);
  cleanURL.search = '';
  if (!assetURLs.has(cleanURL.href)) return;
  // Le cache représente une version cohérente. Une nouvelle version est
  // entièrement préparée à l’installation et activée après choix de l’utilisateur.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(cleanURL.href);
    return response ?? fetch(request);
  })());
});
