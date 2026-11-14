import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {calculateRaid,assessRaidFailures} from "./raid-core.js";
const read=name=>readFileSync(new URL(name,import.meta.url),"utf8");
const html=read("index.html"),css=read("raid-course.css"),js=read("raid-course.js"),engine=read("raid-core.js");
test("cours sans tirets longs",()=>{
 for(const [name,source] of Object.entries({html,css,js,engine}))
  assert.doesNotMatch(source,/[—–]/,name);
});
test("parcours et ancres présents",()=>{
 for(const id of ["depart","comprendre","simulateur","parite","pannes","atelier","choix","synthese"])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/viewport/);
});
test("mode sombre du navigateur et lisibilité tactile",()=>{
 assert.match(css,/@media\(prefers-color-scheme:dark\)/);
 assert.match(css,/@media\(max-width:480px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/focus-visible/);
});
test("calculateur et pannes utilisent exclusivement le moteur partagé",()=>{
 assert.match(js,/import \{calculateRaid,assessRaidFailures\} from "\.\/raid-core\.js"/);
 assert.match(js,/assessRaidFailures\(/);
 assert.match(js,/calculateRaid\(/);
 assert.doesNotMatch(js,/const factors=|function calculateRaid\(/);
});
test("calculs partagés cohérents",()=>{
 const c={format:"raid-configuration",schemaVersion:1,level:"6",disks:[1,2,3,4].map(i=>({id:"d"+i,role:"active",capacityTB:2}))};
 const r=calculateRaid(c);assert.equal(r.ok,true);assert.equal(r.value.capacitiesTB.usable,4);
 const p=assessRaidFailures(c,["d1","d2"]);assert.equal(p.ok,true);assert.equal(p.value.available,true);
});
test("présence des mini-défis et contenus de base",()=>{
 assert.equal((html.match(/class="quiz" data-question=/g)||[]).length,6);
 for(const phrase of ["partition","volume","système de fichiers","NVMe","sauvegarde","RAID 01"])
  assert.ok(html.includes(phrase),phrase);
});

test("NAS interactif V2 et réglage séparé",()=>{
 assert.match(html,/id="tool-editor"/);
 assert.match(js,/className="nas-chassis"/);
 assert.match(js,/className="nas-slots"/);
 assert.match(js,/className="nas-tray"/);
 assert.match(js,/aria-pressed/);
 assert.match(css,/\.nas-tray\.is-spare/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
test("messages simples à l'écran",()=>{
 assert.match(js,/Le RAID fonctionne encore/);
 assert.match(js,/RAID indisponible/);
 assert.doesNotMatch(js,/Volume indisponible|Volume toujours disponible|La redondance peut être diminuée/);
 assert.match(html,/Clique sur un tiroir/);
});

test("V3 : quatre choix au défi RAID 5",()=>{
 const block=html.match(/data-question="parity"[\s\S]*?<\/div><p class="reply"/)?.[0];
 assert.ok(block,"défi 03 présent");
 assert.equal((block.match(/data-answer=/g)||[]).length,4);
});
test("Chapitre 1 : animations de stockage progressives et accessibles",()=>{
 for(const id of ["storage-lab","storage-stage-name","storage-stage-counter","storage-stage-message","storage-prev","storage-next"])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.equal((html.match(/data-storage-step="[1-5]"/g)||[]).length,5);
 for(const letter of ["C:","D:","E:","F:"])assert.ok(html.includes(letter),letter);
 assert.match(js,/function initStorageLab\(/);
 assert.match(js,/root\.dataset\.step=String\(step\)/);
 assert.match(js,/\$\("storage-next"\)\.addEventListener/);
 assert.match(css,/\.storage-lab\[data-step="5"\] \.storage-usb/);
 assert.match(css,/@media\(max-width:520px\)/);
});
test("Chapitre 1 : illustrations précédentes restaurées",()=>{
 for(const id of ["hardware-grid","hdd-art","sata-art","nvme-art","hdd-ring","nvme-board"])
  assert.ok(html.includes(id),id);
 assert.doesNotMatch(html,/class="hardware-art hardware-svg"/);
 assert.match(html,/Disque avec des pièces qui tournent/);
 assert.match(css,/\.hdd-art/);
 assert.match(css,/\.sata-art/);
 assert.match(css,/\.nvme-art/);
});
test("Chapitre 1 : pas de métaphore de l'armoire",()=>{
 assert.doesNotMatch(html,/le disque est une armoire|Imagine une armoire/);
});
test("V3 : le spare est expliqué avant le mini-défi",()=>{
 assert.match(html,/Le disque de secours : le remplaçant prêt à aider/);
 assert.ok(html.indexOf("spare-lesson")<html.indexOf('data-question="spare"'));
 assert.match(html,/ne simulons pas le remplacement automatique/);
});
test("V3 : NAS limité à 12 disques, tiroirs compacts et noms uniformes",()=>{
 assert.match(js,/if\(disks.length>=12\)return/);
 assert.match(js,/add.disabled=disks.length>=12/);
 assert.match(js,/const slots=disks.length<=4\?4/);
 assert.match(js,/title.textContent=d.id;/);
 assert.doesNotMatch(js,/d.id.toUpperCase\(\)/);
 assert.match(css,/\.nas-tray\{min-height:114px/);
 assert.match(css,/@media\(max-width:560px\)\{\.nas-slots/);
});
test("V3 : erreur aux mini-défis sans révéler la réponse",()=>{
 assert.match(js,/Pas encore\. Essaie une autre réponse\./);
 assert.match(js,/reply.textContent=good\?/);
 assert.match(js,/if\(good\)\{for\(const x/);
});
test("V3 : choix professionnels équilibrés",()=>{
 for(const term of ["Petit NAS","RAID 5 + secours","RAID 6 + secours","RAID 10","RAID 01"])
  assert.ok(html.includes(term),term);
});

test("V3 : quatre choix au mini-défi 01",()=>{
 const block=html.match(/data-question="base"[\s\S]*?<\/div><p class="reply"/)?.[0];
 assert.ok(block,"défi 01 présent");
 assert.equal((block.match(/data-answer=/g)||[]).length,4);
});

test("V4 : façade NAS identifiable sans retirer les tiroirs interactifs",()=>{
 assert.match(js,/brand.textContent="Synology"/);
 assert.match(js,/nas-indicators/);
 assert.match(js,/nas-power-button/);
 assert.match(js,/nas-feet/);
 assert.match(js,/indicators=\[\["STATUS"/);
 assert.match(js,/\["ALERT","off"\]/);
 assert.match(js,/\["LAN 1","on"\]/);
 assert.match(js,/nas-tray/);
 assert.match(css,/\.nas-chassis::before/);
 assert.match(css,/\.nas-feet i/);
 assert.match(css,/@media\(max-width:480px\)/);
});

test("Simulateur bloc par bloc : RAID 1, 5 et 6 uniquement",()=>{
 const levels=js.match(/const levels=\[([\s\S]*?)\];/)?.[1];
 assert.ok(levels);
 assert.match(levels,/\["1","Miroir"\]/);
 assert.match(levels,/\["5","Parité simple"\]/);
 assert.match(levels,/\["6","Double parité"\]/);
 assert.doesNotMatch(levels,/\["0"|\["10"|\["01"/);
 assert.match(js,/const layouts=/);
 assert.match(css,/\.swatch-data\{background:#1469de/);
 assert.match(css,/\.swatch-p\{background:#ff8b23/);
 assert.match(css,/\.swatch-q\{background:#25b968/);
});
test("Simulateur : spare facultatif et reconstruction pédagogique",()=>{
 for(const id of ["sim-spare-controls","sim-spare-toggle","sim-spare-caption","sim-spare-actions"])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(js,/function initSimSpare\(/);
 assert.match(js,/sparePhase="rebuilding"/);
 assert.match(js,/sparePhase="done"/);
 assert.match(js,/assessRaidFailures\(cfg\(selected,physical\)/);
 assert.match(html,/reconstruction du spare est représentée étape par étape/);
});
test("Simulateur : 4 disques RAID 5, 5 disques RAID 6 et parités tournantes",()=>{
 const source=js.match(/const layouts=(\{[\s\S]*?\});/)?.[1];
 assert.ok(source,"schémas RAID présents");
 const layouts=JSON.parse(source);
 assert.equal(layouts["1"].length,2);
 assert.equal(layouts["5"].length,4);
 assert.equal(layouts["6"].length,5);
 for(const [level,rows,expectedP,expectedQ] of [["5",layouts["5"],1,0],["6",layouts["6"],1,1]]){
  assert.ok(rows.every(row=>row.length===4),"quatre bandes de données RAID "+level);
  for(let stripe=0;stripe<4;stripe++){
   const blocks=rows.map(row=>row[stripe]);
   assert.equal(blocks.filter(block=>block==="P").length,expectedP,"parité P bande "+stripe);
   assert.equal(blocks.filter(block=>block==="Q").length,expectedQ,"parité Q bande "+stripe);
  }
 }
 assert.match(js,/minimum : trois/);
 assert.match(js,/minimum : quatre/);
});

test("Chapitre 4 : suivre un seul fichier du RAID 5 au RAID 6",()=>{
 assert.match(html,/Le parcours d'un fichier en RAID 5 et RAID 6/);
 assert.match(html,/id="file-raid-lab"/);
 for(const id of ["file-raid-5","file-raid-6","file-raid-drives","file-raid-original","file-raid-pieces","file-raid-result","file-raid-prev","file-raid-next"]){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.equal((html.match(/data-file-raid-step="[1-5]"/g)||[]).length,5);
 assert.match(js,/function initFileRaidLab\(/);
 assert.match(js,/initFileRaidLab\(\)/);
 assert.match(js,/Array\.from\(\{length:12\}/);
 assert.match(js,/const photoSvg=/);
 assert.match(js,/encodeURIComponent\(photoSvg\)/);
 assert.match(js,/function initFileRaidLab\(/);
 assert.match(js,/setPhotoCrop\(tile,name\)/);
 assert.match(js,/setPhotoCrop\(thumbnail,name\)/);
 assert.match(js,/const missing=missingFor\(matrix,breakdowns\)/);
 assert.match(css,/background-size:400% 300%/);
 assert.match(css,/grid-template-rows:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/\.file-raid-photo-tile\.is-restored/);
 assert.match(html,/id="file-raid-photo-shell"/);
 assert.match(js,/const n=mode==="5"\?4:5/);
 assert.match(js,/const q=mode==="6"/);
 assert.match(js,/const p=\(n-1-stripe\+n\)%n/);
 assert.match(js,/breakdowns=mode==="5"\?\[1\]:\[1,3\]/);
 assert.match(css,/\.file-raid-drives/);
 assert.match(css,/@media\(max-width:640px\)/);
});
test("Chapitre 4 : pas de parité dédiée à un disque ni d'affirmation de réparation",()=>{
 const intro=html.slice(html.indexOf('id="parite"'),html.indexOf('id="pannes"'));
 assert.doesNotMatch(intro,/Trois disques : des fichiers et une protection/);
 assert.match(intro,/aucun disque n'est réservé uniquement à la parité/);
 assert.match(intro,/Le RAID ne remplace pas une sauvegarde/);
 assert.match(js,/les disques en panne ne sont pas réparés/);
});

test("Chapitre 4 : morceau visible en grand et repérable sur disque",()=>{
 assert.match(html,/id="file-raid-selection"/);
 assert.match(js,/const block=document.createElement\(isData\?"button":"span"\)/);
 assert.match(js,/block\.dataset\.piece=name/);
 assert.match(js,/tile\.dataset\.piece=name/);
 assert.match(js,/selectedPiece=selectedPiece===control\.dataset\.piece\?null:control\.dataset\.piece/);
 assert.match(js,/el\.classList\.toggle\("is-matched",matched\)/);
 assert.match(css,/#file-raid-lab \.file-raid-drive \.file-raid-mini-photo/);
 assert.match(css,/aspect-ratio:1\/1/);
 assert.match(css,/#file-raid-lab \.file-raid-photo-tile\.is-matched/);
 assert.match(css,/#file-raid-lab \.file-raid-data\.is-matched/);
 assert.match(css,/#file-raid-lab \.file-raid-selection\[hidden\]/);
});
