/* C² - VPN et DHCP : même langue graphique que le chapitre VLAN.
   Deux sites distants, routeurs-relais DHCP, tunnel intersite, serveur central Rennes.
   Modèle pédagogique : diffusion locale, relayage (giaddr) et DORA complet. */
(() => {
 'use strict';
 const ns='http://www.w3.org/2000/svg';
 const sites=[
  {name:'Pacé',net:'192.168.20.0/24',ip:'192.168.20.100',scope:'pace',left:true},
  {name:'Bruz',net:'192.168.30.0/24',ip:'192.168.30.100',scope:'bruz',left:false}
 ];
 const pcSVG='<rect x="-17" y="-15" width="34" height="24" rx="3" fill="#315f83" stroke="#79b0d0" stroke-width="1.8"/><rect x="-12" y="-11" width="24" height="16" fill="#d0ecff"/><path d="M0 9v7m-12 2h24" stroke="#658ba7" stroke-width="3"/>';
 const gateSVG='<rect x="-21" y="-15" width="42" height="30" rx="5" fill="#526e83" stroke="#91b6c9" stroke-width="2"/><path d="M-13 -5h26M-13 5h26" stroke="#d8eaf6" stroke-width="3"/>';
 function svg(){
  let s='<svg class="vpn-motion__svg" viewBox="0 0 420 490" role="img" aria-label="Deux sites distants, Pacé et Bruz, avec chacun un PC et un routeur relais DHCP. Leurs tunnels VPN traversent Internet vers le siège de Rennes, qui héberge un serveur DHCP avec trois étendues.">';
  const groups=[{x:6,center:104,pc:53,gw:151,name:'PACÉ',net:sites[0].net,cls:'vpn-motion__pace'},
                {x:216,center:314,pc:263,gw:361,name:'BRUZ',net:sites[1].net,cls:'vpn-motion__bruz'}];
  groups.forEach((g,i)=>{
   s+='<rect x="'+g.x+'" y="5" width="198" height="150" rx="12" class="vpn-motion__site '+g.cls+'"/>';
   s+='<text x="'+g.center+'" y="28" text-anchor="middle" class="vpn-motion__heading">'+g.name+'</text>';
   s+='<text x="'+g.center+'" y="45" text-anchor="middle" class="vpn-motion__small">'+g.net+'</text>';
   s+='<g transform="translate('+g.pc+' 78)">'+pcSVG+'</g>';
   s+='<g transform="translate('+g.gw+' 78)">'+gateSVG+'</g>';
   s+='<path d="M'+(g.pc+17)+' 78 H'+(g.gw-21)+'" class="vpn-motion__lan"/>';
   s+='<text x="'+g.pc+'" y="115" text-anchor="middle" class="vpn-motion__small">PC</text>';
   s+='<text x="'+g.pc+'" y="131" text-anchor="middle" class="vpn-motion__pc-ip" data-pc="'+i+'">DHCP</text>';
   s+='<text x="'+g.gw+'" y="114" text-anchor="middle" class="vpn-motion__small">Routeur VPN</text>';
   s+='<text x="'+g.gw+'" y="130" text-anchor="middle" class="vpn-motion__helper-state" data-helper-state="'+i+'">Helper : ON</text>';
   s+='<path d="M'+g.gw+' 155 V174 L210 210" class="vpn-motion__tunnel vpn-motion__tunnel--'+i+'"/>';
  });
  s+='<rect x="151" y="184" width="118" height="52" rx="22" class="vpn-motion__internet"/>';
  s+='<text x="210" y="205" text-anchor="middle" class="vpn-motion__heading">Internet</text>';
  s+='<text x="210" y="220" text-anchor="middle" class="vpn-motion__small">Tunnels VPN</text>';
  s+='<path d="M210 236 V261" class="vpn-motion__tunnel vpn-motion__tunnel--hq"/>';
  s+='<rect x="5" y="261" width="410" height="220" rx="12" class="vpn-motion__hq"/>';
  s+='<text x="210" y="284" text-anchor="middle" class="vpn-motion__heading">RENNES · SIÈGE</text>';
  s+='<text x="210" y="302" text-anchor="middle" class="vpn-motion__small">192.168.10.0/24</text>';
  s+='<text x="210" y="324" text-anchor="middle" class="vpn-motion__heading">Serveur DHCP central</text>';
  s+='<text x="210" y="341" text-anchor="middle" class="vpn-motion__small">192.168.10.10</text>';
  s+='<text x="20" y="363" class="vpn-motion__scope-head">Étendues DHCP gérées</text>';
  [['Rennes','192.168.10.100 à .200','rennes'],['Pacé','192.168.20.100 à .200','pace'],['Bruz','192.168.30.100 à .200','bruz']].forEach((v,i)=>{
   const y=372+i*32;
   s+='<rect x="19" y="'+y+'" width="382" height="28" rx="6" class="vpn-motion__scope" data-scope="'+v[2]+'"/>';
   s+='<text x="31" y="'+(y+18)+'" class="vpn-motion__scope-label">'+v[0]+'</text>';
   s+='<text x="157" y="'+(y+18)+'" class="vpn-motion__scope-range">'+v[1]+'</text>';
  });
  return s+'<g class="vpn-motion__packets"></g></svg>';
 }
 function route(site,stage){
  const left=site.left,c=left?151:361,p=left?53:263;
  const localOut=[[p+17,78],[c-21,78]];
  const localIn=[[c,93],[c-21,78],[p+17,78]];
  const fromGw=[[c,93],[c,155],[210,210],[210,261],[210,309]];
  const toGw=[...fromGw].reverse();
  return {discover:localOut,relay:fromGw,offerRelay:toGw,offerClient:localIn,request:localOut,requestRelay:fromGw,ackRelay:toGw,ackClient:localIn}[stage];
 }
 document.querySelectorAll('[data-dhcp-vpn]').forEach(host=>{
  host.classList.add('vpn-motion');
  host.innerHTML='<div class="vpn-motion__controls"><span class="vpn-motion__controls-label">IP helper</span><label class="vpn-motion__toggle"><span>Pacé</span><input type="checkbox" class="vpn-motion__enabled" data-helper="0" role="switch" checked><span class="vpn-motion__toggle-label" data-helper-label="0">ON</span></label><label class="vpn-motion__toggle"><span>Bruz</span><input type="checkbox" class="vpn-motion__enabled" data-helper="1" role="switch" checked><span class="vpn-motion__toggle-label" data-helper-label="1">ON</span></label><button type="button" class="vpn-motion__play">▶ Lancer l’animation</button></div>'+
    '<div class="vpn-motion__canvas">'+svg()+'</div>'+
    '<div class="vpn-motion__legend"><span><i class="vpn-motion__dot vpn-motion__dot--local"></i> Broadcast DHCP local</span><span><i class="vpn-motion__dot vpn-motion__dot--vpn"></i> Relais DHCP via VPN</span></div>'+
    '<div class="vpn-motion__readout"><div class="vpn-motion__readout-head"><strong>DHCP entre sites via VPN</strong><span class="vpn-motion__counter"></span></div><ol class="vpn-motion__history" role="log" aria-live="polite" aria-relevant="additions" aria-label="Messages observés"></ol></div>';
  const helpers=[...host.querySelectorAll('[data-helper]')],helperLabels=[...host.querySelectorAll('[data-helper-label]')],helperStates=[...host.querySelectorAll('[data-helper-state]')],button=host.querySelector('.vpn-motion__play');
  const layer=host.querySelector('.vpn-motion__packets'),history=host.querySelector('.vpn-motion__history'),counter=host.querySelector('.vpn-motion__counter');
  const svgRoot=host.querySelector('svg');
  let epoch=0,timers=new Set(),running=false;
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const cancel=()=>{epoch++;timers.forEach(clearTimeout);timers.clear();layer.replaceChildren();button.disabled=false;helpers.forEach(el=>el.disabled=false);running=false;};
  function delay(ms,token){return new Promise(resolve=>{const id=setTimeout(()=>{timers.delete(id);resolve(token===epoch)},ms);timers.add(id);});}
  function add(label,body){
   const li=document.createElement('li'),b=document.createElement('strong'),span=document.createElement('span');
   b.textContent=label;span.textContent=body;li.append(b,span);history.append(li);
   history.scrollTop=history.scrollHeight;
  }
  function mark(scope,on){host.querySelector('[data-scope="'+scope+'"]').classList.toggle('vpn-motion__scope--active',on);}
  function reset(){
   cancel();history.replaceChildren();counter.textContent='';
   sites.forEach((site,i)=>{host.querySelector('[data-pc="'+i+'"]').textContent='DHCP';mark(site.scope,false);});
   helpers.forEach((el,i)=>{
    const value=el.checked?'ON':'OFF';
    helperLabels[i].textContent=value;
    helperStates[i].textContent='Helper : '+value;
    helperStates[i].classList.toggle('vpn-motion__helper-state--off',!el.checked);
   });
   button.textContent='▶ Lancer l’animation';
  }
  async function move(points,type,label,token){
   if(token!==epoch)return false;
   const node=document.createElementNS(ns,'circle'),txt=document.createElementNS(ns,'text');
   node.setAttribute('r','7');node.setAttribute('class','vpn-motion__packet vpn-motion__packet--'+type);
   txt.setAttribute('class','vpn-motion__packet-text');txt.textContent=label;layer.append(node,txt);
   let lengths=[],total=0;for(let i=1;i<points.length;i++){const l=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(l);total+=l;}
   const duration=reduced()?250:Math.min(1900,Math.max(500,total*2.5)),start=performance.now();
   return new Promise(resolve=>{
    function tick(now){
     if(token!==epoch){node.remove();txt.remove();resolve(false);return;}
     let remaining=Math.min(1,(now-start)/duration)*total,i=0;
     while(i<lengths.length-1&&remaining>lengths[i]){remaining-=lengths[i];i++;}
     const a=points[i],b=points[i+1],portion=lengths[i]?Math.min(1,remaining/lengths[i]):0;
     const x=a[0]+(b[0]-a[0])*portion,y=a[1]+(b[1]-a[1])*portion;
     node.setAttribute('cx',x);node.setAttribute('cy',y);txt.setAttribute('x',x);txt.setAttribute('y',y-12);
     if(now-start<duration)requestAnimationFrame(tick);
     else{node.remove();txt.remove();resolve(true);}
    }
    requestAnimationFrame(tick);
   });
  }
  helpers.forEach(el=>el.addEventListener('change',reset));
  async function play(){
   reset();const token=epoch,active=helpers.map(el=>el.checked);running=true;helpers.forEach(el=>el.disabled=true);button.disabled=true;button.textContent='▶ Animation en cours';
   const gap=reduced()?180:450;
   try{
    for(const [index,site] of sites.entries()){
     if(token!==epoch)break;
     counter.textContent=site.name;
     add('Discover · '+site.name,'Le PC de '+site.name+' diffuse un DHCP Discover sur son réseau local. Le routeur reçoit ce broadcast.');
     if(!await move(route(site,'discover'),'local','D',token))break;
     if(!active[index]){
      add('IP helper désactivé','Le tunnel VPN de '+site.name+' fonctionne, mais son routeur ne relaie pas le Discover. Le serveur de Rennes ne reçoit aucune demande DHCP.');
      if(!await delay(gap,token))break;
      if(token!==epoch)break;
      host.querySelector('[data-pc="'+index+'"]').textContent='APIPA';
      add('APIPA · '+site.name,'Après l’échec des tentatives DHCP, le PC de '+site.name+' utilise une adresse automatique 169.254.x.x/16, sans passerelle.');
      continue;
     }
     add('Relais DHCP','La passerelle de '+site.name+' relaie le Discover vers Rennes en unicast à travers le tunnel VPN (giaddr identifie le réseau client).');
     if(!await move(route(site,'relay'),'vpn','D',token))break;
     mark(site.scope,true);
     add('Étendue de '+site.name,'Le serveur central choisit la plage '+site.net+' pour répondre au client de '+site.name+'.');
     if(!await delay(gap,token))break;
     add('Offer','Le serveur propose '+site.ip+'. L’Offer revient au client par le tunnel VPN et le relais DHCP.');
     if(!await move(route(site,'offerRelay'),'vpn','O',token))break;
     if(!await move(route(site,'offerClient'),'local','O',token))break;
     add('Request','Le client diffuse un Request local. Le routeur le relaie vers Rennes via le VPN.');
     if(!await move(route(site,'request'),'local','R',token))break;
     if(!await move(route(site,'requestRelay'),'vpn','R',token))break;
     add('ACK','Le serveur confirme le bail ; l’ACK revient vers le PC de '+site.name+' via le relais.');
     if(!await move(route(site,'ackRelay'),'vpn','A',token))break;
     if(!await move(route(site,'ackClient'),'local','A',token))break;
     host.querySelector('[data-pc="'+sites.indexOf(site)+'"]').textContent=site.ip;
     mark(site.scope,false);
     if(!await delay(gap,token))break;
    }
    if(token!==epoch)return;
    counter.textContent='Animation terminée';
    const success=active.filter(Boolean).length;
    add('Bilan',success===2?'Pacé et Bruz ont obtenu leurs adresses depuis le serveur DHCP de Rennes.':success===0?'Les VPN fonctionnent, mais aucun routeur ne relaie les demandes DHCP : les deux PC passent en APIPA.':'Le VPN fonctionne sur les deux sites, mais seul le site dont l’IP helper est activé reçoit une adresse DHCP. L’autre PC passe en APIPA.');
   }finally{if(token===epoch){running=false;helpers.forEach(el=>el.disabled=false);button.disabled=false;button.textContent='↻ Rejouer l’animation';}}
  }
  button.addEventListener('click',()=>{if(!running)play();});
  const chapter=host.closest('details.chapter');chapter?.addEventListener('toggle',()=>{if(!chapter.open)reset();});
  window.addEventListener('pagehide',cancel);
 });
})();