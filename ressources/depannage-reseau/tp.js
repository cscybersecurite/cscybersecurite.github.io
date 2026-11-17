import {createAssetRegistry} from 'https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/asset-profiles.js';
import {createEngine} from 'https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/r2d3-core.js';
import {mountCablingFrontpanel} from 'https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/cabling-frontpanel.js?v=1.5';
import {createPingAnimator} from 'https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/ping-animation.js';
const $=id=>document.getElementById(id);
const events=[],state={pc:false,sw:false,miniDone:false,mainDone:false,continuity:false,browser:false,stage:0,phase:0,lease:false,finalBrowserPassed:false,ipPingPassed:false,dnsPingPassed:false,apipaSeen:false,diagnosisPassed:false,ip:"169.254.32.18",cableId:null};
const labels=["Brasser la mini-baie","Brasser la grande baie","Tester la continuité","Ouvrir le navigateur","Observer l'adresse APIPA","Identifier le problème APIPA","Réparer la configuration DHCP","Vérifier les deux pings","Vérifier Internet dans le navigateur"];
const log=(type,data={})=>{events.push({date:new Date().toISOString(),type,...data});renderReport();};
let registry,pcPort,switchPort,miniPanel,mainPanel,miniView,mainView,engine,baseScenario;
function must(r){if(!r.success)throw Error(r.message||r.code||"R2D3 : opération refusée");return r;}
function patchCable(a,b){
 const c=must(registry.createCable({connectors:["rj45-male","rj45-male"]})).cable;
 must(registry.connectCableEnd(c.id,0,a));
 must(registry.connectCableEnd(c.id,1,b));
 return c.id;
}
function isLinked(a,b){
 return registry.listCables().some(c=>c.ends.some(e=>e?.portId===a)&&c.ends.some(e=>e?.portId===b));
}
function makePhysical(){
 registry=createAssetRegistry();
 const site=must(registry.createPlace({name:"Entreprise"})).place.id;
 const bureau=must(registry.createPlace({name:"Bureau de passage",parentId:site})).place.id;
 const miniPlace=must(registry.createPlace({name:"Mini-baie n°5",parentId:site})).place.id;
 const mainPlace=must(registry.createPlace({name:"Grande baie",parentId:site})).place.id;
 miniPanel=must(registry.createPanel({name:"Mini-Baie N° 5",placeId:miniPlace,count:10,prefix:"",start:1})).panel;
 mainPanel=must(registry.createPanel({name:"Panneau grande baie",placeId:mainPlace,count:28,prefix:"",start:1})).panel;
 const outlet=must(registry.createWallOutlet({name:"F",location:"Bureau de passage"})).outlet;
 const pcProfile=must(registry.createProfile("PC portable")).profile.id;
 must(registry.addPortGroup(pcProfile,{type:"ethernet-rj45",prefix:"LAN",start:1,count:1,digits:2}));
 const swProfile=must(registry.createProfile("Switch 24 ports")).profile.id;
 must(registry.addPortGroup(swProfile,{type:"ethernet-rj45",prefix:"LAN",start:1,count:24,digits:2}));
 const pc=must(registry.createAsset(pcProfile,{name:"PC portable"})).asset;
 const sw=must(registry.createAsset(swProfile,{name:"SW01"})).asset;
 must(registry.moveAssetToPlace(pc.id,bureau));must(registry.moveAssetToPlace(sw.id,mainPlace));
 pcPort=pc.ports[0].id;switchPort=sw.ports[22].id;
 // Raccordements permanents : poste F et liaisons inter-baies.
 patchCable(pcPort,outlet.ports[0].front.id);
 patchCable(outlet.ports[0].back.id,miniPanel.ports[5].back.id);
 for(let i=0;i<4;i++)patchCable(miniPanel.ports[6+i].back.id,mainPanel.ports[16+i].back.id);
 // Quelques branchements déjà présents, distincts du port 23 cible.
 patchCable(mainPanel.ports[0].front.id,sw.ports[2].id);
 patchCable(mainPanel.ports[5].front.id,sw.ports[4].id);
 const internetProfile=must(registry.createProfile("Liaison montante")).profile.id;
 must(registry.addPortGroup(internetProfile,{type:"ethernet-rj45",prefix:"WAN",start:1,count:1,digits:2}));
 const internet=must(registry.createAsset(internetProfile,{name:"Sortie Internet"})).asset;
 patchCable(sw.ports[0].id,internet.ports[0].id);
 miniView=mountCablingFrontpanel({
  root:$("mini-panel"),registry,devices:["Mini-Baie N° 5"],showCableList:false,
  layout:{"Mini-Baie N° 5":{columns:12,slots:["1","2","3","4","5","6",null,null,"7","8","9","10"],labels:["A","B","C","D","E","F","A","B","C","D"]}}
 });
 mainView=mountCablingFrontpanel({
  root:$("main-panel"),registry,devices:["Panneau grande baie","SW01"],showCableList:false,
  layout:{"Panneau grande baie":{columns:12,labels:Array.from({length:28},(_,i)=>"ABCD"[i%4]+(Math.floor(i/4)+1))},
          "SW01":{columns:12,switchPairs:true,switchGroups:true,kindLabel:"Switch"}}
 });
}
$("validate-mini").addEventListener("click",()=>{
 const ok=isLinked(miniPanel.ports[5].front.id,miniPanel.ports[9].front.id);
 $("mini-result").textContent=ok?"Mini-baie correctement brassée. Passez à la grande baie.":"Le panneau doit relier F au départ D situé à droite.";
 log("validation_mini_baie",{success:ok,liaison:"F vers D"});
 if(ok){state.miniDone=true;state.pc=true;$("main-step").hidden=false;$("validate-mini").disabled=true;$("main-step").scrollIntoView({behavior:"smooth",block:"start"});}
});
$("validate-main").addEventListener("click",()=>{
 const ok=isLinked(mainPanel.ports[19].front.id,switchPort);
 $("main-result").textContent=ok?"Grande baie correctement brassée. Vérifiez la continuité physique.":"Raccordez D5 au port 23 du switch.";
 log("validation_grande_baie",{success:ok,liaison:"D5 vers 23"});
 if(ok){state.mainDone=true;state.sw=true;$("continuity-step").hidden=false;$("validate-main").disabled=true;$("continuity-step").scrollIntoView({behavior:"smooth",block:"start"});}
});
function renderReport(){
 const text=["Mini-baie F → D : "+(state.miniDone?"validée":"à réaliser"),
 "Grande baie D5 → 23 : "+(state.mainDone?"validée":"à réaliser"),
 "Continuité physique : "+(state.continuity?"vérifiée":"non vérifiée"),
 "Adresse IPv4 : "+(state.ip||"aucune"),
 "Diagnostic APIPA : "+(state.diagnosisPassed?"validé":"non validé"),
 "Ping IP / DNS : "+(state.ipPingPassed?"OK":"à vérifier")+" / "+(state.dnsPingPassed?"OK":"à vérifier"),
 "Navigateur final : "+(state.finalBrowserPassed?"validé":"non vérifié")].join("\n");
 $("report").textContent=text;
 const checks=[state.miniDone,state.mainDone,state.continuity,state.browser,state.apipaSeen,state.diagnosisPassed,state.lease,state.ipPingPassed&&state.dnsPingPassed,state.finalBrowserPassed];
 const n=checks.filter(Boolean).length;
 $("progress-text").textContent=n+" / 9 étapes";
 $("progress").replaceChildren(...checks.map(ok=>{const item=document.createElement("span");if(ok)item.className="done";return item;}));
 $("progress-label").textContent=n===9?"Intervention terminée":labels[checks.findIndex(ok=>!ok)]||"Poursuivre le diagnostic";
 $("export").disabled=!state.finalBrowserPassed;
 $("export-hint").textContent=state.finalBrowserPassed?"✓ Intervention terminée. Tu peux exporter ton travail.":"🔒 Vérifie Internet dans le navigateur final pour débloquer l’export.";
}
// Une représentation pédagogique de la liaison physique, pas un moteur de paquets.
const pathDescriptions=[
 "Départ : le PC envoie un signal par son port Ethernet.",
 "Le signal arrive à la prise murale F.",
 "Il traverse la mini-baie n°5 grâce au cordon F → D.",
 "Le câble installé relie le départ D à la prise D5 de la grande baie.",
 "Le signal arrive au port 23 du switch. La liaison physique est correcte !"
];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let pathPlaying=false;
async function playPhysicalPath(){
 if(pathPlaying)return;
 pathPlaying=true;
 const panel=$("path-animation"),rail=$("path-rail"),caption=$("path-caption");
 const stops=Array.from(rail.querySelectorAll("[data-path-stop]:not([hidden])"));
 const wires=Array.from(rail.querySelectorAll("[data-path-wire]:not([hidden])"));
 panel.hidden=false;
 stops.forEach(el=>el.classList.remove("active","reached"));
 wires.forEach(el=>el.classList.remove("active","reached"));
 $("continuity").disabled=true;
 panel.scrollIntoView({behavior:"smooth",block:"nearest"});
 for(let i=0;i<stops.length;i++){
  const stop=stops[i];
  stop.classList.add("active");
  stop.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
  caption.textContent=pathDescriptions[i];
  await pause(i===stops.length-1?280:190);
  stop.classList.remove("active");
  stop.classList.add("reached");
  if(i<wires.length){
   wires[i].classList.add("active");
   await pause(190);
   wires[i].classList.remove("active");
   wires[i].classList.add("reached");
  }
 }
 caption.textContent="✓ Liaison PC → switch validée ! Étape suivante : vérifier Internet dans le chapitre 2.";
 $("continuity-result").textContent="✓ Continuité physique validée : PC → switch.";
 $("browser-section").hidden=false;
 $("browser-section").scrollIntoView({behavior:"smooth",block:"nearest"});
 pathPlaying=false;
}
$("continuity").addEventListener("click",()=>{
 if(pathPlaying)return;
 let continuous=false,details="";
 try{
  const r=(state.miniDone&&state.mainDone)?registry.explorePhysicalPath(pcPort,switchPort):{success:false,connected:false};
  continuous=Boolean(r.success&&r.connected);
  details=continuous?"Parcours physique vérifié. Observe le signal traverser l'installation.":"Liaison interrompue. Vérifiez les branchements.";
 }catch(e){details="Contrôle indisponible : "+e.message;}
 state.continuity=continuous;
 $("continuity-result").textContent=details;
 log("continuite",{success:continuous,details});
 if(continuous)playPhysicalPath();
});
$("open-web").addEventListener("click",()=>{
 if(!state.continuity)return;
 state.browser=true;
 $("browser-result").innerHTML='<div class="browser-error"><span class="browser-error-icon" aria-hidden="true">🌐</span><div><h3>Ce site est inaccessible</h3><p>Impossible de se connecter à <strong>www.google.fr</strong>.</p><p>Vérifiez la connexion Internet de cet ordinateur.</p><small class="browser-error-code">ERR_INTERNET_DISCONNECTED</small></div></div>';
 $("open-web").disabled=true;$("console-section").hidden=false;updateHint();
 log("navigateur",{adresse:"https://www.google.fr",success:false});
 // Le navigateur reste à la même position ; l’élève descend ensuite vers les outils.
});
function updateHint(){
 $("technician").textContent=!state.apipaSeen
  ?"Internet ne fonctionne pas. Quelles informations techniques peux-tu recueillir sur le PC ?"
  :!state.diagnosisPassed
   ?"Tu as repéré une adresse 169.254. Interprète ce résultat dans « Ton diagnostic » avant de modifier la configuration."
   :!state.lease
    ?"Diagnostic validé. Choisis les commandes utiles pour remettre la configuration IPv4 en état."
    :!(state.ipPingPassed&&state.dnsPingPassed)
     ?"Le PC possède une adresse réseau. Vérifie la communication avec une adresse IP et avec un nom de domaine."
     :"Les deux Pings ont réussi. Vérifie l’accès au site dans le navigateur final.";
}
function print(s){$("terminal-output").append(document.createTextNode("\n\nC:\\Users\\technicien>"+s));$("terminal-output").scrollTop=$("terminal-output").scrollHeight;}
function config(all){return [
 "Configuration IP de Windows","",
 "Carte Ethernet :",
 "   Adresse IPv4. . . . . . . . . . : "+(state.ip||"aucune"),
 "   Masque de sous-réseau . . . . . : "+(state.lease?"255.255.255.0":state.ip?"255.255.0.0":"aucun"),
 "   Passerelle par défaut . . . . . : "+(state.lease?"192.168.30.1":"aucune"),
 ...(all?["   DHCP activé . . . . . . . . . . : Oui","   Serveur DHCP . . . . . . . . . : "+(state.lease?"192.168.30.2":"non joignable"),"   Serveur DNS . . . . . . . . . . : "+(state.lease?"192.168.30.2":"aucun")]:[])
 ].join("\n");}
