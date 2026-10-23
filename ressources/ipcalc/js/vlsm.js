/** Planification VLSM IPv4 autonome, aucune dépendance au navigateur. */
import { CalculationError, numberToIPv4, prefixToMask } from './ipv4.js';

export const VLSM_PAGE_SIZE=100;
// Garde-fou de ressources pour éviter une création accidentelle de millions de lignes.
export const VLSM_MAX_SUBNETS=100000;
function positiveInt(value,label){
  const text=String(value??'').trim(),number=Number(text);
  if(!/^\d+$/.test(text)||!Number.isSafeInteger(number)||number<1)
    throw new CalculationError(label+' doit être un entier supérieur ou égal à 1.','vlsm');
  return number;
}
function sizeFor(hosts){
  // Comme le moteur FLSM, un besoin de 1 ou 2 hôtes utilise une liaison /31.
  if(hosts<=2)return {prefix:31,blockSize:2,usableHosts:2};
  const blockSize=2**Math.ceil(Math.log2(hosts+2));
  return {prefix:32-Math.log2(blockSize),blockSize,usableHosts:blockSize-2};
}
/** Données disponibles dès la saisie de l'adresse initiale, sans planification. */
export function describeVlsmBase(base){
  if(!base||!Number.isSafeInteger(base.network)||!Number.isSafeInteger(base.blockSize)
    ||!Number.isInteger(base.prefix)||base.prefix<0||base.prefix>31)
    throw new CalculationError('Réseau IPv4 initial invalide.','address');
  return {cidr:base.address+'/'+base.prefix,address:base.address,prefix:base.prefix,
    mask:base.mask,broadcast:base.broadcast,
    totalAddresses:base.blockSize,usableHosts:base.usableHosts,network:base.network};
}
/** Prévisualisation : statistiques sans attribution d'adresses. */
export function summarizeVlsmRequests(base,requests){
  const initial=describeVlsmBase(base);
  if(!Array.isArray(requests)||!requests.length)
    throw new CalculationError('Ajoutez au moins une demande VLSM.','vlsm');
  let subnetCount=0,requiredAddresses=0,requestedHosts=0;
  const groups=[];
  requests.forEach((request,index)=>{
    if(!request||typeof request!=='object')
      throw new CalculationError('Demande VLSM invalide.','vlsm');
    const quantity=positiveInt(request.quantity,'Quantité (ligne '+(index+1)+')');
    const hosts=positiveInt(request.hosts,'Hôtes (ligne '+(index+1)+')');
    subnetCount+=quantity;
    if(subnetCount>VLSM_MAX_SUBNETS)
      throw new CalculationError('Ce calcul dépasse la limite de sécurité de '+VLSM_MAX_SUBNETS.toLocaleString('fr-FR')+' réseaux. Réduisez la demande pour préserver le navigateur.','vlsm');
    const size=sizeFor(hosts);
    if(size.prefix<initial.prefix)
      throw new CalculationError('Un besoin de '+hosts+' hôtes dépasse la capacité de '+initial.cidr+'.','vlsm');
    const addressCost=size.blockSize*quantity;
    requiredAddresses+=addressCost;
    requestedHosts+=hosts*quantity;
    groups.push({sourceIndex:index,quantity,hosts,...size,addressCost});
  });
  groups.sort((a,b)=>b.blockSize-a.blockSize||a.sourceIndex-b.sourceIndex);
  return {initial,groups,subnetCount,requiredAddresses,requestedHosts,
    remainingAddresses:initial.totalAddresses-requiredAddresses,
    fits:requiredAddresses<=initial.totalAddresses};
}
/** Refuse le plan entier lorsque les besoins dépassent la capacité initiale. */
export function planVlsm(base,requests){
  const preview=summarizeVlsmRequests(base,requests),{initial}=preview;
  if(!preview.fits)
    throw new CalculationError(
      'Capacité insuffisante : '+preview.requiredAddresses.toLocaleString('fr-FR')
      +' adresses nécessaires pour '+initial.totalAddresses.toLocaleString('fr-FR')
      +' disponibles. Réduisez les demandes ou choisissez un réseau plus grand.',
      'vlsm');
  const rows=[],end=initial.network+initial.totalAddresses;
  let cursor=initial.network;
  for(const group of preview.groups){
    for(let i=0;i<group.quantity;i++){
      const aligned=Math.ceil(cursor/group.blockSize)*group.blockSize;
      if(aligned+group.blockSize>end)
        throw new CalculationError('Les blocs demandés ne tiennent pas dans le réseau initial.','vlsm');
      cursor=aligned;
      rows.push({index:rows.length,sourceIndex:group.sourceIndex,
        requestedHosts:group.hosts,usableHosts:group.usableHosts,
        prefix:group.prefix,blockSize:group.blockSize,network:cursor,
        address:numberToIPv4(cursor),
        cidr:numberToIPv4(cursor)+'/'+group.prefix,
        broadcast:group.prefix===31?null:numberToIPv4(cursor+group.blockSize-1),
        mask:prefixToMask(group.prefix)});
      cursor+=group.blockSize;
    }
  }
  const usedAddresses=rows.reduce((sum,r)=>sum+r.blockSize,0);
  const freeAddresses=initial.totalAddresses-usedAddresses;
  return {...preview,rows,usedAddresses,freeAddresses,
    freeStart:freeAddresses?numberToIPv4(cursor):null,
    freeEnd:freeAddresses?numberToIPv4(end-1):null};
}
