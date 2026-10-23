import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNetwork, ipv4ToNumber } from '../js/ipv4.js';
import { planVlsm, summarizeVlsmRequests, describeVlsmBase, VLSM_MAX_SUBNETS } from '../js/vlsm.js';

const base=parseNetwork('192.168.10.75/24');

test('le réseau initial se décrit sans planifier un seul sous-réseau',()=>{
  const r=describeVlsmBase(base);
  assert.equal(r.cidr,'192.168.10.0/24');
  assert.equal(r.mask,'255.255.255.0');
  assert.equal(r.broadcast,'192.168.10.255');
  assert.equal(r.totalAddresses,256);
  assert.equal(r.usableHosts,254);
});

test('demandes non ordonnées : classement décroissant, réseau, broadcast, masque et capacité',()=>{
  const p=planVlsm(base,[
    {quantity:1,hosts:12},{quantity:1,hosts:50},
    {quantity:1,hosts:5},{quantity:1,hosts:25}]);
  assert.deepEqual(p.rows.map(r=>r.requestedHosts),[50,25,12,5]);
  assert.deepEqual(p.rows.map(r=>r.cidr),[
    '192.168.10.0/26','192.168.10.64/27',
    '192.168.10.96/28','192.168.10.112/29']);
  assert.deepEqual(p.rows.map(r=>r.usableHosts),[62,30,14,6]);
  assert.deepEqual(p.rows.map(r=>r.mask),[
    '255.255.255.192','255.255.255.224',
    '255.255.255.240','255.255.255.248']);
  assert.equal(p.usedAddresses,120);
  assert.equal(p.freeAddresses,136);
  assert.equal(p.freeStart,'192.168.10.120');
});

test('64 hôtes utilisables exigent /25 et non /26',()=>{
  const p=planVlsm(base,[{quantity:1,hosts:64}]);
  assert.equal(p.rows[0].prefix,25);
  assert.equal(p.rows[0].usableHosts,126);
  assert.equal(p.rows[0].broadcast,'192.168.10.127');
});

test('plusieurs réseaux identiques : quantité multipliée et numérotation zéro',()=>{
  const p=planVlsm(base,[{quantity:3,hosts:30}]);
  assert.deepEqual(p.rows.map(r=>r.index),[0,1,2]);
  assert.deepEqual(p.rows.map(r=>r.address),[
    '192.168.10.0','192.168.10.32','192.168.10.64']);
  assert.equal(p.subnetCount,3);
});

test('les liaisons 1 ou 2 hôtes utilisent /31 et n’ont pas de broadcast conventionnel',()=>{
  const p=planVlsm(base,[{quantity:1,hosts:5},{quantity:2,hosts:2},{quantity:1,hosts:1}]);
  assert.deepEqual(p.rows.map(r=>r.prefix),[29,31,31,31]);
  assert.equal(p.rows[1].broadcast,null);
  assert.equal(p.rows[1].usableHosts,2);
  assert.equal(p.freeAddresses,242);
});

test('140 sous-réseaux acceptés, même si l’affichage est paginé à 100',()=>{
  const b=parseNetwork('10.0.0.0/7');
  const p=planVlsm(b,[
    {quantity:30,hosts:50},{quantity:20,hosts:25},
    {quantity:40,hosts:13},{quantity:50,hosts:8}
  ]);
  assert.equal(p.rows.length,140);
  assert.equal(p.usedAddresses,4000);
  assert.equal(p.freeAddresses,33554432-4000);
  assert.equal(p.rows[0].cidr,'10.0.0.0/26');
  assert.equal(p.rows[139].prefix,28);
  assert.ok(VLSM_MAX_SUBNETS>140);
});

test('bloc trop petit : aucun plan partiel, diagnostique la capacité',()=>{
  assert.throws(()=>planVlsm(base,[{quantity:30,hosts:64}]),/Capacité insuffisante/);
  const info=summarizeVlsmRequests(base,[{quantity:30,hosts:64}]);
  assert.equal(info.requiredAddresses,3840);
  assert.equal(info.fits,false);
});

test('demandes invalides refusées strictement, sans conversion permissive',()=>{
  for(const bad of ['0','-1','1.5','1e2','',NaN]) {
    assert.throws(()=>planVlsm(base,[{quantity:1,hosts:bad}]));
    assert.throws(()=>planVlsm(base,[{quantity:bad,hosts:2}]));
  }
});

test('aucun chevauchement : les plages attribuées restent dans le réseau initial',()=>{
  const b=parseNetwork('10.11.12.13/16');
  const p=planVlsm(b,[{quantity:3,hosts:900},{quantity:12,hosts:45},{quantity:4,hosts:4}]);
  let cursor=b.network;
  for(const row of p.rows){
    assert.equal(row.network, cursor);
    assert.equal(row.network % row.blockSize,0);
    assert.ok(row.network+row.blockSize <= b.network+b.blockSize);
    cursor+=row.blockSize;
  }
  assert.equal(p.freeAddresses, b.blockSize-p.usedAddresses);
});

test('réseau de départ /31 : un seul /31 et zéro adresse libre',()=>{
  const b=parseNetwork('192.0.2.15/31');
  const p=planVlsm(b,[{quantity:1,hosts:2}]);
  assert.equal(p.rows[0].address,'192.0.2.14');
  assert.equal(p.rows[0].broadcast,null);
  assert.equal(p.freeAddresses,0);
});
