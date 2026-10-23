/** Moteur IPv6 pur : validation et normalisation, sans accès réseau. */
export class IPv6Error extends Error {
  constructor(message,field='address'){super(message);this.name='IPv6Error';this.field=field;}
}
const FULL=(1n<<128n)-1n;
function parse128(input){
  let value=String(input).trim().toLowerCase();
  if(value.includes('%'))throw new IPv6Error('Les identifiants de zone (%interface) ne sont pas pris en charge.');
  if(!value.includes(':'))throw new IPv6Error('Une adresse IPv6 contient des groupes hexadécimaux séparés par :.');
  if(value.includes('.')){
    const i=value.lastIndexOf(':'),octets=value.slice(i+1).split('.');
    if(i<0||octets.length!==4||octets.some(x=>!/^\d{1,3}$/.test(x)||Number(x)>255))
      throw new IPv6Error('Partie IPv4 intégrée invalide.');
    value=value.slice(0,i+1)+((+octets[0]<<8)|+octets[1]).toString(16)+':'+((+octets[2]<<8)|+octets[3]).toString(16);
  }
  if(!/^[0-9a-f:]+$/.test(value)||value.split('::').length>2)
    throw new IPv6Error('Adresse IPv6 invalide : caractères ou compression incorrects.');
  let groups;
  if(value.includes('::')){
    const [a,b]=value.split('::'),left=a?a.split(':'):[],right=b?b.split(':'):[];
    const missing=8-left.length-right.length;
    if(missing<1)throw new IPv6Error('La compression :: doit remplacer au moins un groupe.');
    groups=[...left,...Array(missing).fill('0'),...right];
  }else groups=value.split(':');
  if(groups.length!==8||groups.some(s=>!s||s.length>4||!/^[0-9a-f]{1,4}$/.test(s)))
    throw new IPv6Error('Adresse IPv6 invalide : huit groupes hexadécimaux sont nécessaires après expansion.');
  return groups.reduce((n,g)=>(n<<16n)|BigInt(parseInt(g,16)),0n);
}
const groupsOf=n=>Array.from({length:8},(_,i)=>Number((n>>BigInt((7-i)*16))&65535n));
export const expandIPv6=n=>groupsOf(n).map(g=>g.toString(16).padStart(4,'0')).join(':');
export function compressIPv6(n){
  const nums=groupsOf(n),parts=nums.map(g=>g.toString(16));let start=-1,length=1;
  for(let i=0;i<8;){if(nums[i]!==0){i++;continue;}let j=i;while(j<8&&nums[j]===0)j++;
    if(j-i>length){start=i;length=j-i;}i=j;
  }
  if(start<0)return parts.join(':');
  return parts.slice(0,start).join(':')+'::'+parts.slice(start+length).join(':');
}
function classify(n){
  if(n===0n)return ['Adresse non spécifiée','Non routable'];
  if(n===1n)return ['Bouclage (::1)','Machine locale'];
  if(n>>120n===255n)return ['Multicast (ff00::/8)','Groupe multicast (pas de broadcast IPv6)'];
  if(n>>118n===0x3fan)return ['Lien local (fe80::/10)','Uniquement sur le lien local'];
  if(n>>121n===0x7en)return ['Locale unique (fc00::/7)','Réseau privé, non routable sur Internet'];
  if(n>>32n===65535n)return ['IPv4 mappée (::ffff:0:0/96)','Représentation IPv6 d’une IPv4'];
  // Préfixes documentaires RFC 3849 (2001:db8::/32) et RFC 9637 (3fff::/20).
  // Ces adresses sont syntaxiquement globales mais ne sont pas routables publiquement.
  if((n>>96n)===0x20010db8n || (n>>108n)===0x3fff0n)
    return ['Documentation IPv6','Réservée aux exemples ; non routable publiquement'];
  if(n>>125n===1n)return ['Unicast globale (2000::/3)','Potentiellement routable sur Internet'];
  return ['Adresse spéciale ou réservée','Portée dépendant du préfixe et de l’usage'];
}
/** Diagnostic de portée IPv6, indépendant du découpage. */
export function classifyIPv6(info) {
  const type=info.type;
  if (type.startsWith('Locale unique')) return {
    category:'lan', label:'LAN',
    description:'Adresse locale unique (ULA, fc00::/7) : destinée aux réseaux internes et non routable sur Internet public. Elle peut être utilisée sur plusieurs sous-réseaux internes.'
  };
  if (type.startsWith('Unicast globale')) return {
    category:'internet', label:'Internet',
    description:'Adresse unicast globale (2000::/3) : potentiellement routable sur Internet. Cela ne garantit ni son attribution effective ni son accessibilité.'
  };
  const details={
    'Adresse non spécifiée':'Adresse non spécifiée (::) : utilisée notamment avant l’attribution d’une adresse. Elle ne peut pas identifier une interface comme adresse source ordinaire.',
    'Bouclage (::1)':'Adresse de bouclage (::1) : communication avec la machine elle-même, sans transmission sur le réseau.',
    'Documentation IPv6':'Adresse réservée à la documentation : utilisée pour les exemples, non routable sur Internet public.',
    'IPv4 mappée (::ffff:0:0/96)':'Adresse IPv4 mappée : représentation d’une adresse IPv4 dans un format IPv6.',
  };
  return {category:'special',label:'Spécial',
    description:details[type] || type+' : '+info.scope+'.'};
}
export function parseIPv6(addressInput,maskInput=''){
  const parts=String(addressInput).trim().split('/');
  if(parts.length>2)throw new IPv6Error('Un seul préfixe CIDR est autorisé.');
  const number=parse128(parts[0]),separate=String(maskInput).trim().replace(/^\//,'');
  const assumedPrefix=parts.length===1&&!separate;
  const prefixText=assumedPrefix?'128':parts.length===2?parts[1]:separate;
  if(!/^\d{1,3}$/.test(prefixText)||Number(prefixText)>128)
    throw new IPv6Error('Indiquez un préfixe IPv6 de /0 à /128.','mask');
  const prefix=Number(prefixText);
  if(parts.length===2&&separate&&(!/^\d{1,3}$/.test(separate)||Number(separate)!==prefix))
    throw new IPv6Error('Les préfixes CIDR saisis sont différents.','mask');
  const hostBits=BigInt(128-prefix);
  const mask=prefix===0?0n:FULL^((1n<<hostBits)-1n);
  const network=number&mask,[type,scope]=classify(number);
  const last=network|((1n<<hostBits)-1n);
  const addressCount=1n<<hostBits;
  const subnets64=prefix<=64?1n<<BigInt(64-prefix):0n;
  return {address:compressIPv6(number),expanded:expandIPv6(number),prefix,assumedPrefix,
    network:compressIPv6(network),networkExpanded:expandIPv6(network),
    lastAddress:compressIPv6(last),lastAddressExpanded:expandIPv6(last),
    addressCount:addressCount.toString(),addressExponent:128-prefix,
    subnets64:subnets64.toString(),subnets64Exponent:prefix<=64?64-prefix:null,
    type,scope,
    interfaceId:prefix===64?groupsOf(number).slice(4).map(g=>g.toString(16).padStart(4,'0')).join(':'):null};
}

/** Découpage IPv6 par longueur de préfixe, sans notion de broadcast ni d’hôtes utilisables. */
export function planIPv6Subnets(info,targetInput) {
  const text=String(targetInput).trim().replace(/^\//,'');
  if(!/^\d{1,3}$/.test(text))throw new IPv6Error('Indiquez un préfixe cible entre le préfixe initial et /64.','ipv6-target');
  const target=Number(text);
  if(target<info.prefix||target>64)throw new IPv6Error('Le préfixe cible doit être compris entre /'+info.prefix+' et /64.','ipv6-target');
  const count=1n<<BigInt(target-info.prefix);
  const base=parse128(info.network);
  const step=1n<<BigInt(128-target);
  return {initial:info.network+'/'+info.prefix,target,count:count.toString(),borrowedBits:target-info.prefix,
    at(index) {
      const i=BigInt(index);
      if(i<0n||i>=count)throw new RangeError('Indice de sous-réseau hors limites.');
      const n=base+i*step;
      return {index:i.toString(),cidr:compressIPv6(n)+'/'+target,expanded:expandIPv6(n)};
    }
  };
}
