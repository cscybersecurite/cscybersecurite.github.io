import {createEngine} from "https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/r2d3-core.js";
import {formatIpconfig} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/ipconfig.js";
import {formatIpconfigAll} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/ipconfig-all.js";
import {formatIpconfigRelease,formatIpconfigRenew} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/dhcp-commands.js";
// Aucune attribution d'adresse dans ce fichier : seules les commandes R2D3 modifient le réseau.
// DiagCore organise les contrôles, l'hypothèse, l'intervention et la vérification.
const host=document.getElementById("dhcp-apipa-diagnostic")??document.getElementById("diagnostic");
const status=document.getElementById("dhcp-apipa-status")??document.getElementById("status");
let scenario,engine,diag,seq=0,renewAttempts=0;
const snapshot=()=>engine.getSnapshot();
const pc=()=>snapshot().objectsById.portable;
const server=()=>snapshot().objectsById.serveur;
function dispatch(type,targetId,params={}){
  const result=engine.dispatch({commandVersion:1,id:"cours-apipa-"+(++seq),type,targetId,params,expectedRevision:snapshot().revision});
  if(result.status!=="applied")throw new Error(result.message||result.code||"Opération impossible");
  return snapshot();
}
const display=text=>({type:"command",text});
function ip(all=false){
 const c=pc(),ipv4=c.config.ipv4,o=c.config.networkOptions??{gateway:null,dns:[]},lease=ipv4.lease;
 if(!all)return display(formatIpconfig({ipv4,gateway:o.gateway,connected:true}));
 const toDate=n=>new Intl.DateTimeFormat("fr-FR",{timeZone:"UTC",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(Date.UTC(2026,10,8,9,0)+n*1000));
 return display(formatIpconfigAll({ipv4,hostname:c.name,dhcp:true,autoconfiguration:true,connected:true,description:"Carte Ethernet du PC portable",mac:c.config.macAddress,gateway:o.gateway,dns:o.dns,dhcpServer:lease?server().config.ipv4.address:undefined,leaseStart:lease?toDate(lease.start):undefined,leaseEnd:lease?toDate(lease.expires):undefined}));
}
function doRenew(){
 dispatch("dhcp.request","portable");renewAttempts++;
 const s=snapshot(),v=pc().config.ipv4;
 return display(formatIpconfigRenew({ipv4:v,status:s.runtime.portable?.dhcpStatus,gateway:pc().config.networkOptions?.gateway}));
}
function doRelease(){dispatch("dhcp.release","portable");return display(formatIpconfigRelease({ipv4:pc().config.ipv4}));}
function link(id,label){const ok=snapshot().linksById[id].connected;return label+" : "+(ok?"branché, liaison présente.":"débranché, liaison absente.");}
const check=(id,label,observe)=>({id,label,observe});
function build(){
 return {
 title:"Où veux-tu intervenir ?",groupPicker:true,minimumChecks:2,hideHypothesisUntilReady:true,hypothesisLabel:"Mon diagnostic",hypothesisTitle:"D'après tes contrôles, que se passe-t-il ?",backLabel:"Continuer mes contrôles",
 groups:[
 {title:"PC portable",checks:[
 check("ip","Exécuter ipconfig",()=>ip()),
 check("all","Exécuter ipconfig /all",()=>ip(true)),
 check("release","Exécuter ipconfig /release",()=>doRelease()),
 check("renew","Exécuter ipconfig /renew",()=>doRenew()),
 check("cablepc","Regarder le câble branché au PC",()=>link("cordon-pc","Câble entre PC et prise réseau"))
 ]},
 {title:"Câblage",checks:[
 check("prise","Contrôler le cordon PC - prise murale",()=>link("cordon-pc","Cordon réseau")),
 check("permanent","Contrôler la liaison prise - bandeau",()=>link("liaison-permanente","Liaison permanente")),
 check("brassage","Contrôler le cordon bandeau - switch",()=>link("cordon-brassage","Cordon de brassage"))
 ]},
 {title:"Switch",checks:[
 check("power","Regarder le voyant d'alimentation",()=> "Le switch est allumé."),
 check("port","Regarder le port Ethernet du PC",()=>snapshot().linksById["cordon-brassage"].connected?"Le voyant du port est allumé.":"Le voyant du port est éteint.")
 ]},
 {title:"Serveur DHCP",checks:[
 check("serverpower","Regarder si le serveur est allumé",()=>"Le serveur est allumé."),
 check("service","Contrôler le service DHCP",()=>server().config.dhcpEnabled?"Le service DHCP est démarré.":"Le service DHCP est arrêté."),
 check("pool","Contrôler la plage DHCP",()=>{const p=server().config.dhcpPool;return "Plage active : "+p.start+" à "+p.end+".";})
 ]}
 ],
 hypotheses:[
 {label:"Le PC utilise une adresse automatique APIPA et doit obtenir un nouveau bail DHCP.",correct:true,requiredChecks:["all"],feedback:"Tu peux maintenant proposer une intervention.",prematureFeedback:"Consulte d'abord la configuration IPv4 détaillée du PC."},
 {label:"Le service DHCP est arrêté.",correct:false,feedback:"Ce diagnostic n'est pas confirmé. Tu peux poursuivre tes contrôles."},
 {label:"Le cordon de brassage est débranché.",correct:false,feedback:"Vérifie le câblage avant de conclure."},
 {label:"Le PC a une adresse DHCP correcte.",correct:false,feedback:"Compare l'adresse du PC avec la plage du serveur."}
 ],
 correction:{title:"Que fais-tu pour rétablir le réseau ?",label:"Exécuter ipconfig /renew sur le PC",requiredChecks:["all"],observation:"La commande est exécutée. Consulte maintenant le résultat sur le PC."},
 verification:{title:"Comment vérifies-tu la réparation ?",label:"Exécuter ipconfig /all pour contrôler la nouvelle adresse",check:()=>{const valid=pc().config.ipv4.lease!==null&&pc().config.ipv4.address?.startsWith("192.168.30.");ip(true);return valid;},observation:"Le PC a obtenu une adresse DHCP dans la plage prévue. Le réseau est rétabli.",failure:"Le PC n'a pas encore obtenu de bail DHCP. Reprends tes contrôles."},
 success:"Intervention terminée : le PC a retrouvé une configuration DHCP."
 };
}
function render(){
 if(diag)diag.destroy();
 const data=build();
 // DiagCore v1.2.2 n'expose pas de callback d'action pour la phase correction.
 // On déclenche la commande réseau sur le clic réel, avant son gestionnaire interne,
 // puis la validation lit exclusivement le nouvel état moteur.
 const correctionLabel=data.correction.label;
 const onCorrection=event=>{
  const button=event.target.closest("button.diagcore__choice");
  if(!button||button.textContent!==correctionLabel)return;
  try{const output=doRenew();status.textContent=output.text.includes("erreur")?"Renouvellement non obtenu.":"Commande exécutée."; }
  catch(e){status.textContent="Erreur : "+e.message;}
 };
 host.addEventListener("click",onCorrection,true);
 if(host._cleanupCorrection)host._cleanupCorrection();
 host._cleanupCorrection=()=>host.removeEventListener("click",onCorrection,true);
 diag=window.DiagCore.mount(host,data,{mode:"vertical"});
}
function reset(){engine=createEngine(scenario);seq=0;renewAttempts=0;status.textContent="Exercice prêt.";render();}
async function init(){
 try{
  if(!host||!status)throw new Error("Zone d’exercice introuvable");
  if(!window.DiagCore?.version?.startsWith("1.2."))throw new Error("DiagCore indisponible");
  const r=await fetch(new URL("./scenario.json",import.meta.url));if(!r.ok)throw new Error("Scénario indisponible");
  scenario=await r.json();reset();
  (document.getElementById("dhcp-apipa-restart")??document.getElementById("restart"))?.addEventListener("click",reset);
 }catch(e){if(host)host.textContent="Impossible de charger l'exercice : "+e.message;}
}
init();
