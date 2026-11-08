/* C² : animation pédagogique DORA / APIPA partagée, sans nouveau moteur DHCP. */
(()=>{'use strict';
const ICON_PC='<svg viewBox="0 0 64 55" aria-hidden="true"><rect x="8" y="5" width="48" height="32" rx="4" fill="#284e73" stroke="#7db4df" stroke-width="2"/><rect x="13" y="10" width="38" height="22" rx="2" fill="#d6edfc"/><path d="M32 37v9M20 48h24" fill="none" stroke="#7595b6" stroke-width="4" stroke-linecap="round"/></svg>';
const ICON_SERVER='<svg viewBox="0 0 64 55" aria-hidden="true"><rect x="13" y="4" width="38" height="47" rx="5" fill="#244765" stroke="#7db4df" stroke-width="2"/><rect x="18" y="11" width="28" height="10" rx="2" fill="#afcfe6"/><rect x="18" y="25" width="28" height="9" rx="2" fill="#afcfe6"/><rect x="18" y="38" width="28" height="8" rx="2" fill="#afcfe6"/><g fill="#1b875b"><circle cx="42" cy="16" r="2"/><circle cx="42" cy="29.5" r="2"/><circle cx="42" cy="42" r="2"/></g></svg>';
const scripts={
 dora:[
  ['D','Discover','Le PC recherche un serveur DHCP.','right',1500],
  ['O','Offer','Les adresses .100 à .102 sont déjà utilisées. Le serveur propose la première disponible : 192.168.10.103.','left',2050],
  ['R','Request','Le PC demande à utiliser l’adresse proposée.','right',1750],
  ['A','Acknowledgment (ACK)','Le serveur confirme le bail : 192.168.10.103 est maintenant attribuée au PC.','left',1950]
 ],
 apipa:[
  ['D','Discover','Le PC recherche un serveur DHCP.','right',1700],
  ['D','Discover (nouvel essai)','Aucun serveur ne répond. Le PC renouvelle sa recherche.','right',1850],
  ['D','Discover (nouvel essai)','Toujours aucun message Offer.','right',1650],
  ['','Choix local','Le PC choisit une adresse APIPA : 169.254.10.20.','none',1400],
  ['','Vérification ARP','Le PC vérifie sur le réseau que cette adresse est disponible.','probe',1950],
  ['','Adresse APIPA','Aucun conflit détecté. Le PC utilise 169.254.10.20 /16, sans passerelle.','none',1900],
  ['D','Discover (recherche poursuivie)','Le PC continue à rechercher un serveur DHCP.','right',1750]
 ]
};
function mount(root,mode){
 const apipa=mode==='apipa',steps=scripts[mode];
 root.classList.add('dhcp-motion',apipa?'dhcp-motion--apipa':'dhcp-motion--dora');
 root.innerHTML=
 '<div class="dhcp-motion__board">'+
  '<div class="dhcp-motion__machine">'+ICON_PC+'<strong>PC Windows</strong><small class="dhcp-motion__address">Pas d’adresse IPv4</small></div>'+
  '<div class="dhcp-motion__lane" aria-hidden="true"><span class="dhcp-motion__packet"></span><span>Réseau local</span></div>'+
  '<div class="dhcp-motion__machine '+(apipa?'dhcp-motion__machine--offline':'')+'">'+ICON_SERVER+'<strong>Serveur DHCP</strong>'+
 (apipa?'<small>Aucune réponse</small>':'<small>Plage : .100 à .105</small>'+
 '<div class="dhcp-motion__pool" aria-label="Plage DHCP : adresses .100, .101 et .102 déjà attribuées, .103, .104 et .105 disponibles">'+
 [100,101,102,103,104,105].map(n=>'<span class="dhcp-motion__pool-card '+(n<=102?'is-used':'is-free')+'" data-ip="'+n+'">.'+n+'</span>').join('')+
 '</div><small class="dhcp-motion__pool-caption">Gris : déjà attribuée</small>')+'</div>'+
 '</div>'+
 '<div class="dhcp-motion__readout"><div class="dhcp-motion__heading"><strong>'+(apipa?'DHCP indisponible puis APIPA':'Les quatre échanges DORA')+'</strong><span class="dhcp-motion__count">Prêt à démarrer</span></div>'+
 '<ol class="dhcp-motion__steps"></ol><p class="dhcp-motion__note" aria-live="polite">Clique sur « Lancer l’animation » pour observer les échanges.</p></div>'+
 '<button class="dhcp-motion__play" type="button">▶ Lancer l’animation</button>';
 const btn=root.querySelector('.dhcp-motion__play'),packet=root.querySelector('.dhcp-motion__packet');
 const list=root.querySelector('.dhcp-motion__steps'),note=root.querySelector('.dhcp-motion__note');
 const count=root.querySelector('.dhcp-motion__count'),address=root.querySelector('.dhcp-motion__address');
 let timers=[],epoch=0;
 const poolCard=apipa?null:root.querySelector('.dhcp-motion__pool-card[data-ip="103"]');
 const resetPool=()=>{if(poolCard){poolCard.className='dhcp-motion__pool-card is-free';poolCard.setAttribute('aria-label','Adresse .103 disponible');}};
 function cancel(){epoch++;timers.forEach(clearTimeout);timers=[];packet.className='dhcp-motion__packet';}
 function schedule(fn,delay){timers.push(setTimeout(fn,delay));}
 function show(entry){
  const [letter,word,description]=entry;
  const li=document.createElement('li');li.className='dhcp-motion__step';
  const title=document.createElement('strong');title.className='dhcp-motion__step-title';
  if(letter){
   const initial=document.createElement('b');initial.className='dhcp-motion__initial';initial.textContent=letter;
   title.append(initial,document.createTextNode(word.substring(1)));
  }else title.textContent=word;
  const detail=document.createElement('span');detail.className='dhcp-motion__step-detail';detail.textContent=description;
  li.append(title,detail);list.append(li);
 }
 function play(){
  cancel();const current=epoch,reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  list.replaceChildren();resetPool();packet.textContent='';address.textContent='Pas d’adresse IPv4';count.textContent='Étape 0 / '+steps.length;
  note.textContent=apipa?'Le serveur DHCP est indisponible.':'Le serveur DHCP est disponible.';
  btn.textContent='↻ Rejouer l’animation';
  let at=280;
  steps.forEach((entry,i)=>{
   const duration=reduced?650:entry[4];
   schedule(()=>{
    if(current!==epoch)return;
    count.textContent='Étape '+(i+1)+' / '+steps.length;
    note.textContent=entry[2];
    packet.className='dhcp-motion__packet';
    if(!apipa){
     packet.textContent=(entry[0]==='O'||entry[0]==='A')?'.103':'';
     if(entry[0]==='O'){
      poolCard.className='dhcp-motion__pool-card is-offered';
      poolCard.setAttribute('aria-label','Adresse .103 proposée, non encore attribuée');
     }
     if(entry[0]==='A'){
      poolCard.className='dhcp-motion__pool-card is-used is-new';
      poolCard.setAttribute('aria-label','Adresse .103 attribuée au PC après ACK');
     }
    }
    if(entry[3]!=='none'){
     void packet.offsetWidth;
     packet.style.setProperty('--dhcp-travel',(reduced?0.3:1.15)+'s');
     packet.classList.add('dhcp-motion__packet--'+entry[3]);
    }
    show(entry);
    if(!apipa&&entry[0]==='A')address.textContent='192.168.10.103 /24';
    if(apipa&&entry[1]==='Adresse APIPA')address.textContent='169.254.10.20 /16';
   },at);
   at+=duration+(reduced?150:320);
  });
  schedule(()=>{
   if(current!==epoch)return;
   packet.className='dhcp-motion__packet';
   count.textContent='Animation terminée';
   note.textContent=apipa?'Le PC continue ses recherches DHCP même avec son adresse APIPA.':'Le PC a obtenu sa configuration IPv4 auprès du serveur.';
  },at);
 }
 btn.addEventListener('click',play);
 const chapter=root.closest('details.chapter');
 chapter?.addEventListener('toggle',()=>{if(!chapter.open)cancel();});
 window.addEventListener('pagehide',cancel);
}
document.querySelectorAll('[data-dhcp-animation]').forEach(root=>{
 const mode=root.getAttribute('data-dhcp-animation');
 if(scripts[mode])mount(root,mode);
});
})();
