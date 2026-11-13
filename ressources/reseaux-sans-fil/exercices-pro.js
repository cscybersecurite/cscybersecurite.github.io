'use strict';
(()=>{
const el=id=>document.getElementById(id);
const XY=(i,w)=>[i%w,Math.floor(i/w)];
const d=(a,b,w)=>{const x=XY(a,w),y=XY(b,w);return Math.hypot(x[0]-y[0],x[1]-y[1]);};
function crossed(a,b,w,blocks){const p=XY(a,w),q=XY(b,w);let hits=0;const steps=Math.max(1,Math.ceil(d(a,b,w)*5));for(let j=1;j<steps;j++){const t=j/steps,i=Math.round(p[0]+(q[0]-p[0])*t)+w*Math.round(p[1]+(q[1]-p[1])*t);if(blocks.has(i))hits++;}return hits/steps;}
function report(id,text,state){const n=el('pro-'+id+'-result');n.textContent=text;n.dataset.state=state||'';}
function board(id,w,h,renderer){const root=el('pro-'+id+'-map');root.replaceChildren();for(let i=0;i<w*h;i++){const b=document.createElement('button');b.type='button';b.className='pro-cell';renderer(b,i);root.append(b);}}
function cell(b,icon,label,disabled,cb){b.disabled=disabled;b.setAttribute('aria-label',label);const s=document.createElement('span');s.textContent=icon;const l=document.createElement('small');l.textContent=label;b.append(s,l);if(!disabled)b.addEventListener('click',cb);}
const W=8,H=5;
(()=>{
const id='wifi',walls=new Set([11,19,27,28]),clients=[1,6,16,22,33,38],aps=new Set();let last=null;
function signal(a,b){const band=el('pro-wifi-band').value;return 100-d(a,b,W)*(band==='2.4'?13:17)-crossed(a,b,W,walls)*(band==='2.4'?53:78);}
function render(){board(id,W,H,(b,i)=>{const wall=walls.has(i),client=clients.includes(i),ap=aps.has(i);const score=last?last.get(i):null;
b.classList.toggle('pro-wall',wall);b.classList.toggle('pro-selected',ap);if(score!==undefined&&score!==null)b.classList.add(score?'pro-good':'pro-bad');
cell(b,wall?'▥':ap?'📡':client?'💻':'·',wall?'Cloison':ap?'Borne':client?'Poste':'Libre',wall||client,()=>{if(ap)aps.delete(i);else if(aps.size<2)aps.add(i);else{report(id,'Deux bornes maximum. Retire une borne pour la déplacer.','warning');return;}last=null;render();report(id,'Position modifiée. Contrôle maintenant la couverture.');});});
el('pro-wifi-count').textContent=aps.size+' / 2 bornes';}
el('pro-wifi-band').addEventListener('change',()=>{last=null;render();report(id,'Bande modifiée. Lance un nouveau contrôle.');});
el('pro-wifi-check').addEventListener('click',()=>{if(!aps.size){report(id,'Installe au moins une borne avant de contrôler.','warning');return;}last=new Map();let passed=0;for(const c of clients){const ok=Math.max(...Array.from(aps,a=>signal(a,c)))>=35;last.set(c,ok);if(ok)passed++;}render();report(id,passed===clients.length?'Mission réussie : les six postes sont couverts. Explique le choix de tes emplacements.':'Couverture : '+passed+'/6 postes. Déplace les bornes ou change de bande pour améliorer le résultat.',passed===clients.length?'success':'warning');});
el('pro-wifi-reset').addEventListener('click',()=>{aps.clear();last=null;el('pro-wifi-band').value='2.4';render();report(id,'Prépare ton installation, puis lance le contrôle.');});render();})();
(()=>{
const id='zigbee',hub=16,sensors=[3,7,30,39],walls=new Set([11,19,27]),routers=[];let last=null;
const link=(a,b)=>d(a,b,W)+3*crossed(a,b,W,walls)<3.8;
function reachable(){const seen=new Set([hub]),queue=[hub];while(queue.length){const a=queue.shift();for(const b of routers)if(!seen.has(b)&&link(a,b)){seen.add(b);queue.push(b);}}return new Set(sensors.filter(s=>Array.from(seen).some(n=>link(n,s))));}
function render(){board(id,W,H,(b,i)=>{const wall=walls.has(i),sensor=sensors.includes(i),coord=i===hub,ix=routers.indexOf(i),route=ix>=0;
b.classList.toggle('pro-wall',wall);b.classList.toggle('pro-selected',route);if(sensor&&last)b.classList.add(last.has(i)?'pro-good':'pro-bad');
cell(b,wall?'▥':coord?'🏠':sensor?'🌡️':route?'🔌':'·',wall?'Mur':coord?'Coordinateur':sensor?'Capteur':route?'Routeur '+String.fromCharCode(65+ix):'Libre',wall||sensor||coord,()=>{if(route)routers.splice(ix,1);else if(routers.length<3)routers.push(i);else{report(id,'Trois routeurs maximum. Retire-en un pour déplacer ton installation.','warning');return;}last=null;render();report(id,'Maillage modifié. Lance le test des capteurs.');});});el('pro-zigbee-count').textContent=routers.length+' / 3 routeurs';}
el('pro-zigbee-check').addEventListener('click',()=>{if(!routers.length){report(id,'Ajoute au moins un routeur. Les capteurs sur pile ne relaient pas les autres.','warning');return;}const failure=el('pro-zigbee-fail').checked;let removed;if(failure)removed=routers.shift();last=reachable();if(failure)routers.unshift(removed);render();const count=last.size;report(id,(failure?'Avec la panne du routeur A : ':'En fonctionnement normal : ')+count+'/4 capteurs communiquent. '+(count===4?'Mission réussie.':'Modifie les relais ou leur position.'),count===4?'success':'warning');});
el('pro-zigbee-fail').addEventListener('change',()=>{last=null;render();report(id,'État de panne modifié. Relance le test pour constater les conséquences.');});
el('pro-zigbee-reset').addEventListener('click',()=>{routers.length=0;last=null;el('pro-zigbee-fail').checked=false;render();report(id,'Prépare ton installation, puis lance le contrôle.');});render();})();
(()=>{
const id='lora',w=9,h=5,sensors=[1,8,27,43],trees=new Set([12,13,21,22,31]),hills=new Set([16,25,34]);let gateway=null,last=null;
const link=(g,s)=>{const raised=el('pro-lora-height').value==='high';return 10-1.2*d(g,s,w)-crossed(g,s,w,trees)*(raised?4:8)-crossed(g,s,w,hills)*(raised?6:12)+(raised?2:0)>2.8;};
function render(){board(id,w,h,(b,i)=>{const sensor=sensors.includes(i),tree=trees.has(i),hill=hills.has(i),selected=gateway===i;
b.classList.toggle('pro-tree',tree);b.classList.toggle('pro-hill',hill);b.classList.toggle('pro-selected',selected);if(sensor&&last)b.classList.add(last.has(i)?'pro-good':'pro-bad');
cell(b,selected?'📡':sensor?'🌱':tree?'🌳':hill?'⛰️':'·',selected?'Passerelle':sensor?'Capteur':tree?'Bois':hill?'Colline':'Parcelle',sensor||tree||hill,()=>{gateway=selected?null:i;last=null;render();report(id,'Position modifiée. Lance le relevé des mesures.');});});el('pro-lora-count').textContent=gateway===null?'Passerelle absente':'Passerelle placée';}
el('pro-lora-height').addEventListener('change',()=>{last=null;render();report(id,'Hauteur modifiée. Relance le relevé.');});
el('pro-lora-check').addEventListener('click',()=>{if(gateway===null){report(id,'Place d’abord la passerelle sur une case libre.','warning');return;}last=new Set(sensors.filter(s=>link(gateway,s)));render();const count=last.size;report(id,count+'/4 mesures reçues. '+(count===4?'Mission réussie : la passerelle transmet les données par son lien IP.':'Essaie un autre emplacement ou un mât plus haut.'),count===4?'success':'warning');});
el('pro-lora-reset').addEventListener('click',()=>{gateway=null;last=null;el('pro-lora-height').value='low';render();report(id,'Prépare ton installation, puis lance le contrôle.');});render();})();
})();