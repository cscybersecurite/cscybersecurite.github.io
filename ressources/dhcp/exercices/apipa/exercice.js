import {createEngine} from "https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/r2d3-core.js";
import {createPingAnimator} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/ping-animation.js";
import {formatIpconfig} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/ipconfig.js";
import {formatIpconfigAll} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/ipconfig-all.js";
import {formatIpconfigRelease,formatIpconfigRenew} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/dhcp-commands.js";
// Aucune attribution d'adresse dans ce fichier : seules les commandes R2D3 modifient le réseau.
// DiagCore organise les contrôles, l'hypothèse, l'intervention et la vérification.
const host=document.getElementById("dhcp-apipa-diagnostic")??document.getElementById("diagnostic");
const status=document.getElementById("dhcp-apipa-status")??document.getElementById("status");
let scenario,engine,diag,seq=0,renewAttempts=0,pingAnimator=null;
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
 return display(formatIpconfigAll({ipv4,hostname:c.name,dhcp:true,autoconfiguration:true,connected:true,description:"Carte Ethernet du PC portable",mac:c.config.macAddress,gateway:o.gateway,dns:o.dns,dhcpServer:lease?server().config.ipv4.address:undefined,leaseStart:lease?toDate(lease.start):undefined,leaseEnd:lease?toDate(lease.expires):undefined,compact:window.matchMedia("(max-width: 600px)").matches}));
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
 check("ip","Configuration IP",()=>ip()),
 check("all","Configuration IP détaillée",()=>ip(true)),
 check("release","Libérer l'adresse IP",()=>doRelease()),
 check("renew","Renouveler l'adresse IP",()=>doRenew()),
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
 {label:"Le PC utilise une adresse automatique APIPA.",correct:true,requiredChecks:["all"],feedback:"Diagnostic correct.",prematureFeedback:"Consulte d'abord la configuration IPv4 détaillée du PC."},
 {label:"Le service DHCP est arrêté.",correct:false,feedback:"Ce diagnostic n'est pas confirmé. Tu peux poursuivre tes contrôles."},
 {label:"Le cordon de brassage est débranché.",correct:false,feedback:"Vérifie le câblage avant de conclure."},
 {label:"Le PC a une adresse DHCP correcte.",correct:false,feedback:"Compare l'adresse du PC avec la plage du serveur."}
 ],
 correction:{title:"Que fais-tu pour rétablir le réseau ?",label:"Exécuter ipconfig /renew sur le PC",requiredChecks:["all"],observation:"La commande est exécutée. Consulte maintenant le résultat sur le PC."},
 verification:{title:"Comment vérifies-tu la réparation ?",label:"Exécuter ipconfig /all pour contrôler la nouvelle adresse",check:()=>{const valid=pc().config.ipv4.lease!==null&&pc().config.ipv4.address?.startsWith("192.168.30.");ip(true);return valid;},observation:"Le PC a obtenu une adresse DHCP dans la plage prévue. Le réseau est rétabli.",failure:"Le PC n'a pas encore obtenu de bail DHCP. Reprends tes contrôles."},
 success:"Intervention terminée : le PC a retrouvé une configuration DHCP."
 };
}

// Présentation des quatre commandes sur deux lignes, sans modifier DiagCore.
const commandLabels=new Map([
 ["Configuration IP","ipconfig"],
 ["Configuration IP détaillée","ipconfig /all"],
 ["Libérer l'adresse IP","ipconfig /release"],
 ["Renouveler l'adresse IP","ipconfig /renew"]
]);
function decorateCommandButtons(){
 for(const button of host.querySelectorAll("button.diagcore__choice")){
  if(button.dataset.dhcpCommand)return;
  const label=button.textContent.trim();
  const command=commandLabels.get(label);
  if(!command)return;
  const primary=document.createElement("span");
  primary.className="dhcp-command-label";primary.textContent=label;
  const secondary=document.createElement("span");
  secondary.className="dhcp-command-code";secondary.textContent=command;
  const wrap=document.createElement("span");wrap.className="dhcp-command-wrap";wrap.append(primary,secondary);
  button.replaceChildren(wrap);
  button.dataset.dhcpCommand=command;
 }
}


