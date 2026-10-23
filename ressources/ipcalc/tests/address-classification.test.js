import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyIPv4 } from '../js/address-classification.js';

const cases=[
  ['10.2.3.4','lan','private'],
  ['172.16.0.2','lan','private'],
  ['172.31.255.254','lan','private'],
  ['192.168.0.75','lan','private'],
  ['172.32.0.1','internet','global'],
  ['8.8.8.8','internet','global'],
  ['192.0.0.9','special','protocol-assignment'],
  ['192.0.2.12','special','documentation'],
  ['198.51.100.7','special','documentation'],
  ['203.0.113.9','special','documentation'],
  ['169.254.12.8','special','link-local'],
  ['127.0.0.1','special','loopback'],
  ['100.64.2.5','special','shared'],
  ['198.18.0.1','special','benchmark'],
  ['224.0.0.1','special','multicast'],
  ['240.0.0.1','special','reserved'],
  ['255.255.255.255','special','reserved'],
];
for(const [ip,category,type] of cases){
  test('classification '+ip,()=>{
    const result=classifyIPv4(ip);
    assert.equal(result.category,category);
    assert.equal(result.type,type);
    assert.ok(result.description.length>25);
    assert.equal(Object.hasOwn(result,'color'),false);
  });
}
test('la classification analyse la machine, pas son adresse réseau',()=>{
  assert.equal(classifyIPv4('169.254.12.8/16').type,'link-local');
  assert.equal(classifyIPv4('192.168.10.75/26').category,'lan');
});
