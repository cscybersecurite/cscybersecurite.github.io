import {createEngine} from "https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/r2d3-core.js";
import {formatIpconfigAll} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/ipconfig-all.js";
import {formatIpconfigRelease,formatIpconfigRenew} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/dhcp-commands.js";
import {createPingAnimator} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/ping-animation.js";

const root=document.querySelector("[data-box-lab]");
if(root){
 const $=selector=>root.querySelector(selector);
 const boxId="srv-dhcp",pcId="pc-dhcp-01";
 const fieldNames={address:"Adresse IPv4 de la box",start:"Début de plage DHCP",end:"Fin de plage DHCP",dns1:"DNS principal",dns2:"DNS secondaire",lease:"Durée du bail"};
 const wanted={address:"192.168.1.1",start:"192.168.1.151",end:"192.168.1.199",dns1:"192.168.1.1",dns2:"8.8.8.8",lease:"1"};
 let engine,scenario,serial=0,initial=null,last=null,readAfter=false,successfulPing=false,animation;
 const state=()=>engine.getSnapshot();
 const command=(type,targetId,params={})=>engine.dispatch({id:"box-course-"+(++serial),commandVersion:1,type,targetId,params,expectedRevision:state().revision});
 const box=()=>state().objectsById[boxId].config;
 const pc=()=>state().objectsById[pcId].config;
 const ip=()=>pc().ipv4;
 const options=()=>pc().networkOptions;
 const value=name=>$('[data-field="'+name+'"]').value.trim();
 const datestamp=seconds=>new Intl.DateTimeFormat("fr-FR",{timeZone:"UTC",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(Date.UTC(2026,10,10,9,0)+seconds*1000));
 const mask=prefix=>prefix===24?"255.255.255.0":prefix===16?"255.255.0.0":"Non disponible";
 const capture=()=>{const v=ip(),o=options(),l=v.lease;return {ipv4:v.address??"Aucune",mask:mask(v.prefix),gateway:o.gateway??"Aucune",dns:o.dns.join(", ")||"Aucun",lease:l?Math.round((l.expires-l.start)/60)+" minutes":"Aucun bail"};};
 function showSnap(target,data){target.textContent=data?["IPv4 : "+data.ipv4,"Masque : "+data.mask,"Passerelle : "+data.gateway,"DNS : "+data.dns,"Bail : "+data.lease].join("\n"):"En attente de vérification.";}
 function notice(message,kind="info"){const el=$("[data-feedback]");el.textContent=message;el.dataset.kind=kind;}
 function loadFields(){
  const c=box(),p=c.dhcpPool,values={address:c.ipv4.address,start:p.start,end:p.end,dns1:p.dns[0]??"",dns2:p.dns[1]??"",lease:String(p.leaseSeconds/3600)};
  for(const [key,v] of Object.entries(values))$('[data-field="'+key+'"]').value=v;
  $("[data-service]").textContent=c.dhcpEnabled?"DHCP : actif":"DHCP : arrêté";
 }
 function clearErrors(){root.querySelectorAll(".box-lab__field-error").forEach(el=>el.remove());root.querySelectorAll("[data-field]").forEach(el=>el.removeAttribute("aria-invalid"));}
 function bad(name,message){
  const el=$('[data-field="'+name+'"]');el.setAttribute("aria-invalid","true");
  const text=document.createElement("div");text.className="box-lab__field-error";text.textContent=message;el.closest(".box-lab__row").after(text);
 }
 function octets(text){const parts=text.split(".");return parts.length===4&&parts.every(x=>/^(0|[1-9]\d{0,2})$/.test(x)&&Number(x)<=255)?parts.map(Number):null;}
 function sameNet(a,b){return a&&b&&a.slice(0,3).join(".")===b.slice(0,3).join(".");}
 function currentForm(){
  const input=Object.fromEntries(Object.keys(fieldNames).map(key=>[key,value(key)]));
  const parsed={},error=[];
  for(const name of ["address","start","end","dns1"]){
   parsed[name]=octets(input[name]);
   if(!parsed[name]){bad(name,"Adresse IPv4 invalide.");error.push(name);}
  }
  if(input.dns2&&!octets(input.dns2)){bad("dns2","Adresse IPv4 invalide.");error.push("dns2");}
  if(parsed.address&&parsed.address[0]!==192){bad("address","Adresse hors du réseau prévu pour ce laboratoire.");error.push("address");}
  if(parsed.address&&parsed.start&&!sameNet(parsed.address,parsed.start)){bad("start","La plage doit être dans le réseau de la box.");error.push("start");}
  if(parsed.address&&parsed.end&&!sameNet(parsed.address,parsed.end)){bad("end","La plage doit être dans le réseau de la box.");error.push("end");}
  if(parsed.start&&parsed.end&&parsed.start[3]>parsed.end[3]){bad("end","La fin doit être après le début.");error.push("end");}
  const hours=Number(input.lease);
  if(!Number.isInteger(hours)||hours<1||hours>720){bad("lease","Durée entière comprise entre 1 et 720 heures.");error.push("lease");}
  if(error.length)return null;
  return {address:input.address,pool:{start:input.start,end:input.end,prefix:24,gateway:input.address,dns:[input.dns1,...(input.dns2?[input.dns2]:[])],leaseSeconds:hours*3600}};
 }
 function save(){
  clearErrors();const data=currentForm();
  if(!data){notice("Certains paramètres sont invalides. Vérifie les champs signalés.","error");return;}
  const previous=box().ipv4;
  const r1=command("network.setIPv4",boxId,{interfaceId:"eth0",mode:"static",address:data.address,prefix:24});
  if(r1.status!=="applied"){notice("R2D3 a refusé l'adresse de la box.","error");return;}
  const r2=command("dhcp.configurePool",boxId,data.pool);
  if(r2.status!=="applied"){
   command("network.setIPv4",boxId,{interfaceId:"eth0",mode:"static",address:previous.address,prefix:previous.prefix});
   notice("R2D3 a refusé la configuration DHCP. Contrôle la plage et les adresses DNS.","error");return;
  }
  readAfter=false;successfulPing=false;last=null;showSnap($("[data-after]"),null);
  notice("Configuration enregistrée dans la box. Effectue les contrôles sur le PC.");
 }
 function allText(){
  const v=ip(),o=options(),l=v.lease;
  return formatIpconfigAll({ipv4:v,hostname:"PC-CLIENT",dhcp:true,description:"Carte Ethernet du PC",mac:pc().macAddress,gateway:o.gateway,dns:o.dns,dhcpServer:l?state().objectsById[l.serverId].config.ipv4.address:undefined,leaseStart:l?datestamp(l.start):undefined,leaseEnd:l?datestamp(l.expires):undefined,compact:matchMedia("(max-width: 600px)").matches});
 }
 function check(){
  clearErrors();const c=box(),p=c.dhcpPool,actual={address:c.ipv4.address,start:p.start,end:p.end,dns1:p.dns[0]??"",dns2:p.dns[1]??"",lease:String(p.leaseSeconds/3600)};
  let incorrect=0;for(const [key,needed] of Object.entries(wanted)){if(actual[key]!==needed){bad(key,"Ce paramètre ne correspond pas à la demande du client.");incorrect++;}}
  const v=ip(),o=options();
  const pcCorrect=Boolean(v.lease&&v.address&&v.address.startsWith("192.168.1.")&&Number(v.address.split(".")[3])>=151&&Number(v.address.split(".")[3])<=199&&v.prefix===24&&o.gateway===wanted.address&&o.dns.join(",")==="192.168.1.1,8.8.8.8"&&v.lease.expires-v.lease.start===3600);
  const reasons=[];
  if(incorrect)reasons.push(incorrect+" paramètre(s) de la box à revoir. Les champs concernés sont signalés.");
  if(!pcCorrect)reasons.push("Le PC n'a pas encore reçu la configuration demandée.");
  if(!readAfter)reasons.push("Consulte ipconfig /all pour effectuer le relevé final.");
  if(!successfulPing)reasons.push("Vérifie la communication avec la box par ping.");
  notice(reasons.length?reasons.join("\n"):"Mission réussie ! Les paramètres de la box sont corrects et le PC les a bien reçus.",reasons.length?"error":"success");
 }
 async function reset(){
  if(animation)animation.cancel();
  try{
   if(!scenario){const response=await fetch("./exercices/box/scene.json",{cache:"no-store"});if(!response.ok)throw Error("Scénario indisponible");scenario=await response.json();}
   engine=createEngine(scenario);serial=0;readAfter=false;successfulPing=false;last=null;
   const result=command("dhcp.request",pcId);
   if(result.status!=="applied")throw Error("Impossible d'attribuer l'adresse initiale");
   initial=capture();showSnap($("[data-before]"),initial);showSnap($("[data-after]"),null);
   loadFields();clearErrors();$("[data-terminal]").textContent=allText();
   notice("Le PC a reçu la configuration initiale. Observe-la, puis modifie les paramètres de la box.");
   root.querySelectorAll("button").forEach(b=>b.disabled=false);
  }catch(error){notice("Impossible de démarrer l'exercice R2D3 : "+error.message,"error");}
 }
 const fields=[
  ["address","Adresse IPv4 de la box"],["start","Début de plage DHCP"],["end","Fin de plage DHCP"],
  ["dns1","DNS principal"],["dns2","DNS secondaire"],["lease","Durée du bail (heures)"]
 ];
 root.innerHTML=[
  '<div class="box-lab__head"><h3>Mission : reconfigurer la box Internet</h3><p>Administration virtuelle d’une box et vérification sur un PC. Moteur R2D3.</p></div>',
  '<div class="box-lab__body">',
  '<section class="box-lab__mission"><h4>Demande du client</h4><p>« Je souhaite utiliser le réseau <strong>192.168.1.0/24</strong>, avec une box en <strong>192.168.1.1</strong>. La plage DHCP doit aller de <strong>192.168.1.151 à 192.168.1.199</strong>, le bail doit durer <strong>1 heure</strong> et je veux ajouter <strong>8.8.8.8</strong> comme DNS secondaire. »</p><p>Observe la configuration initiale du PC, modifie la box, puis vérifie la nouvelle configuration.</p></section>',
  '<div class="box-lab__layout"><section class="box-lab__panel" aria-label="Interface de la box">',
  '<div class="box-lab__panel-head">BOX INTERNET <small data-service style="float:right">DHCP actif</small></div><div class="box-lab__panel-body">',
  '<div class="box-lab__tabs"><span class="box-lab__tab">Accueil</span><span class="box-lab__tab">Wi-Fi</span><span class="box-lab__tab" aria-current="true">Réseau local / DHCP</span></div>',
  ...fields.map(([key,label])=>'<div class="box-lab__row"><label for="box-'+key+'">'+label+'</label><input id="box-'+key+'" data-field="'+key+'" autocomplete="off" spellcheck="false" '+(key==="lease"?'inputmode="numeric"':"")+'></div>'),
  '<div class="box-lab__row"><label for="box-mask">Masque de sous-réseau</label><input id="box-mask" value="255.255.255.0" readonly></div>',
  '<div class="box-lab__buttons"><button type="button" class="box-lab__btn" data-save disabled>Enregistrer</button><button type="button" class="box-lab__btn box-lab__btn--secondary" data-reset disabled>Recommencer</button></div>',
  '</div></section><section class="box-lab__panel" aria-label="PC du client">',
  '<div class="box-lab__panel-head">PC-CLIENT · Ethernet</div><div class="box-lab__panel-body"><p class="box-lab__hint">Le PC conserve son ancien bail jusqu’à sa libération ou son expiration.</p>',
  '<div class="box-lab__buttons"><button class="box-lab__btn box-lab__btn--secondary" data-release disabled>ipconfig /release</button><button class="box-lab__btn box-lab__btn--secondary" data-renew disabled>ipconfig /renew</button><button class="box-lab__btn box-lab__btn--secondary" data-all disabled>ipconfig /all</button><button class="box-lab__btn box-lab__btn--secondary" data-ping disabled>ping box</button></div>',
  '<pre class="box-lab__terminal" data-terminal aria-live="polite">Chargement…</pre></div></section></div>',
  '<div class="box-lab__compare"><div class="box-lab__snapshot"><h5>Avant : configuration initiale</h5><pre data-before>Chargement…</pre></div><div class="box-lab__snapshot"><h5>Après : configuration obtenue</h5><pre data-after>En attente de vérification.</pre></div></div>',
  '<div class="box-lab__buttons"><button class="box-lab__btn" data-check disabled>Vérifier mon intervention</button></div>',
  '<div class="box-lab__feedback" data-feedback role="status" aria-live="polite">Chargement du moteur…</div></div>'
 ].join("");
 $("[data-save]").addEventListener("click",save);
 $("[data-reset]").addEventListener("click",reset);
 $("[data-release]").addEventListener("click",()=>{
  const result=command("dhcp.release",pcId);
  if(result.status==="applied"){$("[data-terminal]").textContent=formatIpconfigRelease({ipv4:ip()});readAfter=false;successfulPing=false;showSnap($("[data-after]"),null);notice("Adresse libérée. Demande maintenant un bail DHCP.");}
  else notice("Libération refusée par le moteur.","error");
 });
 $("[data-renew]").addEventListener("click",()=>{
  const result=command("dhcp.request",pcId);
  if(result.status==="applied"){$("[data-terminal]").textContent=formatIpconfigRenew({ipv4:ip(),status:state().runtime[pcId]?.dhcpStatus,gateway:options().gateway});readAfter=false;successfulPing=false;showSnap($("[data-after]"),null);notice("Demande DHCP effectuée. Consulte ipconfig /all pour vérifier.");}
  else notice("Demande refusée par R2D3 : "+(result.message||result.code),"error");
 });
 $("[data-all]").addEventListener("click",()=>{$("[data-terminal]").textContent=allText();last=capture();readAfter=true;showSnap($("[data-after]"),last);notice("Configuration relevée. Compare les valeurs avant et après.");});
 $("[data-ping]").addEventListener("click",()=>{
  const result=engine.query({type:"network.ping",sourceId:pcId,targetId:boxId});
  successfulPing=Boolean(result.success);
  if(animation)animation.cancel();
  animation=createPingAnimator($("[data-terminal]"));
  animation.run({sourceName:"PC-CLIENT",sourceAddress:ip().address,targetAddress:box().ipv4.address,outcome:result});
  notice(result.success?"Le PC communique avec la box.":"La box ne répond pas : vérifie la configuration.","info");
 });
 $("[data-check]").addEventListener("click",check);
 reset();
}
