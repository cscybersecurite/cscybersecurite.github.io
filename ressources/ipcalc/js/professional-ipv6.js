/** Fiche professionnelle IPv6 A4, indépendante de l'interface et de tout serveur. */

const create = (tag, className = '', text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
};

function field(label, value, expanded = false) {
  const row = create('div', expanded ? 'professional-ipv6-long-field' : '');
  row.append(create('dt', '', label), create('dd', '', value));
  return row;
}

function section(title, rows) {
  const panel = create('div', 'professional-report-group professional-ipv6-group');
  panel.append(create('h3', '', title));
  const fields = create('dl', 'professional-report-fields');
  rows.forEach(([label, value, expanded]) => fields.append(field(label, value, expanded)));
  panel.append(fields);
  return panel;
}

function powerOfTwo(exponent) {
  return '2^' + exponent + ' = ' + (1n << BigInt(exponent)).toLocaleString('fr-FR');
}

/**
 * Produit une fiche DOM réutilisable dans C² : fournit seulement l'objet
 * renvoyé par parseIPv6(), sans élément ni état appartenant à IPcalc.
 */
export function buildIPv6ProfessionalReport(info) {
  if (!info || !Number.isInteger(info.prefix) || info.prefix < 0 || info.prefix > 128 ||
      typeof info.network !== 'string' || typeof info.expanded !== 'string') {
    throw new Error('Calculez une adresse IPv6 valide avant de préparer la fiche.');
  }

  const report = create('section', 'professional-ipv6-report');
  report.id = 'professional-report';
  report.setAttribute('aria-label', 'Rapport professionnel IPv6');
  const head = create('header', 'professional-report-head');
  const headings = create('div');
  headings.append(
    create('h1', '', 'Fiche d’adressage IPv6'),
    create('p', 'professional-report-subtitle', 'Analyse d’une adresse et de son préfixe réseau')
  );
  head.append(headings);
  report.append(head);

  const summary = create('section', 'professional-report-summary');
  summary.append(create('h2', '', 'Caractéristiques de l’adresse IPv6'));
  const groups = create('div', 'professional-ipv6-groups');
  groups.append(
    section('Identification de l’adresse', [
      ['Adresse abrégée', info.address, true],
      ['Adresse développée', info.expanded, true],
      ['Préfixe CIDR', '/' + info.prefix + (info.assumedPrefix ? ' (par défaut)' : '')],
      ['Type d’adresse', info.type],
      ['Portée / utilisation', info.scope],
    ]),
    section('Bloc réseau et capacité', [
      ['Préfixe réseau', info.network + '/' + info.prefix, true],
      ['Réseau développé', info.networkExpanded, true],
      ['Dernière adresse du bloc', info.lastAddress, true],
      ['Nombre total d’adresses', powerOfTwo(info.addressExponent), true],
      ['Sous-réseaux /64 possibles', info.subnets64Exponent === null
        ? '0 (préfixe plus long que /64)'
        : powerOfTwo(info.subnets64Exponent), true],
    ])
  );
  summary.append(groups);
  if (info.interfaceId !== null && info.interfaceId !== undefined) {
    const interfacePanel = section('Identifiant d’interface (/64)', [
      ['Identifiant 64 bits', info.interfaceId, true]
    ]);
    interfacePanel.classList.add('professional-ipv6-interface');
    summary.append(interfacePanel);
  }
  summary.append(create('p', 'professional-report-note',
    'IPv6 ne possède pas de broadcast. Les adresses indiquées délimitent le bloc : ' +
    'la notion de premier ou dernier hôte utilisable dépend de l’affectation des adresses.'));
  report.append(summary);
  return report;
}

/** Impression native A4 Firefox, sans générateur PDF ni accès réseau. */
export function printIPv6Professional(info) {
  document.getElementById('professional-report')?.remove();
  const report = buildIPv6ProfessionalReport(info);
  document.querySelector('main').append(report);
  const previousTitle = document.title;
  document.title = info.network.replaceAll(':', '-') + '_IPv6_Pro';
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
