import {calculateRaid,assessRaidFailures} from "./raid-core.js";
const $=id=>document.getElementById(id);
const cfg=(level,disks)=>({format:"raid-configuration",schemaVersion:1,level,disks});
const fmt=n=>new Intl.NumberFormat("fr-FR",{maximumFractionDigits:4}).format(n)+" To";
const levels=[["0","Répartir, sans copie"],["1","Copier chaque bloc"],["5","Parité simple"],["6","Double parité"],["10","Miroirs répartis"],["01","Groupes répartis en miroir"]];
let selected="5",failed=new Set(),disks=[1,2,3].map(i=>({id:"d"+i,capacityTB:2,role:"active"})),counter=4;
const layouts={
 "0":[["A1","A4","A7"],["A2","A5","A8"],["A3","A6","A9"]],
 "1":[["A1","A2","A3"],["A1","A2","A3"],["A1","A2","A3"]],
 "5":[["A1","A2","P"],["A3","P","A4"],["P","A5","A6"]],
 "6":[["A1","A2","P","Q"],["A3","P","Q","A4"],["P","Q","A5","A6"],["Q","A7","A8","P"]],
 "10":[["A1","A2","A3"],["A1","A2","A3"],["A4","A5","A6"],["A4","A5","A6"]],
 "01":[["A1","A3","A5"],["A2","A4","A6"],["A1","A3","A5"],["A2","A4","A6"]]
};
const explanations={
 "0":"Les blocs sont répartis. Si un disque casse, le RAID ne fonctionne plus.",
 "1":"Chaque disque garde les mêmes données. Un disque peut tomber en panne : l'autre garde les fichiers.",
 "5":"La parité P sert à retrouver les données si un disque casse. Mais pas deux.",
 "6":"Il y a deux protections : P et Q. Le RAID peut continuer même si deux disques tombent en panne.",
 "10":"Les disques travaillent par paires. Dans chaque paire, les données sont copiées. Si les deux disques d'une paire cassent, le RAID ne marche plus.",
 "01":"Il y a deux groupes de disques. Chaque groupe garde les mêmes fichiers. Si un disque casse dans chaque groupe, le RAID ne marche plus."
};
function renderLevels(){
 $("levels").replaceChildren();
 for(const [id,subtitle] of levels){
  const b=document.createElement("button");b.className="level-btn";b.type="button";
  b.setAttribute("aria-pressed",String(id===selected));
  const name=document.createElement("strong");name.textContent="RAID "+id;
  const small=document.createElement("small");small.textContent=subtitle;
  b.append(name,small);b.addEventListener("click",()=>{selected=id;failed.clear();renderLevels();renderSimulation()});
  $("levels").append(b);
 }
}
function renderSimulation(){
 const rows=layouts[selected],result=$("sim-disks");result.replaceChildren();
 const active=rows.map((_,i)=>({id:"d"+(i+1),capacityTB:2,role:"active"}));
 for(let i=0;i<rows.length;i++){
  const disk=document.createElement("article");disk.className="sim-disk"+(failed.has("d"+(i+1))?" off":"");
  const title=document.createElement("h4");title.textContent="Disque "+(i+1)+(failed.has("d"+(i+1))?" • En panne":"");
  disk.append(title);
  for(const block of rows[i]){
   const tile=document.createElement("div");tile.className="block"+(["P","Q"].includes(block)?" parity":selected==="1"?" mirror":"");tile.textContent=block==="P"?"P • parité":block==="Q"?"Q • parité":block;disk.append(tile);
  }
  result.append(disk);
 }
 $("sim-description").textContent=explanations[selected];
 const buttons=$("failure-actions");buttons.replaceChildren();
 for(const d of active){
  const b=document.createElement("button");b.type="button";b.className="failure-btn";
  b.setAttribute("aria-pressed",String(failed.has(d.id)));
  b.textContent=failed.has(d.id)?"Remettre disque "+d.id.slice(1):"Panne disque "+d.id.slice(1);
  b.addEventListener("click",()=>{failed.has(d.id)?failed.delete(d.id):failed.add(d.id);renderSimulation()});buttons.append(b);
 }
 const state=assessRaidFailures(cfg(selected,active),[...failed]);
 const message=$("sim-feedback");
 if(!state.ok){message.textContent=state.errors[0].message;return}
 if(!failed.size){message.textContent="Tout marche. Clique sur « Panne disque » pour faire un essai.";return}
 message.textContent=state.value.available
  ? "Ça marche encore. "+failed.size+" disque"+(failed.size>1?"s":"")+" en panne. Il faut réparer."
  : "Ça ne marche plus. Trop de disques sont en panne. Le RAID ne peut plus retrouver les fichiers.";
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
    reply.textContent=(good?"Bonne réponse. ":"Pas encore. ")+explanations[root.dataset.question];
   });
  }
 }
}
let editingId="d1";
function toolConfiguration(){return cfg($("tool-level").value,disks.map(d=>({...d})))}
function renderTool(){
 const area=$("tool-disks");area.replaceChildren();
 const chassis=document.createElement("div");chassis.className="nas-chassis";
 const header=document.createElement("div");header.className="nas-header";
 const brand=document.createElement("span");brand.className="nas-brand";brand.textContent="STOCKAGE / LAB";
 const status=document.createElement("span");status.className="nas-power";status.textContent="● ON";
 header.append(brand,status);
 const grid=document.createElement("div");grid.className="nas-slots";
 const slots=disks.length<=4?4:disks.length<=6?6:disks.length<=8?8:disks.length;
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
  const title=document.createElement("strong");title.textContent=d.id.toUpperCase();
  const cap=document.createElement("span");cap.className="nas-cap";cap.textContent=d.capacityTB+" To";
  const keyhole=document.createElement("span");keyhole.className="nas-keyhole";keyhole.setAttribute("aria-hidden","true");
  const role=document.createElement("small");role.textContent=d.role==="spare"?"SECOURS":"ACTIF";
  tray.append(led,title,cap,keyhole,role);
  tray.addEventListener("click",()=>{editingId=d.id;renderTool();$("tool-editor").scrollIntoView({block:"nearest",behavior:"auto"})});
  grid.append(tray);
 }
 chassis.append(header,grid);
 const footer=document.createElement("div");footer.className="nas-footer";footer.textContent=disks.length+" disque"+(disks.length>1?"s":"")+" installé"+(disks.length>1?"s":"");
 chassis.append(footer);area.append(chassis);
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
 capacity.addEventListener("input",()=>{d.capacityTB=capacity.value===""?0:Number(capacity.value);const tray=[...document.querySelectorAll(".nas-tray")].find(x=>x.querySelector("strong")?.textContent===d.id.toUpperCase());if(tray){tray.querySelector(".nas-cap").textContent=d.capacityTB+" To";tray.setAttribute("aria-label","Disque "+d.id+", "+d.capacityTB+" To")}calculateTool()});
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
$("tool-add").addEventListener("click",()=>{if(disks.length>=128)return;const d={id:"d"+counter++,capacityTB:2,role:"active"};disks.push(d);editingId=d.id;renderTool()});
$("tool-reset").addEventListener("click",()=>{counter=4;disks=[1,2,3].map(i=>({id:"d"+i,capacityTB:2,role:"active"}));editingId="d1";$("tool-level").value="5";renderTool()});

renderLevels();renderSimulation();bindQuizzes();renderTool();
