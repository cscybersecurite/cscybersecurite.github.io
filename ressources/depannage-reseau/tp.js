import {createAssetRegistry} from 'https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/asset-profiles.js';
import {createEngine} from 'https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/r2d3-core.js';
const $=id=>document.getElementById(id);
const events=[],state={pc:false,sw:false,continuity:false,browser:false,stage:0,phase:0,lease:false,ip:"169.254.32.18",cableId:null};
const labels=["Raccorder le PC au switch","Tester la continuité","Ouvrir le navigateur","Tester la connexion avec un ping","Observer l'adresse APIPA","Libérer puis renouveler l'adresse IPv4","Vérifier la configuration et les deux pings"];
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
let registry,pcPort,switchPort,engine,baseScenario;
function must(r){if(!r.success)throw Error(r.message||r.code||"R2D3 : opération refusée");return r;}
function makePhysical(){
 registry=createAssetRegistry();
 const loc=must(registry.createPlace({name:"Bureau de passage"})).place.id;
 const pcProfile=must(registry.createProfile("PC portable")).profile.id;
 must(registry.addPortGroup(pcProfile,{type:"ethernet-rj45",prefix:"LAN",start:1,count:1,digits:2}));
 const swProfile=must(registry.createProfile("Switch de bureau")).profile.id;
 must(registry.addPortGroup(swProfile,{type:"ethernet-rj45",prefix:"LAN",start:1,count:4,digits:2}));
 const pc=must(registry.createAsset(pcProfile,{name:"Portable salarié"})).asset;
 const sw=must(registry.createAsset(swProfile,{name:"SW01"})).asset;
 must(registry.moveAssetToPlace(pc.id,loc));must(registry.moveAssetToPlace(sw.id,loc));
 pcPort=pc.ports[0].id;switchPort=sw.ports[0].id;
 state.cableId=must(registry.createCable({connectors:["rj45-male","rj45-male"]})).cable.id;
}
function renderReport(){
 const text=["Câble PC : "+(state.pc?"branché":"libre"),"Câble switch : "+(state.sw?"branché":"libre"),"Continuité : "+(state.continuity?"vérifiée":"non vérifiée"),"Adresse IPv4 : "+state.ip,"Commandes réussies : "+events.filter(e=>e.type==="commande"&&e.success).length].join("\n");
 $("report").textContent=text;
 const n=[state.pc&&state.sw,state.continuity,state.browser,state.phase>=1,state.phase>=3,state.phase>=5,state.phase===7].filter(Boolean).length;
 $("progress-text").textContent=n+" / 7 étapes";
 $("progress").replaceChildren(...Array.from({length:7},(_,i)=>{const s=document.createElement("span");if(i<n)s.className="done";return s;}));
 $("progress-label").textContent=n===7?"Intervention terminée":labels[n];
}
function showCable(){
 $("pc-port").classList.toggle("selected",state.pc);$("sw-port").classList.toggle("selected",state.sw);
 $("pc-port").textContent=state.pc?"✓ RJ45 branché":"Brancher le port RJ45";
 $("sw-port").textContent=state.sw?"✓ LAN01 branché":"Brancher le port LAN01";
 $("pc-port").disabled=state.pc;$("sw-port").disabled=state.sw;
 $("cable-status").textContent=state.pc&&state.sw?"Les deux extrémités du câble sont branchées.":state.pc||state.sw?"Une extrémité est branchée. Branchez l'autre extrémité.":"Câble disponible : aucune extrémité branchée.";
}
function attach(which){
 if(state.continuity||state[which])return;
 try{must(registry.connectCableEnd(state.cableId,which==="pc"?0:1,which==="pc"?pcPort:switchPort));state[which]=true;log("raccordement",{equipement:which==="pc"?"PC portable":"Switch",success:true});showCable();}
 catch(e){$("cable-status").textContent="Raccordement impossible : "+e.message;log("raccordement",{success:false,erreur:e.message});}
}
$("pc-port").addEventListener("click",()=>attach("pc"));
$("sw-port").addEventListener("click",()=>attach("sw"));
$("continuity").addEventListener("click",()=>{
 let continuous=false,details="";
 try{
  const r=registry.explorePhysicalPath(pcPort,switchPort);
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
 const doc={format:"ci-el-depannage-reseau",version:"1.1",dateExport:new Date().toISOString(),identite:"Dépôt nominatif dans Toutatice",scenario:"PC portable dans un nouveau bureau",etat:{ports:{pc:state.pc,switch:state.sw},continuite:state.continuity,navigateurTeste:state.browser,adresseIPv4:state.ip,renouvellementReussi:state.lease,testsFinaux:state.phase===7},historique:events};
 const blob=new Blob([JSON.stringify(doc,null,2)],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="depannage-reseau-"+new Date().toISOString().slice(0,10)+".json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
});
async function init(){
 try{
  makePhysical();showCable();
  const response=await fetch("../dhcp/exercices/apipa/scenario.json");
  if(!response.ok)throw Error("Scénario réseau introuvable");
  baseScenario=await response.json();
  engine=createEngine(baseScenario);
  state.ip=engine.getSnapshot().objectsById.portable.config.ipv4.address;
  renderReport();
 }catch(error){
  $("cable-status").textContent="Initialisation impossible : "+error.message;
  ["pc-port","sw-port","continuity"].forEach(id=>$(id).disabled=true);
 }
}
init();