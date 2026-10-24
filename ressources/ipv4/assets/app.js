'use strict';
// V0.3.38 - positionner le titre du chapitre 1 sous la barre de navigation à son ouverture.
const ficheChapter=document.getElementById('fiche');
if(ficheChapter)ficheChapter.addEventListener('toggle',()=>{
 if(ficheChapter.open)ficheChapter.scrollIntoView({behavior:'smooth',block:'start'});
});
// V0.3.105 - résultats du cours issus du moteur IPv4 commun.
import { parseNetwork, ipv4ToNumber, numberToIPv4, binaryOctets } from './ipv4-engine.js';
const example = parseNetwork('192.168.10.75/26');
const prefix = example.prefix;
const bits32 = address => binaryOctets(address).join('');
const firstUsable = numberToIPv4(example.network + 1);
const lastUsable = numberToIPv4(ipv4ToNumber(example.broadcast) - 1);
const rows=[['Adresse d’hôte',bits32(example.inputAddress)],['CIDR',bits32(example.mask)],['Adresse du réseau',bits32(example.address)],['1re IP adressable',bits32(firstUsable)],['Dernière IP adressable',bits32(lastUsable)],['Adresse de broadcast',bits32(example.broadcast)]];
function renderTable(target,mode){const table=document.createElement('table');table.className='bit-table'+(mode==='ip-only'||mode==='host'?' bit-table-lesson':'');table.setAttribute('aria-label','Tableau d’adressage IPv4 sur 32 bits');let html='<thead><tr><th></th>';for(let o=0;o<4;o++)html+='<th class="octet octet-'+(o+1)+'" colspan="8">'+(o+1)+(o===0?'er':'e')+' octet</th>';html+='</tr><tr><th>Poids des bits</th>';for(let i=0;i<32;i++)html+='<th class="weight '+(mode!=='ip-only'&&i===prefix-1?'split':'')+'">'+(128>>(i%8))+'</th>';html+='</tr></thead><tbody>';const lessonIndex=mode.startsWith('line-')?Number(mode.slice(5)):-1;const max=lessonIndex>=0?lessonIndex+3:mode==='ip-only'?1:mode==='host'?2:6;const progress=mode==='steps'?step:6;for(let r=0;r<max;r++){const [name,value]=rows[r];html+='<tr class="'+(r===0?'host-row':'')+'"><td class="'+((mode==='ip-only'&&r===0||mode==='host'&&r===1||lessonIndex>=0&&r===lessonIndex+2)?'active-row-label':'')+'">'+name+'</td>';for(let i=0;i<32;i++){let show=mode==='ip-only'&&revealIp||mode==='full'||mode==='host'&&(r===0||r===1&&revealHost)||lessonIndex>=0&&(r<lessonIndex+2||r===lessonIndex+2&&revealLines[lessonIndex])||mode==='steps'&&(r<2||r===2&&progress>=1||r===3&&progress>=2||r===4&&progress>=3||r===5&&progress>=4);let one=show&&value[i]==='1';let region=r===0?'original-ip':mode==='ip-only'||mode==='host'&&!revealHost&&r===1?'neutral':i<prefix?'network':'hostpart';let split=mode!=='ip-only'&&i===prefix-1&&r!==0&&!(mode==='host'&&!revealHost)?'split':'';html+='<td class="'+(one?'one ':'')+region+' '+split+'">'+(one?'1':'')+'</td>';}html+='</tr>';}html+='</tbody>';table.innerHTML=html;const container=document.getElementById(target);container.replaceChildren(table);if(mode==='host'&&revealHost){const annotation=document.createElement('div');annotation.className='network-host-annotation';annotation.setAttribute('aria-label','Repère pédagogique : '+prefix+' bits réseau et '+(32-prefix)+' bits hôtes');annotation.innerHTML='<div class="annotation-spacer"></div><div class="annotation-track"><div class="annotation-network" style="flex:'+prefix+'">⟵ Partie réseau · '+prefix+' bits ⟶</div><div class="annotation-host" style="flex:'+(32-prefix)+'">Hôte · '+(32-prefix)+' bits</div></div>';container.appendChild(annotation);const cells=table.querySelectorAll('tbody tr:first-child td');const first=cells[1],boundary=cells[prefix+1],last=cells[32];const left=first.offsetLeft,right=last.offsetLeft+last.offsetWidth,split=boundary.offsetLeft;annotation.style.width=table.offsetWidth+'px';const spacer=annotation.querySelector('.annotation-spacer'),track=annotation.querySelector('.annotation-track');spacer.style.flex='0 0 '+left+'px';track.style.flex='0 0 '+(right-left)+'px';track.querySelector('.annotation-network').style.flex='0 0 '+(split-left)+'px';track.querySelector('.annotation-host').style.flex='0 0 '+(right-split)+'px'}}
let revealIp=false,revealHost=false,revealLines=[false,false,false,false],step=0;
const eyeOpen='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';const eyeClosed='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.6 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-3 3.7"/><path d="M6.3 6.3C3.5 8.1 2 12 2 12s3.5 7 10 7a10.5 10.5 0 0 0 4.2-.9"/><path d="M3 3l18 18"/><path d="M10 10a3 3 0 0 0 4 4"/></svg>';document.querySelectorAll('.bit-toggle-icon').forEach(el=>el.innerHTML=eyeOpen);
function syncToggle(type,shown,what){const b=document.querySelector('[data-reveal="'+type+'"]');b.setAttribute('aria-pressed',String(shown));b.setAttribute('aria-label',(shown?'Masquer':'Afficher')+' les 1 '+what);b.querySelector('.bit-toggle-label').textContent=shown?'Masquer':'Afficher';b.querySelector('.bit-toggle-icon').innerHTML=shown?eyeClosed:eyeOpen}
document.querySelector('[data-reveal="ip"]').addEventListener('click',()=>{revealIp=!revealIp;renderTable('table-ip-only','ip-only');renderTable('table-host','host');syncToggle('ip',revealIp,'de l’adresse IPv4')});document.querySelector('[data-reveal="host"]').addEventListener('click',()=>{revealHost=!revealHost;renderTable('table-host','host');syncToggle('host',revealHost,'du CIDR')});for(let k=0;k<4;k++){const btn=document.querySelector('[data-reveal="line-'+k+'"]');btn.querySelector('.bit-toggle-icon').innerHTML=eyeOpen;btn.addEventListener('click',()=>{revealLines[k]=!revealLines[k];renderTable('table-line-'+k,'line-'+k);syncToggle('line-'+k,revealLines[k],'de cette adresse')})}
// Les étapes décimales G à K possèdent leurs propres boutons.
const themePreference=window.matchMedia('(prefers-color-scheme: dark)');const syncBrowserTheme=()=>document.body.classList.toggle('dark',themePreference.matches);syncBrowserTheme();themePreference.addEventListener('change',syncBrowserTheme);
const links=[...document.querySelectorAll('nav a')];links.forEach(a=>a.addEventListener('click',()=>{const target=document.querySelector(a.getAttribute('href'));if(target?.matches('details'))target.open=true;}));
document.querySelectorAll('.chapter').forEach(chapter=>chapter.addEventListener('toggle',()=>{if(chapter.open)document.querySelectorAll('.chapter').forEach(other=>{if(other!==chapter)other.open=false})}));
document.querySelectorAll('.subfold').forEach(fold=>fold.addEventListener('toggle',()=>{if(fold.open)fold.closest('.chapter').querySelectorAll('.subfold').forEach(other=>{if(other!==fold)other.open=false})}));
renderTable('table-ip-only','ip-only');renderTable('table-host','host');for(let k=0;k<4;k++)renderTable('table-line-'+k,'line-'+k);renderTable('table-full','full');

