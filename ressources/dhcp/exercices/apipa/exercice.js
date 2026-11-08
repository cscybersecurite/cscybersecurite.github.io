import {createEngine} from "https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/r2d3-core.js";
import {createPingAnimator} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/ping-animation.js";
import {formatIpconfig} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/ipconfig.js";
import {formatIpconfigAll} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/ipconfig-all.js";
import {formatIpconfigRelease,formatIpconfigRenew} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/dhcp-commands.js";

// Adaptateur local. DiagCore V1.3 organise le parcours, R2D3 détient l'état du réseau.
const host=document.getElementById("dhcp-apipa-diagnostic")??document.getElementById("diagnostic");
const status=document.getElementById("dhcp-apipa-status")??document.getElementById("status");
let scenario,engine,diag,seq=0,technicalRevision=0,pingAnimator=null;
const snapshot=()=>engine.getSnapshot();
const pc=()=>snapshot().objectsById.portable;
const server=()=>snapshot().objectsById.serveur;
const display=text=>({type:"command",text});
const profile=()=>JSON.stringify({ipv4:pc().config.ipv4,networkOptions:pc().config.networkOptions});
function dispatch(type){
 const before=profile();
 const result=engine.dispatch({commandVersion:1,id:"cours-apipa-"+(++seq),type,targetId:"portable",params:{},expectedRevision:snapshot().revision});
 if(result.status!=="applied")throw new Error(result.message||result.code||"Opération impossible");
 const changed=profile()!==before;
 if(changed)technicalRevision++;
 return changed;
}
function ip(all=false){
 const c=pc(),ipv4=c.config.ipv4,o=c.config.networkOptions??{gateway:null,dns:[]},lease=ipv4.lease;
 if(!all)return display(formatIpconfig({ipv4,gateway:o.gateway,connected:true}));
 const toDate=n=>new Intl.DateTimeFormat("fr-FR",{timeZone:"UTC",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(Date.UTC(2026,10,8,9,0)+n*1000));
 return display(formatIpconfigAll({ipv4,hostname:c.name,dhcp:true,autoconfiguration:true,connected:true,description:"Carte Ethernet du PC portable",mac:c.config.macAddress,gateway:o.gateway,dns:o.dns,dhcpServer:lease?server().config.ipv4.address:undefined,leaseStart:lease?toDate(lease.start):undefined,leaseEnd:lease?toDate(lease.expires):undefined,compact:window.matchMedia("(max-width: 600px)").matches}));
}
function renew(){
 const changed=dispatch("dhcp.request");
 const s=snapshot(),v=pc().config.ipv4;
 return {executed:true,changed,observation:display(formatIpconfigRenew({ipv4:v,status:s.runtime.portable?.dhcpStatus,gateway:pc().config.networkOptions?.gateway}))};
}
function release(){
 const changed=dispatch("dhcp.release");
 return {executed:true,changed,observation:display(formatIpconfigRelease({ipv4:pc().config.ipv4}))};
}
function link(id,label){
 const connected=snapshot().linksById[id].connected;
 return label+" : "+(connected?"branché, liaison présente.":"débranché, liaison absente.");
}
function stopPing(){if(pingAnimator){pingAnimator.cancel();pingAnimator=null;}}
function ping(){
 stopPing();
 const outcome=engine.query({type:"network.ping",sourceId:"portable",targetId:"serveur"});
 const address="192.168.30.2";
 const output=document.getElementById("windows-output");
 // Le composant commun anime les quatre réponses ; DiagCore enregistre l'observation.
 if(output){
  const animation=createPingAnimator(output);
  pingAnimator=animation;
  animation.run({sourceName:"PC portable",sourceAddress:pc().config.ipv4.address,targetAddress:address,outcome});
 }
 const success=Boolean(outcome.success&&!outcome.conflict);
 const heading="C:\\Users\\technicien>ping "+address;
 const lines=Array(4).fill(success?"Réponse de "+address+" : octets=32 temps<1 ms TTL=128":"Délai d'attente de la demande dépassé.");
 return {executed:true,passed:success,observation:display([heading,"","Envoi d'une requête 'Ping' "+address+" avec 32 octets de données :",
  ...lines,"","Statistiques Ping pour "+address+" :",
  "    Paquets : envoyés = 4, reçus = "+(success?4:0)+", perdus = "+(success?0:4)+" ("+(success?0:100)+" % de perte)"].join("\n"))};
}
const check=(id,label,observe,subtitle)=>({id,label,subtitle,observe,verify:observe});
function build(){
 return {
  title:"Où veux-tu intervenir ?",groupPicker:true,minimumChecks:2,hideHypothesisUntilReady:true,
  hypothesisLabel:"Mon diagnostic",hypothesisTitle:"D'après tes contrôles, que se passe-t-il ?",
  backLabel:"Continuer mes contrôles",
  workTitle:"Intervenir ou vérifier",
  workPrompt:"Le dépannage n'est pas terminé. Vérifie si l'incident est résolu.",
  interventionTitle:"Interventions possibles",closeLabel:"Demander la clôture",
  getRevision:()=>technicalRevision,
  groups:[
   {title:"PC portable",checks:[
    check("ip","Configuration IP",()=>ip(),"ipconfig"),
    check("all","Configuration IP détaillée",()=>ip(true),"ipconfig /all"),
    check("ping","Tester la connexion réseau",ping,"ping 192.168.30.2"),
    check("cablepc","Regarder le câble branché au PC",()=>link("cordon-pc","Câble entre PC et prise réseau"))
   ]},
   {title:"Câblage",checks:[
    check("prise","Contrôler le cordon PC - prise murale",()=>link("cordon-pc","Cordon réseau")),
    check("permanent","Contrôler la liaison prise - bandeau",()=>link("liaison-permanente","Liaison permanente")),
    check("brassage","Contrôler le cordon bandeau - switch",()=>link("cordon-brassage","Cordon de brassage"))
   ]},
   {title:"Switch",checks:[
    check("power","Regarder le voyant d'alimentation",()=>"Le switch est allumé."),
    check("port","Regarder le port Ethernet du PC",()=>snapshot().linksById["cordon-brassage"].connected?"Le voyant du port est allumé.":"Le voyant du port est éteint.")
   ]},
   {title:"Serveur DHCP",checks:[
    check("serverpower","Regarder si le serveur est allumé",()=>"Le serveur est allumé."),
    check("service","Contrôler le service DHCP",()=>server().config.dhcpEnabled?"Le service DHCP est démarré.":"Le service DHCP est arrêté."),
    check("pool","Contrôler la plage DHCP",()=>{const p=server().config.dhcpPool;return "Plage active : "+p.start+" à "+p.end+".";})
   ]}
  ],
  hypotheses:[
   {label:"Le PC utilise une adresse automatique APIPA.",correct:true,requiredChecks:["all"],feedback:"Diagnostic correct.",prematureFeedback:"Consulte d'abord la configuration IPv4 détaillée du PC."},
   {label:"Le service DHCP est arrêté.",correct:false,feedback:"Ce diagnostic n'est pas confirmé. Tu peux poursuivre tes contrôles."},
   {label:"Le cordon de brassage est débranché.",correct:false,feedback:"Vérifie le câblage avant de conclure."},
   {label:"Le PC a une adresse DHCP correcte.",correct:false,feedback:"Compare l'adresse du PC avec la plage du serveur."}
  ],
  interventions:[
   {id:"renew",label:"Renouveler l'adresse IP",subtitle:"ipconfig /renew",execute:renew},
   {id:"release",label:"Libérer l'adresse IP",subtitle:"ipconfig /release",execute:release},
   {id:"flushdns",label:"Vider le cache DNS",subtitle:"ipconfig /flushdns",execute:()=>({
    executed:true,changed:false,observation:display(["C:\\Users\\technicien>ipconfig /flushdns",
     "","Configuration IP de Windows","","Cache de résolution DNS vidé."].join("\n"))
   })}
  ],
  canClose:({revision,verifications})=>{
   const ipValid=pc().config.ipv4.lease!==null&&pc().config.ipv4.address?.startsWith("192.168.30.");
   const reachable=engine.query({type:"network.ping",sourceId:"portable",targetId:"serveur"}).success;
   const recentlyChecked=verifications.some(v=>v.revision===revision&&["all","ip","ping"].includes(v.id));
   return {allowed:Boolean(ipValid&&reachable&&recentlyChecked),
    feedback:ipValid&&reachable&&!recentlyChecked?"Effectue un contrôle réseau avant de clôturer.":"Le dépannage n'est pas terminé. Poursuis tes contrôles ou tes interventions."};
  },
  success:"L'incident est résolu. Le dépannage est terminé."
 };
}
function reset(){
 stopPing();
 if(diag)diag.destroy();
 engine=createEngine(scenario);seq=0;technicalRevision=0;
 const output=document.getElementById("windows-output");
 if(output)output.textContent="Aucune commande exécutée.";
 if(status)status.textContent="";
 diag=window.DiagCore.mount(host,build(),{mode:"vertical"});
}
function loadCore(){
 if(window.DiagCore?.version==="1.3.0")return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  script.src="https://chaoli22000bzh.github.io/DiagCore/v1.3/diagcore.js";
  script.onload=()=>window.DiagCore?.version==="1.3.0"?resolve():reject(new Error("DiagCore V1.3 indisponible"));
  script.onerror=()=>reject(new Error("Chargement de DiagCore V1.3 impossible"));
  document.head.append(script);
 });
}
async function init(){
 try{
  if(!host)throw new Error("Zone d'exercice introuvable");
  await loadCore();
  const response=await fetch(new URL("./scenario.json",import.meta.url));
  if(!response.ok)throw new Error("Scénario indisponible");
  scenario=await response.json();reset();
  (document.getElementById("dhcp-apipa-restart")??document.getElementById("restart"))?.addEventListener("click",reset);
 }catch(error){if(host)host.textContent="Impossible de charger l'exercice : "+error.message;}
}
init();
