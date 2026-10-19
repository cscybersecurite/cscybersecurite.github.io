import {renderWorksheetPaperD} from './guide-common.js?v=0.1.57';
import {parseNetwork,planSubnets,subnetAt,summaryIndices,usableHosts} from './ipcalc-ipv4.js';
const $=id=>document.getElementById(id);
let plan=null;
function renderPowers(count){
 const target=$('flsm-powers');if(!target)return;
 target.replaceChildren();
 const needed=Math.ceil(Math.log2(count)),capacity=2**needed,free=capacity-count;
 $('flsm-c-selected').textContent=count+' sous-réseaux';
 $('flsm-c-needed').textContent=count+' sous-réseaux';
 for(let bits=0;bits<=needed;bits++){
  const n=2**bits,item=document.createElement('div');
  item.className='flsm-power-item'+(bits===needed?' is-sufficient':'');
  const expression=document.createElement('strong');
  expression.append(document.createTextNode('2'),Object.assign(document.createElement('sup'),{textContent:String(bits)}),document.createTextNode(' = '+n));
  const status=document.createElement('span');status.textContent=n>=count?'Suffisant':'Pas assez';
  item.append(expression,status);target.append(item);
 }
 $('flsm-powers-explanation').textContent='2'+['⁰','¹','²','³','⁴','⁵'][needed]+' = '+capacity+' sous-réseaux possibles';
 $('flsm-c-bits').textContent="J'ai donc besoin de "+needed+' bits.';
 const bar=$('flsm-c-bar');bar.replaceChildren();
 const colors=['#2c729f','#228d85','#d19a38','#8876b4','#c46d78','#477fa4','#5c9d83','#9b7eae'];
 for(let i=0;i<capacity;i++){
  const cell=document.createElement('span');
  if(i<count){cell.style.backgroundColor=colors[i%colors.length];cell.title='Sous-réseau '+i+' utilisé';}
  else{cell.className='is-free';cell.title='Sous-réseau '+i+' disponible';}
  bar.append(cell);
 }
 bar.setAttribute('aria-label',count+' sous-réseaux utilisés sur '+capacity+', '+free+' disponibles');
 $('flsm-c-used').textContent=count+' utilisés ('+(100*count/capacity).toLocaleString('fr-FR',{maximumFractionDigits:2})+' %)';
 $('flsm-c-free').textContent=free+' disponibles ('+(100*free/capacity).toLocaleString('fr-FR',{maximumFractionDigits:2})+' %)';
}
function renderSteps(){
 if(!plan)return;
 const base=parseNetwork($('base-address').value.trim(),$('base-prefix').value.trim().replace(/^\//,''));
 const indices=summaryIndices(plan.concernedCount);
 const subnets=indices.map(number=>({...subnetAt(plan,number),number}));
 for(let stage=0;stage<=3;stage++){
  renderWorksheetPaperD($('flsm-sheet-'+stage),{
   initialPrefix:base.prefix,subnetPrefix:plan.prefix,
   baseNetwork:base.address,baseBroadcast:base.broadcast,
   subnets,stage
  });
 }
 const bilan=$('flsm-g-bilan-list');
 if(bilan){
  bilan.replaceChildren();
  $('flsm-g-bilan-intro').textContent='J’ai obtenu '+plan.concernedCount+' sous-réseaux en /'+plan.prefix+' :';
  const table=document.createElement('table');
  const body=document.createElement('tbody');
  for(const subnet of subnets){
   const row=document.createElement('tr');
   const label=document.createElement('th');label.scope='row';label.textContent='Sous-réseau '+subnet.number;
   const address=document.createElement('td');address.textContent=subnet.address+'/'+plan.prefix;
   row.append(label,address);body.append(row);
  }
  table.append(body);bilan.append(table);
  $('flsm-g-bilan-note').textContent=plan.concernedCount>6?'Voici les 3 premiers et les 3 derniers sous-réseaux. Les autres sont également compris dans le découpage.':'';
 }
 const e=$('flsm-e-explanation');
 if(e)e.textContent=plan.concernedCount<=6?
  'Je remplis les '+(plan.prefix-base.prefix)+' bits empruntés pour chaque sous-réseau, dans l’ordre binaire.':
  'Je remplis les '+(plan.prefix-base.prefix)+' bits empruntés pour les trois premiers et les trois derniers sous-réseaux. Les numéros intermédiaires ne sont pas oubliés.';
 const guide=$('flsm-e-last-guide');
 if(guide && guide.dataset.lastCount!==String(plan.concernedCount)){
  guide.open=plan.concernedCount>6;
  guide.dataset.lastCount=String(plan.concernedCount);
 }

}
function renderPepetteExample(){
 const count=Number($('flsm-e-example-count').value);
 const bits=Math.ceil(Math.log2(count));
 const capacity=2**bits;
 const length=Math.min(3,count);
 const first=Array.from({length},(_,i)=>i);
 const last=Array.from({length},(_,i)=>count-length+i);
 const show=(id,values)=>{
  const target=$(id);target.replaceChildren();
  for(const n of values){
   const line=document.createElement('div');line.className='flsm-pepette-example-row';
   const number=document.createElement('span');number.textContent=n+' =';
   const binary=document.createElement('code');binary.textContent=n.toString(2).padStart(bits,'0');
   line.append(number,binary);target.append(line);
  }
 };
 $('flsm-e-example-intro').textContent='Pour '+count+' sous-réseaux, j’emprunte '+bits+' bits.';
 show('flsm-e-example-first',first);show('flsm-e-example-last',last);
 $('flsm-e-example-capacity').textContent=count<capacity?'Je peux créer '+capacity+' combinaisons, mais seuls '+count+' sous-réseaux sont demandés. Les '+(capacity-count)+' autres restent disponibles.':'Les '+capacity+' combinaisons sont toutes utilisées.';
}
$('flsm-e-example-count').addEventListener('change',renderPepetteExample);
renderPepetteExample();
function calculate(){
 $('error').textContent='';
 try{
  const prefix=$('base-prefix').value.trim().replace(/^\//,'');
  const base=parseNetwork($('base-address').value.trim(),prefix);
  if(base.address!==$('base-address').value.trim())throw Error('Indiquez l’adresse réseau initiale, pas une adresse d’hôte.');
  if(!base.broadcast||base.broadcast!==$('base-broadcast').value.trim())throw Error('Le broadcast initial ne correspond pas au réseau et au préfixe fournis.');
  const count=Number($('subnet-count').value);
  if(!Number.isSafeInteger(count)||count<2||count>16)throw Error('Choisis un nombre de sous-réseaux entre 2 et 16.');
  plan=planSubnets(base,{method:'count',count});
  if(plan.prefix>=31)throw Error('Ce cours utilise des sous-réseaux avec des adresses réseau et broadcast distinctes : choisissez un découpage moins fin.');
  $('requested-count').textContent=String(count);
  $('possible-count').textContent=String(plan.capacity);
  $('free-count').textContent=String(plan.capacity-count);
  const free=plan.capacity-count;
  const allocation=$('flsm-allocation');
  allocation.replaceChildren();
  // Affichage limité pour garder une barre lisible, sans énumérer des milliers de sous-réseaux.
  if(plan.capacity<=32){
    allocation.style.gridTemplateColumns='repeat('+Math.min(plan.capacity,8)+',minmax(0,1fr))';
    for(let n=0;n<plan.capacity;n++){
      const cell=document.createElement('span');
      cell.textContent=String(n);
      cell.title='Sous-réseau '+n+(n<count?' attribué':' disponible');
      if(n<count)cell.classList.add('is-assigned');
      allocation.append(cell);
    }
  }else{
    allocation.style.gridTemplateColumns='1fr';
    const cell=document.createElement('span');
    cell.textContent=count+' sous-réseaux attribués sur '+plan.capacity+' possibles';
    cell.classList.add('is-assigned');
    allocation.append(cell);
  }
  $('free-explanation').textContent=free+' sous-réseau(x) non attribué(s) : '+(free*usableHosts(plan.prefix)).toLocaleString('fr-FR')+' adresses d’hôtes utilisables restent disponibles dans ces sous-réseaux.';
  renderSteps();
  $('result-initial').textContent='/'+base.prefix;
  $('result-bits').textContent=String(plan.prefix-base.prefix);
  renderPowers(count);
  $('result-prefix').textContent='/'+plan.prefix;
  $('flsm-c-final-prefix').textContent='/'+plan.prefix;

  const hostBits=32-plan.prefix;
  const formula=$('hosts-formula');
  formula.replaceChildren();
  for(const [exponent,suffix] of [
   ['(32 - CIDR)',' - 2'],
   ['(32 - '+plan.prefix+')',' - 2'],
   [String(hostBits),' - 2 = '+usableHosts(plan.prefix).toLocaleString('fr-FR')]
  ]){
   const line=document.createElement('div');
   line.append(document.createTextNode('Nb hôtes du sous-réseau = 2'),Object.assign(document.createElement('sup'),{textContent:exponent}),document.createTextNode(suffix));
   formula.append(line);
  }
  $('hosts-result').textContent=`Chaque sous-réseau /${plan.prefix} dispose de ${usableHosts(plan.prefix).toLocaleString('fr-FR')} hôtes utilisables.`;
 }catch(e){plan=null;$('error').textContent=e.message;}
}
$('subnet-count').value='4';
$('subnet-count').addEventListener('change',calculate);
const themeButton=$('theme');
try{const savedTheme=localStorage.getItem('ipv4-theme');if(savedTheme==='dark'||(!savedTheme&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.body.classList.add('dark')}catch{if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)document.body.classList.add('dark')}
themeButton.addEventListener('click',()=>{document.body.classList.toggle('dark');try{localStorage.setItem('ipv4-theme',document.body.classList.contains('dark')?'dark':'light')}catch{}});
calculate();

// Sélection de la difficulté : structure et classes reprises du manuel IPv4.
const difficultyButtons=[...document.querySelectorAll('[data-training-difficulty]')];
const launchTraining=document.getElementById('launch-training');
const launchInfo=document.getElementById('training-launch-info');
const difficultyNames={'1':'Avec Pépette','2':'Je me débrouille','3':'Je relève le défi'};
let selectedDifficulty=null;
difficultyButtons.forEach(button=>button.addEventListener('click',()=>{
 selectedDifficulty=button.dataset.trainingDifficulty;
 difficultyButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 launchTraining.disabled=false;
 launchTraining.textContent='Lancer : '+difficultyNames[selectedDifficulty];
 launchInfo.textContent='';
}));
launchTraining?.addEventListener('click',()=>{
 if(!selectedDifficulty)return;
 if(selectedDifficulty==='1'){startPepette();return;}
 if(selectedDifficulty==='2'){startMedium();return;}
 if(selectedDifficulty==='3'){startExpert();return;}
 launchInfo.textContent='Le parcours « '+difficultyNames[selectedDifficulty]+' » sera développé après validation du niveau Avec Pépette.';
});

const goFlsmTraining=$('go-flsm-training');
goFlsmTraining?.addEventListener('click',()=>{
 const section=$('training-fold');if(!section)return;
 // Ouvrir également les éventuels volets parents et refermer le chapitre précédent.
 for(let parent=section.parentElement;parent;parent=parent.parentElement){
  if(parent.tagName==='DETAILS')parent.open=true;
 }
 section.open=true;
 const summary=section.querySelector('summary');
 (summary||section).scrollIntoView({behavior:'smooth',block:'start'});
 (summary||section).focus?.({preventScroll:true});
});

 
// Parcours Avec Pépette : tirage indépendant, sans historique ni liste ordonnée.
// Le moteur IPcalc reste la seule source des calculs de sous-réseaux.
let pepettePlan=null,pepetteStep=0;
const pepetteStages=['bits','prefix','initial-network','initial-broadcast','borrowed','binary','decimal','hosts'];
const pepetteRows=[['Réseau (binaire)','address',true],['Réseau (décimal)','address',false],['Broadcast (binaire)','broadcast',true],['Broadcast (décimal)','broadcast',false]];
const pepetteBits=ip=>ip.split('.').map(x=>Number(x).toString(2).padStart(8,'0')).join('');
const pepetteTasks=()=>[
 {kind:'number',label:'Nombre de bits empruntés',expected:pepettePlan.prefix-pepettePlan.base.prefix},
 {kind:'number',label:'Nouveau CIDR',expected:pepettePlan.prefix},
 ...['address','broadcast'].map((key,i)=>({kind:'initial',label:i?'Broadcast initial (binaire)':'Réseau initial (binaire)',key})),
 ...Array.from({length:pepettePlan.concernedCount},(_,index)=>({kind:'borrowed',index,key:'address',label:'Sous-réseau '+index+' : Réseau (bits empruntés)'})),
 ...Array.from({length:pepettePlan.concernedCount},(_,index)=>['address','broadcast'].map((key,i)=>({kind:'binary',index,key,label:'Sous-réseau '+index+' : '+(i?'Broadcast':'Réseau')+' (binaire)'}))).flat(),
 ...Array.from({length:pepettePlan.concernedCount},(_,index)=>['address','broadcast'].map((key,i)=>({kind:'decimal',index,key,label:'Sous-réseau '+index+' : '+(i?'Broadcast':'Réseau')+' (décimal)'}))).flat()
];
function pepetteRandom(n){
 if(globalThis.crypto?.getRandomValues){const a=new Uint32Array(1);const limit=Math.floor(4294967296/n)*n;let v;do{crypto.getRandomValues(a);v=a[0];}while(v>=limit);return v%n;}
 return Math.floor(Math.random()*n);
}
function pepetteExercise(){
 const count=pepetteRandom(2)===0?2:4,borrowed=count===2?1:2;
 const candidates=[8,16,24].flatMap(edge=>[edge,edge-borrowed]).filter(p=>p>=4&&p+borrowed<=30);
 for(let tries=0;tries<1000;tries++){
  const prefix=candidates[pepetteRandom(candidates.length)];
  const first=[10,172,192][pepetteRandom(3)];
  const second=first===172?16+pepetteRandom(16):first===192?168:pepetteRandom(16);
  const third=pepetteRandom(16)*16,fourth=pepetteRandom(16)*16;
  const raw=[first,second,third,fourth].join('.');
  const parsed=parseNetwork(raw,prefix);
  const ones=parsed.address.split('.').reduce((sum,x)=>sum+Number(x).toString(2).replace(/0/g,'').length,0);
  if(ones>12)continue;
  const candidate=planSubnets(parsed,{method:'count',count});
  return candidate;
 }
 throw new Error("Impossible de générer l'exercice.");
}


/* Niveau intermédiaire : tableau commun, validation de chaque sous-réseau
   sans révélation des bits ou des octets erronés. */
let mediumPlan=null,mediumValidated=0,mediumInputs=[];
let expertPlan=null;
function mediumExercise(){
 for(let attempt=0;attempt<1200;attempt++){
  const count=3+pepetteRandom(6),borrowed=Math.ceil(Math.log2(count));
  const prefix=9+pepetteRandom(19);
  if(prefix+borrowed>29||prefix%8===0||(prefix+borrowed)%8===0)continue;
  const bytes=Array.from({length:4},()=>pepetteRandom(256));
  const parsed=parseNetwork(bytes.join('.'),prefix);
  const ones=pepetteBits(parsed.address).slice(0,prefix).split('1').length-1;
  if(ones<Math.max(4,Math.floor(prefix*.3)))continue;
  return planSubnets(parsed,{method:'count',count});
 }
 throw new Error('Impossible de générer un exercice intermédiaire.');
}
// Niveau expert : cinq à seize sous-réseaux, sans guidage et validation globale.
function expertExercise(){
 for(let attempt=0;attempt<2000;attempt++){
  const count=5+pepetteRandom(11); // 5 à 15 sous-réseaux demandés
  if([2,4,8,16].includes(count))continue;
  const borrowed=Math.ceil(Math.log2(count));
  const prefix=9+pepetteRandom(18);
  if(prefix+borrowed>29||prefix%8===0||(prefix+borrowed)%8===0)continue;
  // Favoriser les CIDR traversant une limite d'octet.
  if(Math.floor((prefix-1)/8)===Math.floor((prefix+borrowed-1)/8))continue;
  const bytes=Array.from({length:4},()=>pepetteRandom(256));
  const parsed=parseNetwork(bytes.join('.'),prefix);
  const ones=pepetteBits(parsed.address).slice(0,prefix).split('1').length-1;
  if(ones<Math.max(6,Math.floor(prefix*.48)))continue;
  return planSubnets(parsed,{method:'count',count});
 }
 throw new Error('Impossible de générer un exercice expert.');
}
function startExpert(){
 setFlsmTrainingPresentation(3);
 try{
  expertPlan=expertExercise();flsmHostStep=0;flsmHostFeedback='';
  $('pepette-training').hidden=false;$('pepette-finish').hidden=true;
  $('pepette-feedback').textContent='';launchInfo.textContent='';
  renderSubnetExercise(3);
  $('pepette-training').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(error){launchInfo.textContent=error.message;}
}
function setFlsmTrainingPresentation(level){
 const title=$('flsm-exercise-title');
 if(title)title.textContent=difficultyNames[String(level)]+' : mon exercice FLSM';
 const help=document.querySelector('#pepette-training .pepette-help');
 if(help)help.hidden=level!==1;
 const panel=$('pepette-binary-panel');
 if(panel){panel.hidden=true;}
 const toggle=$('pepette-binary-toggle');
 if(toggle){toggle.setAttribute('aria-expanded','false');toggle.textContent='Voir le coup de patte';}
 $('pepette-progress').textContent='';
}
function startMedium(){
 setFlsmTrainingPresentation(2);
 try{
  mediumPlan=mediumExercise();mediumValidated=0;mediumInputs=[];flsmHostStep=0;flsmHostFeedback='';
  $('pepette-training').hidden=false;$('pepette-finish').hidden=true;
  $('pepette-feedback').textContent='';launchInfo.textContent='';
  $('pepette-statement').replaceChildren();
  for(const [label,value,cls] of [
   ['Réseau initial',mediumPlan.base.address+'/'+mediumPlan.base.prefix,'pepette-address'],
   ['Broadcast initial',mediumPlan.base.broadcast,''],
   ['Sous-réseaux demandés',String(mediumPlan.concernedCount),'pepette-count']
  ]){
   const line=document.createElement('div');line.append(document.createTextNode(label+' : '));
   const strong=document.createElement('strong');strong.className=cls;strong.textContent=value;line.append(strong);$('pepette-statement').append(line);
  }
  renderSubnetExercise(2);
  $('pepette-training').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(error){launchInfo.textContent=error.message;}
}
function renderSubnetExercise(level){
 const root=$('pepette-exercise');root.replaceChildren();
 const plan=level===3?expertPlan:mediumPlan,base=plan.base;
 if(level===3){
  $('pepette-statement').replaceChildren();
  for(const [label,value,cls] of [
   ['Réseau initial',base.address+'/'+base.prefix,'pepette-address'],
   ['Broadcast initial',base.broadcast,''],
   ['Sous-réseaux demandés',String(plan.concernedCount),'pepette-count']
  ]){
   const line=document.createElement('div');line.append(document.createTextNode(label+' : '));
   const strong=document.createElement('strong');strong.className=cls;strong.textContent=value;line.append(strong);$('pepette-statement').append(line);
  }
 }
 $('pepette-progress').textContent='';
 const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el;};

 const intro=make('p','',level===3?'Je complète les 32 bits et les adresses décimales des sous-réseaux affichés. Je valide mon tableau entier en une seule fois.':'Je complète les 32 bits et les adresses décimales de chaque sous-réseau. Je vérifie chaque bloc complet, sans correction case par case.');
 root.append(intro);
 const countRow=make('div','pepette-row');
 countRow.append(make('strong','','Nombre de bits empruntés : '));
 const borrowed=make('input','pepette-decimal');borrowed.type='number';borrowed.min='1';borrowed.max=level===3?'5':'4';borrowed.setAttribute('aria-label','Nombre de bits empruntés');
 countRow.append(borrowed,make('strong','',' Nouveau CIDR : /'));
 const cidr=make('input','pepette-decimal');cidr.type='number';cidr.min='1';cidr.max='30';cidr.setAttribute('aria-label','Nouveau CIDR');
 countRow.append(cidr);
 const checkPrefix=make('button','pepette-check','Vérifier mes calculs');checkPrefix.type='button';countRow.append(checkPrefix);
 const prefixFeedback=make('p','');prefixFeedback.setAttribute('aria-live','polite');root.append(countRow);
 const frame=make('div','flsm-paper-d');
 const ref=make('table','flsm-paper-grid flsm-paper-reference'),head=make('tbody');
 const oct=make('tr');oct.append(make('th','flsm-paper-label','OCTETS'));
 for(let o=0;o<4;o++){const th=make('th','flsm-paper-octet',(o+1)+(o===0?'er':'e')+' octet');th.colSpan=8;oct.append(th);}head.append(oct);
 for(const [label,powers] of [['Puissances de 2',true],['Poids décimaux',false]]){
  const tr=make('tr');tr.append(make('th','flsm-paper-label',label));
  for(let i=0;i<32;i++){
   const th=make('th','flsm-paper-reference-bit'+(i%8===7&&i!==31?' flsm-paper-octet-end':''));
   if(powers){th.append('2',make('sup','',String(7-i%8)));}else th.textContent=String(2**(7-i%8));
   tr.append(th);
  }head.append(tr);
 }
 ref.append(head);frame.append(ref);root.append(frame);
 const blocks=[],entries=[];
 let expertActions=null;
 const shownIndices=level===3&&plan.concernedCount>6
  ?[0,1,2,plan.concernedCount-3,plan.concernedCount-2,plan.concernedCount-1]
  :Array.from({length:plan.concernedCount},(_,i)=>i);
 for(const index of shownIndices){
  const subnet=subnetAt(plan,index),block=make('div','flsm-paper-subnet'),title=make('div','flsm-paper-subnet-title');
  title.append(make('strong','','Sous-réseau '));const number=make('strong','flsm-subnet-number',String(index));title.append(number);block.append(title);
  const table=make('table','flsm-paper-grid flsm-paper-address'),body=make('tbody');
  const inputs=[];
  for(const [label,key,binary] of pepetteRows){
   const tr=make('tr');tr.append(make('th','flsm-paper-label',label));
   if(binary){
    const expected=pepetteBits(subnet[key]);
    for(let i=0;i<32;i++){
     const td=make('td','flsm-paper-bit '+(i<base.prefix?'flsm-paper-network':i<plan.prefix?'flsm-paper-borrowed':'flsm-paper-host'));
     if(i===base.prefix-1)td.classList.add('flsm-paper-initial-bar');
     if(i===plan.prefix-1)td.classList.add('flsm-paper-subnet-bar');
     const input=make('input','pepette-bit pepette-bit-toggle');
     input.readOnly=true;input.setAttribute('role','button');input.setAttribute('aria-label',label+', bit '+(i+1));
     input.dataset.bitIndex=String(i);input.style.cursor='pointer';
     input.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setPepetteBit(input,input.value!=='1');}});
     td.append(input);tr.append(td);inputs.push({input,expected:expected[i],binary:true});
    }
    const bits=inputs.slice(-32),row=tr;let drag=null;
    const paint=(start,end,on)=>{for(const item of bits){const i=Number(item.input.dataset.bitIndex);if(i>=Math.min(start,end)&&i<=Math.max(start,end))setPepetteBit(item.input,on);}};
    row.addEventListener('pointerdown',e=>{
     const target=e.target.closest('input.pepette-bit');if(!target||e.button!==0||target.disabled)return;
     e.preventDefault();const start=Number(target.dataset.bitIndex);
     drag={id:e.pointerId,start,last:start,on:target.value!=='1',original:bits.map(item=>item.input.value)};
     row.setPointerCapture(e.pointerId);paint(start,start,drag.on);
    });
    row.addEventListener('pointermove',e=>{
     if(!drag||e.pointerId!==drag.id)return;
     const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('input.pepette-bit');
     if(!target||!row.contains(target))return;
     const end=Number(target.dataset.bitIndex);if(end===drag.last)return;
     bits.forEach((item,i)=>setPepetteBit(item.input,drag.original[i]==='1'));drag.last=end;paint(drag.start,end,drag.on);
    });
    const stop=e=>{if(drag&&drag.id===e.pointerId){drag=null;if(row.hasPointerCapture(e.pointerId))row.releasePointerCapture(e.pointerId);}};
    row.addEventListener('pointerup',stop);row.addEventListener('pointercancel',stop);
   }else{
    const octets=subnet[key].split('.');
    for(let o=0;o<4;o++){
     const td=make('td','flsm-paper-decimal');td.colSpan=8;
     const input=make('input','pepette-decimal');input.inputMode='numeric';input.maxLength=3;
     input.setAttribute('aria-label',label+', octet '+(o+1));
     input.addEventListener('input',()=>input.value=input.value.replace(/[^0-9]/g,'').slice(0,3));
     td.append(input);tr.append(td);inputs.push({input,expected:octets[o],binary:false});
    }
   }body.append(tr);
  }
  table.append(body);block.append(table);
  const controls=make('div','pepette-actions'),verify=make('button','pepette-check','Vérifier le sous-réseau '+index),feedback=make('p','');
  verify.type='button';if(level===2){controls.append(verify,feedback);block.append(controls);}
  frame.append(block);blocks.push(block);entries.push(inputs);
  if(level===2)verify.addEventListener('click',()=>{
   const correct=inputs.every(({input,expected,binary})=>binary?(input.value==='1'?'1':'0')===expected:input.value.trim()!==''&&Number(input.value)===Number(expected));
   if(!correct){feedback.className='pepette-error';feedback.textContent='Il reste une erreur dans ce sous-réseau. Je vérifie mes quatre lignes.';return;}
   const tick=make('span','flsm-subnet-validated',' ✓');tick.setAttribute('aria-label','Validé');tick.title='Sous-réseau validé';title.append(tick);
   controls.remove();
   for(const {input} of inputs)input.disabled=true;
   verify.disabled=true;mediumValidated++;
   $('pepette-progress').textContent='';
   if(mediumValidated===plan.concernedCount){
    const success=make('p','pepette-success','✓ Bravo ! Mon tableau FLSM est terminé.');root.append(success);
    renderFlsmHosts(2);
   }
  });
 }
 for(const block of blocks)block.hidden=true;
 checkPrefix.addEventListener('click',()=>{
  if(Number(borrowed.value)!==plan.prefix-base.prefix||Number(cidr.value)!==plan.prefix){
   prefixFeedback.className='pepette-error';prefixFeedback.textContent='Je vérifie le nombre de bits empruntés et le nouveau CIDR.';return;
  }
  borrowed.disabled=true;cidr.disabled=true;
  checkPrefix.remove();
  const tick=make('span','flsm-prefix-validated','✓');
  tick.setAttribute('role','status');tick.setAttribute('aria-label','Calculs validés');
  tick.title='Calculs validés';countRow.append(tick);
  prefixFeedback.textContent='';
  blocks.forEach(block=>block.hidden=false);
  if(level===3&&expertActions)expertActions.hidden=false;
 });
 if(level===3){
  const actions=make('div','pepette-actions');
  const verifyAll=make('button','pepette-check','Vérifier mon tableau');
  verifyAll.type='button';
  const globalFeedback=make('p','');globalFeedback.setAttribute('aria-live','polite');
  actions.append(verifyAll,globalFeedback);root.append(actions);
  actions.hidden=true;
  expertActions=actions;
  verifyAll.addEventListener('click',()=>{
   const valid=entries.every(inputs=>inputs.every(({input,expected,binary})=>
    binary?(input.value==='1'?'1':'0')===expected:input.value.trim()!==''&&Number(input.value)===Number(expected)
   ));
   if(!valid){
    globalFeedback.className='pepette-error';
    globalFeedback.textContent='Le tableau comporte encore une ou plusieurs erreurs. Je vérifie tous mes sous-réseaux.';
    return;
   }
   for(const inputs of entries)for(const {input} of inputs)input.disabled=true;
   actions.remove();
   root.append(make('p','pepette-success','✓ Bravo ! Mon tableau FLSM est terminé.'));
   renderFlsmHosts(3);
  });
 }
}

function startPepette(){
 setFlsmTrainingPresentation(1);
 try{
  pepettePlan=pepetteExercise();pepetteStep=0;flsmHostStep=0;flsmHostFeedback='';
  $('pepette-training').hidden=false;$('pepette-finish').hidden=true;
  $('pepette-feedback').textContent='';launchInfo.textContent='';
  const base=pepettePlan.base;
  $('pepette-statement').replaceChildren();
  for(const [label,value,cls] of [
   ['Réseau initial',base.address+'/'+base.prefix,'pepette-address'],
   ['Broadcast initial',base.broadcast,''],
   ['Sous-réseaux demandés',String(pepettePlan.concernedCount),'pepette-count']
  ]){
   const row=document.createElement('div');row.append(document.createTextNode(label+' : '));
   const strong=document.createElement('strong');strong.className=cls;strong.textContent=value;row.append(strong);
   $('pepette-statement').append(row);
  }
  renderPepetteWorksheet();
  $('pepette-training').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){launchInfo.textContent=e.message;}
}

/* Calcul des hôtes : trois parcours repris du questionnaire IPv4.
   Le préfixe est celui du sous-réseau obtenu après découpage FLSM. */
let flsmHostStep=0,flsmHostLevel=1,flsmHostFeedback='',flsmHostExpertChecked=false,flsmHostExpertValues=null;
function flsmHostElement(tag,cls,textValue){
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(textValue!==undefined)node.textContent=textValue;
 return node;
}
function flsmHostButton(label,callback){
 const button=flsmHostElement('button','',label);button.type='button';button.addEventListener('click',callback);return button;
}
function renderFlsmHosts(level){
 flsmHostLevel=level;
 const exercise=$('pepette-exercise'),activePlan=level===3?expertPlan:level===2?mediumPlan:pepettePlan,prefix=activePlan.prefix,exp=32-prefix,power=2**exp,result=usableHosts(prefix);
 let host=$('flsm-host-calculation');
 if(!host){host=document.createElement('section');host.id='flsm-host-calculation';host.className='card lesson-step';exercise.append(host);}
 host.replaceChildren();
 const heading=flsmHostElement('div','pepette-exercise-heading');
 heading.append(flsmHostElement('h3','', 'Calcul du nombre d’hôtes - '+difficultyNames[String(level)]),
  flsmHostElement('p','', 'CIDR du sous-réseau : /'+prefix));
 host.append(heading);
 const work=flsmHostElement('div','pepette-hosts-work');
 work.style.cssText='min-width:0;flex:1 1 380px';
 const layout=flsmHostElement('div','pepette-hosts-layout');
 layout.style.cssText='display:flex;align-items:flex-start;flex-wrap:wrap;gap:24px;margin-top:12px';
 layout.append(work);host.append(layout);
 const formula=flsmHostElement('div','pepette-hosts-formula');
 formula.style.cssText='display:flex;align-items:baseline;flex-wrap:wrap;gap:8px;font-size:1.45rem;font-weight:600;line-height:2.5;margin:20px 0 12px';
 const field=(label,width=58)=>{
  const input=flsmHostElement('input');input.type='text';input.inputMode='numeric';input.autocomplete='off';
  input.setAttribute('aria-label',label);input.style.cssText='width:'+width+'px;box-sizing:border-box;text-align:center;font:inherit;padding:4px;border:2px solid #f59e0b;border-radius:5px';
  return input;
 };
 const exponentBlock=child=>{
  const group=flsmHostElement('span');group.style.cssText='display:inline-flex;align-items:flex-start;white-space:nowrap';
  group.append(flsmHostElement('span','','2'));
  const sup=flsmHostElement('sup');sup.style.cssText='font-size:.65em;line-height:1.2;position:relative;top:-.2em';
  sup.append(child);group.append(sup);return group;
 };
 const finish=()=>{
  const success=flsmHostElement('p','pepette-success','Bravo ! Tu as trouvé '+result.toLocaleString('fr-FR')+' hôtes utilisables par sous-réseau.');
  work.append(success,flsmHostElement('p','','Tu peux donc attribuer une adresse IP à '+result.toLocaleString('fr-FR')+' équipements sur chaque sous-réseau.'));
  const actions=flsmHostElement('div','flsm-host-finish-actions');
  const again=flsmHostButton('Nouvel exercice',level===3?startExpert:level===2?startMedium:startPepette);again.classList.add('flsm-host-finish-primary');
  const menu=flsmHostButton('Retour au menu',()=>{$('pepette-menu').click();});menu.classList.add('flsm-host-finish-secondary');
  actions.append(again,menu);work.append(actions);
 };
 if(level===1){
  heading.append(flsmHostElement('p','pepette-step-instruction',flsmHostStep===2?'Bravo ! Ton calcul est terminé.':'Complète la case dans l’égalité, puis vérifie ta réponse.'));
  let active=null;
  const valueField=expected=>{const input=field('Valeur à compléter dans la formule');input.dataset.expected=String(expected);active=input;return input;};
  formula.append(flsmHostElement('span','','Nb hôtes du sous-réseau ='));
  const sup=flsmHostElement('span');sup.append('(32 - ',flsmHostStep===0?valueField(prefix):String(prefix),')');
  formula.append(exponentBlock(sup),flsmHostElement('span','','− 2 ='));
  if(flsmHostStep>=1){formula.append(exponentBlock(flsmHostStep===1?valueField(exp):String(exp)),flsmHostElement('span','','− 2'));}
  work.append(formula);
  if(flsmHostStep<2){
   const feedback=flsmHostElement('p','pepette-hint',flsmHostFeedback);work.append(feedback);
   const verify=flsmHostButton('Vérifier',()=>{
    if(active.value.trim()===active.dataset.expected){flsmHostStep++;flsmHostFeedback='';renderFlsmHosts(1);host.querySelector('.pepette-hosts-formula input')?.focus({preventScroll:true});}
    else{feedback.textContent='Ce n’est pas la bonne valeur. Essaie encore.';active.focus();active.select();}
   });
   active.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();verify.click();}});
   work.append(verify);
  }else finish();
  return;
 }
 heading.append(flsmHostElement('p','',level===2?'Complète la formule du nombre d’hôtes utilisables. Tu peux corriger tes réponses.':'Construis la formule du nombre d’hôtes utilisables. Une seule tentative par adresse.'));
 const base=field('Base',64),exponent=field('Exposant',60),last=field(level===2?'Nombre à soustraire':'Dernier terme, signe compris',76);
 const pow=flsmHostElement('span');const sup=flsmHostElement('sup');sup.append(exponent);pow.append(base,sup);
 formula.append(flsmHostElement('span','','Nb hôtes du sous-réseau ='),pow);
 if(level===2)formula.append(flsmHostElement('span','','−'));
 else last.inputMode='text';
 formula.append(last);
 const numeric=exp<=8?field('Résultat numérique',95):null;
 if(numeric)formula.append(flsmHostElement('span','','='),numeric);
 work.append(formula);
 const feedback=flsmHostElement('div',level===2?'pepette-hosts-medium-feedback':'pepette-hosts-expert-feedback');work.append(feedback);
 const check=()=>{
  const correctBase=base.value.trim()==='2',correctExp=exponent.value.trim()===String(exp);
  const correctLast=level===2?last.value.trim()==='2':last.value.trim().replace(/\s+/g,'').replace('−','-')==='-2';
  const correctResult=!numeric||numeric.value.trim().replace(/[\s\u00a0\u202f]/g,'')===String(result);
  const correct=correctBase&&correctExp&&correctLast&&correctResult;
  feedback.replaceChildren();
  if(correct){
   const tick=flsmHostElement('span','flsm-host-validated','✓');
   tick.setAttribute('role','status');tick.setAttribute('aria-label','Formule validée');
   tick.title='Formule validée';
   feedback.append(tick);
   for(const input of [base,exponent,last,numeric].filter(Boolean))input.disabled=true;
   verify.remove();
   finish();
  }
  else{
   feedback.append(flsmHostElement('p','pepette-hint',level===2?'Ce n’est pas encore tout à fait correct. Tu peux modifier tes réponses et vérifier à nouveau.':'Cette formule n’est pas correcte. Voici ce qu’il faut revoir :'));
   if(!correctBase||!correctExp)feedback.append(flsmHostElement('p','','Vérifie la puissance de 2 : combien de bits restent disponibles pour les hôtes ?'));
   if(!correctLast)feedback.append(flsmHostElement('p','','Deux adresses sont réservées : celle du réseau et celle de broadcast.'));
   if(!correctResult)feedback.append(flsmHostElement('p','','Vérifie le calcul numérique.'));
   if(level===3){
    const solution=flsmHostElement('p','','Formule attendue : 2');const sup=flsmHostElement('sup','',String(exp));solution.append(sup,' − 2');
    if(numeric)solution.append(' = '+result.toLocaleString('fr-FR'));
    feedback.append(solution);verify.remove();
    feedback.append(flsmHostButton('Corriger mon calcul',()=>renderFlsmHosts(3)));
   }
  }
 };
 const verify=flsmHostButton('Vérifier',check);work.append(verify);
}

