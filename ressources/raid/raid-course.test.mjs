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
 assert.match(js,/Ça marche encore/);
 assert.match(js,/Ça ne marche plus/);
 assert.doesNotMatch(js,/Volume indisponible|Volume toujours disponible|La redondance peut être diminuée/);
 assert.match(html,/Clique sur un tiroir/);
});

test("V3 : quatre choix au défi RAID 5",()=>{
 const block=html.match(/data-question="parity"[\s\S]*?<\/div><p class="reply"/)?.[0];
 assert.ok(block,"défi 03 présent");
 assert.equal((block.match(/data-answer=/g)||[]).length,4);
});
test("V3 : bases du stockage et types de disques illustrés",()=>{
 for(const id of ["storage-stages","disk-drawing","partition-drawing","volume-drawing","files-drawing","hardware-grid","hdd-art","sata-art","nvme-art"])
  assert.ok(html.includes('class="'+id)||html.includes(' '+id+'"')||html.includes(' '+id+' '),id);
 assert.match(css,/\.storage-stages/);
 assert.match(css,/\.hardware-grid/);
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
