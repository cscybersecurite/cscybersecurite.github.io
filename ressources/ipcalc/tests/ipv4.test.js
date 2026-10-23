import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseNetwork, ipv4ToNumber, numberToIPv4, prefixToMask, maskToPrefix,
  planSubnets, subnetAt, summaryIndices, subnetPage, binaryOctets,
} from '../js/ipv4.js';

const fixtures = [
  ['10.123.45.67/8', '10.0.0.0', '255.0.0.0', '10.255.255.255', 16777214],
  ['172.16.20.30/16', '172.16.0.0', '255.255.0.0', '172.16.255.255', 65534],
  ['192.168.10.75/24', '192.168.10.0', '255.255.255.0', '192.168.10.255', 254],
  ['192.168.10.75/26', '192.168.10.64', '255.255.255.192', '192.168.10.127', 62],
  ['192.168.10.75/30', '192.168.10.72', '255.255.255.252', '192.168.10.75', 2],
  ['192.168.10.75/31', '192.168.10.74', '255.255.255.254', null, 2],
  ['255.255.255.255/0', '0.0.0.0', '0.0.0.0', '255.255.255.255', 4294967294],
  ['192.168.10.75/32', '192.168.10.75', '255.255.255.255', null, 1],
  ['255.255.255.255/31', '255.255.255.254', '255.255.255.254', null, 2],
];

for (const [input, address, mask, broadcast, hosts] of fixtures) {
  test(`réseau ${input} : cinq caractéristiques exactes`, () => {
    const actual = parseNetwork(input);
    assert.equal(actual.address, address);
    assert.equal(actual.mask, mask);
    assert.equal(actual.prefix, Number(input.split('/')[1]));
    assert.equal(actual.broadcast, broadcast);
    assert.equal(actual.usableHosts, hosts);
    assert.equal(actual.inputAddress, input.split('/')[0]);
  });
}

test('les masques /0 à /32 sont contigus et réversibles', () => {
  for (let prefix = 0; prefix <= 32; prefix++) {
    const mask = prefixToMask(prefix);
    assert.equal(maskToPrefix(mask), prefix);
    assert.equal(parseNetwork('192.168.10.75', mask).prefix, prefix);
  }
});

test('masque séparé, préfixe séparé et CIDR cohérents', () => {
  const expected = parseNetwork('192.168.10.75/26');
  for (const mask of ['255.255.255.192', '26', '/26']) {
    assert.deepEqual(parseNetwork(' 192.168.10.75 ', mask), expected);
    assert.deepEqual(parseNetwork('192.168.10.75/26', mask), expected);
  }
  assert.throws(() => parseNetwork('192.168.10.75/26', '255.255.255.0'), /différents/);
});

for (const input of ['', '192.168.1/24', '256.0.0.1/24', '-1.0.0.1/24', '1.2.3.4.5/24', '1.2.3.a/24', '1e2.2.3.4/24', '1.2.3.4//24', '1.2.3.4/24/26', '<script>/24']) {
  test(`adresse invalide rejetée : ${JSON.stringify(input)}`, () => assert.throws(() => parseNetwork(input)));
}

for (const prefix of ['33', '-1', '2.5', '', 'Infinity', '+24', '1e1']) {
  test(`préfixe invalide rejeté : /${prefix}`, () => assert.throws(() => parseNetwork(`1.2.3.4/${prefix}`), /préfixe/));
}

for (const mask of ['255.0.255.0', '255.255.255.253', '128.128.0.0', '0.0.0.1', '255.255.256.0']) {
  test(`masque invalide rejeté : ${mask}`, () => assert.throws(() => parseNetwork('1.2.3.4', mask)));
}

test('préfixe manquant : erreur attribuée au champ masque', () => {
  assert.throws(() => parseNetwork('1.2.3.4'), error => error.field === 'mask' && /préfixe/.test(error.message));
});

test('arithmétique non signée aux limites IPv4', () => {
  for (const [text, number] of [['0.0.0.0', 0], ['128.0.0.0', 2147483648], ['255.255.255.255', 4294967295]]) {
    assert.equal(ipv4ToNumber(text), number);
    assert.equal(numberToIPv4(number), text);
  }
  for (const number of [-1, 4294967296, 0.5, NaN]) assert.throws(() => numberToIPv4(number));
});

test('méthode A : dix demandés, capacité seize, derniers 8 / 9 / 10', () => {
  const plan = planSubnets(parseNetwork('192.168.10.75/24'), { method: 'count', count: 10 });
  assert.equal(plan.prefix, 28);
  assert.equal(plan.usableHosts, 14);
  assert.equal(plan.capacity, 16);
  assert.equal(plan.concernedCount, 10);
  const displayed = summaryIndices(plan.concernedCount).map(index => subnetAt(plan, index));
  assert.deepEqual(displayed.map(row => row.number), [1, 2, 3, 8, 9, 10]);
  assert.deepEqual(displayed.map(row => row.address), ['192.168.10.0', '192.168.10.16', '192.168.10.32', '192.168.10.112', '192.168.10.128', '192.168.10.144']);
});