function networkReady(){
 if(!state.continuity||!state.lease)return false;
 try{return !!engine.query({type:"network.ping",sourceId:"portable",targetId:"serveur"}).success;}catch{return false;}
}
// Composant Ping partagé C2-Lab, inchangé. Résultat issu du moteur R2D3.
let pingRunning=false;
function animatePing(entered){
 if(pingRunning)return;
 pingRunning=true;
 const terminal=$("terminal-output"),result=document.createElement("div");
 result.className="ping-session";terminal.append(document.createTextNode("\n\n"),result);
 const targetInput=entered==="ping google.fr"?"google.fr":"8.8.8.8";
 const targetAddress=targetInput==="google.fr"?"142.250.179.195":targetInput;
 const animator=createPingAnimator(result);
 const buttons=Array.from($("command-list").querySelectorAll("button[data-command]"));
 buttons.forEach(button=>button.disabled=true);
 const follow=()=>{terminal.scrollTop=terminal.scrollHeight;};
 animator.run({sourceName:"PC portable",sourceAddress:state.ip,targetInput,targetAddress,outcome:{success:networkReady()},
  onProgress:follow,onComplete:({success})=>{pingRunning=false;buttons.forEach(button=>button.disabled=false);follow();finishCommand(entered,success,result.textContent);}
 });follow();
}
function action(type){
 const snap=engine.getSnapshot();
 return engine.dispatch({commandVersion:1,id:"depannage-"+events.length+"-"+type,type,targetId:"portable",params:{},expectedRevision:snap.revision});
}
function refreshFinalBrowser(){
 $("final-browser-section").hidden=!(state.diagnosisPassed&&state.lease&&state.ipPingPassed&&state.dnsPingPassed);
}
function finishCommand(entered,success,output){
 if(entered==="ipconfig /all"&&state.ip.startsWith("169.254.")){state.apipaSeen=true;$("diagnosis-panel").hidden=false;}
 if(state.diagnosisPassed&&state.lease&&success){
  if(entered==="ping 8.8.8.8")state.ipPingPassed=true;
  if(entered==="ping google.fr")state.dnsPingPassed=true;
 }
 if(!state.lease){state.ipPingPassed=false;state.dnsPingPassed=false;}
 refreshFinalBrowser();
 log("commande",{commande:entered,success,resultat:output,etapeValidee:success});
 updateHint();
 if(state.ipPingPassed&&state.dnsPingPassed){$("final-browser-section").scrollIntoView({behavior:"smooth",block:"nearest"});}
}
function runCommand(entered){
 if(!state.browser||!engine||pingRunning)return;
 if(entered==="ping 8.8.8.8"||entered==="ping google.fr"){animatePing(entered);return;}
 let output="",success=false;
 try{
  if(entered==="ipconfig /all"){output=config(true);success=true;}
  else if(entered==="ipconfig /release"||entered==="ipconfig /renew"){
   if(!state.diagnosisPassed){output="Intervention non autorisée : examine la configuration et valide d'abord ton diagnostic.";}
   else if(entered==="ipconfig /release"){
    const r=action("dhcp.release");success=r.status==="applied";
    if(success){state.ip="";state.lease=false;state.ipPingPassed=false;state.dnsPingPassed=false;}
    output=success?"Configuration IPv4 libérée.":r.message||"Échec de la commande.";
   }else if(!state.continuity){output="Pas de liaison réseau. Vérifiez le câble.";}
   else{
    const r=action("dhcp.request");success=r.status==="applied";
    const obj=engine.getSnapshot().objectsById.portable,newIp=obj.config.ipv4.address;
    success=success&&!!obj.config.ipv4.lease&&newIp?.startsWith("192.168.30.");
    state.ip=newIp||"";state.lease=Boolean(obj.config.ipv4.lease);
    state.ipPingPassed=false;state.dnsPingPassed=false;
    output=success?"Nouvelle adresse IPv4 obtenue : "+state.ip:r.message||"Impossible d'obtenir une adresse.";
   }
  }else{output="Commande non reconnue dans cet exercice.";}
 }catch(error){output="Erreur technique : "+error.message;}
 print(entered+"\n"+output);finishCommand(entered,success,output);
}
$("validate-diagnosis").addEventListener("click",()=>{
 const selected=document.querySelector('input[name="diagnosis"]:checked')?.value;
 if(!selected){$("diagnosis-result").textContent="Choisis une réponse avant de valider.";return;}
 const correct=selected==="apipa";
 log("diagnostic_apipa",{reponse:selected,success:correct});
 if(!correct){$("diagnosis-result").textContent="Ce diagnostic n'est pas correct. Observe l'adresse IPv4 et réessaie.";return;}
 state.diagnosisPassed=true;
 $("diagnosis-result").textContent="✓ Diagnostic correct : le PC n'a pas reçu d'adresse IPv4 du DHCP. Tu peux maintenant intervenir.";
 document.querySelectorAll('input[name="diagnosis"]').forEach(input=>input.disabled=true);
 $("validate-diagnosis").disabled=true;
 updateHint();renderReport();
});
$("command-list").addEventListener("click",event=>{
 const btn=event.target.closest("button[data-command]");
 if(!btn)return;
 runCommand(btn.dataset.command);
});
$("final-open-web").addEventListener("click",()=>{
 if(!state.diagnosisPassed||!state.lease||!state.ipPingPassed||!state.dnsPingPassed||!state.continuity)return;
 const ok=networkReady();
 if(ok){
  $("final-browser-result").innerHTML='<div style="max-width:480px;margin:auto;text-align:center;padding:10px 0"><div style="font-size:43px" aria-hidden="true">🌐</div><h3 style="margin:8px 0;color:var(--ok)">Connexion Internet rétablie !</h3><p>La page de démonstration s’affiche correctement.</p><p>Bravo, vous avez terminé le dépannage du réseau.</p></div>';
  $("final-browser-status").textContent="✓ Accès au site vérifié. Votre intervention est terminée.";
  $("final-open-web").disabled=true;
  state.finalBrowserPassed=true;
 }else{
  $("final-browser-result").innerHTML='<div class="browser-error"><span class="browser-error-icon" aria-hidden="true">🌐</span><div><h3>Ce site est inaccessible</h3><p>La connexion Internet ne fonctionne pas encore.</p><small class="browser-error-code">ERR_INTERNET_DISCONNECTED</small></div></div>';
  $("final-browser-status").textContent="La connexion ne fonctionne pas. Vérifiez la configuration réseau.";
 }
 log("navigateur_final",{adresse:"https://www.google.fr",success:ok});
});
$("export").addEventListener("click",()=>{
 if(!state.finalBrowserPassed)return;
 const doc={format:"ci-el-depannage-reseau",version:"1.14",dateExport:new Date().toISOString(),identite:"Dépôt nominatif dans Pronote",scenario:"PC portable dans un nouveau bureau",etat:{brassage:{miniBaie:state.miniDone,grandeBaie:state.mainDone,cordons:registry?.listCables()},ports:{pc:state.pc,switch:state.sw},continuite:state.continuity,navigateurTeste:state.browser,adresseIPv4:state.ip,renouvellementReussi:state.lease,testsFinaux:state.ipPingPassed&&state.dnsPingPassed,navigateurFinalValide:state.finalBrowserPassed,diagnosticAPIPAValide:state.diagnosisPassed,pingIPValide:state.ipPingPassed,pingDNSValide:state.dnsPingPassed},historique:events};
 const blob=new Blob([JSON.stringify(doc,null,2)],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="depannage-reseau-"+new Date().toISOString().slice(0,10)+".json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
});
async function init(){
 try{
  makePhysical();
  const response=await fetch("../dhcp/exercices/apipa/scenario.json");
  if(!response.ok)throw Error("Scénario réseau introuvable");
  baseScenario=await response.json();
  engine=createEngine(baseScenario);
  state.ip=engine.getSnapshot().objectsById.portable.config.ipv4.address;
  renderReport();
 }catch(error){
  $("mini-result").textContent="Initialisation impossible : "+error.message;
  ["validate-mini","validate-main","continuity"].forEach(id=>$(id).disabled=true);
 }
}
init();