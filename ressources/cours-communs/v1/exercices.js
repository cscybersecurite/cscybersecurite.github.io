'use strict';
const get=id=>document.getElementById(id);
const say=(id,t,ok)=>{const n=get(id);n.textContent=t;n.classList.remove('good','warn');if(ok===true)n.classList.add('good');if(ok===false)n.classList.add('warn');};
const app=document.body.dataset.app;
if(app==='osi'){
 const steps=[['Application','La demande HTTPS concerne un service Web.','application'],['Transport','Le client utilise un protocole de transport et un port de service.','transport'],['Internet','Un paquet IP doit être acheminé vers l’adresse du serveur.','internet'],['Accès réseau','Le paquet est transporté sur la liaison locale (Ethernet ou Wi-Fi).','access'],['Réception','Le serveur reçoit puis traite la demande.','none']];
 let i=0;
 function render(){get('osi-path').replaceChildren();steps.forEach((s,k)=>{const b=document.createElement('div');b.textContent=(k+1)+'. '+s[0];if(k===i-1)b.style.outline='3px solid #d49a32';b.style.opacity=k>i?'.55':'1';get('osi-path').append(b)})}
 get('osi-next').onclick=()=>{if(i>=steps.length){say('osi-response','Parcours terminé. Recommence pour simuler un autre incident.',true);return;}const s=steps[i++];render();const fault=get('osi-fault').value;if(fault===s[2]){say('osi-response','Incident détecté à l’étape '+s[0]+' : '+s[1]+' La communication ne peut pas aboutir dans ce scénario.',false);get('osi-next').disabled=true;}else{say('osi-response',s[0]+' : '+s[1]+(i===steps.length?' Le message est arrivé.':' Clique pour continuer.'),i===steps.length)}};
 get('osi-reset').onclick=()=>{i=0;get('osi-next').disabled=false;render();say('osi-response','Lance le parcours du message.')};get('osi-fault').onchange=()=>get('osi-reset').click();render();
}
if(app==='ethernet'){
 const ports={A:1,B:2,C:3},mac={A:'02:00:00:00:00:0A',B:'02:00:00:00:00:0B',C:'02:00:00:00:00:0C'},table=new Map();
 function render(){const target=get('eth-table');target.replaceChildren();if(!table.size){target.textContent='Aucune adresse connue.';return;}for(const [k,v] of table){const p=document.createElement('p');p.className='mac-row';const a=document.createElement('code');a.textContent=mac[k];const b=document.createElement('strong');b.textContent='Port '+v;p.append(a,b);target.append(p)}}
 get('eth-send').onclick=()=>{const a=get('eth-src').value,b=get('eth-dst').value;if(a===b){say('eth-result','Choisis une destination différente de la source.',false);return;}table.set(a,ports[a]);render();const destinations=b==='ALL'?[1,2,3].filter(x=>x!==ports[a]):table.has(b)?[table.get(b)]:[1,2,3].filter(x=>x!==ports[a]);const behavior=b==='ALL'?'Broadcast : diffusion dans le réseau local.':table.has(b)?'Unicast connu : seul le port destinataire est utilisé.':'Destination inconnue : le switch diffuse sur les autres ports.';say('eth-result','Adresse source '+mac[a]+' apprise sur le port '+ports[a]+'.\n'+behavior+'\nPorts de sortie : '+destinations.join(', ')+'.',true)};
 get('eth-reset').onclick=()=>{table.clear();render();say('eth-result','Table MAC effacée.');};render();
}
if(app==='connectique'){
 const tasks=[
 ['Un écran ancien ne possède qu’une entrée VGA analogique.','VGA','Le VGA transporte un signal vidéo analogique.'],
 ['Un écran professionnel dispose uniquement d’une entrée DisplayPort pleine taille.','DisplayPort','DisplayPort est une interface vidéo numérique.'],
 ['Un périphérique série RS-232 possède un connecteur DE-9.','DE-9 (DB9)','Le DE-9 est souvent appelé DB9 par abus de langage.'],
 ['Une imprimante ancienne utilise un port parallèle DB25.','DB25','Le DB25 a notamment servi aux ports parallèles.'],
 ['Un écran compact exige un câble Mini DisplayPort.','Mini DisplayPort','Mini DisplayPort est un format de connecteur DisplayPort.'],
 ['Un PC doit rejoindre le switch Ethernet cuivre en 8P8C.','RJ45 (8P8C)','Cette prise est très courante pour Ethernet cuivre.'],
 ['Un écran récent possède un port HDMI.','HDMI','HDMI transporte principalement audio et vidéo numériques.'],
 ['Un périphérique moderne se connecte à un port USB-C compatible.','USB-C','USB-C décrit le connecteur ; les fonctions varient selon les appareils.']];
 const options=['USB-A','USB-C','HDMI','DisplayPort','Mini DisplayPort','VGA','DVI','DE-9 (DB9)','DB25','PS/2','RJ45 (8P8C)'];let index=0,correct=0;
 const sel=get('conn-select');options.forEach(x=>{const o=document.createElement('option');o.value=x;o.textContent=x;sel.append(o)});
 const render=()=>{get('conn-request').textContent=index<tasks.length?'Intervention '+(index+1)+' / '+tasks.length+' : '+tasks[index][0]:'Toutes les interventions ont été réalisées.';get('conn-progress').textContent=correct+' raccordement(s) réussis sur '+tasks.length};
 get('conn-check').onclick=()=>{if(index===tasks.length){say('conn-result','Mission terminée. Recommence pour réviser.',true);return;}if(sel.value!==tasks[index][1]){say('conn-result','Ce connecteur ne correspond pas au matériel de la mission. Observe la fonction et la forme du port, puis recommence.',false);return;}const note=tasks[index][2];index++;correct++;render();say('conn-result','Raccordement correct. '+note+(index===tasks.length?' Mission terminée !':''),true);};
 get('conn-reset').onclick=()=>{index=0;correct=0;sel.selectedIndex=0;render();say('conn-result','Sélectionne le connecteur adapté à la première intervention.')};render();
}
if(app==='backup'){
 let day=0;const days=['Lundi','Mardi','Mercredi','Jeudi'],changed=[100,12,9,14],copies=[];
 function refresh(){const root=get('backup-timeline');root.replaceChildren();days.forEach((x,i)=>{const b=document.createElement('div');const a=document.createElement('b');a.textContent=x;const z=document.createElement('small');z.textContent=copies[i]?'Copie '+copies[i].size+' unités':'Non sauvegardé';b.append(a,z);b.style.opacity=i<day?'1':'.55';root.append(b)})}
 get('backup-create').onclick=()=>{if(day===4){say('backup-result','Les quatre sauvegardes sont disponibles. Lance une restauration.',true);return;}const method=get('backup-method').value,size=day===0?100:method==='differential'?changed.slice(1,day+1).reduce((a,b)=>a+b,0):changed[day];copies.push({day,size});day++;refresh();say('backup-result','Sauvegarde du '+days[day-1].toLowerCase()+' créée : '+size+' unités pédagogiques. '+(day===4?'Tu peux maintenant restaurer.':'Poursuis avec le jour suivant.'),true);};
 get('backup-restore').onclick=()=>{if(day<4){say('backup-result','Tu dois d’abord disposer des sauvegardes jusqu’au jeudi.',false);return;}const method=get('backup-method').value;const chain=method==='incremental'?days: [days[0],days[3]];say('backup-result','Restauration théorique jeudi : '+chain.join(' → ')+'.\n'+(method==='incremental'?'Il faut la complète et les incrémentielles successives.':'Il faut la complète et la dernière différentielle.')+' Vérifie toujours le résultat sur de vraies données.',true);};
 get('backup-reset').onclick=()=>{day=0;copies.length=0;refresh();say('backup-result','Commence par créer la sauvegarde complète du lundi.')};get('backup-method').onchange=()=>get('backup-reset').click();refresh();
}
if(app==='nas'){
 const required=new Set(['smb','backup','vpn','external']);
 get('nas-check').onclick=()=>{const chosen=new Set(Array.from(document.querySelectorAll('[data-nas]:checked'),x=>x.dataset.nas)),missing=[...required].filter(x=>!chosen.has(x)),risky=['admin','nfs'].filter(x=>chosen.has(x));if(missing.length||risky.length){say('nas-result','Configuration à revoir. '+(missing.length?'Des besoins ne sont pas couverts : '+missing.map(x=>({smb:'partages SMB',backup:'tâches de sauvegarde',vpn:'accès VPN',external:'copie indépendante'})[x]).join(', ')+'. ':'')+(risky.length?'Services ou risques inutiles : '+risky.map(x=>x==='admin'?'administration directement exposée':'NFS non demandé').join(', ')+'.':''),false)}else say('nas-result','Mission réussie : partages Windows, sauvegardes et accès distant contrôlé. La copie indépendante protège mieux les données que le RAID seul.',true)};
 get('nas-reset').onclick=()=>{document.querySelectorAll('[data-nas]').forEach(x=>x.checked=false);say('nas-result','Configure les services, puis teste les besoins du client.')};
}
