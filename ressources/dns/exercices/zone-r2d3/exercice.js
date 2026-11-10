/* Adaptateur pédagogique DNS : tous les résultats et toutes les écritures viennent de R2D3. */
import {createEngine} from "https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/r2d3-core.js";
import {formatNslookup,formatTypedNslookup} from "https://chaoli22000bzh.github.io/C2-Lab/shared-ui/v1/nslookup.js";

const SCENARIOS="./exercices/zone-r2d3/scenarios.json";
const PC="pc-dhcp-01", DNS="srv-dns";
const initialLookups={arte:"nslookup www.arte.net",armor:"nslookup www.armortech.fr"};
const q=(root,key)=>root.querySelector('[data-dns-ui="'+key+'"]');
const report=(root,message)=>{q(root,"status").textContent=message;};
const rowKey=(r)=>[r.name,r.type,r.value,r.priority??""].join("|");

function setup(root,scenarios){
 const mode=root.dataset.dnsMode,scenario=scenarios[mode];
 if(!scenario){report(root,"Scénario DNS introuvable.");return;}
 let engine,serial=0,selected=null,seenBefore=false,lookedAfter=false,modified=false;
 const snapshot=()=>engine.getSnapshot();
 const records=()=>snapshot().objectsById[DNS].config.dnsZone.records;
 const send=(type,targetId,params={})=>engine.dispatch({
  id:"cours-dns-"+mode+"-"+(++serial),commandVersion:1,type,targetId,params,
  expectedRevision:snapshot().revision
 });
 const labelRecord=r=>r.type==="MX"?r.priority+" "+r.value:r.value;
 function render(){
  const tbody=q(root,"records"),zone=records();
  tbody.replaceChildren(...zone.map(r=>{
   const tr=document.createElement("tr"),active=selected===rowKey(r);
   tr.classList.toggle("dns-r2d3-selected",active);
   for(const value of [r.name,r.type,labelRecord(r)]){
    const td=document.createElement("td");td.textContent=String(value);tr.appendChild(td);
   }
   const td=document.createElement("td"),button=document.createElement("button");
   button.type="button";button.className="dns-r2d3-mini";button.textContent="Modifier";
   button.setAttribute("aria-label","Modifier "+r.name+" "+r.type);
   button.addEventListener("click",()=>select(r));
   td.appendChild(button);tr.appendChild(td);return tr;
  }));
  const srv=snapshot().objectsById[DNS];
  q(root,"server-status").textContent=srv.config.dnsEnabled?"Service actif":"Service arrêté";
  q(root,"count").textContent=zone.length+" enregistrement"+(zone.length>1?"s":"");
  q(root,"delete").disabled=!selected;
 }
 function select(r){
  selected=rowKey(r);
  q(root,"name").value=r.name;
  q(root,"type").value=r.type;
  q(root,"value").value=r.value;
  q(root,"priority").value=r.priority??10;
  q(root,"priority-row").hidden=r.type!=="MX";
  report(root,"Enregistrement sélectionné. Modifie sa valeur puis enregistre.");
  render();
 }
 function newRecord(){
  selected=null;q(root,"name").value="";
  q(root,"type").value="A";q(root,"value").value="";
  q(root,"priority").value=10;q(root,"priority-row").hidden=true;
  report(root,"Saisis les informations du nouvel enregistrement.");
  render();q(root,"name").focus();
 }
 function buildRecord(){
  const type=q(root,"type").value;
  const record={name:q(root,"name").value.trim().toLowerCase(),
   type,value:q(root,"value").value.trim()};
  if(type==="MX")record.priority=Number(q(root,"priority").value);
  return record;
 }
 function save(){
  const record=buildRecord();
  if(!record.name||!record.value){report(root,"Renseigne le nom DNS et la valeur.");return;}
  const before=records().find(r=>rowKey(r)===selected);
  if(before&&(before.name!==record.name||before.type!==record.type)){
   report(root,"Pour changer le nom ou le type d'un enregistrement, supprime-le puis crée-en un nouveau.");return;
  }
  const response=send("dns.upsertRecord",DNS,{record});
  if(response.status!=="applied"){report(root,"Modification refusée par R2D3 : "+(response.message??response.code));return;}
  if(before){
   modified=true;lookedAfter=false;
  }
  const updated=records().find(r=>r.name===record.name&&r.type===record.type&&r.value===record.value);
  selected=updated?rowKey(updated):null;
  render();
  report(root,"Enregistrement enregistré sur le serveur DNS. Vérifie le résultat avec nslookup.");
 }
 function remove(){
  const chosen=records().find(r=>rowKey(r)===selected);
  if(!chosen)return;
  const response=send("dns.removeRecord",DNS,{name:chosen.name,recordType:chosen.type,value:chosen.value});
  if(response.status!=="applied"){report(root,"Suppression refusée par R2D3 : "+(response.message??response.code));return;}
  selected=null;modified=true;lookedAfter=false;render();
  report(root,"Enregistrement supprimé du serveur DNS.");
 }
 function lookup(event){
  event?.preventDefault();
  const command=q(root,"command").value.trim();
  const match=/^nslookup(?:\s+-type=(A|AAAA|MX|TXT|PTR))?\s+([^\s]+)$/i.exec(command);
  if(!match){report(root,"Commande attendue : nslookup nom.domaine ou nslookup -type=MX nom.domaine");return;}
  const type=(match[1]??"A").toUpperCase(),name=match[2].toLowerCase();
  const result=engine.query({type:"dns.resolve",sourceId:PC,name,recordType:type});
  const output=type==="A"?formatNslookup({name,result}):formatTypedNslookup({name,recordType:type,result});
  q(root,"terminal").textContent=output;
  if(mode==="armor"&&type==="A"&&name==="www.armortech.fr"){
   if(!modified)seenBefore=true;
   else lookedAfter=true;
  }
  report(root,result.status==="ok"?"Requête DNS exécutée. Examine la réponse du serveur.":"Requête exécutée. Examine le message d'erreur.");
 }
 function verify(){
  if(!seenBefore){report(root,"Commence par constater le problème avec nslookup www.armortech.fr.");return;}
  if(!lookedAfter){report(root,"Après la modification, relance nslookup www.armortech.fr.");return;}
  const cname=records().find(r=>r.name==="www.armortech.fr"&&r.type==="CNAME");
  const result=engine.query({type:"dns.resolve",sourceId:PC,name:"www.armortech.fr",recordType:"A"});
  const success=cname?.value==="armortech.fr"&&result.status==="ok"&&result.address==="192.0.2.80";
  report(root,success?"Mission réussie ! Le nom www renvoie désormais vers le nouveau serveur.":"La résolution de www.armortech.fr ne correspond pas encore au nouveau serveur. Vérifie la zone et recommence.");
  q(root,"result").textContent=success?"Intervention terminée : DNS corrigé et nouvelle réponse vérifiée.":"";
 }
 function reset(){
  engine=createEngine(scenario);serial=0;selected=null;seenBefore=false;lookedAfter=false;modified=false;
  const response=send("dhcp.request",PC);
  if(response.status!=="applied"){report(root,"Initialisation du PC refusée par R2D3 : "+(response.message??response.code));return;}
  q(root,"command").value=initialLookups[mode];
  q(root,"terminal").textContent="C:\\> En attente d'une commande nslookup.";
  q(root,"result").textContent="";
  q(root,"type").value="A";q(root,"priority-row").hidden=true;
  newRecord();render();
  report(root,mode==="armor"?"Commence par vérifier le problème avec nslookup.":"Zone DNS chargée. Sélectionne un enregistrement ou exécute nslookup.");
 }
 q(root,"edit-form").addEventListener("submit",e=>{e.preventDefault();save();});
 q(root,"lookup-form").addEventListener("submit",lookup);
 q(root,"type").addEventListener("change",()=>q(root,"priority-row").hidden=q(root,"type").value!=="MX");
 q(root,"new").addEventListener("click",newRecord);
 q(root,"delete").addEventListener("click",remove);
 q(root,"reset").addEventListener("click",reset);
 if(mode==="armor")q(root,"verify").addEventListener("click",verify);
 reset();
}

async function init(){
 const roots=[...document.querySelectorAll("[data-dns-mode]")];
 if(!roots.length)return;
 try{
  const response=await fetch(SCENARIOS,{cache:"no-store"});
  if(!response.ok)throw Error("Fichier de scénarios indisponible");
  const scenarios=await response.json();
  for(const root of roots)setup(root,scenarios);
 }catch(error){
  for(const root of roots)report(root,"Exercice indisponible : "+error.message);
  console.error("Cours DNS et R2D3 :",error);
 }
}
init();