// Tableau de conversion décimal/binaire, construit localement sans connexion Internet.
const binaryReference=document.getElementById('binary-reference-rows');if(binaryReference){binaryReference.innerHTML=Array.from({length:64},(_,i)=>'<tr>'+[0,64,128,192].map(base=>'<td>'+(base+i)+'</td><td>'+(base+i).toString(2).padStart(8,'0')+'</td>').join('')+'</tr>').join('');}

// Les deux coups de patte sont indépendants et peuvent être activés ensemble.
const pepetteToggle=document.getElementById('pepette-toggle');
const pepetteToggle1=document.getElementById('pepette-toggle-1');
const pepetteState={one:false,two:false};
function updatePepetteTips(){
 const table=document.querySelector('#table-full table');if(!table)return;
 table.classList.toggle('pepette-active',pepetteState.two);
 table.classList.toggle('pepette-one-active',pepetteState.one);
 for(let r=2;r<6;r++){
  const cells=[...table.tBodies[0].rows[r].cells];
  for(let i=prefix;i<32;i++){
   const td=cells[i+1];if(!td)continue;
   const showOne=pepetteState.one&&(r===4||r===5);
   const showTwo=pepetteState.two&&i>=30;
   const original=rows[r][1][i];
   td.classList.toggle('pepette-one-bit',showOne);
   td.classList.toggle('pepette-two-bit',showTwo);
   if(original==='0'&&(showOne||showTwo)){td.textContent='0';td.classList.add('pepette-zero')}
   else if(td.classList.contains('pepette-zero')){td.textContent='';td.classList.remove('pepette-zero')}
  }
 }
 if(pepetteToggle1){pepetteToggle1.textContent=pepetteState.one?'Masquer Astuce 1':'Afficher Astuce 1';pepetteToggle1.setAttribute('aria-pressed',String(pepetteState.one))}
 if(pepetteToggle){pepetteToggle.textContent=pepetteState.two?'Masquer Astuce 2':'Afficher Astuce 2';pepetteToggle.setAttribute('aria-pressed',String(pepetteState.two))}
}
if(pepetteToggle1)pepetteToggle1.addEventListener('click',()=>{pepetteState.one=!pepetteState.one;updatePepetteTips()});
if(pepetteToggle)pepetteToggle.addEventListener('click',()=>{pepetteState.two=!pepetteState.two;updatePepetteTips()});

