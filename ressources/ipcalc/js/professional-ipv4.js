/** Fiche professionnelle IPv4 simple A4, sans découpage ni dépendance serveur. */
import { classifyIPv4 } from './address-classification.js';
import { numberToIPv4 } from './ipv4.js';

const format = value => Number(value).toLocaleString('fr-FR');
const el = (tag, className = '', text) => {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = String(text);
  return item;
};
const pair = (label, value) => {
  const item = el('div');
  item.append(el('dt', '', label), el('dd', '', value));
  return item;
};

/** Résultat entièrement autonome : réutilisable dans C² à partir d'un objet réseau IPv4. */
export function buildIPv4ProfessionalReport(base) {
  if (!base || !Number.isInteger(base.network) || !Number.isInteger(base.prefix)) {
    throw new Error('Calculez une adresse IPv4 valide avant de préparer la fiche.');
  }

  const report = el('section', 'professional-ipv4-report');
  report.id = 'professional-report';
  report.setAttribute('aria-label', 'Rapport professionnel IPv4');
  const head = el('header', 'professional-report-head');
  const headings = el('div');
  headings.append(el('h1', '', 'Fiche d’adressage IPv4'));
  const analyzed = el('p', 'professional-ipv4-analyzed');
  analyzed.append(el('span', '', 'Adresse IPv4 analysée : '),
    el('strong', '', (base.inputAddress ?? base.address) + '/' + base.prefix));
  headings.append(analyzed);
  head.append(headings);
  report.append(head);

  const section = el('section', 'professional-report-summary');
  section.append(el('h2', '', 'Caractéristiques du réseau'));
  const group = el('div', 'professional-report-group professional-ipv4-fields');
  group.append(el('h3', '', 'Réseau IPv4'));
  const fields = el('dl', 'professional-report-fields');
  const first = base.network + (base.prefix >= 31 ? 0 : 1);
  const last = base.network + base.blockSize - (base.prefix >= 31 ? 1 : 2);
  [
    ['Adresse réseau', base.address + '/' + base.prefix],
    ['Masque décimal', base.mask],
    ['Préfixe CIDR', '/' + base.prefix],
    ['Première adresse utilisable', numberToIPv4(first)],
    ['Dernière adresse utilisable', numberToIPv4(last)],
    ['Adresse de broadcast', base.broadcast ?? 'Sans broadcast (/'+base.prefix+')'],
    ['Nombre total d’adresses', format(base.blockSize)],
    ['Hôtes utilisables', format(base.usableHosts)],
  ].forEach(([label, value]) => fields.append(pair(label, value)));
  const classification=classifyIPv4(base.inputAddress??base.address, base.prefix, base.network);
  fields.append(pair('Nature de l’adresse saisie',classification.label+' : '+classification.description));
  group.append(fields);
  section.append(group);
  if (base.prefix === 31) {
    section.append(el('p', 'professional-report-note',
      'Liaison point à point /31 : les deux adresses sont utilisables. Pas de broadcast conventionnel.'));
  }
  if (base.prefix === 32) section.append(el('p', 'professional-report-note',
    'Adresse unique /32 : une seule adresse utilisable, sans broadcast.'));
  if (base.prefix === 0) section.append(el('p', 'professional-report-note',
    'Préfixe /0 : espace IPv4 complet, notamment utilisé pour la route par défaut.'));
  report.append(section);
  return report;
}

/** Même impression native que FLSM Pro ; les éditions scolaires restent indépendantes. */
export function printIPv4Professional(base) {
  document.getElementById('professional-report')?.remove();
  const report = buildIPv4ProfessionalReport(base);
  document.querySelector('main').append(report);
  const previousTitle = document.title;
  document.title = base.address + '_IPv4_Pro';
  document.body.classList.add('print-professional');
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    document.body.classList.remove('print-professional');
    document.title = previousTitle;
    report.remove();
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  try { window.print(); }
  catch (error) { restore(); throw error; }
  return report;
}
