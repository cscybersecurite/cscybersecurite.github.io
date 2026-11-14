import {calculateRaid,assessRaidFailures} from "./raid-core.js";
const $=id=>document.getElementById(id);
const cfg=(level,disks)=>({format:"raid-configuration",schemaVersion:1,level,disks});
const fmt=n=>new Intl.NumberFormat("fr-FR",{maximumFractionDigits:4}).format(n)+" To";
const levels=[["1","Miroir"],["5","Parité simple"],["6","Double parité"]];
let selected="5",failed=new Set(),withSpare=false,sparePhase="standby",disks=[1,2,3].map(i=>({id:"d"+i,capacityTB:2,role:"active"})),counter=4;
const layouts={
 "1":[["A1","B1","C1"],["A1","B1","C1"]],
 "5":[["A1","B1","P"],["A2","P","C1"],["P","B2","C2"]],
 "6":[["A1","B1","P","Q"],["A2","P","Q","D1"],["P","Q","C1","D2"],["Q","B2","C2","P"]]
};
const explanations={
 "1":"Les deux disques contiennent exactement les mêmes blocs. Ils forment un miroir.",
 "5":"Les données sont réparties sur trois disques. Les blocs orange P servent à retrouver les données après une panne.",
 "6":"Quatre disques, avec deux parités P (orange) et Q (verte). Le RAID peut supporter deux pannes de disques."
};
function renderLevels(){
 $("levels").replaceChildren();
 for(const [id,subtitle] of levels){
  const b=document.createElement("button");b.className="level-btn";b.type="button";
  b.setAttribute("aria-pressed",String(id===selected));
  const name=document.createElement("strong");name.textContent="RAID "+id;
  const small=document.createElement("small");small.textContent=subtitle;
  b.append(name,small);
  b.addEventListener("click",()=>{selected=id;failed.clear();withSpare=false;sparePhase="standby";renderLevels();renderSimulation()});
  $("levels").append(b);
 }
}
function renderSimulation(){
 const rows=layouts[selected],result=$("sim-disks");result.replaceChildren();
 const active=rows.map((_,i)=>({id:"d"+(i+1),capacityTB:2,role:"active"}));
 const spareId="secours",oneFailure=failed.size===1;
 const spareRebuilt=withSpare&&sparePhase==="done"&&oneFailure;
 const physical=active.concat(withSpare?[{id:spareId,capacityTB:2,role:"spare"}]:[]);
 for(let i=0;i<physical.length;i++){
  const d=physical[i],isSpare=d.id===spareId,isFailed=failed.has(d.id);
  const disk=document.createElement("article");
  disk.className="sim-disk"+(isFailed?" off":"")+(isSpare?" spare-disk":"");
  const title=document.createElement("h4");
  title.textContent=isSpare?"Disque de secours":("Disque "+(i+1)+(isFailed?" • En panne":""));
  disk.append(title);
  const diskBlocks=isSpare?(sparePhase==="rebuilding"||sparePhase==="done"?rows[Number([...failed][0].slice(1))-1]:[]):rows[i];
  if(isSpare){
   const status=document.createElement("p");status.className="spare-label";
   status.textContent=sparePhase==="done"?"Reconstruction terminée":sparePhase==="rebuilding"?"Reconstruction simulée": "En attente";
   disk.append(status);
  }
  for(const block of diskBlocks){
   const tile=document.createElement("div");
   tile.className="block"+(block==="P"?" parity-p":block==="Q"?" parity-q":" data-block")+(isSpare?" copied-block":"");
   tile.textContent=block==="P"?"P":block==="Q"?"Q":block;
   disk.append(tile);
  }
  if(isSpare&&sparePhase==="standby"){
    const empty=document.createElement("div");empty.className="spare-empty";
    empty.textContent="Aucune donnée du RAID";disk.append(empty);
  }
  result.append(disk);
 }
 $("sim-description").textContent=explanations[selected];
 $("sim-spare-controls").hidden=selected==="1";
 const spareToggle=$("sim-spare-toggle");
 spareToggle.checked=withSpare;
 $("sim-spare-caption").textContent=withSpare?"Disque de secours ajouté. Il ne stocke pas encore les données du RAID.":"Ajoute un disque de secours pour observer son rôle après une panne.";
 const buttons=$("failure-actions");buttons.replaceChildren();
 for(const d of active){
  const b=document.createElement("button");b.type="button";b.className="failure-btn";
  b.setAttribute("aria-pressed",String(failed.has(d.id)));
  b.textContent=failed.has(d.id)?"Remettre disque "+d.id.slice(1):"Panne disque "+d.id.slice(1);
  b.addEventListener("click",()=>{
   failed.has(d.id)?failed.delete(d.id):failed.add(d.id);
   sparePhase="standby";renderSimulation();
  });buttons.append(b);
 }
 const state=assessRaidFailures(cfg(selected,physical),[...failed]);
 const message=$("sim-feedback"),spareActions=$("sim-spare-actions");
 spareActions.replaceChildren();
 if(!state.ok){message.textContent=state.errors[0].message;return}
 if(!failed.size){message.textContent="Tout fonctionne. Choisis un disque à mettre en panne.";return}
 if(!state.value.available){
  message.textContent="RAID indisponible. Le disque de secours ne peut pas remplacer les données perdues lorsqu'il y a trop de pannes.";
  return;
 }
 if(withSpare&&oneFailure){
  if(sparePhase==="standby"){
   message.textContent="Le RAID fonctionne encore, mais un disque est en panne. Le disque de secours peut prendre sa place.";
   const start=document.createElement("button");start.type="button";start.className="spare-action";
   start.textContent="Lancer la reconstruction (simulation)";
   start.addEventListener("click",()=>{sparePhase="rebuilding";renderSimulation()});spareActions.append(start);
   return;
  }
  if(sparePhase==="rebuilding"){
   message.textContent="Reconstruction simulée : les blocs du disque en panne sont recopiés ou recalculés sur le disque de secours.";
   const finish=document.createElement("button");finish.type="button";finish.className="spare-action";
   finish.textContent="Terminer la reconstruction";
   finish.addEventListener("click",()=>{sparePhase="done";renderSimulation()});spareActions.append(finish);
   return;
  }
  if(spareRebuilt){
   message.textContent="Reconstruction terminée dans cette démonstration. Le disque de secours remplace maintenant le disque en panne. Une autre panne n'est plus protégée par ce même disque de secours.";
   return;
  }
 }
 message.textContent="Le RAID fonctionne encore malgré "+failed.size+" disque"+(failed.size>1?"s":"")+" en panne. Il faut remplacer les disques défectueux.";
}
function initSimSpare(){
 const toggle=$("sim-spare-toggle");
 if(!toggle)return;
 toggle.addEventListener("change",()=>{withSpare=toggle.checked;failed.clear();sparePhase="standby";renderSimulation()});
}
function bindQuizzes(){
 const explanations={
 base:"C: est souvent le nom du stockage affiché dans Windows. On appelle ça un volume.",
 mirror:"Le miroir copie les mêmes fichiers sur plusieurs disques.",
 parity:"Un disque de 2 To sert à la protection. Il reste 6 To pour les fichiers.",
 backup:"Avec une sauvegarde, tu peux retrouver un fichier supprimé.",
 spare:"Le disque de secours attend. Il ne donne pas de place en plus pour les fichiers. Il reste 4 To.",
 case:"Le RAID 6 peut continuer si deux disques cassent. En RAID 10, cela dépend des deux disques touchés."
 };
 for(const root of document.querySelectorAll(".quiz")){
  const reply=root.querySelector(".reply");
  for(const b of root.querySelectorAll("button")){
   b.type="button";
   b.addEventListener("click",()=>{
    for(const x of root.querySelectorAll("button"))x.setAttribute("aria-pressed",String(x===b));
    const good=b.dataset.answer==="oui";
    reply.className="reply "+(good?"good":"bad");
    reply.textContent=good?"Bonne réponse. "+explanations[root.dataset.question]:"Pas encore. Essaie une autre réponse.";
    if(good){for(const x of root.querySelectorAll("button"))x.disabled=true;}
   });
  }
 }
}
let editingId="d1";
function toolConfiguration(){return cfg($("tool-level").value,disks.map(d=>({...d})))}
function renderTool(){
 const area=$("tool-disks");area.replaceChildren();
 const chassis=document.createElement("div");chassis.className="nas-chassis";
 chassis.setAttribute("role","group");chassis.setAttribute("aria-label","NAS Synology pédagogique, tiroirs interactifs");
 const header=document.createElement("div");header.className="nas-header";
 const brand=document.createElement("span");brand.className="nas-brand";brand.textContent="Synology";
 const lights=document.createElement("div");lights.className="nas-indicators";
 const indicators=[["STATUS","on"],["ALERT","off"],["LAN 1","on"],["LAN 2","on"]];
 for(const [label,state] of indicators){
  const light=document.createElement("span");light.className="nas-indicator";
  const led=document.createElement("i");led.className="nas-indicator-led "+state;led.setAttribute("aria-hidden","true");
  const caption=document.createElement("span");caption.textContent=label;
  light.append(led,caption);lights.append(light);
 }
 const power=document.createElement("span");power.className="nas-power-button";
 power.setAttribute("role","img");power.setAttribute("aria-label","NAS allumé");
 power.textContent="⏻";
 header.append(brand,lights,power);
 const grid=document.createElement("div");grid.className="nas-slots";
 const slots=disks.length<=4?4:disks.length<=6?6:disks.length<=8?8:disks.length<=10?10:12;
 for(let i=0;i<slots;i++){
  const d=disks[i];
  if(!d){
   const empty=document.createElement("div");empty.className="nas-tray nas-empty";
   empty.setAttribute("aria-label","Emplacement vide");
   const label=document.createElement("span");label.textContent="VIDE";
   empty.append(label);grid.append(empty);continue;
  }
  const tray=document.createElement("button");tray.type="button";
  tray.className="nas-tray"+(d.role==="spare"?" is-spare":"")+(d.id===editingId?" is-selected":"");
  tray.setAttribute("aria-pressed",String(d.id===editingId));
  tray.setAttribute("aria-label","Disque "+d.id+", "+d.capacityTB+" To, "+(d.role==="spare"?"secours":"actif")+". Voir ses réglages");
  const led=document.createElement("span");led.className="nas-led";led.setAttribute("aria-hidden","true");
  const title=document.createElement("strong");title.textContent=d.id;
  const cap=document.createElement("span");cap.className="nas-cap";cap.textContent=d.capacityTB+" To";
  const keyhole=document.createElement("span");keyhole.className="nas-keyhole";keyhole.setAttribute("aria-hidden","true");
  const role=document.createElement("small");role.textContent=d.role==="spare"?"SECOURS":"ACTIF";
  tray.append(led,title,cap,keyhole,role);
  tray.addEventListener("click",()=>{editingId=d.id;renderTool();$("tool-editor").scrollIntoView({block:"nearest",behavior:"auto"})});
  grid.append(tray);
 }
 chassis.append(header,grid);
 const footer=document.createElement("div");footer.className="nas-footer";footer.textContent=disks.length+" / 12 places occupées";
 chassis.append(footer);const feet=document.createElement("div");feet.className="nas-feet";feet.setAttribute("aria-hidden","true");feet.append(document.createElement("i"),document.createElement("i"));chassis.append(feet);area.append(chassis);
 const add=$("tool-add");add.disabled=disks.length>=12;
 add.setAttribute("aria-disabled",String(add.disabled));
 add.title=add.disabled?"Les 12 places du NAS sont occupées.":"Ajouter un disque";
 renderEditor();calculateTool();
}
function renderEditor(){
 const area=$("tool-editor");area.replaceChildren();
 let d=disks.find(x=>x.id===editingId);
 if(!d){d=disks[0];editingId=d?.id??null}
 if(!d){
  const p=document.createElement("p");p.textContent="Aucun disque. Clique sur Ajouter un disque.";area.append(p);return;
 }
 const h=document.createElement("strong");h.textContent="Réglages du disque "+d.id;
 const hint=document.createElement("p");hint.className="tiny";hint.textContent="Choisis un disque sur le NAS pour le modifier.";
 const controls=document.createElement("div");controls.className="disk-controls";
 const label=document.createElement("label");label.textContent="Taille (To)";
 const capacity=document.createElement("input");capacity.type="number";capacity.min="0.01";capacity.max="1000000";capacity.step="0.25";capacity.value=d.capacityTB;
 capacity.setAttribute("aria-label","Taille du disque "+d.id);
 capacity.addEventListener("input",()=>{d.capacityTB=capacity.value===""?0:Number(capacity.value);const tray=[...document.querySelectorAll(".nas-tray")].find(x=>x.querySelector("strong")?.textContent===d.id);if(tray){tray.querySelector(".nas-cap").textContent=d.capacityTB+" To";tray.setAttribute("aria-label","Disque "+d.id+", "+d.capacityTB+" To")}calculateTool()});
 label.append(capacity);
 const roleLabel=document.createElement("label");roleLabel.textContent="Rôle";
 const role=document.createElement("select");role.setAttribute("aria-label","Rôle du disque "+d.id);
 for(const [v,t] of [["active","Actif"],["spare","De secours"]])role.add(new Option(t,v));
 role.value=d.role;role.addEventListener("change",()=>{d.role=role.value;renderTool()});roleLabel.append(role);
 const remove=document.createElement("button");remove.type="button";remove.textContent="Retirer ce disque";
 remove.addEventListener("click",()=>{disks=disks.filter(x=>x!==d);editingId=disks[0]?.id??null;renderTool()});
 controls.append(label,roleLabel,remove);area.append(h,hint,controls);
}
const simpleError={INVALID_CAPACITY:"Entre une taille supérieure à 0 To.",TOO_FEW_ACTIVE_DISKS:"Il manque des disques actifs pour ce RAID.",EVEN_ACTIVE_DISKS:"Ce RAID demande un nombre pair de disques actifs.",SPARE_TOO_SMALL:"Le disque de secours est trop petit.",INVALID_DISKS:"Il y a trop de disques."};
function calculateTool(){
 const result=calculateRaid(toolConfiguration()),metrics=$("tool-metrics"),bar=$("tool-bar");
 metrics.replaceChildren();bar.replaceChildren();
 const status=$("tool-status");$("tool-tolerance").textContent="";
 if(!result.ok){
  status.className="status error";
  const e=result.errors[0];
  status.textContent=e.code==="TOO_FEW_ACTIVE_DISKS"
   ?"Il faut au moins "+({"0":2,"1":2,"5":3,"6":4,"10":4,"01":4}[$("tool-level").value])+" disques actifs pour ce RAID."
   :simpleError[e.code]??e.message;
  return;
 }
 status.className="status";status.textContent="Le RAID est prêt.";
 const r=result.value,c=r.capacitiesTB;
 for(const [label,value] of [["Total des disques",c.rawTotal],["Pour les fichiers",c.usable],["Pour la protection",c.redundancy],["Place non utilisée",c.unused],["Disques de secours",c.spare]]){
  const tile=document.createElement("div");tile.className="metric";const strong=document.createElement("b");strong.textContent=fmt(value);
  const caption=document.createElement("span");caption.textContent=label;tile.append(strong,caption);metrics.append(tile);
 }
 for(const [value,style] of [[c.usable,"usable"],[c.redundancy,"redundancy"],[c.unused,"unused"],[c.spare,"sparebar"]]){
  const segment=document.createElement("i");segment.className=style;segment.style.width=100*value/c.rawTotal+"%";bar.append(segment);
 }
 const tolerance=r.tolerance;
 $("tool-tolerance").textContent=tolerance.guaranteed===0
  ?"Si un disque tombe en panne, le RAID ne marche plus."
  : "Le RAID peut continuer avec "+tolerance.guaranteed+" disque"+(tolerance.guaranteed>1?"s":"")+" en panne. Pour RAID 10 et RAID 01, cela dépend aussi des disques touchés.";
}
$("tool-level").addEventListener("change",renderTool);
$("tool-add").addEventListener("click",()=>{if(disks.length>=12)return;const d={id:"d"+counter++,capacityTB:2,role:"active"};disks.push(d);editingId=d.id;renderTool()});
$("tool-reset").addEventListener("click",()=>{counter=4;disks=[1,2,3].map(i=>({id:"d"+i,capacityTB:2,role:"active"}));editingId="d1";$("tool-level").value="5";renderTool()});

