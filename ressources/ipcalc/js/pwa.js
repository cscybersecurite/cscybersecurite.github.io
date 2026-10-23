/** Installation et mise à jour cohérente de l'interface IPv4/IPv6 hors connexion. */
const $ = id => document.getElementById(id);
let registration;
let installPrompt;
let readyOffline = false;
let refreshing = false;

function updateConnection() {
  $('connection-status').dataset.offline = String(!navigator.onLine);
  $('connection-label').textContent = !navigator.onLine ? 'Hors connexion' : readyOffline ? 'Prêt hors connexion' : 'Calcul local';
}

function message(text) {
  $('pwa-message').textContent = text;
  $('pwa-message').hidden = false;
}

function offerUpdate() {
  if (registration?.waiting && navigator.serviceWorker.controller) $('update-banner').hidden = false;
}

window.addEventListener('offline', updateConnection);
window.addEventListener('online', () => {
  updateConnection();
  registration?.update().catch(() => {});
});

// Vérifier les mises à jour lors du retour à l'onglet ou à l'application.
window.addEventListener('pageshow', () => {
  if(navigator.onLine) registration?.update().catch(() => {});
});
document.addEventListener('visibilitychange', () => {
  if(!document.hidden && navigator.onLine) registration?.update().catch(() => {});
});

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  $('install-app').hidden = false;
});

$('install-app').addEventListener('click', async () => {
  if (!installPrompt) return;
  try {
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') message('IPcalc a été ajouté à votre appareil.');
  } finally {
    installPrompt = null;
    $('install-app').hidden = true;
  }
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  $('install-app').hidden = true;
  message('IPcalc est installé. Vos calculs sont disponibles hors connexion.');
});

$('apply-update').addEventListener('click', () => {
  registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
});

if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
  navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), { updateViaCache: 'none' }).then(async registered => {
    registration = registered;
    offerUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed') offerUpdate();
      });
    });
    await navigator.serviceWorker.ready;
    readyOffline = true;
    updateConnection();
    // Le cache devient disponible seulement après l’installation complète.
    if (navigator.onLine) registration.update().catch(() => {});
  }).catch(() => {
    message('Les calculs fonctionnent, mais le cache hors connexion n’a pas pu être préparé. Rouvrez IPcalc en ligne pour réessayer.');
  });
}

updateConnection();
