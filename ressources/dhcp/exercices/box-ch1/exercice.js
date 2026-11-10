import {createEngine} from "https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/r2d3-core.js";
import {formatIpconfigAll} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/ipconfig-all.js";
import {formatIpconfigRelease,formatIpconfigRenew} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/dhcp-commands.js";
import {createPingAnimator} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/ping-animation.js";

const root=document.getElementById("dhcp-box-ch1");
if(root){
 const $=id=>root.querySelector('[data-db="'+id+'"]');
 const check={box:"192.168.1.1",start:"192.168.1.151",end:"192.168.1.199",dns1:"192.168.1.1",dns2:"8.8.8.8",hours:1};
 const initialDate=Date.UTC(2026,10,10,9,0,0);
 const date=seconds=>new Intl.DateTimeFormat("fr-FR",{timeZone:"UTC",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(initialDate+seconds*1000));
 let scenario,engine,serial=0,observedBefore=false,saved=false,renewed=false,pingPassed=false,pingAnimator=null;
 const state=()=>engine.getSnapshot();
 const command=(type,targetId,params={})=>engine.dispatch({id:"cours-box-"+(++serial),commandVersion:1,type,targetId,params,expectedRevision:state().revision});
 const validIPv4=text=>{if(!/^\d{1,3}(\.\d{1,3}){3}$/.test(text))return false;return text.split(".").every(x=>Number(x)<=255);};
 const same24=(a,b)=>a.split(".").slice(0,3).join(".")===b.split(".").slice(0,3).join(".");
 const numeric=ip=>ip.split(".").reduce((sum,n)=>sum*256+Number(n),0);
 const fail=(message,id="message")=>{$(id).textContent=message;};
 const settings=()=>({
  box:$("box-ip").value.trim(),start:$("start").value.trim(),end:$("end").value.trim(),
  dns1:$("dns1").value.trim(),dns2:$("dns2").value.trim(),
  hours:Number($("hours").value)
 });
 function updateControls(){
  $("observe").disabled=observedBefore;
  $("save").disabled=!observedBefore;
  $("release").disabled=!saved;
  $("renew").disabled=!saved;
  $("ping").disabled=!saved;
  $("check").disabled=!observedBefore;
 }
 function fill(){
  const srv=state().objectsById.box,p=srv.config.dhcpPool;
  $("box-ip").value=srv.config.ipv4.address;
  $("start").value=p.start;$("end").value=p.end;
  $("dns1").value=p.dns[0]??"";$("dns2").value=p.dns[1]??"";
  $("hours").value=String(p.leaseSeconds/3600);
  $("mask").textContent="255.255.255.0";
  $("gateway").textContent=srv.config.ipv4.address;
  $("server").textContent=srv.config.dhcpEnabled?"Activé":"Arrêté";
 }
 function ipAll(){
  const o=state().objectsById.pc,ip=o.config.ipv4,lease=ip.lease,opts=o.config.networkOptions??{gateway:null,dns:[]};
  return formatIpconfigAll({
   ipv4:ip,hostname:o.name,dhcp:true,autoconfiguration:true,connected:true,
   description:"Carte Ethernet du PC",mac:o.config.macAddress,gateway:opts.gateway,dns:opts.dns,
   dhcpServer:lease?state().objectsById[lease.serverId]?.config.ipv4.address:undefined,
   leaseStart:lease?date(lease.start):undefined,leaseEnd:lease?date(lease.expires):undefined,
   compact:window.matchMedia("(max-width: 600px)").matches
  });
 }
 function observe(){
  const r=command("dhcp.request","pc");
  if(r.status!=="applied"){fail("Impossible de relever la configuration initiale : "+(r.message??r.code));return;}
  observedBefore=true;
  $("before").textContent=ipAll();
  fail("Configuration initiale relevée. Modifie maintenant les paramètres de la box.");
  updateControls();
 }
 function save(){
  if(!observedBefore)return;
  const s=settings();
  if(![s.box,s.start,s.end,s.dns1].every(validIPv4)||s.dns2&&!validIPv4(s.dns2)){
   fail("Enregistrement impossible : vérifie le format des adresses IPv4.");return;
  }
  if(!same24(s.box,s.start)||!same24(s.box,s.end)||numeric(s.start)>numeric(s.end)){
   fail("Enregistrement impossible : la plage DHCP doit appartenir au réseau local de la box, et son début doit précéder sa fin.");return;
  }
  if(!Number.isInteger(s.hours)||s.hours<1||s.hours>720){
   fail("Enregistrement impossible : la durée du bail doit être comprise entre 1 et 720 heures.");return;
  }
  const ipChange=command("network.setIPv4","box",{interfaceId:"lan0",mode:"static",address:s.box,prefix:24});
  if(ipChange.status!=="applied"){fail("Configuration LAN refusée par R2D3 : "+(ipChange.message??ipChange.code));return;}
  const r=command("dhcp.configurePool","box",{
   start:s.start,end:s.end,prefix:24,gateway:s.box,
   dns:[s.dns1,...(s.dns2?[s.dns2]:[])],leaseSeconds:s.hours*3600
  });
  if(r.status!=="applied"){fail("Paramètres DHCP refusés par R2D3 : "+(r.message??r.code));return;}
  saved=true;renewed=false;pingPassed=false;pingAnimator?.cancel();
  $("after").textContent="Configuration du PC non encore vérifiée.";
  $("ping-result").textContent="";
  $("results").replaceChildren();
  fill();
  fail("Modifications enregistrées dans la box virtuelle. Sur le PC, libère l'ancien bail, puis demande une nouvelle configuration.");
  updateControls();
 }
 function release(){
  const r=command("dhcp.release","pc");
  if(r.status!=="applied"){fail("Libération refusée : "+(r.message??r.code));return;}
  renewed=false;pingPassed=false;pingAnimator?.cancel();
  $("after").textContent=formatIpconfigRelease({ipv4:state().objectsById.pc.config.ipv4});
  $("ping-result").textContent="";
  fail("Ancien bail libéré. Exécute maintenant ipconfig /renew pour recevoir la configuration de la box.");
 }
 function renew(){
  const r=command("dhcp.request","pc");
  if(r.status!=="applied"){fail("Renouvellement refusé : "+(r.message??r.code));return;}
  const s=state(),pc=s.objectsById.pc,status=s.runtime.pc?.dhcpStatus;
  $("after").textContent=formatIpconfigRenew({ipv4:pc.config.ipv4,status,gateway:pc.config.networkOptions.gateway})+"\n\n"+ipAll();
  renewed=status==="lease"&&!pc.config.ipv4.address?.startsWith("192.168.0.");
  pingPassed=false;pingAnimator?.cancel();
  $("ping-result").textContent="";
  fail("Lis la nouvelle sortie ipconfig /all, puis teste la communication avec la box.");
 }
 function ping(){
  const s=state(),ip=s.objectsById.box.config.ipv4.address,outcome=engine.query({type:"network.ping",sourceId:"pc",targetId:"box"});
  pingPassed=false;
  pingAnimator.run({sourceName:"PC-CLIENT",sourceAddress:s.objectsById.pc.config.ipv4.address,targetAddress:ip,targetInput:ip,outcome,
   onComplete:result=>{pingPassed=result.success;fail(result.success?"La box répond au ping. Tu peux contrôler ta mission.":"La box ne répond pas. Vérifie les paramètres et renouvelle la configuration du PC.");}});
 }
 function verify(){
  const s=state(),box=s.objectsById.box,pool=box.config.dhcpPool,pc=s.objectsById.pc;
  const fields=[
   ["Adresse LAN de la box",box.config.ipv4.address===check.box],
   ["Début de la plage DHCP",pool.start===check.start],
   ["Fin de la plage DHCP",pool.end===check.end],
   ["DNS principal",pool.dns[0]===check.dns1],
   ["DNS secondaire",pool.dns[1]===check.dns2],
   ["Durée du bail",pool.leaseSeconds===check.hours*3600],
   ["Nouvelle adresse du PC",Boolean(renewed&&pc.config.ipv4.lease&&numeric(pc.config.ipv4.address)>=numeric(pool.start)&&numeric(pc.config.ipv4.address)<=numeric(pool.end))],
   ["Passerelle, DNS et bail sur le PC",Boolean(pc.config.networkOptions.gateway===check.box&&pc.config.networkOptions.dns.join(",")===check.dns1+","+check.dns2&&pc.config.ipv4.lease?.expires-pc.config.ipv4.lease?.start===3600)],
   ["Ping vers la box",pingPassed]
  ];
  $("results").replaceChildren(...fields.map(([title,ok])=>{
   const li=document.createElement("li");
   li.className=ok?"db-ok":"db-error";
   li.textContent=title+" : "+(ok?"correct":"à corriger ou à vérifier");
   return li;
  }));
  const success=fields.every(([,ok])=>ok);
  fail(success?"Mission réussie ! La box et le PC utilisent la configuration demandée.":"Certains points restent incorrects. Modifie les paramètres concernés, puis vérifie de nouveau.");
 }
 function reset(){
  pingAnimator?.cancel();engine=createEngine(scenario);serial=0;
  observedBefore=false;saved=false;renewed=false;pingPassed=false;
  fill();$("before").textContent="Clique sur « Relever la configuration initiale ».";
  $("after").textContent="Aucune nouvelle configuration relevée.";
  $("ping-result").textContent="";$("results").replaceChildren();
  fail("");updateControls();
 }
 async function start(){
  try{
   const response=await fetch("./exercices/box-ch1/scenario.json",{cache:"no-store"});
   if(!response.ok)throw new Error("Scénario non disponible");
   scenario=await response.json();
   pingAnimator=createPingAnimator($("ping-result"));
   $("observe").addEventListener("click",observe);
   $("save").addEventListener("click",save);
   $("release").addEventListener("click",release);
   $("renew").addEventListener("click",renew);
   $("ping").addEventListener("click",ping);
   $("check").addEventListener("click",verify);
   $("reset").addEventListener("click",reset);
   reset();
  }catch(error){fail("Exercice indisponible : "+error.message);console.error("DHCP box chapitre 1 :",error);}
 }
 start();
}