// Parcours d'intervention autonome : le moteur R2D3 reste responsable du DHCP.
// DiagCore garde la phase diagnostic. Les interventions et vérifications sont propres à cet exercice.
function makeChoice(parent,label,command,action){
 const b=document.createElement("button");b.type="button";b.className="diagcore__choice";
 const wrap=document.createElement("span");wrap.className="dhcp-command-wrap";
 const name=document.createElement("span");name.className="dhcp-command-label";name.textContent=label;wrap.append(name);
 if(command){const code=document.createElement("span");code.className="dhcp-command-code";code.textContent=command;wrap.append(code);}
 b.append(wrap);b.addEventListener("click",action);parent.append(b);return b;
}
function createSection(title){
 const next=host.querySelector(".diagcore__next");if(!next)return null;
 next.replaceChildren();next.dataset.dhcpStage="exercise";
 const h=document.createElement("h2");h.className="diagcore__title";h.textContent=title;next.append(h);
 return next;
}
function consoleResult(parent,content){
 const pre=document.createElement("pre");pre.className="diagcore__terminal";pre.setAttribute("aria-live","polite");
 pre.textContent=content;parent.append(pre);return pre;
}
function cancelPing(){if(pingAnimator){pingAnimator.cancel();pingAnimator=null;}}
function pingResult(parent,completed){
 cancelPing();
 const pre=consoleResult(parent,"");
 const result=engine.query({type:"network.ping",sourceId:"portable",targetId:"serveur"});
 pingAnimator=createPingAnimator(pre);
 pingAnimator.run({sourceName:"PC portable",sourceAddress:pc().config.ipv4.address,targetAddress:"192.168.30.2",outcome:result,onComplete:completed});
}
function interventions(){
 cancelPing();
 const next=createSection("Que fais-tu pour rétablir le réseau ?");
 if(!next)return;
 const choices=document.createElement("div");choices.className="dhcp-action-list";next.append(choices);
 makeChoice(choices,"Renouveler l'adresse IP","ipconfig /renew",()=>{try{verification(doRenew().text);}catch(e){status.textContent="Commande non exécutée : "+e.message;}});
 makeChoice(choices,"Libérer l'adresse IP","ipconfig /release",()=>{try{verification(doRelease().text);}catch(e){status.textContent="Commande non exécutée : "+e.message;}});
 makeChoice(choices,"Vider le cache DNS","ipconfig /flushdns",()=>verification([
  "C:\\Users\\technicien>ipconfig /flushdns","","Configuration IP de Windows","","Cache de résolution DNS vidé.","","C:\\Users\\technicien>"
 ].join("\n")));
 makeChoice(choices,"Tester la connexion réseau","ping 192.168.30.2",()=>verification(null,true));
}
function verification(output,actionPing=false){
 cancelPing();
 const next=createSection("Vérification");
 if(!next)return;
 const msg=document.createElement("p");msg.className="dhcp-verification-prompt";
 msg.textContent="Le dépannage n'est pas terminé. Vérifie si l'incident est résolu.";next.append(msg);
 if(actionPing)pingResult(next,()=>{});
 else consoleResult(next,output);
 const controls=document.createElement("div");controls.className="dhcp-action-list";
 const heading=document.createElement("h3");heading.className="dhcp-controls-title";heading.textContent="Contrôles";next.append(heading);next.append(controls);
 const result=consoleResult(next,"");result.hidden=true;
 let checked=false;
 const show=text=>{cancelPing();result.hidden=false;result.textContent=text;checked=true;notice.textContent="";};
 makeChoice(controls,"Configuration IP","ipconfig",()=>show(ip().text));
 makeChoice(controls,"Configuration IP détaillée","ipconfig /all",()=>show(ip(true).text));
 makeChoice(controls,"Tester la connexion réseau","ping 192.168.30.2",()=>{
  result.hidden=true;cancelPing();
  const extra=next.querySelector(".dhcp-ping-check");if(extra)extra.remove();
  const container=document.createElement("div");container.className="dhcp-ping-check";next.insertBefore(container,decisions);
  pingResult(container,()=>{checked=true;});
 });
 makeChoice(controls,"Contrôler le service DHCP",null,()=>show(server().config.dhcpEnabled?"Le service DHCP est démarré.":"Le service DHCP est arrêté."));
 makeChoice(controls,"Contrôler le câblage",null,()=>show([
  link("cordon-pc","Cordon PC - prise murale"),
  link("liaison-permanente","Liaison permanente"),
  link("cordon-brassage","Cordon de brassage")
 ].join("\n")));
 const decisions=document.createElement("div");decisions.className="dhcp-action-list dhcp-verification-decisions";next.append(decisions);
 const notice=document.createElement("p");notice.className="dhcp-verification-notice";
 notice.setAttribute("role","status");next.append(notice);
 makeChoice(decisions,"L'incident est résolu",null,()=>{
  if(!checked){notice.textContent="Effectue d'abord un contrôle.";return;}
  const ok=Boolean(pc().config.ipv4.lease)&&engine.query({type:"network.ping",sourceId:"portable",targetId:"serveur"}).success;
  if(ok){cancelPing();const done=createSection("Intervention terminée");const p=document.createElement("p");p.textContent="L'incident est résolu. Le dépannage est terminé.";done.append(p);}
  else notice.textContent="La clôture n'est pas possible avec l'état actuel du réseau. Poursuis tes contrôles ou tes interventions.";
 });
 makeChoice(decisions,"Poursuivre le dépannage",null,interventions);
}
function decorateExercise(){
 decorateCommandButtons();
 const next=host.querySelector(".diagcore__next");
 if(!next||next.dataset.dhcpStage==="exercise")return;
 const title=next.querySelector(".diagcore__title")?.textContent;
 if(title==="Que fais-tu pour rétablir le réseau ?")interventions();
}
function render(){
 if(diag)diag.destroy();
 if(host._cleanupCorrection)host._cleanupCorrection();
 if(host._cleanupCommandButtons)host._cleanupCommandButtons();
 const observer=new MutationObserver(decorateExercise);
 observer.observe(host,{subtree:true,childList:true});
 host._cleanupCommandButtons=()=>observer.disconnect();
 diag=window.DiagCore.mount(host,build(),{mode:"vertical"});
 decorateExercise();
}
function reset(){cancelPing();engine=createEngine(scenario);seq=0;renewAttempts=0;status.textContent="Exercice prêt.";render();}
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