test('méthode B : 30 hôtes, huit sous-réseaux /27', () => {
  const plan = planSubnets(parseNetwork('192.168.1.75/24'), { method: 'hosts', hosts: 30 });
  assert.equal(plan.prefix, 27);
  assert.equal(plan.requestedCount, null);
  assert.equal(plan.concernedCount, 8);
  assert.equal(plan.capacity, 8);
  assert.equal(subnetAt(plan, 7).broadcast, '192.168.1.255');
});

test('méthode C : trois sous-réseaux, au moins 50 hôtes', () => {
  const plan = planSubnets(parseNetwork('192.168.1.0/24'), { method: 'combined', count: 3, hosts: 50 });
  assert.equal(plan.prefix, 26);
  assert.equal(plan.capacity, 4);
  assert.equal(plan.concernedCount, 3);
  assert.equal(plan.usableHosts, 62);
});

test('contraintes combinées impossibles avec des solutions explicites', () => {
  assert.throws(() => planSubnets(parseNetwork('192.168.1.0/24'), { method: 'combined', count: 5, hosts: 50 }), /32 hôtes|30 hôtes/);
  assert.throws(() => planSubnets(parseNetwork('192.168.1.0/24'), { method: 'combined', count: 5, hosts: 50 }), /plus grand.*moins de sous-réseaux.*nombre d’hôtes/);
});

test('manque de bits ou de capacité hôtes : diagnostic pertinent', () => {
  assert.throws(() => planSubnets(parseNetwork('192.168.1.0/30'), { method: 'count', count: 3 }), /au maximum 2.*moins de sous-réseaux.*plus grand/);
  assert.throws(() => planSubnets(parseNetwork('192.168.1.0/24'), { method: 'hosts', hosts: 255 }), /au maximum 254.*Réduisez.*plus grand/);
});

test('liaisons point à point : /31, deux hôtes sans broadcast', () => {
  for (const hosts of [1, 2]) {
    const plan = planSubnets(parseNetwork('192.168.1.0/30'), { method: 'hosts', hosts });
    assert.equal(plan.prefix, 31);
    assert.equal(plan.capacity, 2);
    assert.equal(subnetAt(plan, 1).broadcast, null);
    assert.equal(subnetAt(plan, 1).usableHosts, 2);
  }
  assert.equal(planSubnets(parseNetwork('192.168.1.0/31'), { method: 'count', count: 1 }).prefix, 31);
});

test('les effectifs invalides ne sont jamais arrondis ou convertis implicitement', () => {
  for (const value of [0, -1, '2.5', '2e3', '', 'Infinity', '9007199254740992']) {
    assert.throws(() => planSubnets(parseNetwork('10.0.0.0/8'), { method: 'count', count: value }));
    assert.throws(() => planSubnets(parseNetwork('10.0.0.0/8'), { method: 'hosts', hosts: value }));
  }
  assert.throws(() => planSubnets(parseNetwork('10.0.0.0/8'), { method: 'vlsm' }));
});

test('règle papier : tout jusqu’à six, trois premiers et trois derniers ensuite', () => {
  assert.deepEqual(summaryIndices(1), [0]);
  assert.deepEqual(summaryIndices(6), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(summaryIndices(7), [0, 1, 2, 4, 5, 6]);
  assert.deepEqual(summaryIndices(16), [0, 1, 2, 13, 14, 15]);
});

test('grand réseau /0 : 2 147 483 648 sous-réseaux, seulement six calculés', () => {
  const plan = planSubnets(parseNetwork('128.0.0.1/0'), { method: 'hosts', hosts: 2 });
  assert.equal(plan.capacity, 2147483648);
  const rows = summaryIndices(plan.capacity).map(index => subnetAt(plan, index));
  assert.equal(rows.length, 6);
  assert.equal(rows.at(-1).address, '255.255.255.254');
  assert.equal(rows.at(-1).number, 2147483648);
  const page = subnetPage(plan, { page: 42949672, pageSize: 50 });
  assert.equal(page.items.length, 48);
  assert.equal(page.items.at(-1).address, '255.255.255.254');
});

test('pagination des intermédiaires et des sous-réseaux non demandés', () => {
  const plan = planSubnets(parseNetwork('10.0.0.0/16'), { method: 'count', count: 100 });
  const middle = subnetPage(plan, { start: 3, end: 97, page: 1 });
  assert.equal(middle.total, 94);
  assert.equal(middle.pageCount, 2);
  assert.equal(middle.items[0].number, 54);
  assert.equal(middle.items.at(-1).number, 97);
  const extras = subnetPage(plan, { start: 100, end: 128 });
  assert.equal(extras.items[0].number, 101);
  assert.equal(extras.items.at(-1).number, 128);
  assert.throws(() => subnetPage(plan, { pageSize: 1000000 }));
  assert.throws(() => subnetPage(plan, { page: 3 }));
  assert.throws(() => subnetAt(plan, 128));
});

test('binaire : toujours quatre octets de huit bits', () => {
  assert.deepEqual(binaryOctets('192.168.10.64'), ['11000000', '10101000', '00001010', '01000000']);
  assert.deepEqual(binaryOctets('0.0.0.0'), Array(4).fill('00000000'));
});
