/** Moteur IPv4 pur, sans DOM, stockage, réseau ou dépendance. */
export const IPV4_SIZE = 2 ** 32;
export const MAX_PREFIX = 32;

export class CalculationError extends Error {
  constructor(message, field = 'address') {
    super(message);
    this.name = 'CalculationError';
    this.field = field;
  }
}

export function ipv4ToNumber(value) {
  const text = String(value).trim();
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(text)) {
    throw new CalculationError('Saisissez une adresse IPv4 avec quatre octets, par exemple 192.168.10.75.');
  }
  const octets = text.split('.').map(Number);
  if (octets.some(octet => octet > 255)) {
    throw new CalculationError('Chaque octet de l’adresse IPv4 doit être compris entre 0 et 255.');
  }
  return octets.reduce((address, octet) => address * 256 + octet, 0);
}

export function numberToIPv4(value) {
  if (!Number.isInteger(value) || value < 0 || value >= IPV4_SIZE) {
    throw new RangeError('Adresse IPv4 numérique hors limites.');
  }
  return [24, 16, 8, 0].map(shift => Math.floor(value / 2 ** shift) % 256).join('.');
}

export function validatePrefix(prefix) {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > MAX_PREFIX) {
    throw new CalculationError('Le préfixe CIDR doit être un entier compris entre /0 et /32.', 'mask');
  }
  return prefix;
}

export function prefixToMask(prefix) {
  validatePrefix(prefix);
  return numberToIPv4(IPV4_SIZE - 2 ** (32 - prefix));
}

export function maskToPrefix(value) {
  let mask;
  try {
    mask = ipv4ToNumber(value);
  } catch {
    throw new CalculationError('Saisissez un masque décimal valide, par exemple 255.255.255.192.', 'mask');
  }
  const hostBits = Math.log2(IPV4_SIZE - mask);
  if (!Number.isInteger(hostBits)) {
    throw new CalculationError('Le masque doit être contigu : tous les bits à 1 doivent précéder les bits à 0.', 'mask');
  }
  return validatePrefix(32 - hostBits);
}

function parsePrefix(value) {
  if (!/^\d{1,2}$/.test(value)) {
    throw new CalculationError('Le préfixe CIDR doit être un entier compris entre /0 et /32.', 'mask');
  }
  return validatePrefix(Number(value));
}

