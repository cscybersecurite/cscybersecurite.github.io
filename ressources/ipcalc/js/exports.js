import { subnetAt, summaryIndices } from './ipv4.js';

export const MAX_EXPORT_ROWS = 10000;
export const EXPORT_COLUMNS = ['Adresse réseau', 'Masque décimal', 'Préfixe CIDR', 'Broadcast', 'Hôtes utilisables'];

export function networkValues(network) {
  return [network.address, network.mask, `/${network.prefix}`, network.broadcast ?? 'Sans broadcast', String(network.usableHosts)];
}

/** Les périmètres sont explicites et contrôlés AVANT de générer les lignes. */
export function exportSelection(result, scope = 'visible', visibleIndices) {
  if (!['visible', 'requested', 'all'].includes(scope)) throw new RangeError('Périmètre d’export invalide.');
  if (!result.plan) return { label: 'Réseau simple', rows: [result.base] };
  const plan = result.plan;
  const labels = {
    visible: 'Sous-réseaux visibles',
    requested: plan.requestedCount === null ? 'Ensemble des sous-réseaux (méthode hôtes)' : 'Sous-réseaux demandés',
    all: 'Ensemble des sous-réseaux',
  };
  const indices = scope === 'visible' ? [...new Set(visibleIndices ?? summaryIndices(plan.concernedCount))].sort((a, b) => a - b) : null;
  const count = indices ? indices.length : scope === 'all' ? plan.capacity : plan.concernedCount;
  if (count > MAX_EXPORT_ROWS) {
    throw new RangeError(`Ce périmètre contient ${count.toLocaleString('fr-FR')} sous-réseaux. La limite est de ${MAX_EXPORT_ROWS.toLocaleString('fr-FR')} lignes pour préserver la réactivité. Exportez les sous-réseaux visibles ou utilisez un réseau plus petit.`);
  }
  const rows = indices ? indices.map(index => subnetAt(plan, index)) : Array.from({ length: count }, (_, index) => subnetAt(plan, index));
  return { label: labels[scope], rows };
}

const csvCell = value => `"${String(value).replaceAll('"', '""')}"`;

export function toCSV(selection) {
  const rows = [['Périmètre', selection.label], EXPORT_COLUMNS, ...selection.rows.map(networkValues)];
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n') + '\r\n';
}

export function toText(selection) {
  const title = `IPcalc\nPérimètre : ${selection.label}\nNombre de réseaux : ${selection.rows.length}`;
  return title + '\n\n' + selection.rows.map(network => EXPORT_COLUMNS.map((label, index) => `${label} : ${networkValues(network)[index]}`).join('\n')).join('\n\n');
}

export async function copyText(text, clipboard = globalThis.navigator?.clipboard) {
  if (!clipboard?.writeText) throw new Error('La copie automatique n’est pas disponible dans ce navigateur. Utilisez l’export CSV.');
  try {
    await clipboard.writeText(text);
  } catch {
    throw new Error('La copie n’a pas été autorisée par le navigateur. Autorisez le presse-papiers ou utilisez l’export CSV.');
  }
}
