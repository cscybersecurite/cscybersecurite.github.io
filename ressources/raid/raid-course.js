import {calculateRaid,assessRaidFailures} from "./raid-core.js";
const $=id=>document.getElementById(id);
const cfg=(level,disks)=>({format:"raid-configuration",schemaVersion:1,level,disks});
const fmt=n=>new Intl.NumberFormat("fr-FR",{maximumFractionDigits:4}).format(n)+" To";
// Chapitre 3 : le duel RAID ou sauvegarde, sans seconde simulation des blocs.
let disks=[1,2,3].map(i=>({id:"d"+i,capacityTB:2,role:"active"}));
const duelSituations=[
 {question:"Un serveur doit lire de gros fichiers plus rapidement grâce à plusieurs disques. Quelle technologie peut aider ?",answer:"raid",explain:"Certains RAID répartissent le travail entre les disques et peuvent améliorer les débits."},
 {question:"Un disque d'un RAID 5 tombe en panne. Le serveur doit garder les fichiers accessibles.",answer:"raid",explain:"Le RAID 5 peut continuer à fonctionner après une panne de disque actif."},
 {question:"Un salarié supprime par erreur un dossier important.",answer:"backup",explain:"Une sauvegarde exploitable, faite avant la suppression, permet de retrouver le dossier."},
 {question:"Un rançongiciel chiffre les dossiers de l'entreprise. Il faut récupérer les fichiers d'avant l'attaque.",answer:"backup",explain:"Une sauvegarde saine et isolée de l'attaque peut permettre la restauration des fichiers."}
];
function initRaidDuel(){
 const root=$("raid-duel");if(!root)return;
 let index=0,score=0,chosen=null;
 const count=$("raid-duel-count"),scoreText=$("raid-duel-score"),question=$("raid-duel-question");
 const feedback=$("raid-duel-feedback"),next=$("raid-duel-next"),restart=$("raid-duel-restart");
 const choices=[...root.querySelectorAll("[data-duel-answer]")];
 function render(){
  const item=duelSituations[index];
  count.textContent="Situation "+(index+1)+" sur "+duelSituations.length;
  scoreText.textContent=score+" bonne"+(score>1?"s":"")+" réponse"+(score>1?"s":"");
  question.textContent=item.question;
  feedback.textContent="";feedback.className="raid-duel-feedback";
  for(const button of choices){button.disabled=false;button.setAttribute("aria-pressed","false");}
  next.hidden=index===duelSituations.length-1;next.disabled=true;
  restart.hidden=true;chosen=null;
 }
 for(const button of choices)button.addEventListener("click",()=>{
  if(chosen!==null)return;
  chosen=button.dataset.duelAnswer;
  const item=duelSituations[index],good=chosen===item.answer;
  if(good)score++;
  for(const option of choices){option.disabled=true;option.setAttribute("aria-pressed",String(option===button));}
  feedback.className="raid-duel-feedback "+(good?"good":"bad");
  feedback.textContent=(good?"Bonne réponse. ":"Pas tout à fait. ")+item.explain;
  scoreText.textContent=score+" bonne"+(score>1?"s":"")+" réponse"+(score>1?"s":"");
  if(index===duelSituations.length-1){
   restart.hidden=false;
   feedback.textContent+=" Duel terminé : "+score+" / "+duelSituations.length+". Le RAID et la sauvegarde sont complémentaires.";
  }else next.disabled=false;
 });
 next.addEventListener("click",()=>{if(chosen===null||index>=duelSituations.length-1)return;index++;render();});
 restart.addEventListener("click",()=>{index=0;score=0;render();});
 render();
}

// Vignettes SVG homogènes et agrandissement accessible au toucher ou au clavier.

// Un lien direct ou le menu peut ouvrir le chapitre visé.
// Sans fragment dans l'URL, tous les chapitres restent fermés au chargement.