function parseMask(value) {
  const text = value.trim();
  return text.includes('.') ? maskToPrefix(text) : parsePrefix(text.replace(/^\//, ''));
}

export function usableHosts(prefix) {
  validatePrefix(prefix);
  return prefix === 32 ? 1 : prefix === 31 ? 2 : 2 ** (32 - prefix) - 2;
}

export function describeNetwork(address, prefix) {
  validatePrefix(prefix);
  if (!Number.isInteger(address) || address < 0 || address >= IPV4_SIZE) {
    throw new RangeError('Adresse IPv4 numérique hors limites.');
  }
  const blockSize = 2 ** (32 - prefix);
  const network = Math.floor(address / blockSize) * blockSize;
  return {
    network,
    address: numberToIPv4(network),
    mask: prefixToMask(prefix),
    prefix,
    broadcast: prefix >= 31 ? null : numberToIPv4(network + blockSize - 1),
    usableHosts: usableHosts(prefix),
    blockSize,
  };
}

export function parseNetwork(addressInput, maskInput = '') {
  const parts = String(addressInput).trim().split('/');
  if (parts.length > 2) {
    throw new CalculationError('Utilisez une seule barre oblique pour le préfixe CIDR.');
  }
  const inputAddress = ipv4ToNumber(parts[0]);
  const maskText = String(maskInput).trim();
  let prefix;
  if (parts.length === 2) {
    prefix = parsePrefix(parts[1]);
    if (maskText && parseMask(maskText) !== prefix) {
      throw new CalculationError('Le masque et le préfixe CIDR indiqués sont différents. Corrigez-les ou laissez le champ masque vide.', 'mask');
    }
  } else {
    if (!maskText) {
      throw new CalculationError('Ajoutez un préfixe CIDR à l’adresse ou renseignez le masque décimal.', 'mask');
    }
    prefix = parseMask(maskText);
  }
  return { ...describeNetwork(inputAddress, prefix), inputAddress: numberToIPv4(inputAddress) };
}

function positiveInteger(value, field, label) {
  const text = String(value).trim();
  const number = Number(text);
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(number) || number < 1) {
    throw new CalculationError(`${label} doit être un entier supérieur ou égal à 1.`, field);
  }
  return number;
}

/**
 * Le nombre demandé est distinct de la capacité. En mode hôtes, tous les
 * sous-réseaux sont concernés. Un besoin de 1 ou 2 hôtes autorise le /31.
 */
export function planSubnets(base, { method, count, hosts }) {
  if (!['count', 'hosts', 'combined'].includes(method)) {
    throw new CalculationError('Choisissez une méthode de découpage valide.', 'method');
  }
  const requestedCount = method === 'hosts' ? null : positiveInteger(count, 'count', 'Le nombre de sous-réseaux');
  const minimumHosts = method === 'count' ? null : positiveInteger(hosts, 'hosts', 'Le nombre minimal d’hôtes');
  let prefix;
  if (requestedCount !== null) {
    prefix = base.prefix + Math.ceil(Math.log2(requestedCount));
    if (prefix > 31) {
      throw new CalculationError(`Le réseau /${base.prefix} permet au maximum ${2 ** (31 - base.prefix)} sous-réseaux /31. Demandez moins de sous-réseaux ou utilisez un réseau initial plus grand.`, 'count');
    }
    if (minimumHosts !== null && usableHosts(prefix) < minimumHosts) {
      throw new CalculationError(`Pour ${requestedCount} sous-réseaux, le préfixe /${prefix} offre ${usableHosts(prefix)} hôtes utilisables par sous-réseau, moins que les ${minimumHosts} demandés. Utilisez un réseau initial plus grand, demandez moins de sous-réseaux ou réduisez le nombre d’hôtes.`, 'hosts');
    }
  } else {
    if (minimumHosts > base.usableHosts) {
      throw new CalculationError(`Le réseau /${base.prefix} offre au maximum ${base.usableHosts} hôtes utilisables. Réduisez le nombre d’hôtes ou utilisez un réseau initial plus grand.`, 'hosts');
    }
    prefix = 31;
    while (usableHosts(prefix) < minimumHosts) prefix -= 1;
  }
  const blockSize = 2 ** (32 - prefix);
  const capacity = base.blockSize / blockSize;
  return {
    base, method, requestedCount, minimumHosts, prefix, blockSize, capacity,
    concernedCount: requestedCount ?? capacity,
    mask: prefixToMask(prefix), usableHosts: usableHosts(prefix),
  };
}

export function subnetAt(plan, index) {
  if (!Number.isInteger(index) || index < 0 || index >= plan.capacity) {
    throw new RangeError('Numéro de sous-réseau hors limites.');
  }
  return { ...describeNetwork(plan.base.network + index * plan.blockSize, plan.prefix), index, number: index + 1 };
}

export function summaryIndices(count) {
  if (!Number.isSafeInteger(count) || count < 1) throw new RangeError('Nombre de sous-réseaux invalide.');
  return count <= 6 ? Array.from({ length: count }, (_, index) => index) : [0, 1, 2, count - 3, count - 2, count - 1];
}

/** Pagination bornée : aucun tableau proportionnel à la taille du réseau. */
export function subnetPage(plan, { start = 0, end = plan.concernedCount, page = 0, pageSize = 50 } = {}) {
  if (![start, end, page, pageSize].every(Number.isSafeInteger) || start < 0 || end < start || end > plan.capacity || page < 0 || pageSize < 1 || pageSize > 100) {
    throw new RangeError('Paramètres de pagination invalides.');
  }
  const total = end - start;
  const pageCount = Math.ceil(total / pageSize);
  if ((pageCount > 0 && page >= pageCount) || (pageCount === 0 && page !== 0)) throw new RangeError('Page hors limites.');
  const offset = start + page * pageSize;
  const length = Math.max(0, Math.min(pageSize, end - offset));
  return { items: Array.from({ length }, (_, index) => subnetAt(plan, offset + index)), page, pageCount, total };
}

export function binaryOctets(address) {
  return numberToIPv4(ipv4ToNumber(address)).split('.').map(octet => Number(octet).toString(2).padStart(8, '0'));
}
