import {createAssetRegistry} from 'https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/asset-profiles.js';
import {createEngine} from 'https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/r2d3-core.js';
import {mountCablingFrontpanel} from 'https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/cabling-frontpanel.js?v=1.5';
const $=id=>document.getElementById(id);
const events=[],state={pc:false,sw:false,miniDone:false,mainDone:false,continuity:false,browser:false,stage:0,phase:0,lease:false,ip:"169.254.32.18",cableId:null};
const labels=["Brasser la mini-baie","Brasser la grande baie","Tester la continuité","Ouvrir le navigateur","Tester la connexion avec un ping","Observer l'adresse APIPA","Libérer puis renouveler l'adresse IPv4","Vérifier la configuration et les deux pings"];
const hints=[
"Le câble est bien branché, mais Internet ne fonctionne toujours pas. Je vais vérifier si mon PC peut communiquer avec Internet.",
"Le test de connexion a échoué. Je vais regarder les informations réseau de mon PC.",
"Je reconnais cette adresse qui commence par 169.254. C'est une adresse APIPA. Mon PC s'est donné cette adresse tout seul parce qu'il n'a pas réussi à obtenir une adresse du réseau. Je vais d'abord enlever mon ancienne adresse IP APIPA.",
"Maintenant que les câbles sont bien branchés, je vais demander une nouvelle adresse IP au réseau.",
"Mon PC a maintenant une nouvelle adresse IP. Je vais vérifier qu'il l'a bien reçue.",
"Mon PC a maintenant une bonne adresse IP. Je vais vérifier qu'il peut communiquer avec un ordinateur sur Internet.",
"Le premier ping fonctionne. Je vais maintenant essayer avec le nom d'un site Internet.",
"Les deux pings fonctionnent. Mon PC peut maintenant accéder à Internet. Le problème est résolu !"
];
const expected=["ping 8.8.8.8","ipconfig /all","ipconfig /release","ipconfig /renew","ipconfig /all","ping 8.8.8.8","ping google.fr"];
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
 "Adresse IPv4 : "+state.ip,
 "Commandes réussies : "+events.filter(e=>e.type==="commande"&&e.success).length].join("\\n");
 $("report").textContent=text;
 const n=[state.miniDone,state.mainDone,state.continuity,state.browser,state.phase>=1,state.phase>=3,state.phase>=5,state.phase===7].filter(Boolean).length;
 $("progress-text").textContent=n+" / 8 étapes";
 $("progress").replaceChildren(...Array.from({length:8},(_,i)=>{const item=document.createElement("span");if(i<n)item.className="done";return item;}));
 $("progress-label").textContent=n===8?"Intervention terminée":labels[n]||"Poursuivre le diagnostic";
}
$("continuity").addEventListener("click",()=>{
 let continuous=false,details="";
 try{
  const r=(state.miniDone&&state.mainDone)?registry.explorePhysicalPath(pcPort,switchPort):{success:false,connected:false};
  continuous=Boolean(r.success&&r.connected);
  details=continuous?"Liaison correcte.":"Liaison interrompue. Vérifiez les branchements.";
 }catch(e){details="Contrôle indisponible : "+e.message;}
 state.continuity=continuous;$("continuity-result").textContent=details;
 log("continuite",{success:continuous,details});
 if(continuous){$("browser-section").hidden=false;$("continuity").disabled=true;$("browser-section").scrollIntoView({behavior:"smooth",block:"start"});}
});
$("open-web").addEventListener("click",()=>{
 if(!state.continuity)return;
 state.browser=true;
 $("browser-result").innerHTML="<strong>Impossible d'accéder à ce site</strong><p>Vérifiez votre connexion Internet.</p><small>ERR_INTERNET_DISCONNECTED</small>";
 $("open-web").disabled=true;$("console-section").hidden=false;updateHint();
 log("navigateur",{adresse:"https://www.google.fr",success:false});
 $("console-section").scrollIntoView({behavior:"smooth",block:"start"});
});
function updateHint(){$("technician").textContent=hints[state.phase];}
function print(s){$("terminal-output").textContent+="\n\nC:\\Users\\technicien>"+s;$("terminal-output").scrollTop=$("terminal-output").scrollHeight;}
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
function ping(target){
 const ok=networkReady(),host=target==="google.fr"?"142.250.179.195":"8.8.8.8";
 return (target==="google.fr"?"Envoi d'une requête 'ping' sur google.fr ["+host+"]\n":"")+
 (ok?Array(4).fill("Réponse de "+host+" : octets=32 temps=14 ms TTL=115").join("\n"):"Délai d'attente de la demande dépassé.")+
 "\n\nPaquets : envoyés = 4, reçus = "+(ok?4:0)+", perdus = "+(ok?0:4)+".";
}
function action(type){
 const snap=engine.getSnapshot();
 return engine.dispatch({commandVersion:1,id:"depannage-"+events.length+"-"+type,type,targetId:"portable",params:{},expectedRevision:snap.revision});
}
function runCommand(entered){
 if(!state.browser||!engine)return;
 let output="",success=false;
 try{
  if(entered==="ipconfig /all"){
   output=config(true);success=true;
  }else if(entered==="ipconfig /release"){
   const r=action("dhcp.release");success=r.status==="applied";
   if(success){state.ip="";state.lease=false;}
   output=success?"Configuration IPv4 libérée.":r.message||"Échec de la commande.";
  }else if(entered==="ipconfig /renew"){
   if(!state.continuity){
    output="Pas de liaison réseau. Vérifiez le câble.";success=false;
   }else{
    const r=action("dhcp.request");success=r.status==="applied";
    const obj=engine.getSnapshot().objectsById.portable;
    const newIp=obj.config.ipv4.address;
    success=success&&!!obj.config.ipv4.lease&&newIp?.startsWith("192.168.30.");
    state.ip=newIp||"";state.lease=Boolean(obj.config.ipv4.lease);
    output=success?"Nouvelle adresse IPv4 obtenue : "+state.ip:r.message||"Impossible d'obtenir une adresse.";
   }
  }else if(entered==="ping 8.8.8.8"||entered==="ping google.fr"){
   output=ping(entered==="ping google.fr"?"google.fr":"8.8.8.8");success=networkReady();
  }else{
   output="Commande non reconnue dans cet exercice.";
  }
 }catch(error){output="Erreur technique : "+error.message;success=false;}
 // L'historique garde toutes les commandes, y compris les choix inadaptés.
 print(entered+"\n"+output);
 const validAtStep=(
  (state.phase===0&&entered==="ping 8.8.8.8"&&!success)||
  (state.phase===1&&entered==="ipconfig /all"&&state.ip.startsWith("169.254."))||
  (state.phase===2&&entered==="ipconfig /release"&&success)||
  (state.phase===3&&entered==="ipconfig /renew"&&success)||
  (state.phase===4&&entered==="ipconfig /all"&&state.lease)||
  (state.phase===5&&entered==="ping 8.8.8.8"&&success)||
  (state.phase===6&&entered==="ping google.fr"&&success)
 );
 log("commande",{commande:entered,success,resultat:output,etapeValidee:validAtStep});
 if(validAtStep&&state.phase<7){state.phase++;updateHint();}
}
$("command-list").addEventListener("click",event=>{
 const btn=event.target.closest("button[data-command]");
 if(!btn)return;
 runCommand(btn.dataset.command);
});
$("export").addEventListener("click",()=>{
 const doc={format:"ci-el-depannage-reseau",version:"1.2",dateExport:new Date().toISOString(),identite:"Dépôt nominatif dans Toutatice",scenario:"PC portable dans un nouveau bureau",etat:{brassage:{miniBaie:state.miniDone,grandeBaie:state.mainDone,cordons:registry?.listCables()},ports:{pc:state.pc,switch:state.sw},continuite:state.continuity,navigateurTeste:state.browser,adresseIPv4:state.ip,renouvellementReussi:state.lease,testsFinaux:state.phase===7},historique:events};
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