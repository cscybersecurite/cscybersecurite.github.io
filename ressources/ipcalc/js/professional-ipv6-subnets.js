/** Rapport A4 professionnel de découpage IPv6, sans dépendance à l'interface IPcalc. */
const node=(tag,className='',text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=String(text);return el;};
const number=n=>BigInt(n).toLocaleString('fr-FR');
const MAX_ROWS=16;

export function buildIPv6SubnetProfessionalReport(info,plan){
  if(!info||!plan||!Number.isInteger(info.prefix)||!Number.isInteger(plan.target)||
    plan.target<info.prefix||plan.target>64||typeof plan.at!=='function'||
    !/^[0-9]+$/.test(String(plan.count))||BigInt(plan.count)<1n||
    plan.borrowedBits!==plan.target-info.prefix){
    throw new Error('Calculez un découpage IPv6 valide avant de préparer le rapport.');
  }
  const count=BigInt(plan.count);
  const report=node('section','professional-ipv6-subnet-report');
  report.id='professional-report';
  report.setAttribute('aria-label','Rapport professionnel de découpage IPv6');
  const head=node('header','professional-report-head');
  const title=node('div');
  title.append(node('h1','','Plan de sous-réseaux IPv6'),node('p','professional-report-subtitle','Rapport technique de découpage par préfixe CIDR'));
  head.append(title);report.append(head);
  const summary=node('section','professional-report-summary');
  summary.append(node('h2','','Synthèse du plan d’adressage'));
  const grid=node('div','professional-ipv6-subnet-summary');
  for(const [label,value] of [
    ['Réseau initial',plan.initial],
    ['Préfixe cible','/'+plan.target],
    ['Bits empruntés',plan.borrowedBits],
    ['Nombre de sous-réseaux',number(count)],
    ['Bits restants par sous-réseau',128-plan.target],
    ['Adresses par sous-réseau','2^'+(128-plan.target)]
  ]){
    const cell=node('div');cell.append(node('dt','',label),node('dd','',value));grid.append(cell);
  }
  summary.append(grid);
  const reading=node('section','professional-ipv6-subnet-reading');
  reading.append(node('h3','','Répartition des 128 bits'));
  const bar=node('div','professional-ipv6-subnet-bar');
  const segments=[
    [info.prefix,'Préfixe initial','professional-ipv6-subnet-fixed'],
    [plan.borrowedBits,'Sous-réseaux','professional-ipv6-subnet-borrowed'],
    [128-plan.target,'Partie restante','professional-ipv6-subnet-rest']
  ];
  for(const [bits,label,css] of segments){
    if(!bits)continue;
    const segment=node('div',css);
    segment.style.flex=String(bits);
    segment.setAttribute('aria-label',label+' : '+bits+' bits');
    bar.append(segment);
  }
  reading.append(bar);
  const legend=node('div','professional-ipv6-subnet-legend');
  for(const [bits,label,css] of segments){
    if(!bits)continue;
    const item=node('div','professional-ipv6-subnet-legend-item');
    item.append(node('span','professional-ipv6-subnet-legend-swatch '+css),node('span','',label+' : '+bits+' bits'));
    legend.append(item);
  }
  reading.append(legend);
  reading.append(node('p','professional-report-note','Les bits empruntés identifient les sous-réseaux. IPv6 ne possède pas d’adresse de broadcast.'));
  summary.append(reading);
  report.append(summary);
  const allocation=node('section','professional-ipv6-subnet-allocation');
  allocation.append(node('h2','','Tableau des sous-réseaux'));
  const indices=[];
  if(count<=BigInt(MAX_ROWS)){
    for(let i=0n;i<count;i++)indices.push(i);
  }else{
    for(let i=0n;i<8n;i++)indices.push(i);
    indices.push(null);
    for(let i=count-4n;i<count;i++)indices.push(i);
  }
  const table=node('table','professional-ipv6-subnet-table');
  const thead=node('thead'),heading=node('tr');
  for(const label of ['N°','Préfixe IPv6','Adresse réseau développée']){
    const th=node('th','',label);th.scope='col';heading.append(th);
  }
  thead.append(heading);table.append(thead);
  const tbody=node('tbody');
  for(const index of indices){
    const tr=node('tr');
    if(index===null){
      const td=node('td','','…');td.colSpan=3;td.className='professional-ipv6-subnet-ellipsis';tr.append(td);
    }else{
      const row=plan.at(index);
      tr.append(node('td','',number(index+1n)),node('td','',row.cidr),node('td','',row.expanded));
    }
    tbody.append(tr);
  }
  table.append(tbody);allocation.append(table);
  if(count>BigInt(MAX_ROWS))allocation.append(node('p','professional-report-note',
    'Extrait du plan : 8 premiers et 4 derniers sous-réseaux sur '+number(count)+'. Les réseaux intermédiaires ne sont pas imprimés.'));
  report.append(allocation);
  report.append(node('p','professional-report-footer','Rapport technique IPv6. Préfixes réseau uniquement : aucune notion de broadcast ni de nombre d’hôtes utilisables IPv4.'));
  return report;
}

export function printIPv6SubnetProfessional(info,plan){
  document.getElementById('professional-report')?.remove();
  const report=buildIPv6SubnetProfessionalReport(info,plan);
  document.querySelector('main').append(report);
  const previousTitle=document.title;
  document.title=info.network.replaceAll(':','-')+'_IPv6_Decoupage_Pro';
  document.body.classList.add('print-professional');
  let restored=false;
  const restore=()=>{
    if(restored)return;
    restored=true;
    document.body.classList.remove('print-professional');
    document.title=previousTitle;
    report.remove();
    window.removeEventListener('afterprint',restore);
  };
  window.addEventListener('afterprint',restore);
  try{window.print();}catch(error){restore();throw error;}
  return report;
}
