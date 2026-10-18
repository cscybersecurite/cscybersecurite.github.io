// Prototype pedagogique Pépette : premiere ligne binaire, octet par octet.
// Moteur IPCalc importe localement, aucun acces reseau.
import { binaryOctets, parseNetwork, numberToIPv4, ipv4ToNumber, usableHosts } from './ipv4-engine.js';
// V0.3.106 - les réponses réseau des exercices binaires proviennent d'IPcalc.
const binaryAddress = address => binaryOctets(address).join('').split('').map(bit => bit === '1');
const binaryExerciseAnswers = address => {
 const result = parseNetwork(address);
 const first = numberToIPv4(result.network + 1);
 const last = numberToIPv4(ipv4ToNumber(result.broadcast) - 1);
 return {ip:binaryAddress(result.inputAddress),cidr:binaryAddress(result.mask),network:binaryAddress(result.address),first:binaryAddress(first),last:binaryAddress(last),broadcast:binaryAddress(result.broadcast)};
};
const host=document.getElementById('pepette-exercise');
const launch=document.getElementById('launch-training');
if(host&&launch){
 const examples=['10.11.12.13/8','172.16.1.1/16','192.168.1.20/24','10.1.2.3/8','172.16.2.1/16','192.168.0.15/24'];
 const weights=[128,64,32,16,8,4,2,1];
 let example=0,octet=0,bits=Array.from({length:4},()=>Array(8).fill(false)),hint=0,stage='ip',cidrBits=Array(32).fill(false),barPosition=null,barHint=0,barFeedback='',networkBits=Array.from({length:4},()=>Array(8).fill(false)),networkOctet=0,networkHint=0,extraBits={},extraOctet=0,extraHint=0,reviewShown=[false,false],showCourseHelp=false;
 const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
 const button=(label,fn)=>{const b=el('button','pepette-action',label);b.type='button';b.addEventListener('click',fn);return b;};
 function start(){octet=0;hint=0;stage='ip';cidrBits=Array(32).fill(false);barPosition=null;barHint=0;barFeedback='';networkBits=Array.from({length:4},()=>Array(8).fill(false));networkOctet=0;networkHint=0;extraBits={first:Array.from({length:4},()=>Array(8).fill(false)),last:Array.from({length:4},()=>Array(8).fill(false)),broadcast:Array.from({length:4},()=>Array(8).fill(false))};extraOctet=0;extraHint=0;reviewShown=[false,false];showCourseHelp=false;bits=Array.from({length:4},()=>Array(8).fill(false));host.hidden=false;render();host.scrollIntoView({behavior:'smooth',block:'start'});}
 function render(){
  host.replaceChildren();
  completeRestore();
  const [ip,cidr]=examples[example].split('/'),octets=ip.split('.').map(Number),expected=binaryOctets(ip);
  const answers=binaryExerciseAnswers(examples[example]);
  const targets=Object.fromEntries(['first','last','broadcast'].map(kind=>[kind,Array.from({length:4},(_,octet)=>parseInt(answers[kind].slice(octet*8,octet*8+8).map(bit=>bit?'1':'0').join(''),2))]));
  const kinds=['first','last','broadcast'],labels={first:'1re IP',last:'Dernière IP',broadcast:'Broadcast'};
  const header=el('div','pepette-exercise-header');
  const heading=el('div','pepette-exercise-heading');
  heading.append(el('h3',null,'Tableau en binaire - Avec Pépette'),el('p',null,'Adresse : '+ip+'/'+cidr));
  heading.append(el('p','pepette-progress',stage==='ip'?'Adresse IPv4 - octet '+(octet+1)+' sur 4':stage==='cidr'?'Ligne CIDR /'+cidr:stage==='bar'?'Je sépare les bits du réseau et ceux des machines':stage==='network'?'Adresse réseau - octet '+(networkOctet+1)+' sur 4':stage==='first'?'Première IP - octet '+(extraOctet+1)+' sur 4':stage==='last'?'Dernière IP - octet '+(extraOctet+1)+' sur 4':stage==='broadcast'?'Broadcast - octet '+(extraOctet+1)+' sur 4':stage==='review'?'Je contrôle mon travail':'Exercice terminé !'));
  // Consigne stable, visible avant le tableau a chaque octet.
  const instructions={
   ip:['Complète la ligne IPv4.','Transforme l’octet '+(octet+1)+' ('+octets[octet]+') en binaire.'],
   cidr:['Complète la ligne CIDR /'+cidr+'.','Place les '+cidr+' premiers bits à 1, en partant de la gauche.'],
   bar:['Place la barre CIDR.','Clique juste après le dernier 1 de la ligne CIDR.'],
   network:['Complète la ligne Réseau.','Compare IPv4 et CIDR : si les deux bits sont à 1, clique dans la case Réseau en dessous. Sinon, laisse 0.'],
   first:['Complète la ligne Première IP adressable.','Garde les bits du réseau. Dans la partie hôte, laisse des 0, sauf le dernier bit du quatrième octet : mets 1.'],
   last:['Complète la ligne Dernière IP adressable.','Garde les bits du réseau. Dans la partie hôte, mets des 1, sauf le dernier bit du quatrième octet : laisse 0.'],
   broadcast:['Complète la ligne Broadcast.','Garde les bits du réseau. Dans la partie hôte, mets tous les bits à 1.'],
   review:['Vérifie ton tableau.','Utilise les deux astuces de Pépette avant de valider.'],
   finished:['Exercice terminé !','']
  };
  const instruction=el('div','pepette-step-instruction');
  instruction.append(el('strong',null,instructions[stage][0]));
  instructions[stage][1].split(/(?<=\.)\s+/).filter(Boolean).forEach(sentence=>instruction.append(el('p',null,sentence)));
  heading.append(instruction);
  const helpToggle=button(showCourseHelp?'Masquer le coup de patte de Pépette':'Revoir le binaire avec Pépette',()=>{showCourseHelp=!showCourseHelp;render();});
  helpToggle.setAttribute('aria-expanded',String(showCourseHelp));
  header.append(heading,helpToggle);
  host.append(header);
  const courseHelp=el('div','pepette-course-help');
  if(showCourseHelp){
   const original=document.querySelector('#binary-help-panel .binary-help-content');
   if(original){
    const copied=original.cloneNode(true);
    copied.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
    const originalRows=document.querySelector('#binary-reference-rows');
    const copiedRows=copied.querySelector('.binary-reference tbody');
    if(originalRows&&copiedRows)copiedRows.replaceChildren(...Array.from(originalRows.children).map(row=>row.cloneNode(true)));
    const pepetteIntro=el('div','pepette-course-intro');
    const photo=el('img','pepette-course-photo');
    photo.src='assets/pepette.webp';
    photo.alt='Pépette, la mascotte du manuel';
    photo.loading='lazy';
    pepetteIntro.append(photo,copied);
    courseHelp.append(pepetteIntro);
   }
  }
  if(showCourseHelp)host.append(courseHelp);
  // Un seul tableau : chaque octet contient son en-tête et les lignes successives.
  const table=el('div','pepette-octets pepette-unified-grid');
  octets.forEach((value,i)=>{
   const part=el('section','pepette-octet pepette-unified-octet');
   part.append(el('strong',null,'Octet '+(i+1)+' : '+value));
   const powers=el('div','pepette-bits');
   weights.forEach((w,j)=>{const p=el('span','pepette-power');p.append(document.createTextNode('2'),el('sup',null,String(7-j)));powers.append(p);});
   part.append(powers);
   const vals=el('div','pepette-bits');
   weights.forEach(w=>vals.append(el('span','pepette-weight',String(w))));
   part.append(vals);
   const ipLine=el('div','pepette-unified-line'+(stage==='ip'?(i===octet?' is-active':' is-current-row'):' is-complete'));
   if(i===0)ipLine.append(el('span','pepette-line-label'+(stage==='ip'?' is-current-label':''),'IPv4'));
   const ipRow=el('div','pepette-bits');
   weights.forEach((w,j)=>{
    const cell=el('button','pepette-bit'+(bits[i][j]?' is-one':''),bits[i][j]?'1':'');
    cell.type='button';cell.disabled=stage!=='ip'||i!==octet;
    cell.setAttribute('aria-label','IPv4, octet '+(i+1)+', poids '+w+', bit '+(bits[i][j]?'1':'0'));
    cell.setAttribute('aria-pressed',String(bits[i][j]));
    cell.addEventListener('click',()=>{bits[i][j]=!bits[i][j];render();});
    ipRow.append(cell);
   });
   ipLine.append(ipRow);part.append(ipLine);
   if(stage!=='ip'){
    const cidrLine=el('div','pepette-unified-line'+(stage==='cidr'?(i===0?' is-active':' is-current-row'):' is-complete'));
    if(i===0)cidrLine.append(el('span','pepette-line-label'+(stage==='cidr'||stage==='bar'?' is-current-label':''),'CIDR /'+cidr));
    const row=el('div','pepette-bits');
    for(let j=0;j<8;j++){
     const k=i*8+j,cell=el('button','pepette-bit pepette-cidr-bit'+(cidrBits[k]?' is-one':''),cidrBits[k]?'1':'');
     cell.type='button';cell.disabled=stage!=='cidr';cell.dataset.bit=String(k);
     cell.setAttribute('aria-label','Bit CIDR '+(k+1));cell.setAttribute('aria-pressed',String(cidrBits[k]));row.append(cell);
    }
    cidrLine.append(row);
    if(['bar','network','first','last','broadcast','review','finished'].includes(stage)){
     const chosen=barPosition!==null&&Math.floor((barPosition-1)/8)===i;
     if(chosen){
      const bitIndex=(barPosition-1)%8;
      row.children[bitIndex].classList.add('pepette-bar-anchor');
     }
     if(stage==='bar'){
      for(let j=0;j<8;j++){
       const k=i*8+j+1;
       const target=row.children[j];
       target.classList.add('pepette-bar-cell');
       const marker=el('button','pepette-bar-target'+(barPosition===k?' is-selected':''),'');
       marker.type='button';
       marker.setAttribute('aria-label','Placer la barre après le bit '+k);
       marker.title='Après le bit '+k;
       marker.addEventListener('click',()=>{barPosition=k;barFeedback='';render();});
       const wrap=el('span','pepette-bar-slot');
       target.replaceWith(wrap);wrap.append(target,marker);
      }
     }
    }
    part.append(cidrLine);
   }
   if(['network','first','last','broadcast','review','finished'].includes(stage)){
    const networkLine=el('div','pepette-unified-line'+(stage==='network'?(i===networkOctet?' is-active':' is-current-row'):' is-complete'));
    if(i===0)networkLine.append(el('span','pepette-line-label'+(stage==='network'?' is-current-label':''),'Réseau'));
    const networkRow=el('div','pepette-bits');
    weights.forEach((w,j)=>{
     const cell=el('button','pepette-bit'+(networkBits[i][j]?' is-one':''),networkBits[i][j]?'1':'');
     cell.type='button';cell.disabled=stage!=='network'||i!==networkOctet;
     cell.setAttribute('aria-label','Adresse réseau, octet '+(i+1)+', poids '+w);
     cell.setAttribute('aria-pressed',String(networkBits[i][j]));
     cell.addEventListener('click',()=>{networkBits[i][j]=!networkBits[i][j];render();});
     if(stage==='review'&&reviewShown[1]&&i===3&&j>=6)cell.classList.add('pepette-review-two');
     networkRow.append(cell);
    });
    networkLine.append(networkRow);part.append(networkLine);
    if(barPosition!==null&&Math.floor((barPosition-1)/8)===i){
     const bitIndex=(barPosition-1)%8;
     networkRow.children[bitIndex].classList.add('pepette-bar-anchor');
    }
    if(stage==='network'&&i===networkOctet){
     const expectedValue=i<Number(cidr)/8?octets[i]:0;
     const total=weights.reduce((sum,w,j)=>sum+(networkBits[i][j]?w:0),0);
     if(total===expectedValue){
      const next=button(i===3?'Ligne suivante : Première IP':'Octet suivant',()=>{if(i===3){stage='first';extraOctet=0;}else networkOctet++;networkHint=0;render();});
      next.classList.add('pepette-octet-next');part.append(next);
     }
    }
   }
   if(['first','last','broadcast','review','finished'].includes(stage)){
    for(const kind of kinds){
     if(!['review','finished'].includes(stage)&&kinds.indexOf(kind)>kinds.indexOf(stage))break;
     const line=el('div','pepette-unified-line'+(stage===kind?(i===extraOctet?' is-active':' is-current-row'):' is-complete'));
     if(i===0)line.append(el('span','pepette-line-label'+(stage===kind?' is-current-label':''),labels[kind]));
     const row=el('div','pepette-bits');
     weights.forEach((w,j)=>{
      const cell=el('button','pepette-bit'+(extraBits[kind][i][j]?' is-one':''),extraBits[kind][i][j]?'1':'');
      cell.type='button';cell.disabled=stage!==kind||i!==extraOctet;
      cell.setAttribute('aria-label',labels[kind]+', octet '+(i+1)+', poids '+w);
      cell.setAttribute('aria-pressed',String(extraBits[kind][i][j]));
      cell.dataset.extraBit=String(j);
      if(stage===kind&&i===extraOctet)cell.addEventListener('click',()=>{if(cell.dataset.dragHandled==='true')return;extraBits[kind][i][j]=!extraBits[kind][i][j];render();});
      if(stage==='review'&&reviewShown[0]&&(kind==='last'||kind==='broadcast')&&i*8+j>=Number(cidr))cell.classList.add('pepette-review-one');
      if(stage==='review'&&reviewShown[1]&&i===3&&j>=6)cell.classList.add('pepette-review-two');
      row.append(cell);
     });
     if(stage===kind&&i===extraOctet){
      let drag=null;
      const paint=(start,end,value)=>{
       for(let j=Math.min(start,end);j<=Math.max(start,end);j++)extraBits[kind][i][j]=value;
       row.querySelectorAll('[data-extra-bit]').forEach(cell=>{
        const j=Number(cell.dataset.extraBit),on=extraBits[kind][i][j];
        cell.classList.toggle('is-one',on);cell.textContent=on?'1':'';
        cell.setAttribute('aria-pressed',String(on));
       });
      };
      row.addEventListener('pointerdown',e=>{
       const cell=e.target.closest('[data-extra-bit]');
       if(!cell||e.button!==0)return;
       e.preventDefault();
       const start=Number(cell.dataset.extraBit);
       drag={id:e.pointerId,start,last:start,value:!extraBits[kind][i][start],original:extraBits[kind][i].slice()};
       row.setPointerCapture(e.pointerId);
       paint(start,start,drag.value);
      });
      row.addEventListener('pointermove',e=>{
       if(!drag||e.pointerId!==drag.id)return;
       const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-extra-bit]');
       if(!cell||!row.contains(cell))return;
       const end=Number(cell.dataset.extraBit);
       if(end===drag.last)return;
       extraBits[kind][i]=drag.original.slice();
       drag.last=end;paint(drag.start,end,drag.value);
      });
      row.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.id){drag=null;render();}});
      row.addEventListener('pointercancel',e=>{if(drag&&e.pointerId===drag.id){extraBits[kind][i]=drag.original;drag=null;render();}});
     }
     line.append(row);part.append(line);
     if(barPosition!==null&&Math.floor((barPosition-1)/8)===i)row.children[(barPosition-1)%8].classList.add('pepette-bar-anchor');
     if(stage===kind&&i===extraOctet){
      const value=weights.reduce((n,w,j)=>n+(extraBits[kind][i][j]?w:0),0);
      if(value===targets[kind][i]){
       const next=button(i===3?(kind==='first'?'Ligne suivante : Dernière IP':kind==='last'?'Ligne suivante : Broadcast':'Contrôler mon tableau'):'Octet suivant',()=>{
        if(i<3)extraOctet++;
        else{stage=kind==='first'?'last':kind==='last'?'broadcast':'review';extraOctet=0;extraHint=0;}
        render();
       });
       next.classList.add('pepette-octet-next');part.append(next);
      }
     }
    }
   }
   if(stage==='ip'&&i===octet){
    const sum=weights.reduce((total,w,j)=>total+(bits[i][j]?w:0),0);
    if(sum===value){
     const next=button(i===3?'Ligne suivante : CIDR':'Octet suivant',()=>{
      if(i===3)stage='cidr';else octet++;
      hint=0;render();
     });
     next.classList.add('pepette-octet-next');
     part.append(next);
    }
   }
   table.append(part);
  });
  host.append(table);
  if(stage!=='ip'){
   const cidrTable=table;
   if(stage==='bar'){
    if(barPosition!==null)host.append(el('p','pepette-total','Barre placée après le bit '+barPosition+'.'));
    host.append(button('Vérifier la barre',()=>{
     if(barPosition===Number(cidr)){stage='network';networkOctet=0;networkHint=0;barFeedback='';}
     else barFeedback=barPosition===null?'Place d’abord la barre entre deux bits.':'Ce n’est pas encore la bonne séparation. Essaie de nouveau.';
     render();
    }));
    host.append(button('Un indice',()=>{barHint=Math.min(3,barHint+1);render();}));
    if(barFeedback)host.append(el('p','pepette-hint',barFeedback));
    if(barHint){
     const full=Number(cidr)%8===0,oct=Math.floor(Number(cidr)/8),remaining=Number(cidr)%8;
     const msg=barHint===1?'Les cases bleues montrent les bits du réseau.'
      :barHint===2?'Place la barre après la dernière case bleue.'
      :full?'Pour /'+cidr+', clique à droite du dernier 1 de l’octet '+oct+'.'
       :'Pour /'+cidr+', clique après le '+remaining+'e bit de l’octet '+(oct+1)+'.';
     host.append(el('p','pepette-hint',msg));
    }
   }else if(stage==='network'){
    const target=networkOctet<Number(cidr)/8?octets[networkOctet]:0;
    const sum=weights.reduce((n,w,j)=>n+(networkBits[networkOctet][j]?w:0),0);
    if(sum===target)host.append(el('p','pepette-success','Bravo ! Cet octet est correct.'));
    else{
     host.append(button('Un indice',()=>{networkHint=Math.min(3,networkHint+1);render();}));
     if(networkHint){
      const values=weights.filter((w,j)=>bits[networkOctet][j]&&cidrBits[networkOctet*8+j]);
      const msg=networkHint===1?'Regarde les deux cases au-dessus : IPv4 et CIDR.'
       :networkHint===2?'Si les deux cases contiennent 1, clique dans la case Réseau juste en dessous. Sinon, ne clique pas.'
       :'Pour cet octet, clique sous : '+(values.length?values.join(' et '):'aucun nombre, laisse les cases vides')+'.';
      host.append(el('p','pepette-hint',msg));
     }
    }
   }else if(kinds.includes(stage)){
    const target=targets[stage][extraOctet],sum=weights.reduce((n,w,j)=>n+(extraBits[stage][extraOctet][j]?w:0),0);
    const instructions={first:'Recopie les bits du réseau. Dans la partie hôte, laisse tous les bits à 0, sauf le dernier bit du quatrième octet : mets-le à 1.',last:'Recopie les bits du réseau. Dans la partie hôte, mets des 1, sauf le dernier bit : laisse 0.',broadcast:'Recopie les bits du réseau. Dans la partie hôte, mets tous les bits à 1.'};
    if(sum===target)host.append(el('p','pepette-success','Bravo ! Cet octet est correct.'));
    else{
     host.append(button('Un indice',()=>{extraHint=Math.min(3,extraHint+1);render();}));
     if(extraHint){
      const values=weights.filter(w=>(target&w)!==0);
      host.append(el('p','pepette-hint',extraHint===1?'La barre rouge sépare le réseau et les hôtes.':extraHint===2?instructions[stage]:'Pour cet octet, clique sous : '+(values.length?values.join(' et '):'aucun nombre, laisse les cases vides')+'.'));
     }
    }
   }else if(stage==='review'){
    host.append(el('p','pepette-success','Les six lignes sont remplies. Vérifie ton tableau avec les deux astuces de Pépette.'));
    const tips=[
     ['Astuce n° 1 : Je n’oublie pas les 1 !','Observe les bits hôtes, après le CIDR, sur les lignes Dernière IP et Broadcast.','Astuce 1'],
     ['Astuce n° 2 : Je vérifie les deux derniers bits','Compare les deux dernières cases du quatrième octet : Réseau 00, Première IP 01, Dernière IP 10, Broadcast 11.','Astuce 2']
    ];
    const tipsGrid=el('div','pepette-review-grid');
    tips.forEach(([title,detail,name],i)=>{
     const card=el('div','pepette-review-tip'),photo=el('img','pepette-review-photo');
     photo.src='assets/pepette.webp';photo.alt='Pépette';photo.loading='lazy';
     card.append(photo,el('strong',null,title),el('p',null,detail));
     const toggle=button((reviewShown[i]?'Masquer ':'Afficher ')+name,()=>{reviewShown[i]=!reviewShown[i];render();});
     toggle.setAttribute('aria-pressed',String(reviewShown[i]));
     card.append(toggle);tipsGrid.append(card);
    });
    host.append(tipsGrid);
    host.append(el('p','pepette-hint','Les couleurs montrent les cases à vérifier directement dans ton tableau.'));
    host.append(button('Valider mon exercice',()=>{stage='finished';render();}));
   }else if(stage==='finished'){
    host.append(el('p','pepette-success','Bravo ! Tu as terminé et vérifié ton tableau en binaire.'));
    if(completeMode)host.append(button('Continuer vers le tableau décimal',completeToDecimal));
    else host.append(button('Nouvelle adresse',()=>{example=(example+1)%examples.length;start();}));
    if(!completeMode)host.append(button('Nouveau test',()=>{host.hidden=true;document.querySelector('.training-setup')?.scrollIntoView({behavior:'smooth'});}));
   }else if(stage==='cidr'){
    let drag=null;
    const paint=(start,end,value)=>{
     for(let k=Math.min(start,end);k<=Math.max(start,end);k++)cidrBits[k]=value;
     cidrTable.querySelectorAll('.pepette-cidr-bit').forEach(cell=>{const k=Number(cell.dataset.bit);cell.classList.toggle('is-one',cidrBits[k]);cell.textContent=cidrBits[k]?'1':'';cell.setAttribute('aria-pressed',String(cidrBits[k]));});
    };
    cidrTable.addEventListener('pointerdown',e=>{
     const cell=e.target.closest('.pepette-cidr-bit');if(!cell||e.button!==0)return;
     e.preventDefault();const start=Number(cell.dataset.bit);
     drag={id:e.pointerId,start,last:start,value:!cidrBits[start],original:cidrBits.slice()};
     cidrTable.setPointerCapture(e.pointerId);paint(start,start,drag.value);
    });
    cidrTable.addEventListener('pointermove',e=>{
     if(!drag||e.pointerId!==drag.id)return;
     const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('.pepette-cidr-bit');
     if(!cell||!cidrTable.contains(cell))return;
     const end=Number(cell.dataset.bit);if(end===drag.last)return;
     cidrBits=drag.original.slice();drag.last=end;paint(drag.start,end,drag.value);
    });
    cidrTable.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.id){drag=null;render();}});
    cidrTable.addEventListener('pointercancel',e=>{if(drag&&e.pointerId===drag.id){cidrBits=drag.original;drag=null;render();}});
    const count=cidrBits.filter(Boolean).length,correct=cidrBits.every((v,k)=>v===(k<Number(cidr)));
    host.append(el('p','pepette-total','Bits réseau à 1 : '+count+' / '+cidr));
    if(correct){host.append(el('p','pepette-success','Bravo ! Tu as placé les '+cidr+' bits réseau.'));host.append(button('Placer la barre CIDR',()=>{stage='bar';barPosition=null;barHint=0;barFeedback='';render();}));}
    else{
      host.append(button('Un indice',()=>{hint=Math.min(hint+1,3);render();}));
     if(hint)host.append(el('p','pepette-hint',hint===1?'Le /'+cidr+' indique le nombre de bits réseau à 1.':hint===2?'Commence à gauche, au premier bit, et avance vers la droite.':'Les '+cidr+' premiers bits sont à 1, les autres restent à 0.'));
    }
   }else{
    host.append(el('p','pepette-success','Bravo ! Tu as terminé ton tableau.'));
    host.append(button('Nouvelle adresse',()=>{example=(example+1)%examples.length;start();}));
    host.append(button('Revenir aux choix',()=>{host.hidden=true;document.querySelector('.training-setup')?.scrollIntoView({behavior:'smooth'});}));
   }
   return;
  }
  const sum=weights.reduce((total,w,j)=>total+(bits[octet][j]?w:0),0);
  const ok=sum===octets[octet];
  host.append(el('p','pepette-total','Total de mes bits à 1 : '+sum+' / '+octets[octet]));
  if(ok){
   host.append(el('p','pepette-success','Bravo ! Tu as trouvé '+octets[octet]+'.'));

  }else{
   host.append(button('Un indice',()=>{hint=Math.min(hint+1,3);render();}));
   if(hint){
    const target=octets[octet];
    const remaining=target-sum;
    const available=weights.filter((w,j)=>!bits[octet][j]&&w<=remaining);
    const next=available[0];
    const message=hint===1
     ?(remaining>0?'Tu as deja obtenu '+sum+'. Il te manque '+remaining+' pour atteindre '+target+'.':'Tu as obtenu '+sum+', soit '+(-remaining)+' de trop. Retire un ou plusieurs bits a 1.')
     :hint===2
     ?(remaining>0&&next?'Parmi les colonnes encore vides, cherche une valeur qui ne depasse pas '+remaining+'.':remaining>0?'Il faut revoir les bits selectionnes : aucune colonne vide ne convient pour le moment.':'Regarde les colonnes selectionnees et retire celles qui ne conviennent pas.')
     :'Pour '+target+', la decomposition attendue est : '+(weights.filter((w,j)=>expected[octet][j]==='1').join(' + ')||'aucun bit a 1')+'. Compare-la avec tes cases.';
    host.append(el('p','pepette-hint',message));
   }
  }
 }

 // Niveau 3 : travail autonome, tableau entier et correction finale non modifiable.
 const challengePrefixes=[2,3,4,5,6,11,12,13,14,19,20,21,22,27,28,29,30];
 const intermediatePrefixes=[7,9,10,15,17,18,23,25,26];
 let intermediate=false,intermediateStep=0,intermediateHint=false,intermediateErrors=null;
 let challengeAddress='',challengeBits={},challengeBar=null,challengeLocked=false,challengeResult=null;
 const challengeRows=['ip','cidr','network','first','last','broadcast'];
 const challengeNames={ip:'IPv4',cidr:'CIDR',network:'Réseau',first:'1re IP',last:'Dernière IP',broadcast:'Broadcast'};
 const challengeEmpty=()=>Array(32).fill(false);
 function newChallenge(mode=intermediate){
  intermediate=mode;intermediateStep=0;intermediateHint=false;intermediateErrors=null;
  const count=n=>n.toString(2).split('1').length-1;
  const pools=[[],[],[],[]];
  for(let v=1;v<=255;v++){
   if(count(v)<(intermediate?2:4)||count(v)>(intermediate?5:7))continue;
   if(v<=223)pools[0].push(v);
   for(let j=1;j<4;j++)pools[j].push(v);
  }
  let octs;
  do{octs=pools.map(p=>p[Math.floor(Math.random()*p.length)]);}while(new Set(octs).size!==4||octs[0]>=224);
  const prefixes=intermediate?intermediatePrefixes:challengePrefixes;
  const prefix=prefixes[Math.floor(Math.random()*prefixes.length)];
  challengeAddress=octs.join('.')+'/'+prefix;
  challengeBits=Object.fromEntries(challengeRows.map(k=>[k,challengeEmpty()]));
  challengeBar=null;challengeLocked=false;challengeResult=null;
  stage='challenge';host.hidden=false;renderChallenge();
  host.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function challengeExpected(){
  return binaryExerciseAnswers(challengeAddress);
 }
 function renderChallenge(){
  host.replaceChildren();
  completeRestore();
  const [ip,prefixText]=challengeAddress.split('/'),prefix=Number(prefixText),octs=ip.split('.').map(Number),expected=challengeExpected();
  const header=el('div','pepette-exercise-header'),heading=el('div','pepette-exercise-heading');
  heading.append(el('h3',null,'Tableau en binaire - '+(intermediate?'Je me débrouille':'Je relève le défi')),el('p',null,'Adresse : '+challengeAddress));
  const instruction=el('div','pepette-step-instruction');
  if(intermediate){
   const kind=challengeRows[intermediateStep];
   instruction.append(el('strong',null,intermediateStep===6?'Tableau terminé !':'Complète la ligne '+challengeNames[kind]+'.'));
   instruction.append(el('p',null,intermediateStep===6?'Toutes les lignes sont validées.':'Remplis les 32 bits, puis vérifie ta ligne.'));
   if(intermediateStep<6)instruction.append(el('p',null,'Une case vide représente un bit à 0.'));
  }else{
   instruction.append(el('strong',null,challengeLocked?'Correction de ton tableau.':'Complète les cinq lignes du tableau.'));
   instruction.append(el('p',null,challengeLocked?'Tes réponses sont figées. Les erreurs sont indiquées en rouge.':'Tu peux travailler dans l’ordre que tu veux. Une case vide représente un bit à 0.'));
   instruction.append(el('p',null,challengeLocked?'':'Place aussi la barre CIDR. Vérifie tout ton travail à la fin.'));
  }
  heading.append(instruction);header.append(heading);host.append(header);
  const table=el('div','pepette-octets pepette-unified-grid pepette-challenge-grid');
  for(let i=0;i<4;i++){
   const part=el('section','pepette-octet pepette-unified-octet');
   part.append(el('strong',null,'Octet '+(i+1)+' : '+octs[i]));
   const powers=el('div','pepette-bits');weights.forEach((w,j)=>{const p=el('span','pepette-power');p.append(document.createTextNode('2'),el('sup',null,String(7-j)));powers.append(p);});part.append(powers);
   const vals=el('div','pepette-bits');weights.forEach(w=>vals.append(el('span','pepette-weight',String(w))));part.append(vals);
   for(const kind of challengeRows){
    const active=!intermediate||challengeRows[intermediateStep]===kind;
    const line=el('div','pepette-unified-line '+(active?'is-current-row':'is-complete'));
    if(intermediate&&active)line.classList.add('is-active');
    if(i===0)line.append(el('span','pepette-line-label',challengeNames[kind]+(kind==='cidr'?' /'+prefix:'')));
    const row=el('div','pepette-bits');
    for(let j=0;j<8;j++){
     const index=i*8+j,on=challengeBits[kind][index],correct=expected[kind][index];
     const cell=el('button','pepette-bit'+(on?' is-one':''),on?'1':'');
     cell.type='button';cell.disabled=challengeLocked||(intermediate&&challengeRows[intermediateStep]!==kind);
     cell.setAttribute('aria-label',challengeNames[kind]+', octet '+(i+1)+', bit '+(j+1)+', '+(on?'1':'0'));
     cell.setAttribute('aria-pressed',String(on));
     if(!intermediate&&challengeLocked&&on!==correct){cell.classList.add('challenge-error');cell.textContent=on?'1':'0';cell.setAttribute('aria-label',challengeNames[kind]+', bit '+(index+1)+', réponse '+(on?'1':'0')+', attendu '+(correct?'1':'0'));}
     if(!intermediate&&challengeLocked&&on===correct)cell.classList.add('challenge-correct');
     cell.dataset.challengeRow=kind;cell.dataset.challengeIndex=String(index);
     if(!challengeLocked&&(!intermediate||challengeRows[intermediateStep]===kind))cell.addEventListener('click',e=>{if(e.detail!==0)return;challengeBits[kind][index]=!challengeBits[kind][index];renderChallenge();});
     if(challengeBar!==null&&challengeBar===index+1&&kind!=='ip')cell.classList.add('pepette-bar-anchor');
     row.append(cell);
    }
    line.append(row);part.append(line);
   }
   table.append(part);
  }
  host.append(table);
  // Fin du niveau intermediaire : navigation avant le retour anticipe.
  if(intermediate&&intermediateStep>=6){
   host.append(el('p','pepette-success','Bravo ! Tu as terminé les six lignes.'));
   if(completeMode&&completeLevel===2)host.append(button('Continuer vers le tableau décimal',completeMediumToDecimal));
   else{
    host.append(button('Nouvelle adresse',()=>newChallenge(true)));
    host.append(button('Nouveau test',()=>{host.hidden=true;document.querySelector('.training-setup')?.scrollIntoView({behavior:'smooth'});}));
   }
  }
  if(intermediate&&intermediateStep>=6)return;
  if(!challengeLocked&&(!intermediate||intermediateStep<6)){
   // Peinture au passage : horizontal entre octets et vertical entre lignes.
   let drag=null;
   const cellAt=(x,y)=>document.elementFromPoint(x,y)?.closest('[data-challenge-row][data-challenge-index]');
   const mark=(cell)=>{
    if(!drag||!cell||!table.contains(cell))return;
    const kind=cell.dataset.challengeRow,index=Number(cell.dataset.challengeIndex);
    if(!challengeRows.includes(kind)||!Number.isInteger(index)||index<0||index>31||(intermediate&&kind!==challengeRows[intermediateStep]))return;
    const key=kind+':'+index;
    if(drag.visited.has(key))return;
    drag.visited.add(key);
    challengeBits[kind][index]=drag.value;
    cell.classList.toggle('is-one',drag.value);
    cell.textContent=drag.value?'1':'';
    cell.setAttribute('aria-pressed',String(drag.value));
   };
   const trace=(x1,y1,x2,y2)=>{
    const steps=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)/5));
    for(let n=0;n<=steps;n++){
     const t=n/steps;
     mark(cellAt(x1+(x2-x1)*t,y1+(y2-y1)*t));
    }
   };
   table.addEventListener('pointerdown',e=>{
    const cell=e.target.closest('[data-challenge-row][data-challenge-index]');
    if(!cell||e.button!==0||(intermediate&&cell.dataset.challengeRow!==challengeRows[intermediateStep]))return;
    e.preventDefault();
    const kind=cell.dataset.challengeRow,index=Number(cell.dataset.challengeIndex);
    drag={id:e.pointerId,value:!challengeBits[kind][index],visited:new Set(),x:e.clientX,y:e.clientY};
    table.setPointerCapture(e.pointerId);
    mark(cell);
   });
   table.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    trace(drag.x,drag.y,e.clientX,e.clientY);
    drag.x=e.clientX;drag.y=e.clientY;
   });
   table.addEventListener('pointerup',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    trace(drag.x,drag.y,e.clientX,e.clientY);
    drag=null;renderChallenge();
   });
   table.addEventListener('pointercancel',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    drag=null;renderChallenge();
   });
   if(intermediate){
    const kind=challengeRows[intermediateStep];
    if(intermediateErrors!==null)host.append(el('p',intermediateErrors===0?'pepette-success':'pepette-hint',intermediateErrors===0?'Ligne correcte !':intermediateErrors+' bit(s) incorrect(s). Corrige puis vérifie à nouveau.'));
    if(intermediateStep<6){
     const clues={ip:'Utilise les valeurs 128, 64, 32, 16, 8, 4, 2 et 1.',cidr:'Compte les bits réseau depuis la gauche.',network:'Compare les bits IPv4 et CIDR.',first:'Pense au dernier bit de la partie hôte.',last:'Le dernier bit de la partie hôte reste à 0.',broadcast:'Tous les bits hôtes sont à 1.'};
     host.append(button(intermediateHint?'Masquer l’indice':'Un indice',()=>{intermediateHint=!intermediateHint;renderChallenge();}));
     if(intermediateHint)host.append(el('p','pepette-hint',clues[kind]));
     if(kind==='cidr'){
      const bar=el('div','pepette-challenge-bar');
      bar.append(el('strong',null,'Barre CIDR : '+(challengeBar===null?'non placée':'après le bit '+challengeBar)));
      bar.append(el('p',null,'Place la barre CIDR : clique sur le numéro du bit situé juste à gauche de la barre.'));
      const choices=el('div','pepette-challenge-positions');
      for(let n=1;n<=32;n++){
       const b=button(String(n),()=>{challengeBar=n;renderChallenge();});
       if(challengeBar===n)b.classList.add('is-selected');
       choices.append(b);
      }
      bar.append(choices);host.append(bar);
     }
     host.append(button('Vérifier ma ligne',()=>{
      intermediateErrors=challengeBits[kind].filter((v,i)=>v!==expected[kind][i]).length+(kind==='cidr'&&challengeBar!==prefix?1:0);
      if(intermediateErrors===0){intermediateStep++;intermediateHint=false;intermediateErrors=null;}
      renderChallenge();
     }));
    }else{
     host.append(el('p','pepette-success','Bravo ! Tu as terminé les six lignes.'));
     if(completeMode&&completeLevel===2)host.append(button('Continuer vers le tableau décimal',completeMediumToDecimal));
     else host.append(button('Nouvelle adresse',()=>newChallenge(true)));
     if(!(completeMode&&completeLevel===2))host.append(button('Nouveau test',()=>{host.hidden=true;document.querySelector('.training-setup')?.scrollIntoView({behavior:'smooth'});}));
    }
    return;
   }
   const bar=el('div','pepette-challenge-bar');
   bar.append(el('strong',null,'Barre CIDR : '+(challengeBar===null?'non placée':'après le bit '+challengeBar)));
   bar.append(el('p',null,'Place la barre CIDR : clique sur le numéro du bit situé juste à gauche de la barre.'));
   const choices=el('div','pepette-challenge-positions');
   for(let n=1;n<=32;n++){
    const b=button(String(n),()=>{challengeBar=n;renderChallenge();});
    if(challengeBar===n)b.classList.add('is-selected');
    b.setAttribute('aria-pressed',String(challengeBar===n));
    choices.append(b);
   }
   bar.append(choices);host.append(bar);
   const verify=button('Vérifier mon tableau',()=>{
    const missing=challengeBar===null;
    if(missing){host.querySelector('.pepette-challenge-bar')?.scrollIntoView({behavior:'smooth',block:'center'});return;}
    const errors=challengeRows.reduce((n,k)=>n+challengeBits[k].filter((v,i)=>v!==expected[k][i]).length,0);
    challengeResult={errors,barCorrect:challengeBar===prefix};
    challengeLocked=true;renderChallenge();
   });
   host.append(verify);
  }else{
   const message=challengeResult.errors===0&&challengeResult.barCorrect?'Bravo ! Ton tableau est entièrement correct.':'Résultat : '+challengeResult.errors+' bit(s) incorrect(s). '+(challengeResult.barCorrect?'Barre CIDR correcte.':'Barre CIDR incorrecte : position attendue '+prefix+'.');
   host.append(el('p',challengeResult.errors===0&&challengeResult.barCorrect?'pepette-success':'pepette-hint',message));

   if(completeMode&&completeLevel===3){
    if(challengeResult.errors===0&&challengeResult.barCorrect)host.append(button('Continuer vers le tableau décimal',completeChallengeToDecimal));
    else host.append(button('Corriger mon tableau',()=>{challengeLocked=false;challengeResult=null;renderChallenge();}));
   }else{
    host.append(button('Nouvelle adresse',newChallenge));
    host.append(button('Nouveau test',()=>{host.hidden=true;document.querySelector('.training-setup')?.scrollIntoView({behavior:'smooth'});}));
   }
  }
 }


 // Repère orange devant le libellé de la ligne, jamais devant les bits.
 const decimalMarkerStyle=document.createElement('style');
 decimalMarkerStyle.textContent='.pepette-decimal-row-marker{position:absolute;left:-8px;top:50%;transform:translateY(-50%);width:4px;height:20px;background:#f97316;border-radius:2px;pointer-events:none} .pepette-unified-line:has(>.pepette-decimal-row-marker){position:relative}.pepette-decimal-table .pepette-decimal-row-marker{left:auto;right:calc(100% - 3px)}.pepette-unified-line .pepette-line-label .pepette-decimal-row-marker{left:-8px}';
 document.head.append(decimalMarkerStyle);
 // Exercices décimaux : tableau binaire fourni, trois niveaux de guidage.
 let decimalLevel=1,decimalAddress='',decimalValues={},decimalStep=0,decimalError='',decimalLocked=false,decimalErrors={};
 const decimalRows=['cidr','network','first','last','broadcast'];
 const decimalLabels={ip:'IPv4',cidr:'Masque de sous-réseau',network:'Réseau',first:'1re IP',last:'Dernière IP',broadcast:'Broadcast'};
 const decimalPrefixesEasy=[8,16,24,25];
 function decimalStart(level){
  decimalLevel=level;
  let octs,prefix;
  if(level===1){
   octs=[10+Math.floor(Math.random()*30),Math.floor(Math.random()*32),Math.floor(Math.random()*32),1+Math.floor(Math.random()*30)];
   prefix=decimalPrefixesEasy[Math.floor(Math.random()*decimalPrefixesEasy.length)];
  }else{
   const count=n=>n.toString(2).split('1').length-1;
   const min=level===2?2:4,max=level===2?5:7;
   const pool=Array.from({length:255},(_,i)=>i+1).filter(n=>count(n)>=min&&count(n)<=max);
   const first=pool.filter(n=>n<=223);
   do{octs=[first[Math.floor(Math.random()*first.length)],...Array.from({length:3},()=>pool[Math.floor(Math.random()*pool.length)])];}while(new Set(octs).size!==4);
   const prefixes=level===2?intermediatePrefixes:challengePrefixes;
   prefix=prefixes[Math.floor(Math.random()*prefixes.length)];
  }
  decimalAddress=octs.join('.')+'/'+prefix;
  decimalValues=Object.fromEntries(decimalRows.map(k=>[k,Array(4).fill('')]));
  decimalStep=0;decimalError='';decimalLocked=false;decimalErrors={};
  stage='decimal';host.hidden=false;renderDecimal();
  host.scrollIntoView({behavior:'smooth',block:'start'});
 }
 // V0.3.107 - les valeurs décimales proviennent du moteur IPv4 commun.
 function decimalExpected(){
  const result=parseNetwork(decimalAddress);
  const oct=address=>address.split('.').map(Number);
  const first=numberToIPv4(result.network+1);
  const last=numberToIPv4(ipv4ToNumber(result.broadcast)-1);
  return {ip:oct(result.inputAddress),cidr:oct(result.mask),network:oct(result.address),first:oct(first),last:oct(last),broadcast:oct(result.broadcast)};
 }
 function renderDecimal(){
  host.replaceChildren();
  completeRestore();
  const expected=decimalExpected(),prefix=Number(decimalAddress.split('/')[1]);
  const total=decimalRows.length*4,step=Math.min(decimalStep,total-1),activeRow=decimalRows[Math.floor(step/4)],activeOctet=step%4;
  const complete=decimalLevel===1?decimalStep>=total:decimalLevel===2?decimalStep>=decimalRows.length:decimalLocked;
  const header=el('div','pepette-exercise-header'),heading=el('div','pepette-exercise-heading');
  heading.append(el('h3',null,'Tableau en décimal - '+(decimalLevel===1?'Avec Pépette':decimalLevel===2?'Je me débrouille':'Je relève le défi')),el('p',null,'Adresse : '+decimalAddress));
  const instruction=el('div','pepette-step-instruction');
  instruction.append(el('strong',null,complete?'Tableau terminé !':decimalLevel===1?'Complète '+decimalLabels[activeRow]+' : octet '+(activeOctet+1)+'.':decimalLevel===2?'Complète la ligne '+decimalLabels[decimalRows[decimalStep]]+'.':'Complète les six lignes du tableau.'));
  instruction.append(el('p',null,'Observe le tableau binaire fourni, puis écris les valeurs décimales (0 à 255).'));
  heading.append(instruction);header.append(heading);host.append(header);
  const reference=el('div','pepette-octets pepette-unified-grid pepette-challenge-grid pepette-decimal-reference');
  for(let o=0;o<4;o++){
   const part=el('section','pepette-octet pepette-unified-octet');
   part.append(el('strong',null,'Octet '+(o+1)));
   const powers=el('div','pepette-bits');
   weights.forEach((w,j)=>{const p=el('span','pepette-power');p.append(document.createTextNode('2'),el('sup',null,String(7-j)));powers.append(p);});
   part.append(powers);
   const vals=el('div','pepette-bits');weights.forEach(w=>vals.append(el('span','pepette-weight',String(w))));part.append(vals);
   for(const kind of ['ip',...decimalRows]){
    const highlight=decimalLevel===1&&!complete&&kind===activeRow&&o===activeOctet;
    const marker=!complete&&o===0&&((decimalLevel===1&&kind===activeRow)||(decimalLevel===2&&kind===decimalRows[decimalStep]));
    const line=el('div','pepette-unified-line'+(highlight?' is-active':''));
    
    if(highlight){line.style.background='rgba(250,174,46,.26)';line.style.outline='2px solid #f59e0b';line.style.borderRadius='5px';}
    if(o===0){const label=el('span','pepette-line-label',(kind==='cidr'?'CIDR':decimalLabels[kind])+(kind==='cidr'?' /'+prefix:''));if(marker){label.style.position='absolute';const labelMarker=el('span','pepette-decimal-row-marker');labelMarker.setAttribute('aria-hidden','true');label.append(labelMarker);}line.append(label);}
    const bits=el('div','pepette-bits');
    for(let j=0;j<8;j++){
     const one=Boolean((expected[kind][o]>>(7-j))&1);
     const cell=el('span','pepette-bit',one?'1':'');
     cell.style.cssText='display:flex;align-items:center;justify-content:center;background:'+(one&&decimalLevel===1?'#d7dee9':'#fff')+';color:#243247;font-weight:600;box-sizing:border-box;min-width:0;';
     bits.append(cell);
    }
    line.append(bits);
    if(decimalLevel===1&&kind!=='ip'&&o===Math.floor(prefix/8)&&prefix%8!==0){
     // Frontière CIDR dans l'octet, après le dernier bit réseau.
     const pos=prefix%8;
     const cells=bits.children;
     if(cells[pos-1])cells[pos-1].style.borderRight='3px solid #e67e22';
    }
    if(decimalLevel===1&&kind!=='ip'&&prefix%8===0&&o===prefix/8-1){
     bits.lastElementChild.style.borderRight='3px solid #e67e22';
    }
    part.append(line);
   }
   reference.append(part);
  }
  // Toujours afficher le tableau binaire de référence, y compris dans l'exercice complet.
  // L'ancien tableau interactif n'est plus conservé lors du changement d'étape.
  reference.style.marginBottom='24px';
  host.append(reference);
  const title=el('h4',null,'Tableau en décimal');title.style.margin='0 0 4px';host.append(title);
  const table=el('div','pepette-decimal-table');
  table.style.cssText='display:grid;grid-template-columns:minmax(90px,1.5fr) repeat(4,minmax(52px,1fr))'+(decimalLevel===2?' minmax(125px,auto)':'')+';column-gap:6px;row-gap:6px;align-items:center;max-width:'+(decimalLevel===2?'980px':'780px');
  table.append(el('strong',null,''));
  for(let o=0;o<4;o++){const label=el('strong',null,'Octet '+(o+1));label.style.textAlign='center';table.append(label);}
  if(decimalLevel===2)table.append(el('span'));
  let lineButtonSlot=null;
  for(let ri=0;ri<decimalRows.length;ri++){
   const kind=decimalRows[ri];const label=el('strong',null,decimalLabels[kind]);label.style.cssText='text-align:right;padding-right:6px;position:relative';if(!complete&&((decimalLevel===1&&kind===activeRow)||(decimalLevel===2&&kind===decimalRows[decimalStep]))){const labelMarker=el('span','pepette-decimal-row-marker');labelMarker.setAttribute('aria-hidden','true');label.append(labelMarker);}table.append(label);
   for(let o=0;o<4;o++){
    const index=ri*4+o;
    const editable=!complete&&(decimalLevel===3||(decimalLevel===2&&ri===decimalStep)||(decimalLevel===1&&index===decimalStep));
    const input=el('input');
    input.type='text';input.inputMode='numeric';input.maxLength=3;input.autocomplete='off';
    input.value=decimalValues[kind][o];input.disabled=!editable;
    input.style.cssText='width:100%;min-width:0;box-sizing:border-box;padding:9px 4px;text-align:center;border:2px solid '+(editable?'#f59e0b':'#cbd5e1')+';border-radius:6px;font-size:16px';
    if(decimalLocked&&decimalValues[kind][o]!==String(expected[kind][o])){input.style.borderColor='#dc2626';input.style.background='#fee2e2';}
    input.setAttribute('aria-label',decimalLabels[kind]+', octet '+(o+1));
    input.addEventListener('input',()=>{
     const raw=input.value;
     if(raw!==''&&(!/^[0-9]+$/.test(raw)||Number(raw)>255)){
      input.value=decimalValues[kind][o];return;
     }
     decimalValues[kind][o]=raw;decimalError='';
    });
    table.append(input);
   }
   if(decimalLevel===2){const slot=el('div');slot.style.cssText='min-width:125px;display:flex;align-items:center;justify-content:flex-start';if(!complete&&ri===decimalStep)lineButtonSlot=slot;table.append(slot);}
  }
  const actions=el('div','pepette-decimal-actions');
  actions.style.cssText=table.style.cssText+';margin-top:8px';
  host.append(table);
  if(decimalError&&!complete)host.append(el('p','pepette-hint',decimalError));
  if(!complete){
   const verifyButton=button(decimalLevel===1?'Vérifier mon octet':decimalLevel===2?'Vérifier ma ligne':'Vérifier mon tableau',()=>{
    const check=decimalLevel===1?[decimalStep]:decimalLevel===2?Array.from({length:4},(_,i)=>decimalStep*4+i):Array.from({length:decimalRows.length*4},(_,i)=>i);
    const missing=check.filter(n=>decimalValues[decimalRows[Math.floor(n/4)]][n%4]==='').length;
    if(missing){decimalError='Complète '+(missing===1?'la case vide.':'les '+missing+' cases vides.');renderDecimal();return;}
    const errors=check.filter(n=>Number(decimalValues[decimalRows[Math.floor(n/4)]][n%4])!==expected[decimalRows[Math.floor(n/4)]][n%4]).length;
    if(decimalLevel===3){decimalLocked=true;decimalError=errors?'Résultat : '+errors+' octet(s) incorrect(s).':'Bravo ! Ton tableau est correct.';}
    else if(errors){decimalError=errors+' '+(decimalLevel===1?'octet incorrect.':'octet(s) incorrect(s).')+' Corrige puis vérifie à nouveau.';}
    else{decimalStep++;decimalError='';}
    renderDecimal();
    if(decimalLevel===1&&!decimalLocked){
     const next=host.querySelector('.pepette-decimal-table input:not(:disabled)');
     if(next){next.focus({preventScroll:true});if(errors||missing)next.select();}
    }
   });
   if(decimalLevel===1){
    for(let o=0;o<5;o++){const slot=el('div');if(o===activeOctet+1){slot.append(verifyButton);verifyButton.style.cssText='white-space:nowrap;position:relative;left:50%;transform:translateX(-50%)';}actions.append(slot);}
    host.append(actions);
   }else if(decimalLevel===2&&lineButtonSlot){verifyButton.style.whiteSpace='nowrap';lineButtonSlot.append(verifyButton);}
   else host.append(verifyButton);
  }else{
   host.append(el('p',decimalLocked&&decimalError?'pepette-hint':'pepette-success',decimalLocked?decimalError:'Bravo ! Tu as terminé le tableau.'));
   if(completeMode){
    if(decimalLevel===3&&decimalError.startsWith('Résultat :'))host.append(button('Corriger mon tableau',()=>{decimalLocked=false;decimalError='';renderDecimal();}));
    else host.append(button('Continuer vers le calcul du nombre d’hôtes',completeToHosts));
   }
   else{
    host.append(button('Nouvelle adresse',()=>decimalStart(decimalLevel)));
    host.append(button('Nouveau test',()=>{host.hidden=true;document.querySelector('.training-setup')?.scrollIntoView({behavior:'smooth'});}));
   }
  }
 }


 // Calcul des hôtes, niveau 1 : une égalité qui se construit de gauche à droite.
 let hostsPrefix=26,hostsStep=0,hostsError='';
 const hostsPrefixes=[24,25,26,27,28,29];
 function hostsStart(){
  hostsPrefix=hostsPrefixes[Math.floor(Math.random()*hostsPrefixes.length)];
  hostsStep=0;hostsError='';
  stage='hosts';host.hidden=false;renderHosts();
  host.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function renderHosts(){
  host.replaceChildren();
  completeRestore();
  const exponent=32-hostsPrefix,power=2**exponent,result=usableHosts(hostsPrefix);
  const header=el('div','pepette-exercise-header'),heading=el('div','pepette-exercise-heading');
  heading.append(el('h3',null,'Calcul du nombre d’hôtes - Avec Pépette'),el('p',null,'Adresse IPv4 : '+(completeMode?decimalAddress:'192.168.10.42/'+hostsPrefix)));
  if(!completeMode||hostsStep!==4)heading.append(el('p','pepette-step-instruction',hostsStep===4?'Bravo ! Ton calcul est terminé.':'Complète la case dans l’égalité, puis vérifie ta réponse.'));
  header.append(heading);host.append(header);
  const layout=el('div','pepette-hosts-layout');layout.style.cssText='display:flex;align-items:flex-start;flex-wrap:wrap;gap:24px;margin-top:12px';host.append(layout);
  const work=el('div','pepette-hosts-work');work.style.cssText='flex:1 1 380px;min-width:0';layout.append(work);
  const formula=el('div','pepette-hosts-formula');
  formula.style.cssText='display:flex;align-items:baseline;flex-wrap:wrap;gap:8px;font-size:1.45rem;font-weight:600;line-height:2.5;margin:20px 0 12px';
  formula.append(el('span',null,'Nb hôtes ='));
  let active=null;
  const exponentBlock=(parts)=>{
   const group=el('span');group.style.cssText='display:inline-flex;align-items:flex-start;white-space:nowrap';
   group.append(el('span',null,'2'));
   const sup=document.createElement('sup');sup.style.cssText='font-size:.65em;line-height:1.2;position:relative;top:-.2em';
   for(const part of parts)sup.append(typeof part==='string'?document.createTextNode(part):part);
   group.append(sup);return group;
  };
  const field=(expected)=>{
   const input=el('input');input.type='text';input.inputMode='numeric';input.autocomplete='off';
   input.setAttribute('aria-label','Valeur à compléter dans la formule');
   input.style.cssText='width:58px;max-width:58px;box-sizing:border-box;text-align:center;font:inherit;padding:3px;border:2px solid #f59e0b;border-radius:5px';
   input.dataset.expected=String(expected);active=input;return input;
  };
  // Les termes déjà validés restent visibles, sans répéter les questions.
  formula.append(exponentBlock(['(32 - ',hostsStep===0?field(hostsPrefix):String(hostsPrefix),')']));
  formula.append(el('span',null,'- 2 ='));
  if(hostsStep>=1){
   formula.append(exponentBlock([hostsStep===1?field(exponent):String(exponent)]));
   formula.append(el('span',null,'- 2 ='));
  }
  if(hostsStep>=2){
   formula.append(hostsStep===2?field(power):el('span',null,String(power)));
   formula.append(el('span',null,'- 2 ='));
  }
  if(hostsStep>=3)formula.append(hostsStep===3?field(result):el('span',null,String(result)));
  work.append(formula);
  if(hostsError)work.append(el('p','pepette-hint',hostsError));
  if(hostsStep<4){
   const verify=button('Vérifier',()=>{
    if(active.value.trim()===active.dataset.expected){
     hostsStep++;hostsError='';renderHosts();
     host.querySelector('.pepette-hosts-formula input')?.focus({preventScroll:true});
    }else{hostsError='Ce n’est pas la bonne valeur. Essaie encore.';active.focus();active.select();
     const existing=host.querySelector('.pepette-hosts-error');
     if(existing)existing.textContent=hostsError;
     else{const msg=el('p','pepette-hint pepette-hosts-error',hostsError);formula.after(msg);}
    }
   });
   active.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();verify.click();}});
   work.append(verify);
  }else{
   work.append(el('p','pepette-success','Bravo ! Tu as trouvé '+result+' hôtes utilisables.'));
   work.append(el('p',null,'Tu peux donc attribuer une adresse IP à '+result+' équipements sur ce réseau, par exemple des ordinateurs, des serveurs, des imprimantes ou du matériel réseau.'));
   if(completeMode){
    work.append(el('p','pepette-step-instruction','Bravo ! Tu as terminé ton exercice complet d’adressage IPv4.'));
    work.append(button('Nouvel exercice complet',completeStart));
    work.append(button('Nouveau test',completeEnd));
   }else{
    work.append(button('Nouvelle adresse',hostsStart));
    work.append(button('Nouveau test',()=>{host.hidden=true;document.querySelector('.training-setup')?.scrollIntoView({behavior:'smooth'});}));
   }
  }
  const aid=el('aside','pepette-hosts-aid');aid.style.cssText='flex:0 0 340px;width:340px;max-width:100%;min-width:0;margin-top:10px;box-sizing:border-box';
  const helpButton=button('Voir le coup de patte',()=>{panel.hidden=!panel.hidden;helpButton.textContent=panel.hidden?'Voir le coup de patte':'Refermer le coup de patte';helpButton.setAttribute('aria-expanded',String(!panel.hidden));});
  helpButton.setAttribute('aria-expanded','false');aid.append(helpButton);
  const panel=el('div');panel.hidden=true;
  const original=document.getElementById('pepette-powers-panel');
  if(original)for(const child of original.children)panel.append(child.cloneNode(true));
  aid.append(panel);layout.append(aid);
  const table=panel.querySelector('table');if(table){table.style.cssText='width:auto;max-width:100%;font-size:.85rem;border-collapse:collapse';for(const cell of table.querySelectorAll('th,td')){cell.style.cssText='padding:4px 7px;white-space:nowrap;width:auto;line-height:1.3'};}
 }


 let hostsExpertPrefix=16,hostsExpertChecked=false,hostsExpertValues=null;
 function hostsExpertStart(){
  // Tirage pondéré : 10 % dizaines de milliers, 10 % centaines de milliers,
  // 55 % millions, 25 % centaines de millions / milliard.
  const roll=Math.random();
  const prefixes=roll<0.10?[16,17,18]:roll<0.20?[13,14,15]:roll<0.75?[4,5,6,7,8,9,10,11,12]:[2,3];
  // Ne jamais reproposer immédiatement le même CIDR, sans changer les poids des groupes.
  const candidates=prefixes.filter(prefix=>prefix!==hostsExpertPrefix);
  hostsExpertPrefix=candidates[Math.floor(Math.random()*candidates.length)];
  hostsExpertChecked=false;hostsExpertValues=null;host.hidden=false;renderHostsExpert();
  host.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function renderHostsExpert(){
  host.replaceChildren();
  completeRestore();
  const heading=el('div','pepette-exercise-heading');
  heading.append(el('h3',null,'Calcul du nombre d’hôtes - Je relève le défi'),
   el('p',null,'Adresse IPv4 : '+(completeMode&&completeLevel===3?decimalAddress:'192.168.10.42/'+hostsExpertPrefix)),
   el('p',null,'Construis la formule du nombre d’hôtes utilisables. Une seule tentative par adresse.'));
  host.append(heading);
  const form=el('div','pepette-hosts-expert-form');
  form.style.cssText='display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:22px 0;font-size:1.5rem';
  const field=(label,width)=>{
   const input=el('input');input.type='text';input.inputMode='numeric';input.autocomplete='off';
   input.setAttribute('aria-label',label);input.placeholder='?';
   input.style.cssText='width:'+width+'px;box-sizing:border-box;text-align:center;font:inherit;padding:5px;border:2px solid #9ca3af;border-radius:5px';
   return input;
  };
  const base=field('Base',64),exponent=field('Exposant',60),last=field('Nombre après opération',64);
  const power=el('span');power.style.cssText='display:inline-flex;align-items:flex-start';
  const sup=document.createElement('sup');sup.style.cssText='font-size:.7em;position:relative;top:-.2em';sup.append(exponent);
  power.append(base,sup);
  last.setAttribute('aria-label','Dernier terme, signe compris (par exemple -2)');
  last.inputMode='text';
  last.style.width='76px';
  form.append(el('span',null,'Nb hôtes ='),power,last);
  const expectedExponent=32-hostsExpertPrefix;
  const needsResult=expectedExponent<=8;
  let numericResult=null;
  if(needsResult){
   form.append(el('span',null,'='));
   numericResult=field('Résultat numérique',95);
   numericResult.inputMode='numeric';
   form.append(numericResult);
  }
  host.append(form);
  if(hostsExpertChecked&&hostsExpertValues){
   base.value=hostsExpertValues.base;exponent.value=hostsExpertValues.exponent;
   last.value=hostsExpertValues.last;
   if(numericResult)numericResult.value=hostsExpertValues.result;
   for(const control of [base,exponent,last,numericResult].filter(Boolean))control.disabled=true;
   const correctBase=base.value.trim()==='2',correctExp=exponent.value.trim()===String(expectedExponent);
   const correctLast=last.value.trim().replace(/\s+/g,'').replace('−','-')==='-2';
   const expectedCount=usableHosts(hostsExpertPrefix);
   const correctResult=!needsResult||numericResult.value.trim().replace(/[\s\u00a0\u202f]/g,'')===String(expectedCount);
   const correct=correctBase&&correctExp&&correctLast&&correctResult;
   const msg=el('div','pepette-hosts-expert-feedback');
   if(correct){
    msg.append(el('p','pepette-success','Bravo ! Tu as trouvé la bonne formule.'));
    const count=expectedCount;
    msg.append(el('p',null,'Tu peux donc attribuer une adresse IP à '+count.toLocaleString('fr-FR')+' équipements sur ce réseau, par exemple des ordinateurs, des serveurs, des imprimantes ou du matériel réseau.'));
   }else{
    msg.append(el('p','pepette-hint','Cette formule n’est pas correcte. Voici ce qu’il faut revoir :'));
    if(!correctBase||!correctExp)msg.append(el('p',null,'Vérifie la puissance de 2 : la base est 2 et l’exposant correspond aux bits disponibles pour les hôtes (32 moins le CIDR).'));
    if(!correctLast)msg.append(el('p',null,'Pense aux deux adresses qu’on ne peut pas attribuer : l’adresse du réseau et l’adresse de broadcast. Il faut les retirer du total.'));
    if(!correctResult)msg.append(el('p',null,'Vérifie ton calcul numérique : calcule la puissance de 2, puis retire les deux adresses réservées.'));
    const solution=el('p');solution.append('Formule attendue : 2');
    const solSup=document.createElement('sup');solSup.textContent=String(expectedExponent);solution.append(solSup,' − 2');
    if(needsResult)solution.append(' = '+expectedCount.toLocaleString('fr-FR'));
    msg.append(solution);
   }
   host.append(msg);
  }else{
   host.append(button('Vérifier',()=>{
    hostsExpertValues={base:base.value,exponent:exponent.value,last:last.value,result:numericResult?numericResult.value:''};
    hostsExpertChecked=true;renderHostsExpert();
   }));
  }
  if(hostsExpertChecked){
   if(completeMode&&completeLevel===3){
    const v=hostsExpertValues;
    const correct=v.base.trim()==='2'&&v.exponent.trim()===String(32-hostsExpertPrefix)&&v.last.trim().replace(/\s+/g,'').replace('−','-')==='-2'&&((32-hostsExpertPrefix)>8||v.result.trim().replace(/[\s\u00a0\u202f]/g,'')===String(usableHosts(hostsExpertPrefix)));
    if(correct){
     host.append(el('p','pepette-step-instruction','Bravo ! Tu as terminé ton exercice complet d’adressage IPv4.'));
     host.append(button('Nouvel exercice complet',completeChallengeStart));
     host.append(button('Nouveau test',completeEnd));
    }else host.append(button('Corriger mon calcul',()=>{hostsExpertChecked=false;renderHostsExpert();}));
   }else{
    host.append(button('Nouvelle adresse',hostsExpertStart));
    host.append(button('Nouveau test',()=>{host.hidden=true;document.querySelector('.training-setup')?.scrollIntoView({behavior:'smooth'});}));
   }
  }
 }


 // Niveau 2 : formule partiellement guidée, vérifications et corrections libres.
 let hostsMediumPrefix=20,hostsMediumFeedback='';
 const hostsMediumPrefixes=Array.from({length:18},(_,i)=>i+9);
 function hostsMediumStart(){
  const candidates=hostsMediumPrefixes.filter(prefix=>prefix!==hostsMediumPrefix);
  hostsMediumPrefix=candidates[Math.floor(Math.random()*candidates.length)];
  hostsMediumFeedback='';host.hidden=false;renderHostsMedium();
  host.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function renderHostsMedium(){
  host.replaceChildren();
  completeRestore();
  const exp=32-hostsMediumPrefix,count=usableHosts(hostsMediumPrefix);
  const heading=el('div','pepette-exercise-heading');
  heading.append(el('h3',null,'Calcul du nombre d’hôtes - Je me débrouille'),
   el('p',null,'Adresse IPv4 : '+(completeMode&&completeLevel===2?decimalAddress:'192.168.10.42/'+hostsMediumPrefix)),
   el('p',null,'Complète la formule du nombre d’hôtes utilisables. Tu peux corriger tes réponses.'));
  host.append(heading);
  const form=el('div','pepette-hosts-medium-form');
  form.style.cssText='display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:22px 0;font-size:1.5rem';
  const field=(label,width)=>{
   const input=el('input');input.type='text';input.inputMode='numeric';input.autocomplete='off';
   input.setAttribute('aria-label',label);input.placeholder='?';
   input.style.cssText='width:'+width+'px;box-sizing:border-box;text-align:center;font:inherit;padding:5px;border:2px solid #9ca3af;border-radius:5px';
   return input;
  };
  const base=field('Base',64),exponent=field('Exposant',60),last=field('Nombre à soustraire',64);
  const power=el('span');power.style.cssText='display:inline-flex;align-items:flex-start';
  const sup=document.createElement('sup');sup.style.cssText='font-size:.7em;position:relative;top:-.2em';sup.append(exponent);
  power.append(base,sup);
  form.append(el('span',null,'Nb hôtes ='),power,el('span',null,'−'),last);
  const needsResult=exp<=8;
  const result=needsResult?field('Résultat numérique',95):null;
  if(result)form.append(el('span',null,'='),result);
  host.append(form);
  const feedback=el('div','pepette-hosts-medium-feedback');host.append(feedback);
  const verify=button('Vérifier',()=>{
   const correctBase=base.value.trim()==='2',correctExp=exponent.value.trim()===String(exp);
   const correctLast=last.value.trim()==='2';
   const correctResult=!result||result.value.trim().replace(/[\s\u00a0\u202f]/g,'')===String(count);
   feedback.replaceChildren();
   if(correctBase&&correctExp&&correctLast&&correctResult){
    feedback.append(el('p','pepette-success','Bravo ! Tu as trouvé la bonne formule.'));
    feedback.append(el('p',null,'Tu peux donc attribuer une adresse IP à '+count.toLocaleString('fr-FR')+' équipements sur ce réseau, par exemple des ordinateurs, des serveurs, des imprimantes ou du matériel réseau.'));
    for(const control of [base,exponent,last,result].filter(Boolean))control.disabled=true;
    verify.disabled=true;
    if(completeMode&&completeLevel===2){
     verify.remove();
     feedback.append(el('p','pepette-step-instruction','Bravo ! Tu as terminé ton exercice complet d’adressage IPv4.'));
     feedback.append(button('Nouvel exercice complet',completeMediumStart));
     feedback.append(button('Nouveau test',completeEnd));
    }
   }else{
    feedback.append(el('p','pepette-hint','Ce n’est pas encore tout à fait correct. Tu peux modifier tes réponses et vérifier à nouveau.'));
    if(!correctBase||!correctExp)feedback.append(el('p',null,'Vérifie la puissance de 2 : combien de bits restent disponibles pour les hôtes ?'));
    if(!correctLast)feedback.append(el('p',null,'Deux adresses sont réservées : celle du réseau et celle de broadcast. Combien faut-il retirer ?'));
    if(!correctResult)feedback.append(el('p',null,'Vérifie le résultat de ta puissance de 2, puis retire les adresses réservées.'));
   }
  });
  host.append(verify);
  if(!(completeMode&&completeLevel===2)){
   host.append(button('Nouvelle adresse',hostsMediumStart));
   host.append(button('Nouveau test',()=>{host.hidden=true;document.querySelector('.training-setup')?.scrollIntoView({behavior:'smooth'});}));
  }
 }


 // Exercice complet : orchestration des trois interfaces originales, sans duplication.
 let completeMode=false,completeLevel=1,completeSnapshots=[];
 function completeRestore(){
  if(!completeMode||!completeSnapshots.length)return;
  const fragment=document.createDocumentFragment();
  for(const snapshot of completeSnapshots)fragment.append(snapshot.cloneNode(true));
  host.prepend(fragment);
 }
 function completeSaveAndContinue(next){
  // Chaque etape remplace la precedente : le tableau binaire de reference
  // est deja affiche par l'exercice decimal, sans dupliquer l'ancien tableau.
  completeSnapshots=[];
  next();
 }
 function completeStart(){
  completeMode=true;completeLevel=1;completeSnapshots=[];
  // CIDR /24 : les quatre étapes du calcul guidé restent accessibles.
  example=[2,5][Math.floor(Math.random()*2)];
  start();
 }
 function completeToDecimal(){
  const address=examples[example];
  completeSaveAndContinue(()=>{
   decimalStart(1);
   decimalAddress=address;
   decimalValues=Object.fromEntries(decimalRows.map(k=>[k,Array(4).fill('')]));
   decimalStep=0;decimalError='';renderDecimal();
  });
 }
 function completeMediumStart(){
  completeMode=true;completeLevel=2;completeSnapshots=[];
  newChallenge(true);
 }
 function completeMediumToDecimal(){
  const address=challengeAddress;
  decimalStart(2);
  decimalAddress=address;
  decimalValues=Object.fromEntries(decimalRows.map(k=>[k,Array(4).fill('')]));
  decimalStep=0;decimalLocked=false;decimalError='';decimalErrors={};
  renderDecimal();
 }
 function completeChallengeStart(){
  completeMode=true;completeLevel=3;completeSnapshots=[];
  newChallenge(false);
 }
 function completeChallengeToDecimal(){
  const address=challengeAddress;
  decimalStart(3);
  decimalAddress=address;
  decimalValues=Object.fromEntries(decimalRows.map(k=>[k,Array(4).fill('')]));
  decimalStep=0;decimalLocked=false;decimalError='';decimalErrors={};
  renderDecimal();
 }
 function completeToHosts(){
  // Reutiliser le rendu decimal valide : son tableau binaire de reference
  // et son tableau decimal restent visibles sans reconstruire ces composants.
  const finished=el('section','pepette-complete-finished');
  finished.style.marginBottom='28px';
  for(const child of Array.from(host.children)){
   if(child.matches('button') || (child.matches('.pepette-success') && child.textContent.trim()==='Bravo ! Tu as terminé le tableau.'))continue;
   const copy=child.cloneNode(true);
   copy.querySelectorAll('button').forEach(button=>button.remove());
   copy.querySelectorAll('input').forEach(input=>{
    input.disabled=true;
    input.style.background='#e9edf3';
    input.style.color='#68778b';
    input.style.borderColor='#cbd5e1';
   });
   finished.append(copy);
  }
  completeSnapshots=[finished];
  if(completeLevel===2){
   hostsMediumPrefix=Number(decimalAddress.split('/')[1]);
   renderHostsMedium();
  }else if(completeLevel===3){
   hostsExpertPrefix=Number(decimalAddress.split('/')[1]);
   hostsExpertChecked=false;hostsExpertValues=null;
   renderHostsExpert();
  }else{
   hostsPrefix=Number(decimalAddress.split('/')[1]);
   hostsStep=0;hostsError='';renderHosts();
  }
 }
 function completeEnd(){
  completeMode=false;completeSnapshots=[];
  host.hidden=true;document.querySelector('.training-setup')?.scrollIntoView({behavior:'smooth'});
 }

 launch.addEventListener('click',()=>{const topic=document.querySelector('[data-training-topic][aria-pressed="true"]')?.dataset.trainingTopic;const level=document.querySelector('[data-training-difficulty][aria-pressed="true"]')?.dataset.trainingDifficulty;if(topic==='binaire'&&level==='1')start();else if(topic==='binaire'&&level==='2')newChallenge(true);else if(topic==='binaire'&&level==='3')newChallenge(false);else if(topic==='decimal'&&['1','2','3'].includes(level))decimalStart(Number(level));else if(topic==='hotes'&&level==='1')hostsStart();else if(topic==='hotes'&&level==='2')hostsMediumStart();else if(topic==='hotes'&&level==='3')hostsExpertStart();else if(topic==='complet'&&level==='1')completeStart();else if(topic==='complet'&&level==='2')completeMediumStart();else if(topic==='complet'&&level==='3')completeChallengeStart();});
}