function setPepetteBit(input,on){input.value=on?'1':'';input.classList.toggle('is-one',on);input.setAttribute('aria-pressed',String(on));}
function renderPepetteWorksheet(){
 // Résultats pédagogiques persistants, indépendants de l'historique technique masqué.
 const statement=$('pepette-statement');
 for(const id of ['pepette-borrowed-result','pepette-cidr-result'])$(id)?.remove();
 const showResult=(id,label,value)=>{
  const row=document.createElement('div');row.id=id;
  row.append(document.createTextNode(label+' : '));
  const strong=document.createElement('strong');strong.textContent=value;row.append(strong);
  statement.append(row);
 };
 if(pepetteStep>=1)showResult('pepette-borrowed-result','Nombre de bits empruntés',String(pepettePlan.prefix-pepettePlan.base.prefix));
 if(pepetteStep>=2)showResult('pepette-cidr-result','Nouveau CIDR','/'+pepettePlan.prefix);
 const host=$('pepette-exercise');
 const tasks=pepetteTasks(),active=tasks[pepetteStep],base=pepettePlan.base;
 if(!active){$('pepette-progress').textContent='Dernière étape : calcul du nombre d’hôtes utilisables';renderFlsmHosts(1);return;}
 host.replaceChildren();
 $('pepette-progress').textContent=''; // La progression technique reste interne, sans compteur visible pour l'élève.
 const prompt=document.createElement('div');prompt.className='pepette-row';
 prompt.append(Object.assign(document.createElement('strong'),{textContent:'Je complète : '+active.label}));
 const feedback=$('pepette-feedback');feedback.textContent='';feedback.className='';
 if(active.kind==='number'){
  const input=document.createElement('input');input.className='pepette-decimal';input.inputMode='numeric';input.type='number';input.min='0';input.setAttribute('aria-label',active.label);
  const check=document.createElement('button');check.type='button';check.textContent='Vérifier ma réponse';
  check.addEventListener('click',()=>{
   if(input.value.trim()!==''&&Number(input.value)===active.expected){pepetteStep++;renderPepetteWorksheet();}
   else{feedback.textContent='Je vérifie mon calcul avant de continuer.';feedback.className='pepette-error';input.focus();}
  });
  if(active.label==='Nouveau CIDR')prompt.append(document.createTextNode(' / '));
  prompt.append(document.createTextNode(' '),input,document.createTextNode(' '),check);
 }
 host.append(prompt);
 const frame=document.createElement('div');frame.className='flsm-paper-d';
 const reference=document.createElement('table');reference.className='flsm-paper-grid flsm-paper-reference';
 const head=document.createElement('tbody');
 const mk=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;};
 const oct=mk('tr');oct.append(mk('th','flsm-paper-label','OCTETS'));
 for(let o=0;o<4;o++){const th=mk('th','flsm-paper-octet',(o+1)+(o===0?'er':'e')+' octet');th.colSpan=8;oct.append(th);}head.append(oct);
 for(const [title,powers] of [['Puissances de 2',true],['Poids décimaux',false]]){
  const tr=mk('tr');tr.append(mk('th','flsm-paper-label',title));
  for(let i=0;i<32;i++){
   const cell=mk('th','flsm-paper-reference-bit'+(i%8===7&&i!==31?' flsm-paper-octet-end':'')+(pepetteStep>=4&&i>=base.prefix&&i<pepettePlan.prefix?' flsm-paper-borrowed-head':''));
   if(powers)cell.append(document.createTextNode('2'),mk('sup','',String(7-i%8)));
   else cell.textContent=String(2**(7-i%8));
   tr.append(cell);
  }head.append(tr);
 }
 reference.append(head);frame.append(reference);
 const interactive=[];
 function addBlock(title,subnet,index){
  const block=mk('div','flsm-paper-subnet'),header=mk('div','flsm-paper-subnet-title');
  header.append(mk('strong','',title));block.append(header);
  const table=mk('table','flsm-paper-grid flsm-paper-address'),tbody=mk('tbody');
  for(const [label,key,binary] of pepetteRows){
   const tr=mk('tr'),name=mk('th','flsm-paper-label',label);tr.append(name);
   const taskIndex=tasks.findIndex(t=>t.key===key&&t.index===index&&t.kind===(binary?'binary':'decimal'));
   // Les bits empruntés sont communs au réseau et au broadcast.
   // Une validation sur la ligne réseau valide leur recopie sur le broadcast.
   const borrowIndex=tasks.findIndex(t=>t.kind==='borrowed'&&t.index===index);
   const initialIndex=tasks.findIndex(t=>t.kind==='initial'&&t.key===key);
   const isInitial=index===0;
   const current=tasks[pepetteStep];
   const editing= binary ? (isInitial&&current.kind==='initial'&&current.key===key ||
      current.index===index&&current.key===key&&(current.kind==='borrowed'||current.kind==='binary'))
      :current.kind==='decimal'&&current.index===index&&current.key===key;
   const expected=pepetteBits(current.kind==='initial'?base[key]:subnet[key]);
   const groups=[];
   if(binary){
    for(let i=0;i<32;i++){
     const cls=['flsm-paper-bit',i<base.prefix?'flsm-paper-network':pepetteStep>=4&&i<pepettePlan.prefix?'flsm-paper-borrowed':'flsm-paper-host'];
     if(pepetteStep>=2&&i===base.prefix-1)cls.push('flsm-paper-initial-bar');
     if(pepetteStep>=4&&i===pepettePlan.prefix-1)cls.push('flsm-paper-subnet-bar');
     const td=mk('td',cls.join(' '));
     const inInitial=i<base.prefix,inBorrowed=i>=base.prefix&&i<pepettePlan.prefix,inHost=i>=pepettePlan.prefix;
     let completed=false,editable=false;
     const initialDone=initialIndex<pepetteStep,borrowDone=borrowIndex<pepetteStep,binaryDone=taskIndex<pepetteStep;
     completed=(inInitial&&initialDone)||(inBorrowed&&borrowDone)||(inHost&&binaryDone);
     editable=editing&&(current.kind==='initial'?inInitial:current.kind==='borrowed'?inBorrowed:inHost);
     if(editable){
      const input=mk('input','pepette-bit');input.inputMode='numeric';input.maxLength=1;input.setAttribute('aria-label',label+', bit '+(i+1));
      input.readOnly=true;input.setAttribute('role','button');input.classList.add('pepette-bit-toggle');input.setAttribute('aria-label',label+', bit '+(i+1)+', cliquer pour changer');input.style.cursor='pointer';input.dataset.bitIndex=String(i);
      input.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();setPepetteBit(input,input.value!=='1');}});
      td.append(input);interactive.push({input,expected:expected[i],octet:Math.floor(i/8),cell:td,borrowed:current.kind==='borrowed'});
     }else if(completed){
      const val=(inInitial?pepetteBits(base[key]):pepetteBits(subnet[key]))[i];td.textContent=val==='0'&&!inBorrowed?'':val;
     }
     tr.append(td);
    }
   }else{
    for(let o=0;o<4;o++){
     const td=mk('td','flsm-paper-decimal');td.colSpan=8;
     if(editing){
      const input=mk('input','pepette-decimal');input.inputMode='numeric';input.maxLength=3;input.setAttribute('aria-label',label+', octet '+(o+1));
      input.addEventListener('input',()=>{input.value=input.value.replace(/[^0-9]/g,'').slice(0,3);});
      td.append(input);interactive.push({input,expected:subnet[key].split('.')[o],octet:o,cell:td,decimal:true});
     }else if(taskIndex>=0&&taskIndex<pepetteStep)td.textContent=subnet[key].split('.')[o];
     tr.append(td);
    }
   }
   tbody.append(tr);
  }
  table.append(tbody);block.append(table);frame.append(block);
 }
 for(let i=0;i<pepettePlan.concernedCount;i++)addBlock('Sous-réseau '+i,subnetAt(pepettePlan,i),i);
 host.append(frame);
 if(interactive.some(item=>!item.decimal)){
  const bits=interactive.filter(item=>!item.decimal);
  const row=bits[0].input.closest('tr');
  let drag=null;
  const paint=(start,end,value)=>{
   for(const item of bits){
    const n=Number(item.input.dataset.bitIndex);
    if(n>=Math.min(start,end)&&n<=Math.max(start,end))setPepetteBit(item.input,value);
   }
  };
  row.addEventListener('pointerdown',e=>{
   const cell=e.target.closest('input.pepette-bit');
   if(!cell||e.button!==0)return;
   e.preventDefault();
   const start=Number(cell.dataset.bitIndex);
   drag={id:e.pointerId,start,last:start,value:cell.value!=='1',original:bits.map(item=>item.input.value)};
   row.setPointerCapture(e.pointerId);
   paint(start,start,drag.value);
  });
  row.addEventListener('pointermove',e=>{
   if(!drag||drag.id!==e.pointerId)return;
   const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('input.pepette-bit');
   if(!cell||!row.contains(cell))return;
   const end=Number(cell.dataset.bitIndex);
   if(end===drag.last)return;
   bits.forEach((item,i)=>setPepetteBit(item.input,drag.original[i]==='1'));
   drag.last=end;paint(drag.start,end,drag.value);
  });
  const stop=e=>{if(drag&&e.pointerId===drag.id){drag=null;if(row.hasPointerCapture(e.pointerId))row.releasePointerCapture(e.pointerId);}};
  row.addEventListener('pointerup',stop);row.addEventListener('pointercancel',stop);
 }
 if(interactive.length){
  const check=mk('button','','Vérifier ma ligne');check.type='button';check.className='pepette-check';
  check.addEventListener('click',()=>{
   let wrongOctet=-1;
   for(const item of interactive){
    const value=item.input.value.trim();
    const correct=item.decimal?value!==''&&Number(value)===Number(item.expected):
     (value===''||value==='0'?'0':value)===String(item.expected);
    // Ne jamais signaler individuellement les bits incorrects : cela révèle la réponse.
    item.cell.classList.remove('pepette-octet-error');
    if(!correct&&wrongOctet<0)wrongOctet=item.octet;
   }
   if(wrongOctet>=0){
    feedback.textContent='Je vérifie le '+(wrongOctet+1)+(wrongOctet===0?'er':'e')+' octet, puis je corrige ma ligne.';
    feedback.className='pepette-error';
    interactive.find(item=>item.octet===wrongOctet)?.input.focus();
   }else{
    if(pepetteStep===tasks.length-1){
     for(const item of interactive){
      item.input.value=String(item.expected);
      item.input.disabled=true;
      if(item.input.classList.contains('pepette-bit-toggle'))setPepetteBit(item.input,String(item.expected)==='1');
     }
     pepetteStep++;
     prompt.replaceChildren(mk('strong','pepette-success','✓ Bravo ! Mon tableau FLSM est terminé.'));
     $('pepette-progress').textContent='Dernière étape : calcul du nombre d’hôtes utilisables';
     renderFlsmHosts(1);
    }else{pepetteStep++;renderPepetteWorksheet();}
   }
  });
  prompt.append(document.createTextNode(' '),check);
 }

}
$('pepette-again')?.addEventListener('click',startPepette);
$('pepette-menu')?.addEventListener('click',()=>{
 $('pepette-training').hidden=true;pepettePlan=null;selectedDifficulty=null;
 difficultyButtons.forEach(button=>button.setAttribute('aria-pressed','false'));
 launchTraining.disabled=true;launchTraining.textContent='Je choisis ma difficulté';
 $('training-fold').scrollIntoView({behavior:'smooth',block:'start'});
});

const pepetteBinaryToggle=$('pepette-binary-toggle');
const pepetteBinaryPanel=$('pepette-binary-panel');
pepetteBinaryToggle?.addEventListener('click',()=>{
 const show=pepetteBinaryPanel.hidden;
 pepetteBinaryPanel.hidden=!show;
 pepetteBinaryToggle.setAttribute('aria-expanded',String(show));
 pepetteBinaryToggle.textContent=show?'Masquer le coup de patte':'Voir le coup de patte';
 if(show&&!$('pepette-binary-rows').children.length){
  const frag=document.createDocumentFragment();
  for(let n=0;n<256;n++){
   const row=document.createElement('tr');
   for(const value of [String(n),n.toString(2).padStart(8,'0')]){
    const cell=document.createElement('td');cell.textContent=value;row.append(cell);
   }
   frag.append(row);
  }
  $('pepette-binary-rows').append(frag);
 }
});