// Projection sur le chapitre ouvert, avec retour à la position de lecture.
function initRaidProjection(){
 const control=$("raid-projection");if(!control)return;
 const chapters=[...document.querySelectorAll("main>details.chapter")];
 chapters.forEach(chapter=>chapter.addEventListener("toggle",()=>{
  if(!chapter.open)return;
  for(const other of chapters)if(other!==chapter)other.open=false;
  if(document.documentElement.classList.contains("raid-presentation")){
   chapter.scrollIntoView({block:"start",behavior:"instant"});
  }
 }));
 control.addEventListener("click",()=>{
  const root=document.documentElement;
  const wasActive=root.classList.contains("raid-presentation");
  let open=chapters.find(ch=>ch.open);
  if(!wasActive&&!open){
   open=chapters.find(ch=>ch.getBoundingClientRect().bottom>100)||chapters[0];
   if(open)open.open=true;
  }
  const candidates=[...(open?.querySelectorAll(".chapter-inside p,.chapter-inside figure,.chapter-inside table,.chapter-inside .panel,.chapter-inside .nested-test")||[])];
  const anchor=candidates.find(node=>{const b=node.getBoundingClientRect();return b.bottom>90&&b.top<window.innerHeight-80})||open;
  const top=anchor?.getBoundingClientRect().top??0;
  root.classList.toggle("raid-presentation",!wasActive);
  control.setAttribute("aria-pressed",String(!wasActive));
  control.setAttribute("aria-label",wasActive?"Activer la projection":"Quitter la projection");
  control.title=wasActive?"Activer la projection":"Quitter la projection";
  control.querySelector(".projection-label").textContent=wasActive?"Projection":"Affichage normal";
  if(anchor&&anchor.isConnected)window.scrollBy(0,anchor.getBoundingClientRect().top-top);
 });
}

function initChapterNavigation(){
 function openTarget(){
  const hash=window.location.hash.slice(1);
  if(!hash)return;
  const element=document.getElementById(decodeURIComponent(hash));
  const chapter=element?.closest("details.chapter");
  if(chapter)chapter.open=true;
 }
 window.addEventListener("hashchange",openTarget);
 document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener("click",()=>{
  const target=document.getElementById(link.getAttribute("href").slice(1));
  const chapter=target?.closest("details.chapter");
  if(chapter)chapter.open=true;
 }));
 openTarget();
}

function initRaidVignettes(){
 const family=document.querySelector(".raid-family");if(!family)return;
 const diagrams=[
  {name:"RAID 0",disks:["A","B"],groups:[],note:"Les données A et B sont réparties sur deux disques. Pas de copie."},
  {name:"RAID 1",disks:["AB","AB"],groups:[],note:"La même donnée AB se trouve sur les deux disques."},
  {name:"RAID 5",disks:["A","B","P"],groups:[],note:"Un exemple de répartition de données et de parité P. La parité change de disque selon les blocs."},
  {name:"RAID 6",disks:["A","B","P","Q"],groups:[],note:"Un exemple avec deux parités P et Q. Les parités sont réparties entre les disques."},
  {name:"RAID 10",disks:["A","A","B","B"],groups:[[0,1],[2,3]],note:"Deux paires de miroirs : les disques 1 et 2 contiennent A, les disques 3 et 4 contiennent B."},
  {name:"RAID 01",disks:["A","B","A","B"],groups:[[0,1],[2,3]],note:"Deux groupes répartissent A et B : le second groupe est une copie du premier."}
 ];
 const NS="http://www.w3.org/2000/svg";
 function el(tag,attrs={},value){
  const node=document.createElementNS(NS,tag);
  for(const [name,data] of Object.entries(attrs))node.setAttribute(name,String(data));
  if(value!==undefined)node.textContent=value;
  return node;
 }
 function draw(diagram){
  const svg=el("svg",{viewBox:"0 0 320 152",role:"img","aria-label":diagram.note});
  const count=diagram.disks.length,w=54,gap=count===2?40:18;
  const total=count*w+(count-1)*gap,left=(320-total)/2;
  svg.append(el("text",{x:160,y:18,"text-anchor":"middle",class:"raid-thumb-title"},diagram.name));
  if(diagram.groups.length){
   const groupNames=diagram.name==="RAID 10"?["Miroir","Miroir"]:["Répartition","Répartition"];
   diagram.groups.forEach(([first,last],index)=>{
    const x1=left+first*(w+gap)+w/2,x2=left+last*(w+gap)+w/2;
    svg.append(el("path",{d:`M ${x1} 51 V 44 H ${x2} V 51`,class:"raid-thumb-link"}));
    svg.append(el("text",{x:(x1+x2)/2,y:37,"text-anchor":"middle",class:"raid-thumb-group"},groupNames[index]));
   });
  }else{
   svg.append(el("path",{d:`M 160 30 V 45 M ${left+w/2} 45 H ${left+(count-1)*(w+gap)+w/2}`,class:"raid-thumb-link"}));
  }
  diagram.disks.forEach((label,i)=>{
   const x=left+i*(w+gap);
   svg.append(el("path",{d:`M ${x+w/2} 51 V 62`,class:"raid-thumb-link"}));
   svg.append(el("rect",{x,y:62,width:w,height:66,rx:9,class:"raid-thumb-disk"}));
   svg.append(el("ellipse",{cx:x+w/2,cy:67,rx:w/2,ry:8,class:"raid-thumb-disk-top"}));
   svg.append(el("text",{x:x+w/2,y:102,"text-anchor":"middle",class:label==="P"||label==="Q"?"raid-thumb-parity":"raid-thumb-data"},label));
   svg.append(el("text",{x:x+w/2,y:142,"text-anchor":"middle",class:"raid-thumb-num"},String(i+1)));
  });
  return svg;
 }
 const dialog=document.createElement("dialog");dialog.className="raid-vignette-dialog";
 const close=document.createElement("button");close.type="button";close.className="raid-vignette-close";close.textContent="Fermer";
 const name=document.createElement("h3"),visual=document.createElement("div"),description=document.createElement("p");
 visual.className="raid-vignette-large";
 dialog.append(close,name,visual,description);document.body.append(dialog);
 close.addEventListener("click",()=>dialog.close());
 dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close()});
 for(const article of family.querySelectorAll("article")){
  const heading=article.querySelector("strong");if(!heading)continue;
  const diagram=diagrams.find(item=>item.name===heading.textContent.trim());if(!diagram)continue;
  const button=document.createElement("button");button.type="button";button.className="raid-vignette-button";
  button.setAttribute("aria-label","Agrandir le schéma "+diagram.name);
  button.title="Agrandir le schéma "+diagram.name;
  button.append(draw(diagram));
  article.insertBefore(button,article.querySelector("p"));
  button.addEventListener("click",()=>{
   name.textContent=diagram.name;visual.replaceChildren(draw(diagram));description.textContent=diagram.note;
   dialog.showModal();close.focus();
  });
 }
}