const binaryHelpToggle=document.getElementById('binary-help-toggle');if(binaryHelpToggle)binaryHelpToggle.addEventListener('click',()=>{const panel=document.getElementById('binary-help-panel');const open=panel.hidden;panel.hidden=!open;binaryHelpToggle.setAttribute('aria-expanded',String(open));binaryHelpToggle.textContent=open?'Refermer le coup de patte':'Voir le coup de patte'});

// Transition pédagogique entre les sous-chapitres 1.1 et 1.2.
const goDecimal=document.getElementById('go-decimal');if(goDecimal)goDecimal.addEventListener('click',()=>{const binary=document.getElementById('binaire'),decimal=document.getElementById('decimal-fold');if(!binary||!decimal)return;binary.open=false;decimal.open=true;decimal.scrollIntoView({behavior:'smooth',block:'start'});});

// V0.3.33 - navigation vers l'entraînement commun et les sous-réseaux.
const goTraining=document.getElementById('go-training');
function openNextChapter(targetId){
 const target=document.getElementById(targetId);
 const ipv4=document.getElementById('fiche');
 if(!target)return;
 if(ipv4)ipv4.open=(targetId==='training-fold');
 target.open=true;
  target.scrollIntoView({behavior:'smooth',block:'start'});
}
if(goTraining)goTraining.addEventListener('click',()=>openNextChapter('training-fold'));

// V0.3.39 - aucun choix initial, lancement disponible après deux sélections.
const trainingTopics=[...document.querySelectorAll('[data-training-topic]')];
const trainingDifficulties=[...document.querySelectorAll('[data-training-difficulty]')];
const launchTraining=document.getElementById('launch-training');
const launchInfo=document.getElementById('training-launch-info');
let selectedTopic=null,selectedDifficulty=null;
const topicNames={binaire:'Tableau en binaire',decimal:'Tableau en décimal',hotes:'Calcul du nombre d’hôtes',complet:'Exercice complet'};
const difficultyNames={'1':'Avec Pépette','2':'Je me débrouille','3':'Je relève le défi'};
function refreshTrainingLaunch(){
 if(!launchTraining)return;
 const ready=selectedTopic!==null&&selectedDifficulty!==null;
 launchTraining.disabled=!ready;
 launchTraining.textContent=ready?'Lancer : '+topicNames[selectedTopic]+' + '+difficultyNames[selectedDifficulty]:selectedTopic===null&&selectedDifficulty===null?'Je choisis mon exercice et ma difficulté':selectedTopic===null?'Je choisis mon exercice':'Je choisis ma difficulté';
 if(launchInfo)launchInfo.textContent='';
}
trainingTopics.forEach(button=>button.addEventListener('click',()=>{
 selectedTopic=button.dataset.trainingTopic;
 trainingTopics.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
 refreshTrainingLaunch();
}));
trainingDifficulties.forEach(button=>button.addEventListener('click',()=>{
 selectedDifficulty=button.dataset.trainingDifficulty;
 trainingDifficulties.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
 refreshTrainingLaunch();
}));
if(launchTraining)launchTraining.addEventListener('click',()=>{
 if(!launchTraining.disabled&&launchInfo)launchInfo.textContent=selectedTopic==='binaire'&&selectedDifficulty==='1'?'Tableau en binaire avec Pépette : six lignes et autocontrôle.':selectedTopic==='binaire'&&selectedDifficulty==='2'?'Je me débrouille : progression et vérification ligne par ligne.':selectedTopic==='binaire'&&selectedDifficulty==='3'?'Je relève le défi : tableau complet et vérification finale.':selectedTopic==='decimal'?'Tableau en décimal : conversion à partir du binaire fourni. Vérification selon le niveau.':'Cette combinaison sera disponible dans une prochaine étape du prototype.';
});
refreshTrainingLaunch();

