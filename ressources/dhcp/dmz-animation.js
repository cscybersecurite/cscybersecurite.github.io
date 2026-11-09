/* C² DHCP - Chapitre 6 : DMZ du cabinet médical.
   Deux démonstrations sur une topologie commune, sans configuration de pare-feu.
   Les règles de filtrage sont illustratives. Le relais DHCP est assuré par le pare-feu. */
(() => {
 'use strict';
 const NS='http://www.w3.org/2000/svg';
 const hosts=document.querySelectorAll('[data-dhcp-dmz]');
 function diagram(){
  return '<svg class="dmz-motion__svg" viewBox="0 0 420 465" role="img" aria-label="Internet en haut, pare-feu au centre, réseau LAN du cabinet à gauche et DMZ Wi-Fi patients à droite. Le serveur DHCP se trouve dans le LAN.">'+
  '<rect x="146" y="6" width="128" height="43" rx="20" class="dmz-motion__internet"/>'+
  '<text x="210" y="24" class="dmz-motion__title" text-anchor="middle">INTERNET</text>'+
  '<text x="210" y="38" class="dmz-motion__small" text-anchor="middle">Accès patients</text>'+
  '<path d="M210 49V94" class="dmz-motion__line"/>'+
  '<rect x="148" y="93" width="124" height="64" rx="10" class="dmz-motion__firewall"/>'+
  '<text x="210" y="118" class="dmz-motion__title" text-anchor="middle">PARE-FEU</text>'+
  '<text x="210" y="136" class="dmz-motion__small" text-anchor="middle">Relais DHCP</text>'+
  '<text x="210" y="150" class="dmz-motion__helper" text-anchor="middle">IP helper : OFF</text>'+
  '<path d="M174 157V178H104V207" class="dmz-motion__line"/>'+
  '<path d="M246 157V178H316V207" class="dmz-motion__line"/>'+
  '<rect x="5" y="205" width="197" height="252" rx="12" class="dmz-motion__lan"/>'+
  '<rect x="218" y="205" width="197" height="252" rx="12" class="dmz-motion__dmz"/>'+
  '<text x="104" y="229" class="dmz-motion__title" text-anchor="middle">LAN DU CABINET</text>'+
  '<text x="104" y="247" class="dmz-motion__small" text-anchor="middle">192.168.10.0/24</text>'+
  '<text x="316" y="229" class="dmz-motion__title" text-anchor="middle">DMZ · VISITEURS</text>'+
  '<text x="316" y="247" class="dmz-motion__small" text-anchor="middle">192.168.50.0/24</text>'+
  '<g transform="translate(104 282)"><rect x="-20" y="-19" width="40" height="37" rx="4" fill="#4c708a" stroke="#81a6c2" stroke-width="2"/><path d="M-12 -8H12M-12 2H12M-12 12H12" stroke="#cfebf7" stroke-width="3"/></g>'+
  '<text x="104" y="322" class="dmz-motion__caption" text-anchor="middle">Serveur DHCP</text>'+
  '<text x="104" y="339" class="dmz-motion__small" text-anchor="middle">192.168.10.10</text>'+
  '<rect x="17" y="353" width="174" height="61" rx="7" class="dmz-motion__scope"/>'+
  '<text x="104" y="370" class="dmz-motion__scope-label" text-anchor="middle">Étendue DMZ</text>'+
  '<text x="104" y="386" class="dmz-motion__small" text-anchor="middle">192.168.50.100 à .150</text>'+
  '<text x="104" y="403" class="dmz-motion__small" text-anchor="middle">Bail : 1 heure</text>'+
  '<g transform="translate(316 283)"><rect x="-25" y="-12" width="50" height="29" rx="6" fill="#e9f5fc" stroke="#4886ad" stroke-width="2"/><path d="M-12 -15Q0 -29 12 -15M-8 -10Q0 -18 8 -10" fill="none" stroke="#4886ad" stroke-width="2"/><circle cx="0" cy="9" r="3" fill="#2b9776"/></g>'+
  '<text x="316" y="320" class="dmz-motion__caption" text-anchor="middle">Point d’accès Wi-Fi</text>'+
  '<path d="M316 330V348" class="dmz-motion__wifi"/>'+
  '<g transform="translate(316 366)"><rect x="-11" y="-18" width="22" height="36" rx="4" fill="#294e6a" stroke="#80acc5" stroke-width="2"/><rect x="-8" y="-13" width="16" height="24" rx="1" fill="#d4edfd"/><circle cx="0" cy="14" r="2" fill="#b8d7ec"/></g>'+
  '<text x="316" y="408" class="dmz-motion__caption" text-anchor="middle">Smartphone patient</text>'+
  '<text x="316" y="425" class="dmz-motion__ip" text-anchor="middle">DHCP</text>'+
  '<g class="dmz-motion__flows" aria-label="Flux autorisés et bloqués selon les règles de cet exemple"></g><g class="dmz-motion__packets"></g></svg>';
 }
 const seg={
  patientInternet:[[316,366],[316,282],[316,178],[246,178],[210,157],[210,93],[210,49],[210,28]],
  internetReturn:[[210,28],[210,49],[210,93],[210,157],[246,178],[316,178],[316,282],[316,366]],
  patientLAN:[[316,366],[316,282],[316,178],[246,178],[210,157],[174,178],[104,178],[104,282]],
  internetLAN:[[210,28],[210,93],[210,157],[174,178],[104,178],[104,282]],
  discover:[[316,366],[316,283],[316,250]],
  relay:[[316,250],[316,178],[246,178],[210,157],[174,178],[104,178],[104,282]],
  response:[[104,282],[104,178],[174,178],[210,157],[246,178],[316,178],[316,283],[316,366]]
 };
 hosts.forEach(host=>{
  host.classList.add('dmz-motion');
  host.innerHTML='<div class="dmz-motion__controls"><div class="dmz-motion__modes" role="group" aria-label="Animation à lancer"><button type="button" class="dmz-motion__mode dmz-motion__mode--active" data-mode="zones" aria-pressed="true">1. Comprendre la DMZ</button><button type="button" class="dmz-motion__mode" data-mode="dhcp" aria-pressed="false">2. DHCP dans la DMZ</button></div><div class="dmz-motion__actions"><label class="dmz-motion__toggle" hidden><span>IP helper</span><input type="checkbox" role="switch" class="dmz-motion__helper-input" checked><span class="dmz-motion__helper-value">ON</span></label><button type="button" class="dmz-motion__play">▶ Lancer l’animation</button></div></div>'+
  '<div class="dmz-motion__canvas">'+diagram()+'</div>'+
  '<div class="dmz-motion__legend"><span><i class="dmz-motion__key dmz-motion__key--allowed"></i> Communication autorisée</span><span><i class="dmz-motion__key dmz-motion__key--blocked"></i> Communication bloquée</span><span><i class="dmz-motion__key dmz-motion__key--relay"></i> DHCP relayé</span></div>'+
  '<div class="dmz-motion__log"><div class="dmz-motion__loghead"><strong>DMZ et DHCP</strong><span class="dmz-motion__stage"></span></div><ol class="dmz-motion__history" role="log" aria-label="Étapes de l’animation" aria-live="polite" aria-relevant="additions"></ol></div>';
  const modes=[...host.querySelectorAll('.dmz-motion__mode')],play=host.querySelector('.dmz-motion__play'),toggle=host.querySelector('.dmz-motion__toggle'),helper=host.querySelector('.dmz-motion__helper-input'),helperValue=host.querySelector('.dmz-motion__helper-value'),layer=host.querySelector('.dmz-motion__packets'),flows=host.querySelector('.dmz-motion__flows'),log=host.querySelector('.dmz-motion__history'),stage=host.querySelector('.dmz-motion__stage'),fwState=host.querySelector('.dmz-motion__helper'),phoneIP=host.querySelector('.dmz-motion__ip'),scope=host.querySelector('.dmz-motion__scope');
  let current='zones',runId=0,disabled=false;
  host.dataset.dmzInstance=String([...hosts].indexOf(host)+1);
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const active=token=>token===runId;
  const sleep=(ms,token)=>new Promise(resolve=>{const id=setTimeout(()=>resolve(active(token)),ms);});
  function reset(){
   runId++;layer.replaceChildren();flows.replaceChildren();log.replaceChildren();stage.textContent='';
   phoneIP.textContent='DHCP';scope.classList.remove('dmz-motion__scope--active');
   fwState.textContent='IP helper : '+(helper.checked?'ON':'OFF');
   helperValue.textContent=helper.checked?'ON':'OFF';
   play.disabled=false;helper.disabled=false;disabled=false;play.textContent='▶ Lancer l’animation';
   toggle.hidden=current!=='dhcp';
   modes.forEach(el=>{const yes=el.dataset.mode===current;el.classList.toggle('dmz-motion__mode--active',yes);el.setAttribute('aria-pressed',String(yes));el.disabled=false;});
  }
  function entry(label,desc){
   const li=document.createElement('li'),strong=document.createElement('strong'),span=document.createElement('span');
   strong.textContent=label;span.textContent=desc;li.append(strong,span);log.append(li);log.scrollTop=log.scrollHeight;
  }
  function move(pts,type,tag,token,stopAt=1){
   if(!active(token))return Promise.resolve(false);
   const dot=document.createElementNS(NS,'circle'),t=document.createElementNS(NS,'text');
   dot.setAttribute('r','7');dot.setAttribute('class','dmz-motion__packet dmz-motion__packet--'+type);
   t.setAttribute('class','dmz-motion__packet-letter');t.textContent=tag;layer.append(dot,t);
   const points=pts.map(p=>[...p]);const lens=[];let sum=0;
   for(let i=1;i<points.length;i++){const len=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lens.push(len);sum+=len;}
   const duration=reduced()?240:Math.min(1900,Math.max(550,sum*2.4)),start=performance.now();
   return new Promise(resolve=>{
    function tick(now){
     if(!active(token)){dot.remove();t.remove();resolve(false);return;}
     let rem=Math.min(stopAt,(now-start)/duration)*sum,j=0;
     while(j<lens.length-1&&rem>lens[j]){rem-=lens[j];j++;}
     const a=points[j],b=points[j+1],f=lens[j]?Math.min(1,rem/lens[j]):0,x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f;
     dot.setAttribute('cx',x);dot.setAttribute('cy',y);t.setAttribute('x',x);t.setAttribute('y',y-12);
     if(now-start<duration*stopAt)requestAnimationFrame(tick);
     else{dot.remove();t.remove();resolve(true);}
    }
    requestAnimationFrame(tick);
   });
  }
  // Flèches permanentes. Les chemins aboutissent aux interfaces du pare-feu,
  // et les directions bloquées s'arrêtent au pare-feu (pas dans le LAN).
  // Les deux accès Internet de retour sont des réponses à des sessions établies.
  const flowSteps=[
   {
    name:'DMZ → Internet', description:'Le patient accède à Internet depuis le Wi-Fi visiteurs.',
    d:'M343 205 L352 184 L274 166 L266 93 L258 49',
    result:'allowed'
   },
   {
    name:'Internet → DMZ',description:'Les réponses aux connexions ouvertes par les patients peuvent revenir. Ce n’est pas un accès libre depuis Internet.',
    d:'M274 49 L287 94 L292 165 L368 183 L361 205',
    result:'allowed'
   },
   {
    name:'LAN → Internet',description:'Les ordinateurs du cabinet peuvent accéder à Internet.',
    d:'M90 205 L67 182 L146 170 L155 153 L160 93 L162 49',
    result:'allowed'
   },
   {
    name:'Internet → LAN',description:'Une connexion entrante non sollicitée depuis Internet est bloquée par le pare-feu.',
    d:'M194 49 L194 88',result:'blocked',x:194,y:88
   },
   {
    name:'LAN → DMZ',description:'Dans notre exemple, le cabinet peut joindre le réseau d’accueil en passant par le pare-feu.',
    d:'M168 205 L165 181 L183 156 L231 156 L254 182 L254 205',
    result:'allowed'
   },
   {
    name:'DMZ → LAN',description:'Le Wi-Fi patients ne peut pas accéder librement au LAN médical.',
    d:'M287 205 L287 183 L262 162',result:'blocked',x:262,y:162
   }
  ];
  function svgElement(tag,attrs){
   const el=document.createElementNS(NS,tag);
   for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));
   return el;
  }
  function setupFlowMarkers(){
   const defs=svgElement('defs',{});
   for(const kind of ['allowed','blocked']){
    const marker=svgElement('marker',{
     id:'dmz-'+kind+'-'+host.dataset.dmzInstance,
     markerWidth:8,markerHeight:8,refX:7,refY:4,
     orient:'auto',markerUnits:'userSpaceOnUse'
    });
    marker.append(svgElement('path',{d:'M0 0 L8 4 L0 8 Z',class:'dmz-motion__arrowhead dmz-motion__arrowhead--'+kind}));
    defs.append(marker);
   }
   flows.append(defs);
  }
  async function revealFlow(step,token){
   if(!active(token))return false;
   const path=svgElement('path',{
    d:step.d,
    class:'dmz-motion__flow dmz-motion__flow--'+step.result,
    'marker-end':'url(#dmz-'+step.result+'-'+host.dataset.dmzInstance+')'
   });
   flows.append(path);
   const len=path.getTotalLength();
   const duration=reduced()?0:850;
   // La flèche se dessine progressivement et reste affichée après l'étape.
   path.style.strokeDasharray=String(len);
   path.style.strokeDashoffset=String(len);
   path.getBoundingClientRect();
   path.style.transition='stroke-dashoffset '+duration+'ms ease-out';
   path.style.strokeDashoffset='0';
   if(!await sleep(duration+60,token))return false;
   if(step.result==='blocked'){
    const cross=svgElement('text',{
     x:step.x,y:step.y-7,
     class:'dmz-motion__flow-cross',
     'text-anchor':'middle','aria-label':'Bloqué'
    });
    cross.textContent='×';flows.append(cross);
   }
   return true;
  }
  async function animateZones(token){
   setupFlowMarkers();
   entry('Zones séparées','Le pare-feu contrôle les communications entre Internet, le LAN médical et le Wi-Fi des patients. Les flèches illustrent les règles choisies pour ce cabinet.');
   for(const step of flowSteps){
    if(!active(token))return;
    stage.textContent=step.name;
    entry(step.name,step.description);
    if(!await revealFlow(step,token))return;
    if(!await sleep(reduced()?90:200,token))return;
   }
   entry('À retenir','Vert : échanges autorisés dans le sens de la flèche. Rouge : tentative bloquée. Le Wi-Fi patients ne peut pas accéder au LAN médical.');
  }
  async function animateDhcp(token,relayOn){
   stage.textContent='Discover';
   entry('Discover','Le smartphone diffuse un Discover sur le Wi-Fi. Le point d’accès transmet la demande dans la DMZ.');
   if(!await move(seg.discover,'local','D',token))return;
   if(!relayOn){entry('IP helper désactivé','Le broadcast ne traverse pas le pare-feu jusqu’au serveur DHCP du LAN. Le smartphone reste sans adresse.');return;}
   stage.textContent='Relais DHCP';
   entry('Relais DHCP','L’interface DMZ du pare-feu relaie la demande en unicast au serveur DHCP du LAN. Le réseau d’origine est identifié par giaddr.');
   if(!await move(seg.relay,'relay','D',token))return;
   scope.classList.add('dmz-motion__scope--active');
   entry('Étendue visiteurs','Le serveur sélectionne 192.168.50.100 à .150 et propose un bail de 1 heure.');
   if(!await sleep(reduced()?130:480,token))return;
   stage.textContent='Offer';
   entry('Offer','Le serveur propose 192.168.50.100. La réponse revient par le pare-feu et le Wi-Fi.');
   if(!await move(seg.response,'relay','O',token))return;
   stage.textContent='Request';
   entry('Request','Le smartphone diffuse son Request dans la DMZ, puis le pare-feu le relaie vers le serveur.');
   if(!await move(seg.discover,'local','R',token))return;
   if(!await move(seg.relay,'relay','R',token))return;
   stage.textContent='ACK';
   entry('ACK','Le serveur confirme le bail de 1 heure et la réponse revient au smartphone.');
   if(!await move(seg.response,'relay','A',token))return;
   phoneIP.textContent='192.168.50.100';
   scope.classList.remove('dmz-motion__scope--active');
   entry('À retenir','Le pare-feu relaie les messages DHCP sans donner aux visiteurs l’accès aux PC du cabinet.');
  }
  modes.forEach(el=>el.addEventListener('click',()=>{if(disabled)return;current=el.dataset.mode;reset();}));
  helper.addEventListener('change',reset);
  play.addEventListener('click',async()=>{
   if(disabled)return;
   reset();const token=runId;disabled=true;play.disabled=true;helper.disabled=true;modes.forEach(el=>el.disabled=true);play.textContent='▶ Animation en cours';
   const mode=current,relayOn=helper.checked;
   try{if(mode==='zones')await animateZones(token);else await animateDhcp(token,relayOn);}
   finally{if(active(token)){disabled=false;play.disabled=false;helper.disabled=false;modes.forEach(el=>el.disabled=false);play.textContent='↻ Rejouer l’animation';stage.textContent='Terminé';}}
  });
  const chapter=host.closest('details.chapter');chapter?.addEventListener('toggle',()=>{if(!chapter.open)reset();});
  window.addEventListener('pagehide',()=>{runId++;layer.replaceChildren();flows.replaceChildren();});
  reset();
 });
})();