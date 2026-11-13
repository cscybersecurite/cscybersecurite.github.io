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
