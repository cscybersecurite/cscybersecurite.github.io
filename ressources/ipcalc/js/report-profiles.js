/** Catalogue prévisionnel uniquement : aucun rendu, PDF, DOM ou calcul. */
export const PROFESSIONAL_LOGO = new URL('../icons/ipcalc-subnets.svg', import.meta.url);

export function plannedReports({ context = 'standalone', device = 'desktop', mode = 'ipv4' } = {}) {
  if (!['standalone', 'c2'].includes(context) || !['desktop', 'mobile'].includes(device) || !['ipv4', 'flsm', 'ipv6', 'vlsm'].includes(mode)) {
    throw new RangeError('Contexte de rapport inconnu.');
  }
  const professionalOnly = context === 'c2' || device === 'mobile';
  const reports = [];
  if (!professionalOnly && ['ipv4', 'flsm'].includes(mode)) {
    for (const variant of ['student', 'answer']) reports.push({
      id: `${mode}-${variant}`, category: 'educational', variant,
      paper: mode === 'ipv4' ? 'A4' : 'A3',
      orientation: mode === 'ipv4' ? 'portrait' : 'landscape',
      status: 'planned',
    });
  }
  if (['flsm', 'vlsm'].includes(mode) || (!professionalOnly && mode === 'ipv6')) {
    reports.push({ id: `${mode}-professional`, category: 'professional', variant: 'neutral', paper: null, orientation: null, status: 'planned' });
  }
  return reports;
}