function initStorageLab(){
 const root=$("storage-lab");
 if(!root)return;
 const stages=[
  ["Le disque","Voici un disque. C'est le matériel qui garde les données."],
  ["Les partitions","On découpe le même disque en trois parties. Ce sont les partitions."],
  ["Les volumes","Chaque partition contient ici un volume : C:, D: et E:. Un seul disque suffit pour avoir trois lettres."],
  ["Les fichiers","Dans les volumes, tu peux ranger des fichiers : PDF, JPG, DOC ou MP4."],
  ["La clé USB","On branche une clé USB. C'est un deuxième support. Windows lui donne ici la lettre F:."]
 ];
 let step=1;
 const buttons=[...root.querySelectorAll("[data-storage-step]")];
 function show(next){
  step=Math.min(stages.length,Math.max(1,next));
  root.dataset.step=String(step);
  $("storage-stage-name").textContent=step+". "+stages[step-1][0];
  $("storage-stage-counter").textContent="Étape "+step+" sur "+stages.length;
  $("storage-stage-message").textContent=stages[step-1][1];
  $("storage-prev").disabled=step===1;
  $("storage-next").textContent=step===stages.length?"Recommencer":"Suivant";
  for(const b of buttons){b.setAttribute("aria-pressed",String(Number(b.dataset.storageStep)===step));}
 }
 $("storage-prev").addEventListener("click",()=>show(step-1));
 $("storage-next").addEventListener("click",()=>show(step===stages.length?1:step+1));
 for(const b of buttons)b.addEventListener("click",()=>show(Number(b.dataset.storageStep)));
 show(1);
}
renderLevels();initSimSpare();renderSimulation();bindQuizzes();initStorageLab();renderTool();
