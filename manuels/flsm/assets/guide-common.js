// Composant partagé FLSM / VLSM : rendu progressif d'une fiche IPv4 à 32 bits.
export function renderWorksheet(target,{initialPrefix,subnetPrefix,network,broadcast,subnetNumber,stage}){
 target.replaceChildren();
 const ipToBits=ip=>ip.split('.').map(x=>Number(x).toString(2).padStart(8,'0')).join('');
 const networkBits=ipToBits(network),broadcastBits=ipToBits(broadcast);
 const borrowed=subnetPrefix-initialPrefix;
 const table=document.createElement('table');table.className='bit-table bit-table-lesson';
 const caption=document.createElement('caption');caption.textContent='Sous-réseau '+subnetNumber+' : état de ma fiche';table.append(caption);
 const head=document.createElement('thead');
 const h=document.createElement('tr');const corner=document.createElement('th');corner.className='';corner.textContent='Octets';h.append(corner);
 for(let oct=0;oct<4;oct++){const cell=document.createElement('th');cell.colSpan=8;cell.className='octet octet-'+(oct+1);cell.textContent=(oct+1)+(oct===0?'er':'e')+' octet';h.append(cell);}head.append(h);
 const weights=document.createElement('tr');const wlabel=document.createElement('th');wlabel.textContent='Poids des bits';weights.append(wlabel);
 for(let i=0;i<32;i++){const c=document.createElement('th');c.textContent=String(2**(7-i%8));c.className='weight'+(i>=initialPrefix&&i<subnetPrefix?' flsm-borrowed-head':'');weights.append(c);}head.append(weights);const exponents=document.createElement('tr');const elabel=document.createElement('th');elabel.textContent='Puissances de 2';exponents.append(elabel);for(let i=0;i<32;i++){const cell=document.createElement('th');cell.className='weight'+(i>=initialPrefix&&i<subnetPrefix?' flsm-borrowed-head':'');cell.append(document.createTextNode('2'));const sup=document.createElement('sup');sup.textContent=String(7-i%8);cell.append(sup);exponents.append(cell);}head.append(exponents);table.append(head);
 
 const body=document.createElement('tbody');
 const rows=[['Réseau (binaire)',networkBits,2],['Réseau (décimal)',network,3],['Broadcast (binaire)',broadcastBits,4],['Broadcast (décimal)',broadcast,5]];
 for(const [label,value,required] of rows){
  const tr=document.createElement('tr');const name=document.createElement('th');name.className='';name.textContent=label;tr.append(name);
  if(label.includes('décimal')){
   const octets=value.split('.');
   for(let oct=0;oct<4;oct++){const cell=document.createElement('td');cell.colSpan=8;cell.className='weight';cell.textContent=stage>=required?octets[oct]:'·';tr.append(cell);}
  }else{
   for(let i=0;i<32;i++){
    const cell=document.createElement('td');cell.className=(i<initialPrefix?'network':i<subnetPrefix?'flsm-borrowed-cell':'hostpart')+(i===initialPrefix-1?' flsm-initial-boundary':'')+(i===subnetPrefix-1?' flsm-new-boundary':'');
    // Dès l'étape D, seuls les bits empruntés sont renseignés.
    cell.textContent=stage>=required?value[i]:(stage>=1&&i>=initialPrefix&&i<subnetPrefix?networkBits[i]:'·');
    tr.append(cell);
   }
  }
  body.append(tr);
 }
 table.append(body);target.append(table);

}


/* Tableau papier progressif FLSM : réseau initial, bits empruntés, binaire, décimal. */
export function renderWorksheetPaperD(target,{initialPrefix,subnetPrefix,baseNetwork,baseBroadcast,subnets,stage}){
 target.replaceChildren();
 const make=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
 const bits=ip=>ip.split('.').map(x=>Number(x).toString(2).padStart(8,'0')).join('');
 const frame=make('div','flsm-paper-d');
 const reference=make('table','flsm-paper-grid flsm-paper-reference'),head=make('tbody');
 const octets=make('tr');octets.append(make('th','flsm-paper-label','OCTETS'));
 for(let o=0;o<4;o++){const th=make('th','flsm-paper-octet flsm-paper-octet-'+(o+1),(o+1)+(o===0?'er':'e')+' octet');th.colSpan=8;octets.append(th);}head.append(octets);
 for(const [name,kind] of [['Puissances de 2','powers'],['Poids décimaux','weights']]){
  const tr=make('tr');tr.append(make('th','flsm-paper-label',name));
  for(let i=0;i<32;i++){
   const cls='flsm-paper-reference-bit'+(stage>=1&&i>=initialPrefix&&i<subnetPrefix?' flsm-paper-borrowed-head':'')+(i%8===7&&i!==31?' flsm-paper-octet-end':'');
   const th=make('th',cls);
   if(kind==='weights')th.textContent=String(2**(7-i%8));
   else{th.append(document.createTextNode('2'),make('sup','',String(7-i%8)));}
   tr.append(th);
  }head.append(tr);
 }
 reference.append(head);frame.append(reference);
 const entries=stage===0?[{number:'initial',address:baseNetwork,broadcast:baseBroadcast}]:subnets;
 for(const sr of entries){
  const block=make('div','flsm-paper-subnet'),header=make('div','flsm-paper-subnet-title');
  header.append(make('strong','',stage===0?'Réseau initial':'Sous-réseau'));
  if(stage!==0)header.append(make('span','',String(sr.number)));
  block.append(header);
  const table=make('table','flsm-paper-grid flsm-paper-address'),tbody=make('tbody');
  const networkBits=bits(sr.address),broadcastBits=bits(sr.broadcast);
  const initialNetworkBits=bits(baseNetwork),initialBroadcastBits=bits(baseBroadcast);
  for(const [label,kind] of [['Réseau (binaire)','network-binary'],['Réseau (décimal)','network-decimal'],['Broadcast (binaire)','broadcast-binary'],['Broadcast (décimal)','broadcast-decimal']]){
   const tr=make('tr');tr.append(make('th','flsm-paper-label',label));
   if(kind.endsWith('decimal')){
    const values=(kind==='network-decimal'?sr.address:sr.broadcast).split('.');
    for(let o=0;o<4;o++){const td=make('td','flsm-paper-decimal'+(o!==3?' flsm-paper-octet-end':''),stage===3?values[o]:'');td.colSpan=8;tr.append(td);}
   }else{
    const isNetwork=kind==='network-binary';
    for(let i=0;i<32;i++){
     const cls=['flsm-paper-bit',i<initialPrefix?'flsm-paper-network':stage>=1&&i<subnetPrefix?'flsm-paper-borrowed':'flsm-paper-host'];
     if(i%8===7&&i!==31)cls.push('flsm-paper-octet-end');
     if(i===initialPrefix-1)cls.push('flsm-paper-initial-bar');
     if(stage>=1&&i===subnetPrefix-1)cls.push('flsm-paper-subnet-bar');
     let value='';
     if(stage===0)value=i<initialPrefix?initialNetworkBits[i]:'';
     else if(stage===1){if(i<initialPrefix)value=initialNetworkBits[i];else if(i<subnetPrefix)value=networkBits[i];}
     else value=(isNetwork?networkBits:broadcastBits)[i];
     // Sur la fiche papier, les zéros restent implicites, sauf dans les bits empruntés.
     if(value==='0'&&!(stage>=1&&i>=initialPrefix&&i<subnetPrefix))value='';
     tr.append(make('td',cls.join(' '),value));
    }
   }
   tbody.append(tr);
  }
  table.append(tbody);block.append(table);frame.append(block);
 }
 target.append(frame);
}
