/* Deux exercices locaux autonomes, aucun appel à R2D3. */
(()=>{'use strict';
const orderHost=document.getElementById('dns-mini-order');
const partsHost=document.getElementById('dns-mini-parts');
function element(tag,cls,txt){const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;return node}
function button(txt,fn,cls){const b=element('button',cls,txt);b.type='button';b.addEventListener('click',fn);return b}
function feedback(host,msg,state){const f=host.querySelector('.dns-mini-feedback');f.textContent=msg;f.dataset.state=state||''}
if(orderHost){
 const stages=[
  'Le PC demande au serveur DNS l’adresse IP de www.arte.net.',
  'Le serveur DNS répond au PC : 192.0.2.10.',
  'Le PC contacte le serveur web à cette adresse IP.',
  'Le serveur web transmet la page demandée au PC.'
 ];
 let order=[2,0,3,1],checked=false;
 const intro=element('p','', 'Remets les quatre étapes dans le bon ordre. Utilise les flèches pour déplacer chaque étape.');
 const ol=element('ol');const actions=element('div','dns-mini-controls');const result=element('p','dns-mini-feedback');
 result.setAttribute('role','status');result.setAttribute('aria-live','polite');
 function draw(){
  ol.replaceChildren();
  order.forEach((index,pos)=>{
   const li=element('li');const row=element('div','dns-mini-line');
   row.append(element('span','',stages[index]));
   const up=button('↑',()=>move(pos,-1));up.setAttribute('aria-label','Monter cette étape');up.disabled=pos===0;
   const down=button('↓',()=>move(pos,1));down.setAttribute('aria-label','Descendre cette étape');down.disabled=pos===order.length-1;
   row.append(up,down);li.append(row);ol.append(li)
  })
 }
 function move(pos,delta){const next=pos+delta;[order[pos],order[next]]=[order[next],order[pos]];checked=false;feedback(orderHost,'','');draw()}
 actions.append(button('Vérifier',()=>{
  const ok=order.every((n,i)=>n===i);
  feedback(orderHost,ok?'Bravo ! Le DNS fournit l’adresse IP ; le PC communique ensuite avec le serveur web.':'Pas encore. Repère d’abord la demande DNS, puis sa réponse, puis la communication avec le serveur web.',ok?'success':'error');
 }),button('Recommencer',()=>{order=[2,0,3,1];feedback(orderHost,'','');draw()},'dns-mini-secondary'));
 orderHost.append(intro,ol,actions,result);draw()
}
if(partsHost){
 const samples=[
  {name:'pc01.atelier.cybernet.fr',bits:['pc01','atelier','cybernet','fr'],roles:['Hôte','Sous-domaine','Domaine','Extension']},
  {name:'mail.paris.arte.net',bits:['mail','paris','arte','net'],roles:['Hôte','Sous-domaine','Domaine','Extension']},
  {name:'srv-fichiers.rennes.cybernet.fr',bits:['srv-fichiers','rennes','cybernet','fr'],roles:['Hôte','Sous-domaine','Domaine','Extension']}
 ];
 let step=0;
 const progress=element('p','dns-mini-progress'),name=element('p','dns-mini-name'),grid=element('div','dns-mini-grid'),actions=element('div','dns-mini-controls'),result=element('p','dns-mini-feedback');
 result.setAttribute('role','status');result.setAttribute('aria-live','polite');
 const next=button('Nom suivant',()=>{if(step<samples.length-1){step++;render()}else{step=0;render()}});next.disabled=true;
 const check=button('Vérifier',()=>{
  const choices=[...grid.querySelectorAll('select')].map(x=>x.value);
  if(choices.some(x=>!x)){feedback(partsHost,'Attribue un rôle à chaque partie du nom avant de vérifier.','error');return}
  const errors=choices.reduce((n,x,i)=>n+(x===samples[step].roles[i]?0:1),0);
  if(errors){feedback(partsHost,errors+' réponse(s) à revoir. Observe la position de chaque élément dans le nom DNS.','error')}
  else{feedback(partsHost,'Bravo ! Toutes les parties du nom DNS sont correctement identifiées.','success');next.disabled=false}
 });
 const restart=button('Recommencer',()=>{step=0;render()},'dns-mini-secondary');
 actions.append(check,next,restart);
 function render(){
  progress.textContent='Nom '+(step+1)+' sur '+samples.length;
  name.textContent=samples[step].name;
  grid.replaceChildren();feedback(partsHost,'','');next.disabled=true;
  samples[step].bits.forEach((bit,i)=>{
   const box=element('div','dns-mini-part');const label=element('label','',bit);const select=element('select');
   const ident='dns-part-'+step+'-'+i;label.htmlFor=ident;select.id=ident;
   ['Choisir…','Hôte','Sous-domaine','Domaine','Extension'].forEach((choice,j)=>{const opt=element('option','',choice);opt.value=j?choice:'';select.append(opt)});
   select.addEventListener('change',()=>{feedback(partsHost,'','');next.disabled=true});
   box.append(label,select);grid.append(box)
  })
  next.textContent=step===samples.length-1?'Revoir les noms':'Nom suivant'
 }
 partsHost.append(element('p','', 'Pour chacun des trois noms DNS, identifie le rôle de chaque partie.'),progress,name,grid,actions,result);render()
}
})();
