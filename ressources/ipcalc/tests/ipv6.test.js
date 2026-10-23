import test from 'node:test';
import assert from 'node:assert/strict';
import { parseIPv6, classifyIPv6, planIPv6Subnets } from '../js/ipv6.js';

test('IPv6 documentaire /64 : dernière adresse, 2^64, un seul /64', () => {
  const result=parseIPv6('2001:db8:abcd:12::1234/64');
  assert.equal(result.type,'Documentation IPv6');
  assert.equal(result.scope,'Réservée aux exemples ; non routable publiquement');
  assert.equal(result.network,'2001:db8:abcd:12::');
  assert.equal(result.lastAddress,'2001:db8:abcd:12:ffff:ffff:ffff:ffff');
  assert.equal(result.addressCount,'18446744073709551616');
  assert.equal(result.subnets64,'1');
});

test('Documentation 3fff::/20 et adresse unicast globale normale', () => {
  assert.equal(parseIPv6('3fff:0:1::2/48').type,'Documentation IPv6');
  assert.equal(parseIPv6('2001:4860:4860::8888/64').type,'Unicast globale (2000::/3)');
});

test('Le /56 contient 256 sous-réseaux /64', () => {
  const result=parseIPv6('fd12:3456::7/56');
  assert.equal(result.subnets64,'256');
  assert.equal(result.subnets64Exponent,8);
  assert.equal(result.lastAddress,'fd12:3456:0:ff:ffff:ffff:ffff:ffff');
});

test('Les préfixes plus spécifiques que /64 ne contiennent aucun /64 complet', () => {
  const result=parseIPv6('fe80::1/80');
  assert.equal(result.subnets64,'0');
  assert.equal(result.subnets64Exponent,null);
});

test('Adresse seule sans CIDR : /128 par défaut, capacité 1', () => {
  const result=parseIPv6('::1');
  assert.equal(result.assumedPrefix,true);
  assert.equal(result.prefix,128);
  assert.equal(result.lastAddress,'::1');
  assert.equal(result.addressCount,'1');
});

test('Bloc IPv6 complet /0 : arithmétique entière, aucune perte de précision', () => {
  const result=parseIPv6('::/0');
  assert.equal(result.lastAddress,'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
  assert.equal(result.addressCount,(1n<<128n).toString());
  assert.equal(result.subnets64,(1n<<64n).toString());
});

test('Les adresses invalides restent refusées', () => {
  assert.throws(()=>parseIPv6('2001:db8::1234/129'));
  assert.throws(()=>parseIPv6('2001:db8::gg/64'));
  assert.throws(()=>parseIPv6('1:2:3:4:5:6:7:8:9/64'));
});

test('Diagnostic IPv6 : ULA, globale, lien local, bouclage, multicast et documentation', () => {
  for (const [address,category,fragment] of [
    ['fd12:3456::10/64','lan','locale unique'],
    ['2001:4860:4860::8888/128','internet','unicast globale'],
    ['fe80::1234/64','special','Lien local'],
    ['::1/128','special','bouclage'],
    ['ff02::1/128','special','Multicast'],
    ['2001:db8::1/64','special','documentation']
  ]) {
    const diagnostic=classifyIPv6(parseIPv6(address));
    assert.equal(diagnostic.category,category,address);
    assert.match(diagnostic.description,new RegExp(fragment,'i'),address);
  }
});

test('Découpage IPv6 /56 vers /64 : 256 sous-réseaux et bornes exactes',()=>{
  const plan=planIPv6Subnets(parseIPv6('2001:db8:1234:ab00::/56'),'/64');
  assert.equal(plan.count,'256');
  assert.equal(plan.borrowedBits,8);
  assert.equal(plan.at(0).cidr,'2001:db8:1234:ab00::/64'.replace('ab00','ab00'));
  assert.equal(plan.at(1).cidr,'2001:db8:1234:ab01::/64');
  assert.equal(plan.at(255).cidr,'2001:db8:1234:abff::/64');
  assert.throws(()=>plan.at(256));
  assert.throws(()=>planIPv6Subnets(parseIPv6('2001:db8::/56'),'/48'));
  assert.throws(()=>planIPv6Subnets(parseIPv6('2001:db8::/56'),'/65'));
});
