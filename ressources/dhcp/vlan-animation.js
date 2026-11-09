/* C² : animation VLAN + relais DHCP. Référence graphique : DORA.
 * Démonstration pédagogique : 2 PC / VLAN, 5 ports physiques, SVI et 3 étendues.
 */
(() => {
 'use strict';
 const svgNS='http://www.w3.org/2000/svg';
 const hosts=document.querySelectorAll('[data-dhcp-vlan]');
 const pcIcon='<svg viewBox="0 0 64 55" aria-hidden="true"><rect x="8" y="5" width="48" height="32" rx="4" fill="#284e73" stroke="#7db4df" stroke-width="2"/><rect x="13" y="10" width="38" height="22" rx="2" fill="#d6edfc"/><path d="M32 37v9M20 48h24" fill="none" stroke="#7595b6" stroke-width="4" stroke-linecap="round"/></svg>';
 const pcRows=[{id:1,v:10,port:1,y:68},{id:2,v:10,port:2,y:125},{id:3,v:20,port:3,y:238},{id:4,v:20,port:4,y:295}];
 const entry={10:{start:68,other:125,origin:1,otherPort:2,ip:'10.10.0.100',scope:'v10'},20:{start:238,other:295,origin:3,otherPort:4,ip:'10.20.0.100',scope:'v20'}};
 const path=(pts,color,thickness=3)=>'<polyline points="'+pts.map(p=>p.join(',')).join(' ')+'" stroke="'+color+'" stroke-width="'+thickness+'" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
 function frame(){
  return '<svg class="vlan-motion__svg" viewBox="0 0 980 355" role="img" aria-label="Deux PC dans le VLAN 10 sur les ports 1 et 2, deux PC dans le VLAN 20 sur les ports 3 et 4. Le serveur DHCP du VLAN 99 est sur le port 5. Le switch L3 réalise le relais DHCP via les interfaces VLAN.">'+
  '<rect x="4" y="13" width="259" height="154" rx="11" fill="#2387bf" fill-opacity=".08" stroke="#438fbe" stroke-dasharray="5 4"/>'+
  '<rect x="4" y="184" width="259" height="159" rx="11" fill="#2b987b" fill-opacity=".08" stroke="#2b987b" stroke-dasharray="5 4"/>'+
  '<text x="20" y="35" class="vlan-motion__net vlan-motion__blue">VLAN 10 · 10.10.0.0/24</text>'+
  '<text x="20" y="207" class="vlan-motion__net vlan-motion__green">VLAN 20 · 10.20.0.0/24</text>'+
  '<rect x="345" y="17" width="264" height="325" rx="13" class="vlan-motion__switch"/>'+
  '<text x="477" y="43" text-anchor="middle" class="vlan-motion__label">SWITCH L3</text>'+
  '<rect x="423" y="151" width="115" height="61" rx="7" class="vlan-motion__svi-box"/>'+
  '<text x="480" y="168" text-anchor="middle" class="vlan-motion__svi-label">Interfaces VLAN</text>'+
  '<text x="480" y="185" text-anchor="middle" class="vlan-motion__svi-label">SVI 10 et 20</text>'+
  '<text x="480" y="201" text-anchor="middle" class="vlan-motion__svi-state">Relais : OFF</text>'+
  '<rect x="659" y="67" width="315" height="263" rx="12" class="vlan-motion__server-card"/>'+
  '<text x="816" y="91" class="vlan-motion__label" text-anchor="middle">SERVEUR DHCP · VLAN 99</text>'+
  '<text x="816" y="110" class="vlan-motion__sub" text-anchor="middle">IP fixe : 10.99.0.10</text>'+
  '<text x="678" y="139" class="vlan-motion__scope-head">Étendues DHCP centralisées</text>'+
  '<rect x="673" y="151" width="286" height="38" rx="7" class="vlan-motion__scope" data-scope="v10"/>'+
  '<rect x="673" y="194" width="286" height="38" rx="7" class="vlan-motion__scope" data-scope="v20"/>'+
  '<rect x="673" y="237" width="286" height="38" rx="7" class="vlan-motion__scope" data-scope="v99"/>'+
  '<text x="688" y="166" class="vlan-motion__scope-name">VLAN 10</text><text x="688" y="181" class="vlan-motion__scope-address">10.10.0.100 à .200</text>'+
  '<text x="688" y="209" class="vlan-motion__scope-name">VLAN 20</text><text x="688" y="224" class="vlan-motion__scope-address">10.20.0.100 à .200</text>'+
  '<text x="688" y="252" class="vlan-motion__scope-name">VLAN 99</text><text x="688" y="267" class="vlan-motion__scope-address">10.99.0.100 à .150</text>'+
  '<text x="815" y="306" class="vlan-motion__sub" text-anchor="middle">Un serveur, trois étendues</text>'+
  pcRows.map(p=>{
    const col=p.v===10?'#338dc6':'#329b7b';
    return path([[155,p.y],[339,p.y]],col,2)+
    '<g class="vlan-motion__pc" data-pc="'+p.id+'">'+
      '<rect x="25" y="'+(p.y-22)+'" width="29" height="22" rx="2" fill="#315f83" stroke="#79b0d0" stroke-width="1.5"/>'+
      '<rect x="29" y="'+(p.y-18)+'" width="21" height="14" fill="#d0ecff"/>'+
      '<path d="M39 '+p.y+' v6 m-11 1 h22" stroke="#658ba7" stroke-width="2.3"/>'+
      '<text x="65" y="'+(p.y-6)+'" class="vlan-motion__pc-name">PC'+p.id+'</text>'+
      '<text x="65" y="'+(p.y+11)+'" class="vlan-motion__pc-ip" data-ip="'+p.id+'">'+(p.id===2||p.id===4?'Témoin':'DHCP')+'</text>'+
    '</g>'+
    '<rect x="334" y="'+(p.y-11)+'" width="24" height="22" rx="3" class="vlan-motion__port '+(p.v===10?'vlan-motion__port--10':'vlan-motion__port--20')+'" data-port="'+p.port+'"/>'+
    '<text x="346" y="'+(p.y+5)+'" class="vlan-motion__port-num" text-anchor="middle">'+p.port+'</text>';
   }).join('')+
  path([[609,179],[654,179]],'#8b83ba',3)+
  '<rect x="598" y="167" width="24" height="24" rx="3" class="vlan-motion__port vlan-motion__port--99" data-port="5"/>'+
  '<text x="610" y="183" text-anchor="middle" class="vlan-motion__port-num">5</text>'+
  '<text x="627" y="160" class="vlan-motion__port-hint">VLAN 99</text>'+
  '<g class="vlan-motion__packets"></g></svg>';
 }

 // Compactage géométrique mobile : coordonnées verticales réduites, sans écraser les textes.
 function mobileY(y){return Math.round(y<=45?y:y<=182?45+(y-45)*.78:y<=417?152+(y-182)*.76:331+(y-417)*.79);}
 function mobileFrame(){
  const mobPC=[
   {id:1,v:10,x:26,y:61,port:1,px:85},
   {id:2,v:10,x:26,y:119,port:2,px:155},
   {id:3,v:20,x:239,y:61,port:3,px:265},
   {id:4,v:20,x:239,y:119,port:4,px:335}
  ];
  return '<svg class="vlan-motion__svg vlan-motion__svg--mobile" viewBox="0 0 420 397" role="img" aria-label="Deux VLAN clients en haut, chacun avec deux PC et deux ports physiques du switch L3 au centre. Le port 5 relie le switch au serveur DHCP du VLAN 99 en bas.">'+
   '<rect x="5" y="7" width="199" height="145" rx="11" fill="#2387bf" fill-opacity=".08" stroke="#438fbe" stroke-dasharray="5 4"/>'+
   '<rect x="216" y="7" width="199" height="145" rx="11" fill="#2b987b" fill-opacity=".08" stroke="#2b987b" stroke-dasharray="5 4"/>'+
   '<text x="14" y="29" class="vlan-motion__net vlan-motion__blue">VLAN 10</text><text x="14" y="45" class="vlan-motion__sub">10.10.0.0/24</text>'+
   '<text x="225" y="29" class="vlan-motion__net vlan-motion__green">VLAN 20</text><text x="225" y="45" class="vlan-motion__sub">10.20.0.0/24</text>'+
   mobPC.map(p=>{
    const col=p.v===10?'#338dc6':'#329b7b';
    const srcX=p.v===10?117:328,yy=mobileY(p.y+15);
    return path([[srcX,yy],[srcX,152],[p.px,152],[p.px,165]],col,2)+
      '<g class="vlan-motion__pc" data-pc="'+p.id+'">'+
       '<rect x="'+p.x+'" y="'+mobileY(p.y)+'" width="29" height="22" rx="2" fill="#315f83" stroke="#79b0d0" stroke-width="1.5"/>'+
       '<rect x="'+(p.x+4)+'" y="'+mobileY(p.y+4)+'" width="21" height="14" fill="#d0ecff"/>'+
       '<path d="M'+(p.x+14)+' '+mobileY(p.y+22)+' v6 m-11 1 h22" stroke="#658ba7" stroke-width="2.3"/>'+
       '<text x="'+(p.x+38)+'" y="'+mobileY(p.y+11)+'" class="vlan-motion__pc-name">PC'+p.id+'</text>'+
       '<text x="'+(p.x+38)+'" y="'+mobileY(p.y+28)+'" class="vlan-motion__pc-ip" data-ip="'+p.id+'">'+(p.id===2||p.id===4?'Témoin':'DHCP')+'</text></g>';
   }).join('')+
   '<rect x="5" y="157" width="410" height="80" rx="12" class="vlan-motion__switch"/>'+
   '<text x="157" y="212" class="vlan-motion__label" text-anchor="middle">SWITCH L3</text>'+
   ''+
   ''+
   ''+
   '<text x="315" y="212" text-anchor="middle" class="vlan-motion__svi-state">Relais : OFF</text>'+
   mobPC.map(p=>'<rect x="'+(p.px-12)+'" y="165" width="24" height="22" rx="3" class="vlan-motion__port '+(p.v===10?'vlan-motion__port--10':'vlan-motion__port--20')+'" data-port="'+p.port+'"/>'+
   '<text x="'+p.px+'" y="180" class="vlan-motion__port-num" text-anchor="middle">'+p.port+'</text>').join('')+
   path([[210,227],[210,251]],'#8b83ba',3)+
   '<rect x="198" y="223" width="24" height="22" rx="3" class="vlan-motion__port vlan-motion__port--99" data-port="5"/>'+
   '<text x="210" y="239" class="vlan-motion__port-num" text-anchor="middle">5</text>'+
   '<rect x="5" y="250" width="410" height="140" rx="12" class="vlan-motion__server-card"/>'+
   '<text x="210" y="268" class="vlan-motion__label" text-anchor="middle">SERVEUR DHCP · VLAN 99</text>'+
   '<text x="210" y="284" class="vlan-motion__sub" text-anchor="middle">IP fixe : 10.99.0.10</text>'+
   '<text x="22" y="304" class="vlan-motion__scope-head">Étendues DHCP centralisées</text>'+
   '<rect x="20" y="310" width="380" height="23" rx="7" class="vlan-motion__scope" data-scope="v10"/>'+
   '<rect x="20" y="336" width="380" height="23" rx="7" class="vlan-motion__scope" data-scope="v20"/>'+
   '<rect x="20" y="362" width="380" height="23" rx="7" class="vlan-motion__scope" data-scope="v99"/>'+
   '<text x="32" y="326" class="vlan-motion__scope-name">VLAN 10</text><text x="157" y="326" class="vlan-motion__scope-address">10.10.0.100 à .200</text>'+
   '<text x="32" y="352" class="vlan-motion__scope-name">VLAN 20</text><text x="157" y="352" class="vlan-motion__scope-address">10.20.0.100 à .200</text>'+
   '<text x="32" y="378" class="vlan-motion__scope-name">VLAN 99</text><text x="157" y="378" class="vlan-motion__scope-address">10.99.0.100 à .150</text>'+
   ''+
   '<g class="vlan-motion__packets"></g></svg>';
 }
 function isMobile(){return window.matchMedia('(max-width:600px)').matches;}
 function route(v,stage){
  const d=entry[v];
  if(!isMobile()){
   const from=[[155,d.start],[334,d.start]],
     flood=[[342,d.start],[387,d.start],[387,d.other],[342,d.other],[155,d.other]],
     relay=[[387,d.start],[477,d.start],[477,179],[610,179],[660,179]],
     reply=[[660,179],[610,179],[477,179],[477,d.start],[342,d.start],[155,d.start]],
     request=[[155,d.start],[342,d.start]],
     reqRelay=[[342,d.start],[477,d.start],[477,179],[610,179],[660,179]];
   return {discover:from,broadcast:flood,relay,offer:reply,request,requestFlood:flood,requestRelay:reqRelay,ack:reply}[stage];
  }
  const origin=v===10?[117,76]:[328,76],other=v===10?[117,134]:[328,134];
  const p=v===10?85:265,q=v===10?155:335;
  const ingress=[[origin[0],origin[1]],[origin[0],152],[p,152],[p,165]],
    local=[[p,187],[p,204],[q,204],[q,187],[q,152],[other[0],152],other],
    unicast=[[p,187],[p,218],[210,218],[210,234],[210,250]],
    back=[[210,250],[210,234],[210,218],[p,218],[p,187],[p,152],[origin[0],152],origin],
    request=ingress,
    requestRelay=[[p,187],[p,218],[210,218],[210,234],[210,250]];
  return {discover:ingress,broadcast:local,relay:unicast,offer:back,request,requestFlood:local,requestRelay,ack:back}[stage];
 }

 hosts.forEach(host=>{
  host.classList.add('vlan-motion');
  host.innerHTML='<div class="vlan-motion__controls"><label class="vlan-motion__toggle"><span>IP helper</span><input type="checkbox" class="vlan-motion__helper" role="switch"><span class="vlan-motion__toggle-status">OFF</span></label><button type="button" class="vlan-motion__play">▶ Lancer l’animation</button></div>'+
  '<div class="vlan-motion__canvas">'+frame()+mobileFrame()+'</div>'+
  '<div class="vlan-motion__legend"><span><i class="vlan-motion__key vlan-motion__key--broadcast"></i> Broadcast dans le VLAN</span><span><i class="vlan-motion__key vlan-motion__key--relay"></i> Relais DHCP en unicast</span></div>'+
  '<div class="vlan-motion__readout"><div class="vlan-motion__readout-head"><strong>Diffusion des broadcasts et relais DHCP</strong><span class="vlan-motion__counter"></span></div><p class="vlan-motion__note" role="status" aria-live="polite">PC1 et PC3 demandent une adresse. PC2 et PC4 observent les broadcasts.</p><ol class="vlan-motion__history" aria-label="Messages observés"></ol></div>';
  const toggle=host.querySelector('.vlan-motion__helper'),state=host.querySelector('.vlan-motion__toggle-status'),play=host.querySelector('.vlan-motion__play'),canvas=host.querySelector('.vlan-motion__canvas'),noteAnchor=host.querySelector('.vlan-motion__readout'),note=host.querySelector('.vlan-motion__note'),history=host.querySelector('.vlan-motion__history'),counter=host.querySelector('.vlan-motion__counter'),svi=host.querySelector('.vlan-motion__svi-state');
  let epoch=0,timers=new Set(),frames=new Set(),running=false;
  const stopped=()=>{epoch++;for(const t of timers)clearTimeout(t);timers.clear();for(const f of frames)cancelAnimationFrame(f);frames.clear();host.querySelectorAll('.vlan-motion__packets').forEach(layer=>layer.replaceChildren());running=false;play.disabled=false;toggle.disabled=false;};
  const pause=(ms,token)=>new Promise(resolve=>{const t=setTimeout(()=>{timers.delete(t);resolve(token===epoch)},ms);timers.add(t);});
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  function message(label,description){
   note.textContent=description;
   const li=document.createElement('li'),strong=document.createElement('strong'),span=document.createElement('span');
   strong.textContent=label;span.textContent=description;li.append(strong,span);history.append(li);
   history.scrollTop=history.scrollHeight;
  }
  function packet(points,type,token,tag=''){
   return new Promise(resolve=>{
    if(token!==epoch)return resolve(false);
    const circle=document.createElementNS(svgNS,'circle');
    circle.setAttribute('r',type==='relay'?'7':'8');
    circle.setAttribute('class','vlan-motion__moving vlan-motion__moving--'+type);
    const label=document.createElementNS(svgNS,'text');label.setAttribute('class','vlan-motion__moving-text');
    label.textContent=tag;
    const layer=host.querySelector(isMobile()?'.vlan-motion__svg--mobile .vlan-motion__packets':'.vlan-motion__svg:not(.vlan-motion__svg--mobile) .vlan-motion__packets');
    layer.append(circle,label);
    let lengths=[],sum=0;
    for(let i=1;i<points.length;i++){const d=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(d);sum+=d;}
    const duration=reduced()?260:Math.max(550,Math.min(1650,sum*2.3));
    const start=performance.now();
    function tick(now){
     if(token!==epoch){circle.remove();label.remove();return resolve(false);}
     const f=Math.min(1,(now-start)/duration),dist=f*sum;
     let rem=dist,j=0;while(j<lengths.length-1&&rem>lengths[j]){rem-=lengths[j];j++;}
     const a=points[j],b=points[j+1],ratio=lengths[j]?Math.min(1,rem/lengths[j]):0;
     const x=a[0]+(b[0]-a[0])*ratio,y=a[1]+(b[1]-a[1])*ratio;
     circle.setAttribute('cx',x);circle.setAttribute('cy',y);label.setAttribute('x',x);label.setAttribute('y',y-13);
     if(f<1){const id=requestAnimationFrame(tick);frames.add(id);}
     else{circle.remove();label.remove();resolve(true);}
    }
    const id=requestAnimationFrame(tick);frames.add(id);
   });
  }
  function setIP(id,value){host.querySelectorAll('[data-ip="'+id+'"]').forEach(n=>n.textContent=value);}
  function scope(v,active){host.querySelectorAll('[data-scope="v'+v+'"]').forEach(n=>n.classList.toggle('vlan-motion__scope--active',active));}
  function reset(){
   stopped();history.replaceChildren();counter.textContent='';
   [1,3].forEach(p=>setIP(p,'DHCP'));[2,4].forEach(p=>setIP(p,'Témoin'));[10,20,99].forEach(v=>scope(v,false));
   host.querySelectorAll('.vlan-motion__svi-state').forEach(n=>n.textContent='Relais : '+(toggle.checked?'ON':'OFF'));
   state.textContent=toggle.checked?'ON':'OFF';
   note.textContent='PC1 et PC3 demandent une adresse. PC2 et PC4 observent les broadcasts.';
  }
  toggle.addEventListener('change',reset);
  async function run(){
   reset();const token=epoch,on=toggle.checked;
   toggle.disabled=true;running=true;play.disabled=true;
   play.textContent='▶ Animation en cours';
   const gap=reduced()?160:520;
   try {
    for(const v of [10,20]){
     if(token!==epoch)break;
     const d=entry[v],color=v===10?'v10':'v20';
     counter.textContent='VLAN '+v+' / '+(on?'relais ON':'relais OFF');
     message('Discover · VLAN '+v,'PC'+d.origin+' diffuse un DHCP Discover. Le message entre dans le switch par le port '+d.origin+'.');
     await packet(route(v,'discover'),color,token,'D');
     if(token!==epoch)break;
     message('Broadcast local','Le switch diffuse sur le port '+d.otherPort+' du VLAN '+v+', mais pas vers les ports des autres VLAN.');
     await packet(route(v,'broadcast'),color,token,'D');
     if(token!==epoch)break;
     if(!on){
      message('Aucun relais','Le broadcast n’est pas routé vers le VLAN 99. Aucun Offer n’arrive au PC'+d.origin+'.');
      if(!await pause(gap,token))break;
      continue;
     }
     message('Relais IP helper','L’interface VLAN '+v+' relaie la demande en unicast vers le serveur 10.99.0.10, avec le réseau d’origine identifié par giaddr.');
     await packet(route(v,'relay'),'relay',token,'D');
     if(token!==epoch)break;
     scope(v,true);
     message('Plage VLAN '+v,'Le serveur sélectionne son étendue '+(v===10?'10.10':'10.20')+'.0.0/24 grâce à l’adresse du relais (giaddr).');
     if(!await pause(gap,token))break;
     message('Offer','Le serveur propose '+d.ip+' et répond au relais DHCP.');
     await packet(route(v,'offer'),'relay',token,'O');
     if(token!==epoch)break;
     message('Request','PC'+d.origin+' diffuse son DHCP Request dans le VLAN '+v+'. Le switch le transmet aux autres ports du même VLAN et le relais l’envoie au serveur.');
     await packet(route(v,'request'),color,token,'R');
     if(token!==epoch)break;
     await Promise.all([
      packet(route(v,'requestFlood'),color,token,'R'),
      packet(route(v,'requestRelay'),'relay',token,'R')
     ]);
     if(token!==epoch)break;
     message('ACK','Le serveur confirme le bail et renvoie l’ACK par le relais vers PC'+d.origin+'.');
     await packet(route(v,'ack'),'relay',token,'A');
     if(token!==epoch)break;
     setIP(d.origin,d.ip);
     scope(v,false);
     if(!await pause(gap,token))break;
    }
    if(token!==epoch)return;
    counter.textContent='Animation terminée';
    note.textContent=on?'Le serveur du VLAN 99 a attribué deux adresses, chacune depuis l’étendue correspondant au VLAN du client.':'Sans relais, les Discover restent dans leurs domaines de broadcast. Le serveur du VLAN 99 ne reçoit aucune demande.';
   } finally {
    if(token===epoch){running=false;toggle.disabled=false;play.disabled=false;play.textContent='↻ Rejouer l’animation';}
   }
  }
  play.addEventListener('click',()=>{if(!running)run();});
  const chapter=host.closest('details.chapter');chapter?.addEventListener('toggle',()=>{if(!chapter.open){reset();play.textContent='▶ Lancer l’animation';}});
  window.addEventListener('pagehide',stopped);
 });
})();