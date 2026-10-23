import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNetwork, planSubnets } from '../js/ipv4.js';
import { exportSelection, toCSV, toText, copyText, MAX_EXPORT_ROWS } from '../js/exports.js';

const base = parseNetwork('192.168.10.75/24');
const result = { base, plan: planSubnets(base, { method: 'count', count: 10 }) };

test('CSV UTF-8 BOM, point-virgule, CRLF, cinq colonnes, périmètre explicite', () => {
  const csv = toCSV(exportSelection(result, 'requested'));
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /"Périmètre";"Sous-réseaux demandés"\r\n/);
  assert.match(csv, /"Adresse réseau";"Masque décimal";"Préfixe CIDR";"Broadcast";"Hôtes utilisables"/);
  assert.match(csv, /"192.168.10.144";"255.255.255.240";"\/28";"192.168.10.159";"14"/);
  assert.equal(csv.trim().split('\r\n').length, 12);
  assert.doesNotMatch(csv, /Premi|Derni/);
});

test('périmètres : visibles, demandés et ensemble sont distincts', () => {
  assert.equal(exportSelection(result, 'visible').rows.length, 6);
  assert.equal(exportSelection(result, 'requested').rows.length, 10);
  assert.equal(exportSelection(result, 'all').rows.length, 16);
  assert.deepEqual(exportSelection(result, 'visible', [9, 0, 9, 10]).rows.map(row => row.number), [1, 10, 11]);
  assert.throws(() => exportSelection(result, 'other'));
});

test('réseau simple et /31 exportés sans adresses d’hôtes supplémentaires', () => {
  const csv = toCSV(exportSelection({ base: parseNetwork('10.0.0.1/31') }));
  assert.match(csv, /"Réseau simple"/);
  assert.match(csv, /"10.0.0.0";"255.255.255.254";"\/31";"Sans broadcast";"2"/);
  assert.doesNotMatch(csv, /10\.0\.0\.1/);
});

test('export volumineux limité avant allocation, résumé toujours possible', () => {
  const largeBase = parseNetwork('0.0.0.0/0');
  const large = { base: largeBase, plan: planSubnets(largeBase, { method: 'hosts', hosts: 2 }) };
  assert.equal(exportSelection(large, 'visible').rows.length, 6);
  assert.throws(() => exportSelection(large, 'all'), /limite.*10/);
  assert.throws(() => exportSelection(large, 'requested'), /limite/);
  assert.equal(MAX_EXPORT_ROWS, 10000);
});

test('copie : contenu français complet transmis au presse-papiers', async () => {
  const text = toText(exportSelection(result));
  let copied;
  await copyText(text, { writeText: async value => { copied = value; } });
  assert.equal(copied, text);
  assert.match(copied, /Périmètre : Sous-réseaux visibles/);
  assert.match(copied, /Nombre de réseaux : 6/);
  assert.equal(copied.match(/Adresse réseau :/g).length, 6);
  assert.doesNotMatch(copied, /Premi|Derni/);
});

test('copie refusée ou indisponible : erreur exploitable', async () => {
  await assert.rejects(copyText('test', {}), /export CSV/);
  await assert.rejects(copyText('test', { writeText: async () => { throw new Error('denied'); } }), /autorisée.*CSV/);
});
