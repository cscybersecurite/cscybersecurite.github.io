import test from 'node:test';
import assert from 'node:assert/strict';
import { plannedReports, PROFESSIONAL_LOGO } from '../js/report-profiles.js';

test('site desktop : fiches IPv4 A4 portrait et FLSM A3 paysage, rapports distincts', () => {
  for (const mode of ['ipv4', 'flsm']) {
    const reports = plannedReports({ mode });
    const educational = reports.filter(report => report.category === 'educational');
    assert.deepEqual(educational.map(report => report.variant), ['student', 'answer']);
    assert.ok(educational.every(report => report.paper === (mode === 'ipv4' ? 'A4' : 'A3')));
    assert.ok(educational.every(report => report.orientation === (mode === 'ipv4' ? 'portrait' : 'landscape')));
    assert.equal(reports.filter(report => report.category === 'professional').length, mode === 'flsm' ? 1 : 0);
  }
  for (const mode of ['ipv6', 'vlsm']) assert.deepEqual(plannedReports({ mode }).map(report => report.category), ['professional']);
});

test('smartphone et C² : uniquement rapports professionnels FLSM/VLSM', () => {
  for (const config of [{ device: 'mobile' }, { context: 'c2' }, { context: 'c2', device: 'mobile' }]) {
    for (const mode of ['flsm', 'vlsm']) assert.deepEqual(plannedReports({ ...config, mode }).map(report => report.category), ['professional']);
    for (const mode of ['ipv4', 'ipv6']) assert.deepEqual(plannedReports({ ...config, mode }), []);
  }
});

test('catalogue non fonctionnel, paramètres contrôlés et logo professionnel local', () => {
  for (const mode of ['ipv4', 'flsm', 'ipv6', 'vlsm']) assert.ok(plannedReports({ mode }).every(report => report.status === 'planned'));
  assert.throws(() => plannedReports({ context: 'unknown' }), RangeError);
  assert.throws(() => plannedReports({ device: 'unknown' }), RangeError);
  assert.throws(() => plannedReports({ mode: 'unknown' }), RangeError);
  assert.ok(PROFESSIONAL_LOGO.pathname.endsWith('/icons/ipcalc-subnets.svg'));
});
