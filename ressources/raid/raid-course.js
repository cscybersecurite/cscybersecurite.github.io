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
 "0":"Les blocs sont répartis. Une panne de disque actif suffit à rendre le volume indisponible.",
 "1":"Chaque disque contient une copie complète des mêmes blocs. Le volume reste disponible tant qu'une copie subsiste.",
 "5":"Les blocs de parité P changent de disque. Une seule panne de disque actif peut être tolérée.",
 "6":"Deux informations de parité, P et Q, sont réparties. Jusqu'à deux pannes de disques actifs peuvent être tolérées.",
 "10":"Les disques forment deux miroirs. Les blocs sont ensuite répartis entre ces miroirs. Deux pannes dans la même paire sont fatales.",
 "01":"Deux groupes répartissent les blocs, puis se reflètent. Il faut qu'au moins un groupe RAID 0 reste complet."
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
 if(!failed.size){message.textContent="Aucune panne. Choisis un disque pour tester la résistance du RAID.";return}
 message.textContent=state.value.available
  ? "Volume toujours disponible. "+failed.size+" disque(s) en panne. La redondance peut être diminuée."
  : "Volume indisponible. Avec ces disques en panne, les données ne peuvent plus être reconstituées par ce RAID.";
}
function bindQuizzes(){
 const explanations={
 base:"C: est généralement une lettre attribuée à un volume. Le volume utilise un système de fichiers, par exemple NTFS.",
 mirror:"Un miroir conserve les mêmes données sur plusieurs disques.",
 parity:"En RAID 5, la capacité équivalente à un disque sert à la parité : (4 - 1) × 2 = 6 To.",
 backup:"Une sauvegarde permet de restaurer des fichiers effacés, si elle est disponible et exploitable.",
 spare:"Un disque de secours ne participe pas au volume actif. Trois disques RAID 5 de 2 To donnent toujours 4 To utiles.",
 case:"Le RAID 6 tolère n'importe quelle combinaison de deux pannes de disques actifs. Le RAID 10 dépend des paires touchées."
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
function toolConfiguration(){return cfg($("tool-level").value,disks.map(d=>({...d})))}
function renderTool(){
 const area=$("tool-disks");area.replaceChildren();
 for(const d of disks){
  const card=document.createElement("div");card.className="tool-disk"+(d.role==="spare"?" spare":"");
  const name=document.createElement("strong");name.textContent="Disque "+d.id;
  const label=document.createElement("label");label.textContent="Capacité (To)";
  const capacity=document.createElement("input");capacity.type="number";capacity.min="0.01";capacity.max="1000000";capacity.step="0.25";capacity.value=d.capacityTB;
  capacity.setAttribute("aria-label","Capacité du disque "+d.id);
  capacity.addEventListener("input",()=>{d.capacityTB=capacity.value===""?0:Number(capacity.value);calculateTool()});
  label.append(capacity);
  const role=document.createElement("select");role.setAttribute("aria-label","Rôle du disque "+d.id);
  for(const [v,t] of [["active","Actif"],["spare","De secours"]])role.add(new Option(t,v));
  role.value=d.role;role.addEventListener("change",()=>{d.role=role.value;renderTool()});
  const remove=document.createElement("button");remove.type="button";remove.textContent="Retirer";
  remove.setAttribute("aria-label","Retirer le disque "+d.id);
  remove.addEventListener("click",()=>{disks=disks.filter(x=>x!==d);renderTool()});
  card.append(name,label,role,remove);area.append(card);
 }
 calculateTool();
}
function calculateTool(){
 const result=calculateRaid(toolConfiguration()),metrics=$("tool-metrics"),bar=$("tool-bar");
 metrics.replaceChildren();bar.replaceChildren();
 const status=$("tool-status");$("tool-tolerance").textContent="";
 if(!result.ok){status.className="status error";status.textContent=result.errors[0].message;return}
 status.className="status";status.textContent="Configuration valide";
 const r=result.value,c=r.capacitiesTB;
 for(const [label,value] of [["Brute",c.rawTotal],["Utilisable",c.usable],["Redondance",c.redundancy],["Non utilisé",c.unused],["Secours",c.spare]]){
  const tile=document.createElement("div");tile.className="metric";const strong=document.createElement("b");strong.textContent=fmt(value);
  const caption=document.createElement("span");caption.textContent=label;tile.append(strong,caption);metrics.append(tile);
 }
 for(const [value,style] of [[c.usable,"usable"],[c.redundancy,"redundancy"],[c.unused,"unused"],[c.spare,"sparebar"]]){
  const s=document.createElement("i");s.className=style;s.style.width=100*value/c.rawTotal+"%";bar.append(s);
 }
 $("tool-tolerance").textContent=r.tolerance.description+" Tolérance garantie : "+r.tolerance.guaranteed+" panne(s). Maximum selon les disques touchés : "+r.tolerance.maximum+".";
}
$("tool-level").addEventListener("change",renderTool);
$("tool-add").addEventListener("click",()=>{if(disks.length>=128)return;disks.push({id:"d"+counter++,capacityTB:2,role:"active"});renderTool()});
$("tool-reset").addEventListener("click",()=>{counter=4;disks=[1,2,3].map(i=>({id:"d"+i,capacityTB:2,role:"active"}));$("tool-level").value="5";renderTool()});
renderLevels();renderSimulation();bindQuizzes();renderTool();
