import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.__appErrors = errors;
  await page.goto('./');
});

test.afterEach(async ({ page }) => {
  expect(page.__appErrors).toEqual([]);
});

async function subdivide(page, { address = '192.168.10.75/24', method = 'count', count = '10', hosts = '30' } = {}) {
  await page.getByLabel('Adresse IP', { exact: true }).fill(address);
  await page.getByRole('radio', { name: 'FLSM', exact: true }).check();
  await page.getByLabel('Méthode de découpage FLSM').selectOption(method);
  if (method !== 'hosts') await page.getByLabel('Sous-réseaux demandés', { exact: true }).fill(count);
  if (method !== 'count') await page.getByLabel('Hôtes utilisables minimum').fill(hosts);
  await page.getByRole('button', { name: 'Calculer le réseau' }).click();
}

test('réseau simple, cinq champs exacts et normalisation de l’hôte', async ({ page }) => {
  const summary = page.locator('#network-result');
  await expect(summary.locator('dd')).toHaveText(['192.168.10.64', '255.255.255.192', '/26', '192.168.10.127', '62']);
  await expect(summary).not.toContainText('appartient au réseau');
  await expect(page.locator('.binary')).toHaveCount(0);
  await expect(page.locator('#subnet-result')).toBeHidden();
});

test('adresse et masque invalides : erreur annoncée, champ ciblé, résultats masqués', async ({ page }) => {
  await page.getByLabel('Adresse IP', { exact: true }).fill('256.1.2.3/24');
  await page.getByRole('button', { name: 'Calculer le réseau' }).click();
  await expect(page.getByRole('alert')).toContainText('0 et 255');
  await expect(page.getByLabel('Adresse IP', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#results')).toBeHidden();
  await page.getByLabel('Adresse IP', { exact: true }).fill('192.168.1.1');
  await page.getByLabel('Masque ou préfixe').fill('255.0.255.0');
  await page.getByRole('button', { name: 'Calculer le réseau' }).click();
  await expect(page.getByRole('alert')).toContainText('contigu');
  await page.getByLabel('Masque ou préfixe').fill('255.255.255.0');
  await page.getByRole('button', { name: 'Calculer le réseau' }).click();
  await expect(page.locator('#network-result dd').first()).toHaveText('192.168.1.0');
});

test('dix sous-réseaux demandés : règle papier exacte et capacité distincte', async ({ page }) => {
  await subdivide(page);
  await expect(page.locator('#subnet-result h3')).toHaveText('10 sous-réseaux demandés');
  await expect(page.locator('#subnet-result')).toContainText('Capacité totale 16');
  const numbers = await page.locator('#subnet-result tr[data-subnet-number]').evaluateAll(rows => rows.map(row => row.dataset.subnetNumber));
  expect(numbers).toEqual(['0', '1', '2', '7', '8', '9']);
  await expect(page.locator('.ellipsis-row')).toContainText('4 sous-réseaux intermédiaires');
  await page.locator('#middle-details > summary').click();
  await expect(page.locator('#middle-details tr[data-subnet-number]')).toHaveCount(4);
  await expect(page.locator('#middle-details tr[data-subnet-number]').first()).toHaveAttribute('data-subnet-number', '3');
  await page.locator('#extra-details > summary').click();
  await expect(page.locator('#extra-details tr[data-subnet-number]').first()).toHaveAttribute('data-subnet-number', '10');
});

test('méthodes hôtes et combinée, puis contrainte impossible', async ({ page }) => {
  await subdivide(page, { method: 'hosts', hosts: '30' });
  await expect(page.locator('#subnet-result h3')).toHaveText('8 sous-réseaux possibles');
  await expect(page.locator('#subnet-result')).toContainText('Préfixe /27');
  await expect(page.locator('#extra-details')).toHaveCount(0);
  await subdivide(page, { method: 'combined', count: '3', hosts: '50' });
  await expect(page.locator('#subnet-result h3')).toHaveText('3 sous-réseaux demandés');
  await expect(page.locator('#subnet-result tr[data-subnet-number]')).toHaveCount(3);
  await subdivide(page, { method: 'combined', count: '5', hosts: '50' });
  await expect(page.getByRole('alert')).toContainText('réseau initial plus grand');
  await expect(page.getByRole('alert')).toContainText('moins de sous-réseaux');
});

test('grand /0 : six lignes et pagination bornée', async ({ page }) => {
  await subdivide(page, { address: '0.0.0.0/0', method: 'hosts', hosts: '2' });
  await expect(page.locator('#subnet-result tr[data-subnet-number]')).toHaveCount(6);
  await expect(page.locator('#subnet-result tr[data-subnet-number]').last()).toContainText('255.255.255.254');
  await page.locator('#middle-details > summary').click();
  await expect(page.locator('#middle-details tr[data-subnet-number]')).toHaveCount(50);
  await page.getByRole('button', { name: 'Suivants : sous-réseaux intermédiaires' }).click();
  await expect(page.locator('#middle-details tr[data-subnet-number]').first()).toHaveAttribute('data-subnet-number', '53');

});

test('la case binaire a disparu de l’interface', async ({ page }) => {
  await expect(page.locator('#show-binary, .binary-toggle')).toHaveCount(0);
  await expect(page.locator('.binary')).toHaveCount(0);
});

test('protection des résultats devenus obsolètes sans ancienne interface d’export', async ({ page }) => {
  await expect(page.locator('#copy-results, #export-csv, #export-scope, .export-panel')).toHaveCount(0);
  await page.getByLabel('Adresse IP', { exact: true }).fill('10.1.2.3/8');
  await expect(page.locator('#stale-notice')).toBeVisible();
  await expect(page.locator('#network-result')).toBeEmpty();
  await expect(page.locator('#subnet-result')).toBeEmpty();
  await expect(page.locator('#network-result')).toBeEmpty();
  await page.getByRole('button', { name: 'Calculer le réseau' }).click();
  await expect(page.locator('#network-result')).toContainText('10.0.0.0');
});

test.describe('PWA réelle', () => {
  test.use({ serviceWorkers: 'allow' });
  test('première visite en ligne puis nouveau lancement hors connexion', async ({ page, context }) => {
  await expect(page.locator('#connection-label')).toHaveText('Prêt hors connexion');
  // Un premier contrôle du service worker peut provoquer une navigation automatique.
  // Chaque sondage est indépendant : aucun evaluate long n'est détruit pendant le reload.
  await expect.poll(async () => {
    try {
      return await page.evaluate(() => !!navigator.serviceWorker.controller);
    } catch {
      return false;
    }
  }, { timeout: 20000 }).toBe(true);
  await expect(page.locator('#connection-label')).toHaveText('Prêt hors connexion');
  const manifest = await page.evaluate(async () => {
    const response = await fetch('./manifest.webmanifest');
    return response.json();
  });
  expect(manifest.display).toBe('standalone');
  expect(manifest.scope).toBe('./');
  expect(manifest.icons.filter(icon => icon.type === 'image/png')).toHaveLength(3);
  await context.setOffline(true);
  const offline = await context.newPage();
  // Chromium récent sépare le blocage des requêtes et l’état réseau du
  // renderer. Les deux sont coupés, sans simuler navigator.onLine en JS.
  const session = await context.newCDPSession(offline);
  await session.send('Network.enable');
  const errors = [];
  offline.on('pageerror', error => errors.push(error.message));
  await offline.goto('./');
  // La nouvelle navigation peut réinitialiser l’indicateur du renderer,
  // tandis que le blocage réel des requêtes est déjà actif dans le contexte.
  await session.send('Network.overrideNetworkState', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await expect(offline.locator('#connection-label')).toHaveText('Hors connexion');
  expect(await offline.evaluate(async () => {
    try { await fetch('./offline-network-probe'); return false; } catch { return true; }
  })).toBe(true);
  await offline.getByLabel('Adresse IP', { exact: true }).fill('10.0.0.1/31');
  await offline.getByRole('button', { name: 'Calculer le réseau' }).click();
  await expect(offline.locator('#network-result dd')).toHaveText(['10.0.0.0', '255.255.255.254', '/31', 'Sans broadcast', '2']);
  await subdivide(offline, { method: 'combined', count: '3', hosts: '50' });
  await expect(offline.locator('#subnet-result h3')).toHaveText('3 sous-réseaux demandés');
  expect(errors).toEqual([]);
  await offline.close();
});
});

test('ressources locales, thème automatique, portrait / paysage sans débordement', async ({ page }) => {
  const external = [];
  page.on('request', request => {
    if (new URL(request.url()).hostname !== '127.0.0.1') external.push(request.url());
  });
  await page.reload();
  await subdivide(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(21, 29, 27)');
  await page.emulateMedia({ colorScheme: 'light' });
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(245, 246, 242)');
  await page.setViewportSize({ width: 320, height: 640 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(external).toEqual([]);
});


test('modes disponibles, emplacements futurs et disposition verticale', async ({ page }) => {
  await expect(page.getByRole('radio', { name: 'VLSM', exact: true })).toBeEnabled();
  await expect(page.locator('#protocol option[value="ipv6"]')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Télécharger une fiche pédagogique PDF' })).toBeEnabled();
  await expect(page.locator('.intro')).toHaveCount(0);
  const input = await page.locator('.input-panel').boundingBox();
  const results = await page.locator('#results').boundingBox();
  expect(results.y).toBeGreaterThanOrEqual(input.y + input.height);
  expect(Math.abs(results.width - input.width)).toBeLessThan(2);
  await subdivide(page);
  await page.getByRole('radio', { name: 'Aucun découpage', exact: true }).check();
  await expect(page.locator('#subnet-settings')).toBeHidden();
  await expect(page.locator('#network-result')).toBeEmpty();
  await expect(page.locator('#subnet-result')).toBeEmpty();
  await page.getByRole('button', { name: 'Calculer le réseau' }).click();
  await expect(page.locator('#network-result dd')).toHaveCount(5);
  await expect(page.locator('#subnet-result')).toBeHidden();
});

test('chaque paramètre invalide immédiatement le résultat', async ({ page }) => {
  for (const parameter of ['address', 'mask', 'method', 'count', 'hosts']) {
    await subdivide(page, { method: 'combined', count: '3', hosts: '50' });
    if (parameter === 'method') await page.locator('#method').selectOption('hosts');
    else await page.locator(`#${parameter}`).fill({ address: '10.0.0.1/24', mask: '/24', count: '2', hosts: '20' }[parameter]);
    await expect(page.locator('#network-result')).toBeEmpty();
    await expect(page.locator('#subnet-result')).toBeEmpty();
    await expect(page.locator('#result-announcement')).toBeEmpty();
    await page.locator('#mask').fill('');
  }
});

test('modifier un calcul avec pagination ouverte ne conserve aucun sous-réseau', async ({ page }) => {
  await subdivide(page);
  await page.locator('#middle-details > summary').click();
  await page.locator('#extra-details > summary').click();
  // Mémoriser les accordéons pour simuler des événements arrivant après leur retrait.
  await page.evaluate(() => {
    window.__staleDetails = [
      document.querySelector('#middle-details'),
      document.querySelector('#extra-details'),
    ];
  });
  await page.getByLabel('Adresse IP', { exact: true }).fill('10.0.0.0/16');
  await page.evaluate(() => {
    window.__staleDetails.forEach(details => details.dispatchEvent(new Event('toggle')));
    delete window.__staleDetails;
  });
  await expect(page.locator('#subnet-result')).toBeEmpty();
  await expect(page.locator('#network-result')).toBeEmpty();
  await page.getByRole('button', { name: 'Calculer le réseau' }).click();
  await expect(page.locator('#network-result')).toContainText('10.0.0.0');
  await expect(page.locator('#middle-details')).not.toHaveAttribute('open');
  await expect(page.locator('#extra-details')).not.toHaveAttribute('open');
});

test('bouton au-dessus de l’adresse, en-têtes alignés et navigation clavier', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Calculer le réseau' });
  const address = page.getByLabel('Adresse IP', { exact: true });
  const initialButton = await button.boundingBox();
  const field = await address.boundingBox();
  expect(initialButton.y + initialButton.height).toBeLessThan(field.y);
  expect(Math.abs(initialButton.x - field.x)).toBeLessThan(1);
  // Le bouton reste suffisamment large pour son libellé, sans imposer
  // un ratio fixe lorsque l'affichage mobile inclut le bouton d'impression.
  expect(initialButton.width).toBeGreaterThan(180);
  expect(initialButton.width).toBeLessThanOrEqual(field.width);
  expect(initialButton.height).toBeLessThanOrEqual(44);
  const inputHeading = await page.locator('.panel-heading .step-number').boundingBox();
  const resultHeading = await page.locator('.results-heading .step-number').boundingBox();
  expect(inputHeading.x).toBe(resultHeading.x);
  expect(inputHeading.width).toBe(resultHeading.width);
  expect(inputHeading.height).toBe(resultHeading.height);
  await expect(page.locator('.results-primary > .results-heading')).toBeVisible();
  await button.focus();
  await expect(button).toBeFocused();
  // La touche Tab traverse le bouton d'impression, puis le sélecteur de protocole.
  // On ne suppose pas un nombre fixe d'étapes entre les contrôles.
  for (let i = 0; i < 6 && !(await address.evaluate(el => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(address).toBeFocused();
  await address.fill('10.0.0.1/24');
  await address.press('Enter');
  await expect(page.locator('#network-result dd').first()).toHaveText('10.0.0.0');
  await expect(page.locator('#result-title')).toBeFocused();
  await page.getByRole('radio', { name: 'Aucun découpage', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'FLSM', exact: true })).toBeChecked();
  await expect(page.locator('#network-result')).toBeEmpty();
  // Comparer les coordonnées du document malgré le défilement clavier mobile.
  const position = await button.evaluate(node => ({ x: node.getBoundingClientRect().x + scrollX, y: node.getBoundingClientRect().y + scrollY }));
  expect(position.x).toBe(initialButton.x);
  expect(position.y).toBe(initialButton.y);
  await address.press('Enter');
  await expect(page.locator('#result-title')).toHaveText('Votre découpage FLSM');
  await expect(page.locator('.help-panel, .site-footer')).toHaveCount(0);
  await expect(page.locator('.version')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Logo IPcalc', exact: true })).toBeVisible();
});

test('numérotation à zéro : huit réseaux, intermédiaires et tous les réseaux', async ({ page }) => {
  await subdivide(page, { count: '8' });
  const rows = page.locator('#subnet-result tr[data-subnet-number]');
  await expect(rows.locator('td:first-child')).toHaveText(['0', '1', '2', '5', '6', '7']);
  await expect(rows.first().locator('td').nth(1)).toHaveText('192.168.10.0');
  await expect(rows.last().locator('td').nth(1)).toHaveText('192.168.10.224');
  await page.locator('#middle-details > summary').click();
  await expect(page.locator('#middle-details tr[data-subnet-number] td:first-child')).toHaveText(['3', '4']);
  await subdivide(page, { count: '4' });
  await expect(rows.locator('td:first-child')).toHaveText(['0', '1', '2', '3']);
  await expect(rows.last().locator('td').nth(1)).toHaveText('192.168.10.192');
  await subdivide(page, { count: '1' });
  await expect(rows.locator('td:first-child')).toHaveText(['0']);
  await expect(rows.first().locator('td').nth(1)).toHaveText('192.168.10.0');
});

test('interface compacte, saisie longue et logos locaux sur plusieurs largeurs', async ({ page }) => {
  const ipv6 = 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/128';
  for (const width of [320, 360, 390, 430, 768, 820, 900, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByLabel('Adresse IP', { exact: true }).fill(ipv6);
    await expect(page.getByLabel('Adresse IP', { exact: true })).toHaveValue(ipv6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const address = await page.locator('#address').boundingBox();
    expect(address.x + address.width).toBeLessThanOrEqual(width);
    const print = await page.locator('#print-results').boundingBox();
    const calculate = await page.locator('.calculate-button').boundingBox();
    expect(print.x).toBeGreaterThan(calculate.x + calculate.width);
    expect(Math.abs(print.y - calculate.y)).toBeLessThanOrEqual(6);
    if (width === 1440) {
      expect((await page.locator('main').boundingBox()).width).toBeLessThanOrEqual(1100);
      expect(address.width).toBeGreaterThanOrEqual(440);
      expect(address.width).toBeLessThanOrEqual(580);
      expect((await page.locator('.panel-heading').boundingBox()).y).toBe(calculate.y);
    }
  }
  for (const [theme, filename] of [['dark', 'ipcalc-subnets.svg'], ['light', 'ipcalc-subnets.svg']]) {
    await page.emulateMedia({ colorScheme: theme });
    const logo = page.getByRole('img', { name: 'Logo IPcalc', exact: true });
    await expect.poll(() => logo.evaluate(img => img.currentSrc)).toContain(filename);
    await expect.poll(() => logo.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(new URL(await logo.evaluate(img => img.currentSrc)).origin).toBe(new URL(page.url()).origin);
  }
});

test('HTTP non sécurisé : calculs locaux sans bannière HTTPS', async ({ page, baseURL }) => {
  // L’origine HTTP non sécurisée est servie par le serveur de test local,
  // sans contacter un DNS, le NAS ou un service externe.
  await page.route('http://ipcalc.test/**', async route => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: new URL(url.pathname, baseURL).href });
    await route.fulfill({ response });
  });
  await page.goto('http://ipcalc.test/IPcalc/');
  expect(await page.evaluate(() => isSecureContext)).toBe(false);
  await expect(page.locator('#pwa-message')).toBeHidden();
  await expect(page.locator('#connection-label')).toHaveText('Calcul local');
  await expect(page.locator('#network-result dd').first()).toHaveText('192.168.10.64');
  for (const method of ['count', 'hosts', 'combined']) {
    await subdivide(page, { method, count: '3', hosts: '50' });
    await expect(page.locator('#subnet-result')).toBeVisible();
  }
  await page.getByLabel('Adresse IP', { exact: true }).fill('999.1.1.1/24');
  await page.getByLabel('Adresse IP', { exact: true }).press('Enter');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('#pwa-message')).toBeHidden();
});

test.describe('Erreur d’installation PWA', () => {
  test.use({ serviceWorkers: 'allow' });
  test('une véritable erreur de préparation PWA reste signalée', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.serviceWorker.register = () => Promise.reject(new Error('Test : cache indisponible'));
  });
  await page.reload();
  await expect(page.locator('#pwa-message')).toContainText('cache hors connexion n’a pas pu être préparé');
  await expect(page.locator('#network-result dd').first()).toHaveText('192.168.10.64');
});
});

test('FLSM lisible : 4, 8, 16 réseaux, tailles réelles et aucune valeur tronquée', async ({ page }) => {
  for (const width of [1440, 1024, 900, 540, 430, 390, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const count of ['4', '8', '16']) {
      await subdivide(page, { count });
      const rows = page.locator('#subnet-result > .table-wrapper tr[data-subnet-number]');
      const numbers = count === '4' ? ['0', '1', '2', '3'] : count === '8' ? ['0', '1', '2', '5', '6', '7'] : ['0', '1', '2', '13', '14', '15'];
      await expect(rows.locator('td:first-child')).toHaveText(numbers);
      await expect(page.locator('.subnet-header > p')).toHaveText(count === '4' ? 'Tous les sous-réseaux concernés sont affichés.' : 'Affichage des 3 premiers et des 3 derniers sous-réseaux.');
      const measures = await rows.locator('td').evaluateAll(cells => cells.map(cell => {
        const style = getComputedStyle(cell);
        const range = document.createRange();
        range.selectNodeContents(cell);
        const text = range.getBoundingClientRect();
        const box = cell.getBoundingClientRect();
        return { font: style.fontSize, weight: style.fontWeight, fontFamily: style.fontFamily, height: box.height, fits: text.left >= box.left - 1 && text.right <= box.right + 1, scrollFits: cell.scrollWidth <= cell.clientWidth + 1 };
      }));
      expect(measures.every(cell => cell.font === '16px' && cell.fontFamily.includes('monospace') && cell.fits && cell.scrollFits)).toBe(true);
      expect(measures.filter((_, index) => index % 6 === 0).every(cell => Number(cell.weight) >= 700)).toBe(true);
      if (width > 900) {
        expect(measures.every(cell => cell.height >= 55)).toBe(true);
        expect(await page.locator('.subnet-table th').first().evaluate(cell => getComputedStyle(cell).fontSize)).toBe('14px');
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (count !== '4') {
        expect(await page.locator('.ellipsis-row td').evaluate(cell => getComputedStyle(cell).fontSize)).toBe('14px');
        await page.locator('#middle-details > summary').click();
        await expect(page.locator('#middle-details tr[data-subnet-number]')).toHaveCount(Number(count) - 6);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('numéros 48 et 128 sans dièse, adresses et pagination inchangées', async ({ page }) => {
  await subdivide(page, { address: '10.0.0.0/16', count: '256' });
  await page.locator('#middle-details > summary').click();
  const row48 = page.locator('#middle-details tr[data-subnet-number="48"]');
  await expect(row48.locator('td').first()).toHaveText('48');
  await expect(row48.locator('td').nth(1)).toHaveText('10.0.48.0');
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Suivants : sous-réseaux intermédiaires' }).click();
  const row128 = page.locator('#middle-details tr[data-subnet-number="128"]');
  await expect(row128.locator('td').first()).toHaveText('128');
  await expect(row128.locator('td').nth(1)).toHaveText('10.0.128.0');
  await expect(row128.locator('td').nth(4)).toHaveText('10.0.128.255');
  await page.getByRole('button', { name: 'Précédents : sous-réseaux intermédiaires' }).click();
  await expect(page.locator('#middle-details tr[data-subnet-number]').first().locator('td').first()).toHaveText('53');
  await expect(page.locator('.brand img')).toHaveCount(0);
  await expect(page.locator('.brand')).toHaveText('IPcalc');
  await expect(page.getByRole('img', { name: 'Logo IPcalc', exact: true })).toHaveCount(1);
});

test('FLSM A4 Pro : troisième choix isolé, rapport complet et impression native', async ({ page }) => {
  await subdivide(page, { address: '192.168.10.0/24', count: '10' });
  await page.getByRole('button', { name: 'Télécharger une fiche pédagogique PDF' }).click();
  await expect(page.locator('#pdf-a4-student')).toBeVisible();
  await expect(page.locator('#pdf-a4-corrected')).toBeVisible();
  await expect(page.locator('#pdf-a4-professional')).toBeVisible();
  await expect(page.locator('#pdf-a4-description')).toBeHidden();
  await expect(page.locator('#pdf-a4-professional')).toHaveText('Fiche professionnelle A4');
  await expect(page.locator('#pdf-a4-student')).toHaveText('Exercice A3 · Énoncé');
  await expect(page.locator('#pdf-a4-corrected')).toHaveText('Exercice A3 · Corrigé');
  await expect(page.locator('.pdf-a4-options > button').first()).toHaveAttribute('id', 'pdf-a4-professional');
  await page.evaluate(() => {
    window.__professionalPrints = 0;
    window.print = () => { window.__professionalPrints += 1; };
  });
  await page.locator('#pdf-a4-professional').click();
  await expect(page.locator('#pdf-a4-dialog')).toBeHidden();
  expect(await page.evaluate(() => window.__professionalPrints)).toBe(1);
  await expect(page).toHaveTitle('192.168.10.0_FLSM_Pro');
  await expect(page.locator('body')).toHaveClass(/print-professional/);
  await expect(page.locator('.professional-report-head')).toContainText('Plan d’adressage IPv4 FLSM');
  await expect(page.locator('.professional-report-group').last().locator('.professional-report-fields')).toContainText('255.255.255.240');
  await expect(page.locator('.professional-report-group').first()).toContainText('Masque initial');
  await expect(page.locator('.professional-report-group').last()).toContainText('Découpage FLSM');
  await expect(page.locator('.professional-report-group').last().locator('.professional-report-fields')).toContainText('Hôtes utilisables non affectés');
  await expect(page.locator('.professional-report-allocation-bar')).toHaveAttribute('role', 'img');
  await expect(page.locator('.professional-report-allocation-legend')).toContainText('sous-réseaux attribués');
  await expect(page.locator('.professional-report-table tbody tr')).toHaveCount(10);
  await expect(page.locator('.professional-report-table tbody tr').first()).toContainText('192.168.10.0/28');
  await expect(page.locator('.professional-report-table tbody tr').last()).toContainText('192.168.10.144/28');
  await expect(page.locator('.professional-report-head h1')).toContainText('Plan d’adressage IPv4 FLSM');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#professional-report')).toBeVisible();
  await expect(page.locator('.workspace')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(page).toHaveTitle('IPcalc - Adressage IPv4 et IPv6');
  await expect(page.locator('#professional-report')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/print-professional/);
});

test('FLSM A4 Pro : un sous-réseau libre, 14 hôtes disponibles et barre 75/25', async ({ page }) => {
  await subdivide(page, { address: '192.168.10.75/26', count: '3' });
  await page.getByRole('button', { name: 'Télécharger une fiche pédagogique PDF' }).click();
  await page.evaluate(() => { window.print = () => {}; });
  await page.locator('#pdf-a4-professional').click();
  await expect(page.locator('.professional-report-group').first()).toContainText('192.168.10.64/26');
  await expect(page.locator('.professional-report-group').last()).toContainText('14');
  await expect(page.locator('.professional-report-group').last()).toContainText('3 / 4');
  await expect(page.locator('.professional-report-legend-free')).toContainText('1 sous-réseau disponible (25 %)');
  const usedSegments = await page.locator('.professional-report-used').evaluateAll(nodes => nodes.map(node => parseFloat(node.style.width)));
  expect(usedSegments).toEqual([25, 25, 25]);
  expect(usedSegments.reduce((total, width) => total + width, 0)).toBe(75);
  expect(await page.locator('.professional-report-free').evaluate(node => parseFloat(node.style.width))).toBe(25);
  await expect(page.locator('.professional-report-table tbody tr')).toHaveCount(3);
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
});

test('IPv4 simple : fiche Pro A4, plage utilisable et deux fiches scolaires préservées', async ({ page }) => {
  await page.getByRole('button', { name: 'Télécharger une fiche pédagogique PDF' }).click();
  await expect(page.locator('#pdf-a4-description')).toBeHidden();
  await expect(page.locator('#pdf-a4-professional')).toBeVisible();
  await expect(page.locator('.pdf-a4-options > button').first()).toHaveAttribute('id', 'pdf-a4-professional');
  await expect(page.locator('#pdf-a4-student')).toHaveText('Fiche élève · Énoncé');
  await expect(page.locator('#pdf-a4-corrected')).toHaveText('Fiche élève · Corrigé');
  await page.evaluate(() => { window.__printCount = 0; window.print = () => { window.__printCount++; }; });
  await page.locator('#pdf-a4-professional').click();
  expect(await page.evaluate(() => window.__printCount)).toBe(1);
  await expect(page).toHaveTitle('192.168.10.64_IPv4_Pro');
  await expect(page.locator('.professional-report-head')).toContainText('Fiche d’adressage IPv4');
  await expect(page.locator('.professional-ipv4-fields')).toContainText('192.168.10.65');
  await expect(page.locator('.professional-ipv4-fields')).toContainText('192.168.10.126');
  await expect(page.locator('.professional-ipv4-fields')).toContainText('192.168.10.127');
  await expect(page.locator('.professional-ipv4-fields')).toContainText('62');
  await expect(page.locator('#professional-report')).toBeHidden();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#professional-report')).toBeVisible();
  await expect(page.locator('.workspace')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('#professional-report')).toHaveCount(0);
  await expect(page).toHaveTitle('IPcalc - Adressage IPv4 et IPv6');
});

test('IPv4 /31 Pro : deux adresses utilisables sans broadcast', async ({ page }) => {
  await page.getByLabel('Adresse IP', { exact: true }).fill('10.0.0.1/31');
  await page.getByRole('button', { name: 'Calculer le réseau' }).click();
  await page.getByRole('button', { name: 'Télécharger une fiche pédagogique PDF' }).click();
  await page.evaluate(() => { window.print = () => {}; });
  await page.locator('#pdf-a4-professional').click();
  await expect(page.locator('.professional-ipv4-fields')).toContainText('10.0.0.0');
  await expect(page.locator('.professional-ipv4-fields')).toContainText('10.0.0.1');
  await expect(page.locator('.professional-ipv4-fields')).toContainText('Sans broadcast (/31)');
  await expect(page.locator('.professional-report-note')).toContainText('point à point');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
});

test('VLSM : cinq lignes compactes et fiche réseau initial automatique', async ({ page }) => {
  await page.getByRole('radio',{name:'VLSM',exact:true}).check();
  await expect(page.locator('#vlsm-settings')).toBeVisible();
  await expect(page.locator('.vlsm-request-row')).toHaveCount(5);
  expect(await page.locator('.vlsm-request-row input[aria-label^="Quantité"]').evaluateAll(nodes => nodes.map(node => node.value))).toEqual(['1','1','1','1','1']);
  await expect(page.locator('#vlsm-base-content')).toContainText('192.168.10.64/26');
  await expect(page.locator('#vlsm-base-content')).toContainText('255.255.255.192');
  await expect(page.locator('#show-binary')).toHaveCount(0);
});

test('VLSM : saisir des quantités, classer et afficher le plan coloré', async ({ page }) => {
  await page.getByLabel('Adresse IP', { exact: true }).fill('192.168.10.0/24');
  await page.getByRole('radio',{name:'VLSM',exact:true}).check();
  await page.getByLabel('Hôtes par réseau ligne 1').fill('12');
  await page.getByLabel('Hôtes par réseau ligne 2').fill('50');
  await page.getByLabel('Hôtes par réseau ligne 3').fill('25');
  await page.getByLabel('Hôtes par réseau ligne 4').fill('5');
  await page.getByRole('button',{name:'Planifier les sous-réseaux'}).click();
  await expect(page.locator('.vlsm-results-table tbody tr')).toHaveCount(4);
  await expect(page.locator('.vlsm-results-table tbody tr').first()).toContainText('192.168.10.0/26');
  await expect(page.locator('.vlsm-results-table tbody tr').last()).toContainText('192.168.10.112/29');
  await expect(page.locator('.vlsm-allocation-bar .vlsm-bar-segment')).toHaveCount(4);
  await expect(page.locator('.vlsm-allocation-legend')).toContainText('136 adresses disponibles');
});

test('VLSM : refus d’un réseau trop petit et mise à jour de la fiche avant calcul', async ({ page }) => {
  await page.getByRole('radio',{name:'VLSM',exact:true}).check();
  await page.getByLabel('Adresse IP', { exact: true }).fill('192.168.10.0/24');
  await page.getByLabel('Quantité ligne 1').fill('30');
  await page.getByLabel('Hôtes par réseau ligne 1').fill('64');
  await expect(page.locator('#vlsm-base-content')).toContainText('capacité insuffisante');
  await page.getByRole('button',{name:'Planifier les sous-réseaux'}).click();
  await expect(page.getByRole('alert')).toContainText('Capacité insuffisante');
  await expect(page.locator('.vlsm-results-table')).toHaveCount(0);
});

test('impression A4 VLSM : résumé textuel et tableau, bouton PDF historique préservé', async ({ page }) => {
  await page.getByLabel('Adresse IP', { exact: true }).fill('192.168.50.0/24');
  await page.getByRole('radio',{name:'VLSM',exact:true}).check();
  for(const [index,hosts] of [50,25,12,5,2,10].entries()){
    if(index===5)await page.locator('#vlsm-add').click();
    await page.getByLabel('Hôtes par réseau ligne '+(index+1)).fill(String(hosts));
  }
  await page.getByRole('button',{name:'Planifier les sous-réseaux'}).click();
  await page.evaluate(()=>{ window.__printCalled=false;window.print=()=>{window.__printCalled=true;}; });
  await page.getByRole('button',{name:'Imprimer le plan VLSM A4'}).click();
  expect(await page.evaluate(()=>window.__printCalled)).toBe(true);
  await expect(page).toHaveTitle('192.168.50.0_VLSM_Pro');
  await expect(page.locator('#professional-report .professional-report-group')).toContainText('192.168.50.0/24');
  await expect(page.locator('#professional-report .professional-vlsm-table tbody tr')).toHaveCount(6);
  await expect(page.locator('.vlsm-results-table tbody tr')).toHaveCount(6);
  await expect(page.locator('.vlsm-results-table tbody tr')).toHaveCount(6);
  await page.emulateMedia({media:'print'});
  await expect(page.locator('#professional-report')).toBeVisible();
  await expect(page.locator('.input-panel')).toBeHidden();
  await expect(page.locator('.vlsm-results-table')).toBeHidden();
  await expect(page.locator('#professional-report .professional-vlsm-table')).toBeVisible();
  await expect(page.locator('#professional-report .professional-vlsm-table tbody tr')).toHaveCount(6);
  await page.emulateMedia({media:'screen'});
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('#professional-report')).toHaveCount(0);
  await expect(page).toHaveTitle('IPcalc - Adressage IPv4 et IPv6');
  await page.getByRole('radio',{name:'Aucun découpage',exact:true}).check();
  await page.getByRole('button',{name:'Calculer le réseau'}).click();
  await expect(page.getByRole('button',{name:'Télécharger une fiche pédagogique PDF'})).toBeEnabled();
});

test('VLSM 140 réseaux : pagination écran à 100 et impression complète', async ({ page }) => {
  await page.getByLabel('Adresse IP', { exact: true }).fill('10.0.0.0/7');
  await page.getByRole('radio',{name:'VLSM',exact:true}).check();
  const groups=[[30,50],[20,25],[40,13],[50,8]];
  for(let i=0;i<groups.length;i++){
    await page.getByLabel('Quantité ligne '+(i+1)).fill(String(groups[i][0]));
    await page.getByLabel('Hôtes par réseau ligne '+(i+1)).fill(String(groups[i][1]));
  }
  await expect(page.locator('#vlsm-base-content')).toContainText('4 000 adresses nécessaires');
  await page.getByRole('button',{name:'Planifier les sous-réseaux'}).click();
  await expect(page.locator('.vlsm-results-table tbody tr')).toHaveCount(100);
  await expect(page.locator('.vlsm-pagination')).toContainText('140');
  await page.getByRole('button',{name:'Suivant'}).click();
  await expect(page.locator('.vlsm-results-table tbody tr')).toHaveCount(40);
  await expect(page.locator('.vlsm-results-table tbody tr').first()).toContainText('100');
  await page.evaluate(()=>{window.print=()=>{};});
  await page.getByRole('button',{name:'Imprimer le plan VLSM A4'}).click();
  await expect(page.locator('#professional-report .professional-vlsm-table tbody tr')).toHaveCount(140);
  await expect(page.locator('.vlsm-results-table tbody tr')).toHaveCount(40);
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('#professional-report')).toHaveCount(0);
});

test('IPv6 Pro A4 : rapport autonome /64, impression Firefox et restauration', async ({ page }) => {
  await page.getByLabel('Adresse IP', { exact: true }).fill('2001:db8:abcd:12::42/64');
  await page.getByRole('button', { name: 'Afficher les informations' }).click();
  const button = page.getByRole('button', { name: 'Imprimer la fiche professionnelle IPv6 A4' });
  await expect(button).toBeEnabled();
  await expect(page.locator('#print-help')).toHaveText('PDF A4 Pro');
  await page.evaluate(() => { window.__printed = 0; window.print = () => window.__printed++; });
  await button.click();
  expect(await page.evaluate(() => window.__printed)).toBe(1);
  await expect(page.locator('.professional-ipv6-report')).toContainText('Fiche d’adressage IPv6');
  await expect(page.locator('.professional-ipv6-report')).toContainText('2001:db8:abcd:12::/64');
  await expect(page.locator('.professional-ipv6-report')).toContainText('2001:db8:abcd:12:ffff:ffff:ffff:ffff');
  await expect(page.locator('.professional-ipv6-report')).toContainText('Documentation IPv6');
  await expect(page.locator('.professional-ipv6-interface')).toContainText('0000:0000:0000:0042');
  await expect(page.locator('.professional-ipv6-report')).toContainText('IPv6 ne possède pas de broadcast');
  await expect(page.locator('#pdf-a4-dialog')).not.toBeVisible();
  await expect(page.locator('#professional-report')).toBeHidden();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#professional-report')).toBeVisible();
  await expect(page.locator('.workspace')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('#professional-report')).toHaveCount(0);
  await expect(page).toHaveTitle('IPcalc - Adressage IPv4 et IPv6');
});

test('IPv6 Pro A4 : /128 ne propose aucun sous-réseau /64 et aucun identifiant /64', async ({ page }) => {
  await page.getByLabel('Adresse IP', { exact: true }).fill('2001:db8::1/128');
  await page.getByRole('button', { name: 'Afficher les informations' }).click();
  await page.evaluate(() => { window.print = () => {}; });
  await page.getByRole('button', { name: 'Imprimer la fiche professionnelle IPv6 A4' }).click();
  await expect(page.locator('.professional-ipv6-report')).toContainText('0 (préfixe plus long que /64)');
  await expect(page.locator('.professional-ipv6-interface')).toHaveCount(0);
  await expect(page.locator('.professional-ipv6-report')).toContainText('2^0 = 1');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
});

test('VLSM Pro : génération entièrement autonome sans panneaux IPcalc', async ({ page }) => {
  await page.getByLabel('Adresse IP', { exact: true }).fill('192.168.50.0/24');
  await page.getByRole('radio', { name: 'VLSM', exact: true }).check();
  await page.getByLabel('Hôtes par réseau ligne 1').fill('50');
  await page.getByLabel('Hôtes par réseau ligne 2').fill('20');
  await page.getByRole('button', { name: 'Planifier les sous-réseaux' }).click();
  await page.evaluate(async () => {
    const { parseNetwork } = await import('./js/ipv4.js');
    const { planVlsm } = await import('./js/vlsm.js');
    const { buildVlsmProfessionalReport } = await import('./js/professional-vlsm.js');
    const base = parseNetwork('10.40.0.0/24');
    const plan = planVlsm(base, [{ quantity: 2, hosts: 30 }]);
    const report = buildVlsmProfessionalReport(base, plan);
    document.querySelector('#network-result').replaceChildren();
    document.querySelector('#subnet-result').replaceChildren();
    document.body.append(report);
  });
  await expect(page.locator('#professional-report')).toContainText('10.40.0.0/24');
  await expect(page.locator('#professional-report .professional-vlsm-table tbody tr')).toHaveCount(2);
  await expect(page.locator('#professional-report')).not.toContainText('192.168.50.0/24');
});


test('diagnostic des préfixes particuliers et adresse unique /32', async ({ page }) => {
  for (const [address, category, label] of [
    ['192.168.1.10/24','lan','LAN'],
    ['8.8.8.8/24','internet','Internet'],
    ['127.0.0.1/8','special','Spécial'],
    ['192.168.1.10/31','special','Spécial'],
    ['192.168.1.10/32','special','Spécial'],
    ['0.0.0.0/0','special','Spécial']
  ]) {
    await page.locator('#address').fill(address);
    await page.getByRole('button',{name:'Calculer le réseau'}).click();
    await expect(page.locator('#address-diagnostic')).toHaveAttribute('data-category',category);
    await expect(page.locator('#address-diagnostic')).toHaveText(label);
  }
  await expect(page.locator('#network-result')).toContainText('Route par défaut');
  for (const [address,kind] of [['192.168.1.0/24','Adresse réseau'],['192.168.1.255/24','Adresse de broadcast']]) {
    await page.locator('#address').fill(address);
    await page.getByRole('button',{name:'Calculer le réseau'}).click();
    await expect(page.locator('#address-diagnostic')).toHaveAttribute('data-category','special');
    await page.locator('#address-diagnostic').click();
    await expect(page.locator('#address-diagnostic-detail')).toContainText(kind);
  }
});


test('FLSM et VLSM : diagnostic du réseau initial, sans faux positif adresse réseau', async ({ page }) => {
  await page.locator('#address').fill('192.168.1.0/24');
  await page.getByRole('radio', { name: 'FLSM', exact: true }).check();
  await page.getByLabel('Méthode de découpage FLSM').selectOption('count');
  await page.getByLabel('Sous-réseaux demandés', { exact: true }).fill('4');
  await page.getByRole('button', { name: 'Calculer le réseau' }).click();
  await expect(page.locator('#address-diagnostic')).toHaveText('LAN');
  await expect(page.locator('#address-diagnostic')).toHaveAttribute('data-category', 'lan');
  await page.locator('#address-diagnostic').click();
  await expect(page.locator('#address-diagnostic-detail')).toContainText('Réseau initial destiné au découpage');
  await page.getByRole('radio', { name: 'VLSM', exact: true }).check();
  await page.getByLabel('Hôtes par réseau ligne 1').fill('50');
  await page.getByRole('button', { name: 'Planifier les sous-réseaux' }).click();
  await expect(page.locator('#address-diagnostic')).toHaveText('LAN');
  await expect(page.locator('#address-diagnostic')).toHaveAttribute('data-category', 'lan');
  await page.locator('#address').fill('203.0.113.0/24');
  await page.getByRole('button', { name: 'Planifier les sous-réseaux' }).click();
  await expect(page.locator('#address-diagnostic')).toHaveText('Spécial');
});

test('IPv6 : diagnostic LAN Internet Spécial accessible au clic', async ({ page }) => {
  for (const [address,category,label] of [
    ['fd12:3456::10/64','lan','LAN'],
    ['2001:4860:4860::8888/128','internet','Internet'],
    ['fe80::1234/64','special','Spécial'],
    ['::1/128','special','Spécial'],
    ['ff02::1/128','special','Spécial'],
    ['2001:db8::1/64','special','Spécial']
  ]) {
    await page.locator('#address').fill(address);
    await page.getByRole('button',{name:'Afficher les informations'}).click();
    await expect(page.locator('#address-diagnostic')).toHaveAttribute('data-category',category);
    await expect(page.locator('#address-diagnostic')).toHaveText(label);
    await page.locator('#address-diagnostic').click();
    await expect(page.locator('#address-diagnostic-detail')).toBeVisible();
    await page.locator('#address-diagnostic').click();
  }
});

test('Découpage IPv6 /56 vers /64 : préfixes et tableau',async({page})=>{
  await page.locator('#address').fill('2001:db8:1234:ab00::/56');
  await page.locator('#ipv6-target').selectOption('64');
  await page.getByRole('button',{name:'Découper le réseau IPv6'}).click();
  await expect(page.locator('#subnet-result')).toContainText('256');
  await expect(page.locator('#subnet-result')).toContainText('2001:db8:1234:ab01::/64');
  await expect(page.locator('#subnet-result')).toContainText('2001:db8:1234:abff::/64');
});

test('IPv6 : coloration exacte des chiffres hexadécimaux et des bits empruntés',async({page})=>{
  for(const [address,target,expectedFixed,expectedBorrowed] of [
    ['2001:db8:1234:ab00::/56','64',2,2],
    ['2001:db8:1234:abc0::/60','64',3,1],
    ['2001:db8:1234::/48','56',0,2]
  ]){
    await page.locator('#address').fill(address);
    await page.locator('#ipv6-target').selectOption(target);
    await page.getByRole('button',{name:'Découper le réseau IPv6'}).click();
    const fourth=page.locator('.ipv6-bit-sample').first().locator('.ipv6-prefix-example span').nth(12);
    await expect(fourth).toBeVisible();
    const digits=page.locator('.ipv6-bit-sample').first().locator('.ipv6-prefix-example span');
    for(let i=0;i<4;i++){
      await expect(digits.nth(12+i)).toHaveClass(i<expectedFixed?'ipv6-hextet-fixed':i<expectedFixed+expectedBorrowed?'ipv6-hextet-subnet':'ipv6-hextet-interface');
    }
    await expect(page.locator('.ipv6-bit-sample').first().locator('.ipv6-bit-sequence span')).toHaveCount(16);
  }
});

test('IPv6 : deux premiers sous-réseaux comparés en binaire',async({page})=>{
  await page.locator('#address').fill('2001:db8:1234:ab00::/56');
  await page.locator('#ipv6-target').selectOption('64');
  await page.getByRole('button',{name:'Découper le réseau IPv6'}).click();
  await expect(page.locator('.ipv6-bit-sample')).toHaveCount(2);
  await expect(page.locator('.ipv6-bit-sample').nth(0)).toContainText('ab00');
  await expect(page.locator('.ipv6-bit-sample').nth(1)).toContainText('ab01');
  await expect(page.locator('.ipv6-bit-sample').nth(0).locator('.ipv6-bit-sequence')).toHaveText('1010 1011 0000 0000');
  await expect(page.locator('.ipv6-bit-sample').nth(1).locator('.ipv6-bit-sequence')).toHaveText('1010 1011 0000 0001');
});


test('Rapport A4 IPv6 : plan /56 vers /64 et échantillonnage des réseaux',async({page})=>{
  await page.locator('#address').fill('2001:db8:1234:ab00::/56');
  await page.locator('#ipv6-target').selectOption('64');
  await page.getByRole('button',{name:'Découper le réseau IPv6'}).click();
  await expect(page.locator('#print-results')).toBeEnabled();
  await page.evaluate(()=>{window.print=()=>{};});
  await page.locator('#print-results').click();
  const report=page.locator('.professional-ipv6-subnet-report');
  await expect(report).toContainText('Plan de sous-réseaux IPv6');
  await expect(report).toContainText('256');
  await expect(report.locator('tbody tr')).toHaveCount(13);
  await expect(report.locator('tbody tr').first()).toContainText('2001:db8:1234:ab00::/64');
  await expect(report.locator('tbody tr').last()).toContainText('2001:db8:1234:abff::/64');
  await expect(report).toContainText('8 premiers et 4 derniers');
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('#professional-report')).toHaveCount(0);
});

test('Rapport A4 IPv6 : un seul réseau /48 vers /48',async({page})=>{
  await page.locator('#address').fill('2001:db8:1234::/48');
  await page.locator('#ipv6-target').selectOption('48');
  await page.getByRole('button',{name:'Découper le réseau IPv6'}).click();
  await page.evaluate(()=>{window.print=()=>{};});
  await page.locator('#print-results').click();
  const report=page.locator('.professional-ipv6-subnet-report');
  await expect(report.locator('tbody tr')).toHaveCount(1);
  await expect(report).toContainText('Bits empruntés');
  await expect(report.locator('tbody tr')).toContainText('2001:db8:1234::/48');
});

test('IPv6 A4 displays all 16 networks',async({page})=>{
  await page.locator('#address').fill('fd12:3456:789a:abc0::/60');
  await page.locator('#ipv6-target').selectOption('64');
  await page.getByRole('button',{name:'Découper le réseau IPv6'}).click();
  await page.evaluate(()=>{window.print=()=>{};});
  await page.locator('#print-results').click();
  const report=page.locator('.professional-ipv6-subnet-report');
  await expect(report.locator('tbody tr')).toHaveCount(16);
  await expect(report.locator('tbody tr').nth(8)).toContainText('fd12:3456:789a:abc8::/64');
  await expect(report.locator('.professional-ipv6-subnet-legend')).toContainText('Sous-réseaux : 4 bits');
});
