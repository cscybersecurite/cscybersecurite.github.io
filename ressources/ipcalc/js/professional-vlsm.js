/** Impression VLSM professionnelle A4 autonome, hors connexion, compatible C².
 * Entrées : objet IPv4 initial (parseNetwork) et plan (planVlsm).
 * Le DOM généré et les styles d'impression ne dépendent d'aucun composant IPcalc.
 */
const number = value => Number(value).toLocaleString('fr-FR');
const percent = (value, total) => (100 * value / total).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %';
const palette = ['#28699c','#218e81','#d39737','#8976ba','#d46f77','#4c96b0','#a28b67','#5d9a72'];
const node = (tag, className = '', text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = String(text);
  return el;
};
const info = (label, value) => {
  const wrapper = node('div');
  wrapper.append(node('dt', '', label), node('dd', '', value));
  return wrapper;
};

/** Construit tout le rapport, y compris les lignes non affichées dans la pagination IPcalc. */
export function buildVlsmProfessionalReport(base, plan) {
  if (!base || !plan || !Array.isArray(plan.rows) || !plan.initial ||
      !Number.isSafeInteger(plan.initial.totalAddresses) ||
      !Number.isSafeInteger(plan.usedAddresses) ||
      !Number.isSafeInteger(plan.freeAddresses) ||
      !plan.rows.length) {
    throw new Error('Calculez un plan VLSM valide avant de préparer la fiche professionnelle.');
  }

  const report = node('section', 'professional-vlsm-report');
  report.id = 'professional-report';
  report.setAttribute('aria-label', 'Rapport professionnel VLSM');

  const header = node('header', 'professional-report-head');
  const headings = node('div');
  headings.append(node('h1', '', 'Plan d’adressage IPv4 VLSM'));
  header.append(headings);
  report.append(header);

  const summary = node('section', 'professional-report-summary');
  summary.append(node('h2', '', 'Synthèse du plan d’adressage'));
  const group = node('div', 'professional-report-group');
  group.append(node('h3', '', 'Réseau initial'));
  const dl = node('dl', 'professional-report-fields');

  [
    ['Réseau initial', base.address + '/' + base.prefix],
    ['Masque décimal', base.mask],
    ['Adresse de diffusion', base.broadcast ?? 'Sans broadcast'],
    ['Adresses totales', number(base.blockSize)],
    ['Hôtes utilisables', number(base.usableHosts)],
  ].forEach(([label, value]) => dl.append(info(label, value)));
  group.append(dl);
  summary.append(group);
  report.append(summary);

  report.append(node('p', 'vlsm-results-intro', number(plan.subnetCount) +
    ' sous-réseaux attribués dans ' + plan.initial.cidr));
  const allocation = node('section', 'professional-report-allocation');
  allocation.append(node('h3', '', 'Occupation de l’espace d’adressage'));
  const bar = node('div', 'vlsm-allocation-bar');
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', number(plan.usedAddresses) +
    ' adresses attribuées et ' + number(plan.freeAddresses) +
    ' non attribuées sur ' + number(plan.initial.totalAddresses));
  for (const group of plan.groups) {
    const segment = node('span', 'vlsm-bar-segment');
    segment.style.width = (group.addressCost / plan.initial.totalAddresses * 100) + '%';
    segment.style.backgroundColor = palette[group.sourceIndex % palette.length];
    segment.title = group.quantity + ' réseaux /' + group.prefix +
      ' : ' + group.addressCost + ' adresses';
    bar.append(segment);
  }
  if (plan.freeAddresses) {
    const free = node('span', 'vlsm-bar-free');
    free.style.width = (plan.freeAddresses / plan.initial.totalAddresses * 100) + '%';
    free.title = number(plan.freeAddresses) + ' adresses non attribuées';
    bar.append(free);
  }
  allocation.append(bar);
  const legend = node('div', 'vlsm-allocation-legend');
  legend.append(
    node('span', '', number(plan.usedAddresses) + ' adresses attribuées (' + percent(plan.usedAddresses, plan.initial.totalAddresses) + ')'),
    node('span', '', number(plan.freeAddresses) + ' adresses disponibles (' + percent(plan.freeAddresses, plan.initial.totalAddresses) + ')')
  );
  allocation.append(legend);
  allocation.append(node('p', 'vlsm-results-intro', 'Chaque couleur représente un groupe de sous-réseaux ayant les mêmes besoins en hôtes.'));
  report.append(allocation);

  const tableSection = node('section', 'professional-report-networks');
  tableSection.append(node('h2', '', 'Tableau complet des sous-réseaux'));
  const wrapper = node('div', 'professional-report-table-wrap');
  const table = node('table', 'professional-report-table professional-vlsm-table');
  const thead = node('thead');
  const heading = node('tr');
  ['Nº','Hôtes demandés','Hôtes disponibles','Adresse réseau / CIDR','Broadcast','Masque décimal']
    .forEach(label => heading.append(node('th', '', label)));
  thead.append(heading);
  table.append(thead);
  const body = node('tbody');
  for (const row of plan.rows) {
    const tr = node('tr');
    [row.index,row.requestedHosts,row.usableHosts,row.cidr,
      row.broadcast ?? 'Sans broadcast (/31)',row.mask]
      .forEach((value, column) => {
        const cell = node('td', '', String(value));
        if (column === 0 && plan.rows.length <= 16) {
          const dot = node('span', 'professional-report-row-dot');
          dot.style.backgroundColor = palette[row.sourceIndex % palette.length];
          cell.prepend(dot);
        }
        tr.append(cell);
      });
    body.append(tr);
  }
  table.append(body);
  wrapper.append(table);
  tableSection.append(wrapper);
  report.append(tableSection);
  return report;
}

/** Impression navigateur/PDF A4 ; le DOM et le titre initiaux sont restaurés après impression. */
export function printVlsmProfessional(base, plan) {
  document.getElementById('professional-report')?.remove();
  const report = buildVlsmProfessionalReport(base, plan);
  const destination = document.querySelector('main') ?? document.body;
  destination.append(report);
  const title = document.title;
  document.title = base.address + '_VLSM_Pro';
  document.body.classList.add('print-professional');
  let finished = false;
  const restore = () => {
    if (finished) return;
    finished = true;
    document.body.classList.remove('print-professional');
    document.title = title;
    report.remove();
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  try { window.print(); }
  catch (error) { restore(); throw error; }
  return report;
}