// V0.3.21 - progression décimale et aide de Pépette sur les puissances.
document.querySelectorAll('.decimal-reveal').forEach(button=>button.addEventListener('click',()=>{const card=button.closest('.decimal-step');const shown=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(shown));button.textContent=shown?'Masquer':'Afficher';card.querySelectorAll('.decimal-value').forEach(cell=>{cell.textContent=shown?cell.dataset.value:'?';cell.classList.toggle('revealed',shown)});card.querySelector('.decimal-explanation').hidden=true;card.querySelectorAll('.decimal-calculation').forEach(cell=>cell.hidden=!shown);}));
const decimalSummaryButton=document.getElementById('decimal-summary-toggle');if(decimalSummaryButton)decimalSummaryButton.addEventListener('click',()=>{const panel=document.getElementById('decimal-summary');panel.hidden=!panel.hidden;decimalSummaryButton.textContent=panel.hidden?'Afficher le tableau corrigé':'Masquer le tableau corrigé';decimalSummaryButton.setAttribute('aria-expanded',String(!panel.hidden))});
const goHotes=document.getElementById('go-hotes');if(goHotes)goHotes.addEventListener('click',()=>{document.getElementById('decimal-fold').open=false;const next=document.getElementById('hotes-fold');next.open=true;next.scrollIntoView({behavior:'smooth',block:'start'})});
const powersButton=document.getElementById('pepette-powers-toggle');if(powersButton)powersButton.addEventListener('click',()=>{const panel=document.getElementById('pepette-powers-panel');panel.hidden=!panel.hidden;powersButton.textContent=panel.hidden?'Voir le coup de patte':'Refermer le coup de patte';powersButton.setAttribute('aria-expanded',String(!panel.hidden))});

// V0.3.22 - tableaux décimaux à 32 colonnes, poids alignés sur les bits.
for(const card of document.querySelectorAll('.decimal-step')){
 const table=card.querySelector('.decimal-guide');if(!table)continue;
 const binary=[...table.querySelectorAll('.binary-octet')].map(td=>td.textContent.trim());
 const values=[...table.querySelectorAll('.decimal-value')].map(td=>td.dataset.value);
 const names=['1er octet','2e octet','3e octet','4e octet'];
 let markup='<thead><tr><th class="decimal-row-name"></th>'+names.map((name,o)=>'<th colspan="8" class="decimal-octet-title octet-'+(o+1)+'">'+name+'</th>').join('')+'</tr><tr><th class="decimal-row-name">Poids décimaux</th>';
 for(let i=0;i<32;i++){const o=Math.floor(i/8),b=i%8;markup+='<th class="decimal-weight octet-'+(o+1)+(binary[o][b]==='1'?' decimal-weight-active':'')+'">'+(128>>b)+'</th>'}
 markup+='</tr></thead><tbody><tr><th class="decimal-row-name">Binaire</th>';
 for(let o=0;o<4;o++)for(let b=0;b<8;b++)markup+='<td class="decimal-bit octet-'+(o+1)+(binary[o][b]==='1'?' decimal-one':'')+'">'+binary[o][b]+'</td>';
 markup+='</tr><tr><th class="decimal-row-name">Décimal</th>';
 for(let o=0;o<4;o++)markup+='<td colspan="8" class="decimal-value octet-'+(o+1)+'" data-value="'+values[o]+'">?</td>';
 markup+='</tr><tr class="decimal-calculations-row"><th class="decimal-row-name">Calcul</th>';for(let o=0;o<4;o++){const weights=[128,64,32,16,8,4,2,1].filter((_,b)=>binary[o][b]==='1');markup+='<td colspan="8" class="decimal-calculation octet-'+(o+1)+'" hidden><strong>'+values[o]+'</strong> = '+weights.join(' + ')+'</td>';}markup+='</tr></tbody>';table.innerHTML=markup;card.querySelector('.decimal-explanation').hidden=true;
}

// V0.3.55 - Recentrer la section de test lorsqu'elle s'ouvre.
const trainingFold=document.getElementById('training-fold');
if(trainingFold)trainingFold.addEventListener('toggle',()=>{if(trainingFold.open)requestAnimationFrame(()=>trainingFold.scrollIntoView({behavior:'smooth',block:'start'}));});

// V0.3.100 - le cours et les quatre accordéons sont accessibles directement.
const goTrainingShortcut=document.getElementById('go-training');
if(goTrainingShortcut)goTrainingShortcut.addEventListener('click',()=>{const fold=document.getElementById('training-fold');if(!fold)return;fold.open=true;fold.scrollIntoView({behavior:'smooth',block:'start'});});
