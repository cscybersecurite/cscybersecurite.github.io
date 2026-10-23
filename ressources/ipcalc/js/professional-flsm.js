/** Rapport professionnel FLSM A4 : module autonome, intégrable dans IPcalc et C². */
import { subnetAt } from './ipv4.js';

export const FLSM_PRO_MAX_ROWS = 10000;
const number = value => Number(value).toLocaleString('fr-FR');
const colors = ['#28699c','#218e81','#d39737','#8976ba','#d46f77','#4c96b0','#a28b67','#5d9a72'];
const percent = (value, total) => (100 * value / total).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %';

function node(tag, className = '', text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = String(text);
  return item;
}

function info(label, value) {
  const block = node('div');
  block.append(node('dt', '', label), node('dd', '', value));
  return block;
}

/**
 * Produit un DOM indépendant de l'interface IPcalc et des documents scolaires.
 * La même fonction pourra recevoir les données d'un TP C² sans requête réseau.
 */
export function buildFlsmProfessionalReport(base, plan) {
  if (!base || !plan || !Number.isSafeInteger(plan.concernedCount) || plan.concernedCount < 1) {
    throw new Error('Calculez un plan FLSM valide avant de créer le rapport.');
  }
  if (plan.concernedCount > FLSM_PRO_MAX_ROWS) {
    throw new Error('Le rapport professionnel A4 est limité à ' + number(FLSM_PRO_MAX_ROWS) +
      ' sous-réseaux. Réduisez le nombre de réseaux à imprimer.');
  }
  const report = node('section', 'professional-flsm-report');
  report.id = 'professional-report';
  report.setAttribute('aria-label', 'Rapport professionnel FLSM');
  const head = node('header', 'professional-report-head');
  const headings = node('div');
  headings.append(node('h1', '', 'Plan d’adressage IPv4 FLSM'));
  head.append(headings);
  report.append(head);

  const summary = node('section', 'professional-report-summary');
  summary.append(node('h2', '', 'Synthèse du plan d’adressage'));
  const remaining = plan.capacity - plan.concernedCount;
  const remainingHosts = remaining * plan.usableHosts;
  const assignedHosts = plan.concernedCount * plan.usableHosts;
  const sections = node('div', 'professional-report-groups');
  const initial = node('div', 'professional-report-group');
  initial.append(node('h3', '', 'Réseau initial'));
  const initialFields = node('dl', 'professional-report-fields');
  [
    ['Adresse réseau', base.address + '/' + base.prefix],
    ['Masque initial', base.mask],
    ['Broadcast initial', base.broadcast ?? 'Sans broadcast'],
    ['Adresses totales', number(base.blockSize)],
  ].forEach(([label, value]) => initialFields.append(info(label, value)));
  initial.append(initialFields);

  const allocation = node('div', 'professional-report-group');
  allocation.append(node('h3', '', 'Découpage FLSM'));
  const allocationFields = node('dl', 'professional-report-fields');
  [
    ['Préfixe des sous-réseaux', '/' + plan.prefix],
    ['Masque FLSM', plan.mask],
    ['Hôtes utilisables / réseau', number(plan.usableHosts)],
    ['Sous-réseaux attribués', number(plan.concernedCount) + ' / ' + number(plan.capacity)],
    ['Sous-réseaux restants', number(remaining)],
    ['Hôtes utilisables non affectés', number(remainingHosts)],
  ].forEach(([label, value]) => allocationFields.append(info(label, value)));
  allocation.append(allocationFields);
  sections.append(initial, allocation);
  summary.append(sections);

  // Visualisation monochrome des sous-réseaux attribués et de l'espace restant.
  const visual = node('div', 'professional-report-allocation');
  visual.append(node('h3', '', 'Répartition du réseau initial'));
  const bar = node('div', 'professional-report-allocation-bar');
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', number(plan.concernedCount) + ' sous-réseaux attribués sur ' + number(plan.capacity) +
    ', ' + number(remaining) + ' restants');
  const visibleSegments = Math.min(plan.concernedCount, 64);
  for (let index = 0; index < visibleSegments; index++) {
    const segment = node('span', 'professional-report-used');
    segment.style.width = (plan.concernedCount / plan.capacity / visibleSegments * 100) + '%';
    segment.style.backgroundColor = colors[index % colors.length];
    segment.title = 'Sous-réseau attribué';
    bar.append(segment);
  }
  if (remaining > 0) {
    const free = node('span', 'professional-report-free');
    free.style.width = (remaining / plan.capacity * 100) + '%';
    free.title = number(remaining) + (remaining === 1 ? ' sous-réseau disponible' : ' sous-réseaux disponibles');
    bar.append(free);
  }
  visual.append(bar);
  const legend = node('div', 'professional-report-allocation-legend');
  const usedLegend = node('span', 'professional-report-legend-used',
    number(plan.concernedCount) + ' sous-réseaux attribués (' + percent(plan.concernedCount, plan.capacity) + ')');
  const freeLegend = node('span', 'professional-report-legend-free',
    number(remaining) + (remaining === 1 ? ' sous-réseau disponible (' : ' sous-réseaux disponibles (') + percent(remaining, plan.capacity) + ')');
  legend.append(usedLegend, freeLegend);
  visual.append(bar, legend);
  summary.append(visual);
  const description = plan.method === 'hosts'
    ? 'Méthode B : dimensionnement selon le nombre minimal d’hôtes : ' + number(plan.minimumHosts)
    : plan.method === 'combined'
      ? 'Méthode combinée : ' + number(plan.requestedCount) + ' réseaux et ' + number(plan.minimumHosts) + ' hôtes minimum par réseau'
      : 'Méthode A : découpage selon le nombre de sous-réseaux demandés : ' + number(plan.requestedCount);
  summary.append(node('p', 'professional-report-method', description));
  report.append(summary);

  const tableSection = node('section', 'professional-report-networks');
  tableSection.append(node('h2', '', 'Tableau complet des sous-réseaux'));
  const wrapper = node('div', 'professional-report-table-wrap');
  const table = node('table', 'professional-report-table');
  const thead = node('thead');
  const labels = ['Nº', 'Adresse réseau / CIDR', 'Premier hôte', 'Dernier hôte', 'Broadcast', 'Hôtes'];
  const titleRow = node('tr');
  labels.forEach(label => {
    const th = node('th', '', label);
    th.scope = 'col';
    titleRow.append(th);
  });
  thead.append(titleRow);
  const tbody = node('tbody');
  // Fragments pour éviter une construction quadratique et conserver tout le tableau.
  for (let start = 0; start < plan.concernedCount; start += 250) {
    const fragment = document.createDocumentFragment();
    for (let index = start; index < Math.min(start + 250, plan.concernedCount); index++) {
      const subnet = subnetAt(plan, index);
      const first = subnet.prefix === 31
        ? subnet.address
        : numberToAddress(subnet.network + 1);
      const last = subnet.prefix === 31
        ? numberToAddress(subnet.network + 1)
        : numberToAddress(subnet.network + subnet.blockSize - 2);
      const row = node('tr');
      [index, subnet.address + '/' + subnet.prefix, first, last,
        subnet.broadcast ?? 'Sans broadcast', number(subnet.usableHosts)].forEach((value, column) => {
          const cell = node('td', '', value);
          if (column === 0 && plan.concernedCount <= 16) {
            const dot = node('span', 'professional-report-row-dot');
            dot.style.backgroundColor = colors[index % colors.length];
            cell.prepend(dot);
          }
          row.append(cell);
        });
      fragment.append(row);
    }
    tbody.append(fragment);
  }
  table.append(thead, tbody);
  wrapper.append(table);
  tableSection.append(wrapper);
  report.append(tableSection);
  return report;
}

function numberToAddress(value) {
  return [24, 16, 8, 0].map(shift => Math.floor(value / 2 ** shift) % 256).join('.');
}

/** Déclenche le dialogue d'impression natif ; PDF texte, aucune capture. */
export function printFlsmProfessional(base, plan) {
  const previous = document.getElementById('professional-report');
  if (previous) previous.remove();
  const report = buildFlsmProfessionalReport(base, plan);
  document.querySelector('main').append(report);
  const originalTitle = document.title;
  document.title = base.address + '_FLSM_Pro';
  document.body.classList.add('print-professional');
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    document.body.classList.remove('print-professional');
    document.title = originalTitle;
    report.remove();
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  try {
    window.print();
  } catch (error) {
    restore();
    throw error;
  }
  return report;
}