function bindQuizzes(){
 const explanations={
 base:"C: est souvent le nom du stockage affiché dans Windows. On appelle ça un volume.",
 compare:"RAID 1 conserve les mêmes blocs sur deux disques : c\'est le principe du miroir.",
 parity:"La parité P permet de recalculer un morceau manquant après la panne d\'un disque. Ce n\'est pas une copie de la photo.",
 backup:"Avec une sauvegarde, tu peux retrouver un fichier supprimé.",
 spare:"Le spare est un disque en attente pour une reconstruction après une panne. Il ne sert pas à augmenter la place pour les fichiers.",
 summary:"Un NAS peut réunir plusieurs disques et permettre de choisir leur organisation RAID.",
 case:"On sépare le RAID 1 du système du RAID 6 des données. Le spare attend une panne du groupe auquel il est affecté."
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
let editingId="d1",selectedConfig="1";
function nextNasDiskId(){const used=new Set(disks.map(d=>d.id));let n=1;while(used.has("d"+n))n++;return "d"+n;}
const raidOptions=[
 {id:"1",label:"RAID 1",level:"1",min:2,kind:"all",detail:"Tous les disques sont en miroir."},
 {id:"5",label:"RAID 5",level:"5",min:3,kind:"all",detail:"Un disque en panne peut être supporté."},
 {id:"5s",label:"RAID 5 + spare",level:"5",min:4,kind:"spare",detail:"Trois disques actifs minimum et un spare en attente."},
 {id:"6",label:"RAID 6",level:"6",min:4,kind:"all",detail:"Deux disques en panne peuvent être supportés."},
 {id:"6s",label:"RAID 6 + spare",level:"6",min:5,kind:"spare",detail:"Quatre disques actifs minimum et un spare en attente."},
 {id:"10",label:"RAID 10",level:"10",min:4,kind:"even",detail:"Miroirs par paires. Les pannes supportées dépendent des paires touchées."},
 {id:"0",label:"RAID 0",level:"0",min:2,kind:"all",detail:"Aucune protection contre la panne d'un disque."},
 {id:"01",label:"RAID 01",level:"01",min:4,kind:"even",detail:"Deux groupes répartis, en miroir. Protection selon les disques en panne."}
];
function buildCandidate(option){
 if(disks.length<option.min||disks.some(d=>!(d.capacityTB>0)))return null;
 const sorted=[...disks].sort((a,b)=>b.capacityTB-a.capacityTB||a.id.localeCompare(b.id));
 let active=sorted,spare=[];
 if(option.kind==="even"&&sorted.length%2!==0)return null;
 if(option.kind==="spare"){spare=[sorted[0]];active=sorted.slice(1)}
 if(active.length<option.min-(option.kind==="spare"?1:0))return null;
 // Le moteur partagé reste seul responsable des capacités et de la tolérance.
 const result=calculateRaid(cfg(option.level,[
  ...active.map(d=>({...d,role:"active"})),
  ...spare.map(d=>({...d,role:"spare"}))
 ]));
 if(!result.ok)return null;
 return {option,result:result.value,active,spare};
}
function renderTool(){
 const area=$("tool-disks");area.replaceChildren();
 const chassis=document.createElement("div");chassis.className="nas-chassis";
 chassis.setAttribute("role","group");chassis.setAttribute("aria-label","NAS Synology pédagogique, tiroirs interactifs");
 const header=document.createElement("div");header.className="nas-header";
 const brand=document.createElement("span");brand.className="nas-brand";brand.textContent="Synology";
 const lights=document.createElement("div");lights.className="nas-indicators";
 const indicators=[["STATUS","on"],["ALERT","off"],["LAN 1","on"],["LAN 2","on"]];
 for(const [label,state] of indicators){
  const light=document.createElement("span");light.className="nas-indicator-led "+state;light.setAttribute("aria-label",label);lights.append(light);
 }
 const power=document.createElement("span");power.className="nas-power-button";
 power.setAttribute("role","img");power.setAttribute("aria-label","NAS allumé");power.textContent="⏻";
 header.append(brand,lights,power);
 const grid=document.createElement("div");grid.className="nas-slots";
 const slots=disks.length<=4?4:disks.length<=6?6:disks.length<=8?8:disks.length<=10?10:12;
 if(!raidOptions.some(o=>o.id===selectedConfig&&buildCandidate(o)))selectedConfig=raidOptions.find(o=>buildCandidate(o))?.id??"";
 const choice=raidOptions.find(x=>x.id===selectedConfig);
 const candidate=choice?buildCandidate(choice):null;
 const activeIds=new Set(candidate?.active.map(d=>d.id)??[]);
 const spareIds=new Set(candidate?.spare.map(d=>d.id)??[]);
 for(let i=0;i<slots;i++){
  const d=disks[i];
  if(!d){
   const empty=document.createElement("div");empty.className="nas-tray nas-empty";
   empty.setAttribute("aria-label","Emplacement vide");
   const label=document.createElement("span");label.textContent="VIDE";
   empty.append(label);grid.append(empty);continue;
  }
  const state=candidate?(spareIds.has(d.id)?"spare":"active"):"neutral";
  const tray=document.createElement("button");tray.type="button";
  tray.className="nas-tray"+(state==="spare"?" is-spare":"")+(d.id===editingId?" is-selected":"");
  tray.setAttribute("aria-pressed",String(d.id===editingId));
  tray.setAttribute("aria-label","Disque "+d.id+", "+d.capacityTB+" To, "+(state==="spare"?"spare (disque de secours)":state==="active"?"actif":"installé")+". Voir ses réglages");
  const led=document.createElement("span");led.className="nas-led";led.setAttribute("aria-hidden","true");
  const title=document.createElement("strong");title.textContent=d.id;
  const cap=document.createElement("span");cap.className="nas-cap";cap.textContent=d.capacityTB+" To";
  const keyhole=document.createElement("span");keyhole.className="nas-keyhole";keyhole.setAttribute("aria-hidden","true");
  const role=document.createElement("small");role.textContent=state==="spare"?"SPARE":state==="active"?"ACTIF":"INSTALLÉ";
  tray.append(led,title,cap,keyhole,role);
  tray.addEventListener("click",()=>{editingId=d.id;renderTool();$("tool-editor").scrollIntoView({block:"nearest",behavior:"auto"})});
  grid.append(tray);
 }
 chassis.append(header,grid);
 const footer=document.createElement("div");footer.className="nas-footer";footer.textContent=disks.length+" / 12 places occupées";
 chassis.append(footer);const feet=document.createElement("div");feet.className="nas-feet";
 feet.setAttribute("aria-hidden","true");feet.append(document.createElement("i"),document.createElement("i"));chassis.append(feet);area.append(chassis);
 const add=$("tool-add");add.disabled=disks.length>=12;
 add.setAttribute("aria-disabled",String(add.disabled));
 add.title=add.disabled?"Les 12 places du NAS sont occupées.":"Ajouter un disque";
 renderEditor();
 renderComparator();
}
function renderEditor(){
 const area=$("tool-editor");area.replaceChildren();
 let d=disks.find(x=>x.id===editingId);
 if(!d){d=disks[0];editingId=d?.id??null}
 if(!d){const p=document.createElement("p");p.textContent="Ajoute un disque pour commencer.";area.append(p);return}
 const h=document.createElement("strong");h.textContent="Disque "+d.id;
 const controls=document.createElement("div");controls.className="disk-controls";
 const label=document.createElement("label");label.textContent="Capacité du disque (To)";
 const capacity=document.createElement("input");capacity.type="number";capacity.min="0.25";capacity.max="1000000";capacity.step="0.25";capacity.value=d.capacityTB;
 capacity.setAttribute("aria-label","Capacité du disque "+d.id);
 capacity.addEventListener("input",()=>{
  d.capacityTB=capacity.value===""?0:Number(capacity.value);
  const tray=[...document.querySelectorAll(".nas-tray")].find(x=>x.querySelector("strong")?.textContent===d.id);
  if(tray)tray.querySelector(".nas-cap").textContent=d.capacityTB+" To";
  renderComparator();
 });
 capacity.addEventListener("change",renderTool);
 label.append(capacity);
 const remove=document.createElement("button");remove.type="button";remove.textContent="Retirer ce disque";
 remove.addEventListener("click",()=>{disks=disks.filter(x=>x!==d);editingId=disks[0]?.id??null;renderTool()});
 controls.append(label,remove);area.append(h,controls);
}
function renderComparator(){
 const root=$("raid-comparator");root.replaceChildren();
 const raw=disks.reduce((sum,d)=>sum+d.capacityTB,0);
 const valid=disks.every(d=>d.capacityTB>0);
 const status=$("tool-status");status.className="status";
 status.textContent=valid?disks.length+" disque"+(disks.length>1?"s":"")+" installé"+(disks.length>1?"s":"")+", "+fmt(raw)+" au total.":"Corrige la capacité du disque sélectionné.";
 if(!valid)return;
 const candidates=new Map(raidOptions.map(o=>[o.id,buildCandidate(o)]));
 if(!candidates.get(selectedConfig)){selectedConfig=raidOptions.find(o=>candidates.get(o.id))?.id??""}
 for(const option of raidOptions){
  const candidate=candidates.get(option.id);
  const row=document.createElement("button");row.type="button";
  row.className="raid-compare-row"+(selectedConfig===option.id?" is-active":"");
  row.disabled=!candidate;
  row.setAttribute("aria-pressed",String(selectedConfig===option.id&&!!candidate));
  const head=document.createElement("span");head.className="raid-compare-head";
  const strong=document.createElement("strong");strong.textContent=option.label;
  const subtitle=document.createElement("small");subtitle.textContent=candidate
   ?candidate.active.length+" actifs"+(candidate.spare.length?", 1 spare":"")
   :"Minimum "+option.min+" disques"+(disks.length>=option.min?" ou configuration incompatible":"");
  head.append(strong,subtitle);row.append(head);
  const track=document.createElement("span");track.className="raid-compare-track";
  if(candidate){
   const c=candidate.result.capacitiesTB;
   for(const [value,kind] of [[c.usable,"usable"],[c.redundancy,"redundancy"],[c.spare,"sparebar"],[c.unused,"unused"]]){
    if(!value)continue;
    const segment=document.createElement("span");segment.className=kind;
    segment.style.width=100*value/raw+"%";segment.textContent=fmt(value);
    segment.title=(kind==="usable"?"Fichiers":kind==="redundancy"?"Protection":kind==="sparebar"?"Spare":"Capacité inutilisée")+" : "+fmt(value);
    track.append(segment);
   }
  }else{
   const no=document.createElement("span");no.className="raid-compare-impossible";no.textContent="Non réalisable";track.append(no);
  }
  row.append(track);
  if(candidate)row.addEventListener("click",()=>{selectedConfig=option.id;renderTool()});
  root.append(row);
 }
 const detail=$("raid-compare-detail");detail.replaceChildren();
 const selected=raidOptions.find(o=>o.id===selectedConfig),item=selected?candidates.get(selected.id):null;
 if(!item){detail.textContent="Ajoute des disques pour comparer les RAID.";return}
 const title=document.createElement("strong");title.textContent=selected.label+" : "+fmt(item.result.capacitiesTB.usable)+" pour les fichiers";
 const note=document.createElement("p");note.textContent=selected.detail+" "+item.active.length+" disques actifs"+
  (item.spare.length?", "+item.spare.length+" spare":"")+".";
 const tolerance=document.createElement("p");tolerance.textContent=item.result.tolerance.description;
 const mismatch=document.createElement("p");
 const unused=item.result.capacitiesTB.unused;
 mismatch.textContent=unused?"Capacité inutilisée à cause de la taille différente des disques : "+fmt(unused)+".":"Tous les disques installés participent à cette configuration.";
 detail.append(title,note,tolerance,mismatch);
}
$("tool-add").addEventListener("click",()=>{
 if(disks.length>=12)return;
 const d={id:nextNasDiskId(),capacityTB:2,role:"active"};disks.push(d);editingId=d.id;renderTool();
});
$("tool-reset").addEventListener("click",()=>{
 disks=[1,2,3].map(i=>({id:"d"+i,capacityTB:2,role:"active"}));editingId="d1";selectedConfig="1";renderTool();
});

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

/* Un seul fichier, sur des bandes de RAID. P/Q ne sont jamais stockés sur un disque dédié. */
function initFileRaidLab(){
 const root=$("file-raid-lab");if(!root)return;
 let mode="5",step=1,selectedPiece=null;
 const titles=["Un fichier à enregistrer","La même photo, découpée en 12 morceaux","Les morceaux sont répartis sur les disques","Un disque tombe en panne","La photo est reconstituée"];
 const pieces=Array.from({length:12},(_,i)=>"M"+(i+1));
 // Une seule illustration, réutilisée à l'identique pour la photo entière et les 12 fragments.
 const photoSvg='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">'+
  '<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#4ca7de"/><stop offset="1" stop-color="#d9eef5"/></linearGradient><linearGradient id="water" x2="0" y2="1"><stop stop-color="#4789ac"/><stop offset="1" stop-color="#164967"/></linearGradient></defs>'+
  '<rect width="800" height="600" fill="url(#sky)"/>'+
  '<circle cx="643" cy="120" r="59" fill="#ffe2a3"/>'+
  '<path d="M0 350L146 172L240 269L382 95L532 298L655 189L800 350Z" fill="#627c9a"/>'+
  '<path d="M250 264L382 95L507 265L435 230L394 241L350 191L307 261Z" fill="#e2edf0"/>'+
  '<path d="M0 345L155 243L279 337L452 240L600 320L800 247V460H0Z" fill="#3f8d72"/>'+
  '<path d="M0 395Q195 350 405 393T800 379V600H0Z" fill="url(#water)"/>'+
  '<path d="M0 468Q195 425 405 476T800 448" fill="none" stroke="#aad0db" stroke-width="10" opacity=".75"/>'+
  '<path d="M0 528Q200 496 430 534T800 510" fill="none" stroke="#9bc5d6" stroke-width="6" opacity=".7"/>'+
  '<path d="M0 367L90 289L135 374Z" fill="#245d4f"/>'+
  '<path d="M670 400L744 251L800 395Z" fill="#286957"/>'+
  '<path d="M702 355L744 251L780 357Z" fill="#317e61"/>'+
  '<path d="M68 410L98 264L126 410Z" fill="#2b765a"/>'+
  '<rect x="91" y="359" width="10" height="71" fill="#785642"/>'+
  '<path d="M0 188Q43 126 95 175Q137 127 191 173" fill="none" stroke="#fff" stroke-width="16" opacity=".85"/>'+
  '<path d="M226 184l28 -23 28 23 -28 -8z" fill="#fff"/>'+
  '<path d="M516 140l28 -24 28 24 -28 -10z" fill="#fff"/>'+
  '<rect x="574" y="245" width="19" height="70" fill="#fff7df" stroke="#344f63" stroke-width="4"/>'+
  '<path d="M567 247l17 -38 17 38z" fill="#ed4e3a"/>'+
  '<rect x="578" y="266" width="11" height="17" fill="#3d83aa"/>'+
  '<path d="M175 476l82 0 -17 17 -52 0z" fill="#693f2a"/>'+
  '<path d="M213 468v-93l-44 92z" fill="#f8fafc" stroke="#8aa0af" stroke-width="2"/>'+
  '<path d="M217 468v-73l39 73z" fill="#ec8f4f"/>'+
  '<path d="M430 503l62 0 -14 13 -38 0z" fill="#704732"/>'+
  '<path d="M462 499v-77l-36 76z" fill="#f6e6a1"/>'+
  '<path d="M465 499v-61l28 61z" fill="#e65b4f"/>'+
  '<path d="M700 470l40 -11 31 16 -44 12z" fill="#eac797"/>'+
  '<circle cx="729" cy="466" r="9" fill="#d45e37"/>'+
  '<path d="M311 385l22 -22 22 22 -22 -10z" fill="#fff" opacity=".9"/>'+
  '<path d="M90 329l-25 66h62z" fill="#1b6449"/>'+
  '</svg>';
 root.style.setProperty("--file-raid-photo",'url("data:image/svg+xml,'+encodeURIComponent(photoSvg)+'")');
 const missingFor=(matrix,failures)=>new Set(failures.flatMap(index=>matrix[index].filter(block=>block.startsWith("M"))));
 const setPhotoCrop=(el,name)=>{
  const index=Number(name.slice(1))-1,col=index%4,row=Math.floor(index/4);
  el.style.backgroundPosition=(col*100/3)+"% "+(row*100/2)+"%";
 };
 const drawBlock=(name)=>{
  const isData=name.startsWith("M");
  const block=document.createElement(isData?"button":"span");
  block.className="file-raid-block "+(name.startsWith("P")?"file-raid-p":name.startsWith("Q")?"file-raid-q":"file-raid-data");
  if(isData){
   block.type="button";
   block.dataset.piece=name;
   block.setAttribute("aria-pressed",String(selectedPiece===name));
  }
  const label=document.createElement("b");label.textContent=name;block.append(label);
  block.setAttribute("aria-label",name.startsWith("P")?"Parité P, bande "+name.slice(1):name.startsWith("Q")?"Parité Q, bande "+name.slice(1):"Morceau "+name.slice(1)+" du fichier");
  if(isData) setPhotoCrop(block,name);
  else{
   const stripe=Number(name.slice(1));
   const related=pieces.slice((stripe-1)*3,stripe*3);
   block.classList.add("file-raid-parity");
   block.dataset.related=related.join(",");
   block.setAttribute("aria-label","Parité "+name+" calculée à partir des morceaux "+related.join(", ")+". Ce ne sont pas des copies.");
   const explanation=document.createElement("small");
   explanation.className="file-raid-parity-caption";
   explanation.textContent="Calculée avec";
   block.append(explanation);
   const thumbnails=document.createElement("span");
   thumbnails.className="file-raid-parity-sources";
   thumbnails.setAttribute("aria-hidden","true");
   for(const piece of related){
    const source=document.createElement("span");
    source.className="file-raid-parity-source";
    const image=document.createElement("i");
    image.className="file-raid-parity-mini";
    setPhotoCrop(image,piece);
    const nameTag=document.createElement("em");
    nameTag.textContent=piece;
    source.append(image,nameTag);
    thumbnails.append(source);
   }
   block.append(thumbnails);
  }
  return block;
 };
 function stripes(){
  const n=mode==="5"?4:5;
  const matrix=Array.from({length:n},()=>[]);
  for(let stripe=0;stripe<4;stripe++){
   const p=(n-1-stripe+n)%n;
   const q=mode==="6"?(p-1+n)%n:-1;
   let data=0;
   for(let disk=0;disk<n;disk++){
    const block=disk===p?"P"+(stripe+1):disk===q?"Q"+(stripe+1):pieces[stripe*3+data++];
    matrix[disk].push(block);
   }
  }
  return matrix;
 }
 function render(){
  const n=mode==="5"?4:5,breakdowns=mode==="5"?[1]:[1,3],matrix=stripes(),failed=step>=4;
  const missing=missingFor(matrix,breakdowns);
  $("file-raid-5").setAttribute("aria-pressed",String(mode==="5"));
  $("file-raid-6").setAttribute("aria-pressed",String(mode==="6"));
  $("file-raid-count").textContent="Étape "+step+" sur 5";
  $("file-raid-title").textContent=step+". "+titles[step-1];
  const words=[
   "Voici notre fichier photo.jpg. Regarde bien cette photo : nous allons toujours utiliser la même.",
   "C'est toujours photo.jpg, mais elle est maintenant coupée en 12 morceaux, de M1 à M12.",
   "Retrouve les mêmes morceaux M1 à M12 dans les "+n+" disques. Les miniatures des blocs P"+(mode==="6"?" et Q":"")+" montrent quelles données servent au calcul des parités : ce ne sont pas des copies. Les parités changent de disque.",
   mode==="5"?"Le disque 2 tombe en panne. Les morceaux qu'il contenait disparaissent de notre photo.":"Les disques 2 et 4 tombent en panne. Les morceaux qu'ils contenaient disparaissent de notre photo.",
   "Grâce aux morceaux et aux parités encore disponibles, le RAID retrouve les morceaux manquants. La photo redevient complète, mais les disques en panne ne sont pas réparés."
  ];
  $("file-raid-explanation").textContent=words[step-1];
  const shell=$("file-raid-photo-shell");
  shell.classList.toggle("is-compact",step>=3);
  $("file-raid-original").hidden=step!==1;
  const pieceRoot=$("file-raid-pieces");
  pieceRoot.hidden=step===1;
  pieceRoot.setAttribute("aria-label",step===2?"photo.jpg découpée en douze morceaux":step===4?"photo.jpg incomplète après panne":step===5?"photo.jpg reconstituée après panne":"photo.jpg découpée en douze morceaux et répartie sur les disques");
  pieceRoot.replaceChildren();
  if(step>=2){
   for(const name of pieces){
    const tile=document.createElement("button");
    tile.type="button";tile.dataset.piece=name;
    tile.setAttribute("aria-pressed",String(selectedPiece===name));
    const absent=step===4&&missing.has(name);
    const restored=step===5&&missing.has(name);
    tile.className="file-raid-photo-tile"+(absent?" is-missing":"")+(restored?" is-restored":"");
    tile.setAttribute("aria-label",absent?name+" indisponible":restored?name+" retrouvé":name);
    setPhotoCrop(tile,name);
    const caption=document.createElement("b");caption.textContent=absent?"?":name;
    tile.append(caption);
    pieceRoot.append(tile);
   }
  }
  $("file-raid-photo-state").textContent=step===1?"Fichier entier":step===2?"Le même fichier en 12 morceaux":step===3?"Ces 12 morceaux sont aussi sur les disques":step===4?"Il manque les morceaux des disques en panne":"Les morceaux ont été retrouvés";
  const drives=$("file-raid-drives");drives.hidden=step<3;drives.replaceChildren();
  if(step>=3){
   for(let d=0;d<n;d++){
    const dead=failed&&breakdowns.includes(d);
    const drive=document.createElement("div");drive.className="file-raid-drive"+(dead?" is-failed":"");
    const heading=document.createElement("strong");heading.textContent="Disque "+(d+1)+(dead?" • panne":"");
    drive.append(heading);
    for(const block of matrix[d]){
     const el=drawBlock(block);
     if(dead){
      el.className="file-raid-block file-raid-lost";
      el.textContent="?";
      el.setAttribute("aria-label","Bloc indisponible : "+block);
     }
     drive.append(el);
    }
    drives.append(drive);
   }
  }
  $("file-raid-result").hidden=step!==5;
  const recovered=$("file-raid-recovered");recovered.replaceChildren();
  if(step===5){
   for(const name of pieces.filter(piece=>missing.has(piece))){
    const tile=drawBlock(name);tile.classList.add("file-raid-rebuilt");
    tile.setAttribute("aria-label","Morceau "+name.slice(1)+" retrouvé par le RAID");
    recovered.append(tile);
   }
  }
  const location=matrix.findIndex(row=>row.includes(selectedPiece));
  const selectedLabel=$("file-raid-selection");
  selectedLabel.hidden=step<2;
  selectedLabel.textContent=selectedPiece
   ?selectedPiece+(step>=3?" : disque "+(location+1)+(failed&&breakdowns.includes(location)?" (en panne)":""):" : cherche ce même morceau sur les disques à l'étape suivante.")
   :"Clique sur un morceau M1 à M12 dans la photo ou sur un disque pour retrouver le même morceau.";
  for(const el of root.querySelectorAll("[data-piece]")){
   const matched=el.dataset.piece===selectedPiece&&selectedPiece!==null;
   el.classList.toggle("is-matched",matched);
   el.setAttribute("aria-pressed",String(matched));
  }
  for(const parity of root.querySelectorAll(".file-raid-parity")){
   parity.classList.toggle("is-related",Boolean(selectedPiece&&parity.dataset.related.split(",").includes(selectedPiece)));
  }
  $("file-raid-result-detail").textContent=mode==="5"?"Un disque en panne. La photo reste accessible grâce aux blocs encore disponibles.":"Deux disques en panne. Les parités permettent de retrouver les morceaux manquants.";
  $("file-raid-prev").disabled=step===1;
  $("file-raid-next").textContent=step===5?"Recommencer":"Suivant";
  for(const button of root.querySelectorAll("[data-file-raid-step]"))button.setAttribute("aria-pressed",String(Number(button.dataset.fileRaidStep)===step));
 }
 root.addEventListener("click",event=>{
  const control=event.target.closest("[data-piece]");
  if(!control||!root.contains(control))return;
  selectedPiece=selectedPiece===control.dataset.piece?null:control.dataset.piece;
  render();
 });
 $("file-raid-5").addEventListener("click",()=>{mode="5";step=1;selectedPiece=null;render()});
 $("file-raid-6").addEventListener("click",()=>{mode="6";step=1;selectedPiece=null;render()});
 $("file-raid-prev").addEventListener("click",()=>{step=Math.max(1,step-1);render()});
 $("file-raid-next").addEventListener("click",()=>{step=step===5?1:step+1;render()});
 for(const button of root.querySelectorAll("[data-file-raid-step]")){
  button.addEventListener("click",()=>{step=Number(button.dataset.fileRaidStep);render()});
 }
 render();
}


bindQuizzes();initStorageLab();initFileRaidLab();initRaidDuel();initRaidVignettes();initChapterNavigation();initRaidProjection();renderTool();
