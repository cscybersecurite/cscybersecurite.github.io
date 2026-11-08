import {createEngine} from 'https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/r2d3-core.js';

const ROOT='192.168.10.';
const MAC='02-52-32-44-33-20';
const byId=id=>document.getElementById(id);
function makeScenario(kind){
 const exclusion=kind==='exclusion';
 const pcCount=exclusion?6:2;
 const objects=[{
  id:'srv',kind:'dhcp-server',name:'Serveur DHCP',
  ports:[{id:'eth0',type:'rj45'}],
  config:{ipv4:{interfaceId:'eth0',mode:'static',address:ROOT+'2',prefix:24},
   dhcpEnabled:true,dhcpPool:{start:ROOT+'100',end:ROOT+'150',prefix:24,
    gateway:ROOT+'1',dns:[ROOT+'2'],leaseSeconds:86400,exclusions:[],reservations:[]}},runtime:{}
 },{
  id:'switch',kind:'ethernet-switch',name:'Switch',
  ports:Array.from({length:10},(_,i)=>({id:String(i),type:'rj45'})),
  config:{},runtime:{}
 }];
 const links=[{id:'link-server',kind:'ethernet-cable',
   endpoints:[{objectId:'srv',portId:'eth0'},{objectId:'switch',portId:'0'}],connected:true}];
 if(exclusion)objects.push({
  id:'robot',kind:'industrial-equipment',name:'Robot industriel',
  ports:[{id:'eth0',type:'rj45'}],
  config:{ipv4:{interfaceId:'eth0',mode:'static',address:ROOT+'105',prefix:24}},runtime:{}
 });
 if(exclusion)links.push({id:'link-robot',kind:'ethernet-cable',
  endpoints:[{objectId:'robot',portId:'eth0'},{objectId:'switch',portId:'9'}],connected:true});
 for(let i=1;i<=pcCount;i++){
  const id='pc-'+i;
  objects.push({id,kind:'pc-windows',name:'PC '+i,
   ports:[{id:'eth0',type:'rj45'}],
   config:{ipv4:{interfaceId:'eth0',mode:'dhcp',address:null,prefix:null,lease:null},
    networkOptions:{gateway:null,dns:[]},macAddress:'02-52-32-44-33-'+String(i).padStart(2,'0')},runtime:{}});
  links.push({id:'link-'+id,kind:'ethernet-cable',
   endpoints:[{objectId:id,portId:'eth0'},{objectId:'switch',portId:String(i)}],connected:true});
 }
 if(!exclusion){
  objects.push({id:'tpe',kind:'payment-terminal',name:'Terminal de paiement',
   ports:[{id:'wifi0',type:'rj45'}],
   config:{ipv4:{interfaceId:'wifi0',mode:'dhcp',address:null,prefix:null,lease:null},
    networkOptions:{gateway:null,dns:[]},macAddress:MAC},runtime:{}});
  // Lien logique simplifié : R2D3 ne simule pas de protocole radio Wi-Fi.
  links.push({id:'link-tpe',kind:'ethernet-cable',
   endpoints:[{objectId:'tpe',portId:'wifi0'},{objectId:'switch',portId:'8'}],connected:false});
 }
 return {format:'r2d3-scenario',schemaVersion:1,scenarioId:'cours-dhcp-'+kind,
  scenarioVersion:'1.0.0',capabilities:{network:true},objects,links};
}
function html(kind){
 const exclusion=kind==='exclusion';
 const title=exclusion?'Exercice 1 : le robot industriel':'Exercice 2 : le terminal de paiement';
 const situation=exclusion
  ? 'Dans une usine automobile, un robot fonctionne avec une adresse IP fixe. Modifier son adressage obligerait à interrompre la production. Ton rôle : éviter qu’un PC reçoive cette adresse par DHCP.'
  : 'Un commerçant rapporte son terminal de paiement au bureau pour la télécollecte. Le pare-feu autorise les échanges nécessaires depuis une adresse IP précise. Ton rôle : permettre au TPE de retrouver cette adresse à chaque retour.';
 return '<section class="dhcp-admin-case" aria-label="'+title+'">'+
  '<h4>'+title+'</h4><p>'+situation+'</p>'+
  '<div class="dhcp-admin-facts">'+
  (exclusion?'<p><strong>Robot :</strong> IP fixe <code>192.168.10.105</code>. Sa configuration ne doit pas être modifiée.</p>':
   '<p><strong>Adresse attendue par le pare-feu :</strong> <code>192.168.10.120</code>.</p>'+
   '<details><summary>Fiche technique du TPE</summary><p>Mode IPv4 : DHCP</p><p>Adresse MAC de l’interface utilisée au bureau : <code>'+MAC+'</code>.</p></details>')+
  '<p><strong>Serveur DHCP :</strong> réseau <code>192.168.10.0/24</code>, plage <code>192.168.10.100</code> à <code>192.168.10.150</code>.</p></div>'+
  '<div class="dhcp-admin-work"><h5>1. Configurer le serveur DHCP</h5>'+
  '<form class="dhcp-admin-form">'+
  '<label>Adresses à exclure <input name="exclusions" placeholder="Adresse(s) IPv4 séparée(s) par une virgule" spellcheck="false"></label>'+
  '<label>Adresse MAC à réserver <input name="mac" placeholder="Ex. : 02-00-00-00-00-01" spellcheck="false"></label>'+
  '<label>Adresse IPv4 réservée <input name="reserved" placeholder="Ex. : 192.168.10.120" spellcheck="false"></label>'+
  '<button type="submit">Enregistrer la configuration</button></form>'+
  '<p class="dhcp-admin-save" role="status" aria-live="polite"></p>'+
  '<div class="dhcp-admin-pool"></div>'+
  '<h5>2. Effectuer les demandes DHCP</h5><div class="dhcp-admin-actions"></div>'+
  '<h5>3. Consulter les attributions</h5><div class="dhcp-admin-leases"></div>'+(exclusion?'<p class="dhcp-admin-conflicts" aria-live="polite"></p>':'')+
  '<div class="dhcp-admin-last" role="status" aria-live="polite"></div>'+
  '<div class="dhcp-admin-finish"><button type="button" class="dhcp-admin-check">Vérifier mon travail</button>'+
  '<button type="button" class="dhcp-admin-reset">Recommencer cet exercice</button></div>'+
  '<p class="dhcp-admin-feedback" role="status" aria-live="polite"></p>'+
  '</div></section>';
}
function mount(kind,id){
 const root=byId(id),exclusion=kind==='exclusion';
 if(!root)return;
 root.innerHTML=html(kind);
 const get=q=>root.querySelector(q);
 let engine,sequence,rounds,requests,moved,departure,observed;
 const snapshot=()=>engine.getSnapshot();
 const pool=()=>snapshot().objectsById.srv.config.dhcpPool;
 const issue=(type,targetId,params={})=>{
  const result=engine.dispatch({commandVersion:1,id:'dhcp-ch3-'+kind+'-'+(++sequence),
   type,targetId,params,expectedRevision:snapshot().revision});
  if(result.status!=='applied')throw Error(result.message||result.code||'Commande refusée');
  return result;
 };
 function information(message){get('.dhcp-admin-last').textContent=message;}
 function refresh(){
  const p=pool();
  const settings=engine.query({type:'dhcp.pools',serverId:'srv'});
  get('.dhcp-admin-pool').textContent=settings.status==='ok'
   ?'Configuration enregistrée : '+p.start+' à '+p.end+
     ' | Exclusions : '+(p.exclusions.join(', ')||'aucune')+
     ' | Réservations : '+(p.reservations.length?p.reservations.map(r=>r.mac+' → '+r.address).join(', '):'aucune')
   :'Configuration indisponible.';
  const result=engine.query({type:'dhcp.leases',serverId:'srv'});
  const rows=result.status==='ok'?result.leases:[];
  const cards=rows.map(x=>'<tr><td>'+((x.clientId==='tpe')?'TPE':x.clientId.replace('pc-','PC '))+'</td><td>'+x.address+'</td></tr>').join('');
  get('.dhcp-admin-leases').innerHTML='<table><thead><tr><th>Client</th><th>Adresse attribuée</th></tr></thead><tbody>'+
   (cards||'<tr><td colspan="2">Aucun bail actif.</td></tr>')+'</tbody></table>';
  if(exclusion){
   const detected=engine.query({type:'network.ipv4Conflicts'});
   const conflicts=detected.status==='ok'?detected.conflicts:[];
   const warning=get('.dhcp-admin-conflicts');
   warning.textContent=conflicts.length?'Conflit IPv4 détecté : '+conflicts.map(x=>x.address).join(', ')+'.':'Aucun conflit IPv4 détecté.';
   warning.className='dhcp-admin-conflicts '+(conflicts.length?'is-conflict':'');
  }
  if(!exclusion)get('.dhcp-admin-tpe-state').textContent=snapshot().linksById['link-tpe'].connected?'TPE au bureau':'TPE en déplacement';
 }
 function command(label,fn){
  const button=document.createElement('button');button.type='button';button.textContent=label;
  button.addEventListener('click',()=>{
   try{fn();refresh();get('.dhcp-admin-feedback').textContent='';}
   catch(e){information('Opération impossible : '+e.message);}
  });
  return button;
 }
 function renderActions(){
  const actions=get('.dhcp-admin-actions');actions.replaceChildren();
  if(exclusion){
   const note=document.createElement('p');
   note.textContent='Les six PC n’ont pas encore de bail. Lance leurs demandes DHCP, puis consulte le tableau.';
   actions.append(note);
   for(let i=1;i<=6;i++)actions.append(command('Demander une IP pour PC '+i,()=>{
    issue('dhcp.request','pc-'+i);requests.add(i);
    const ip=snapshot().objectsById['pc-'+i].config.ipv4.address;
    information('PC '+i+' : adresse attribuée '+(ip||'aucune')+'.');
   }));
  }else{
   const note=document.createElement('p');note.className='dhcp-admin-tpe-state';actions.append(note);
   actions.append(command('Demander une IP pour PC 1',()=>{
    issue('dhcp.request','pc-1');
    information('PC 1 : '+snapshot().objectsById['pc-1'].config.ipv4.address+'.');
   }));
   actions.append(command('Faire revenir le TPE au bureau',()=>{
    issue('network.setLinkConnected','link-tpe',{connected:true});
    information('Le TPE rejoint le réseau du bureau. Il peut maintenant demander un bail.');
   }));
   actions.append(command('Demander une IP pour le TPE',()=>{
    if(!snapshot().linksById['link-tpe'].connected){information('Le TPE est encore en déplacement.');return;}
    issue('dhcp.request','tpe');
    const address=snapshot().objectsById.tpe.config.ipv4.address;
    const valid=address===ROOT+'120';
    if(!departure){rounds.first=valid;rounds.firstObserved=true;}
    else {rounds.second=valid;rounds.secondObserved=true;}
    information('TPE : adresse attribuée '+(address||'aucune')+'.');
   }));
   actions.append(command('Faire repartir le TPE',()=>{
    if(!rounds.firstObserved){information('Effectue une première demande DHCP du TPE avant son départ.');return;}
    if(!snapshot().linksById['link-tpe'].connected){information('Le TPE est déjà en déplacement.');return;}
    issue('dhcp.release','tpe');
    issue('network.setLinkConnected','link-tpe',{connected:false});
    departure=true;rounds.second=false;rounds.secondObserved=false;
    information('Le TPE est reparti et son bail a été libéré.');
   }));
  }
  refresh();
 }
 function reset(){
  engine=createEngine(makeScenario(kind));sequence=0;rounds={first:false,second:false,firstObserved:false,secondObserved:false};
  requests=new Set();departure=false;observed=false;
  get('.dhcp-admin-form').reset();
  get('.dhcp-admin-save').textContent='';
  get('.dhcp-admin-feedback').textContent='';
  get('.dhcp-admin-last').textContent='Exercice prêt.';
  renderActions();
 }
 get('.dhcp-admin-form').addEventListener('submit',event=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  const exclusions=String(data.get('exclusions')||'').split(',').map(x=>x.trim()).filter(Boolean);
  const mac=String(data.get('mac')||'').trim().toUpperCase();
  const address=String(data.get('reserved')||'').trim();
  if(Boolean(mac)!==Boolean(address)){
   get('.dhcp-admin-save').textContent='Une réservation nécessite une adresse MAC et une adresse IPv4.';
   return;
  }
  try{
   issue('dhcp.configurePool','srv',{exclusions,reservations:mac?[{mac,address}]:[]});
   get('.dhcp-admin-save').textContent='Configuration enregistrée dans le serveur DHCP.';
   get('.dhcp-admin-feedback').textContent='';
   refresh();
  }catch(e){get('.dhcp-admin-save').textContent='Configuration refusée : '+e.message;}
 });
 get('.dhcp-admin-check').addEventListener('click',()=>{
  const p=pool(),leases=engine.query({type:'dhcp.leases',serverId:'srv'}).leases;
  let passed,feedback;
  if(exclusion){
   const configured=p.exclusions.includes(ROOT+'105');
   const six=requests.size===6;
   const assigned=Array.from({length:6},(_,i)=>snapshot().objectsById['pc-'+(i+1)].config.ipv4.address);
   const valid=assigned.every(ip=>Boolean(ip)&&ip!==ROOT+'105');
   passed=configured&&six&&valid;
   feedback=!configured?'La configuration du serveur ne protège pas encore l’adresse du robot.'
    :!six?'Effectue une demande DHCP depuis chacun des six PC.'
    :!valid?'Vérifie les attributions : l’adresse du robot a été distribuée.'
    :'Vérification réussie : l’adresse fixe du robot est exclue et les six baux la respectent.';
  }else{
   const reservation=p.reservations.some(r=>r.mac.toUpperCase()===MAC&&r.address===ROOT+'120');
   const current=leases.some(r=>r.clientId==='tpe'&&r.mac?.toUpperCase()===MAC&&r.address===ROOT+'120');
   passed=reservation&&rounds.first&&rounds.second&&rounds.firstObserved&&rounds.secondObserved&&current;
   feedback=!reservation?'La configuration du serveur ne correspond pas encore à la fiche technique du TPE.'
    :!rounds.firstObserved?'Fais revenir le terminal et demande une adresse DHCP.'
    :!rounds.first?'Lors de son premier retour, le TPE n’a pas reçu l’adresse attendue.'
    :!departure||!rounds.secondObserved?'Fais repartir le TPE puis renouvelle l’expérience à son retour.'
    :!rounds.second||!current?'Vérifie l’adresse attribuée au second retour du terminal.'
    :'Vérification réussie : le serveur associe cette adresse MAC à la même IP lors des deux retours.';
  }
  const node=get('.dhcp-admin-feedback');node.className='dhcp-admin-feedback '+(passed?'is-success':'is-warning');node.textContent=feedback;
 });
 get('.dhcp-admin-reset').addEventListener('click',reset);
 reset();
}
mount('exclusion','dhcp-ch3-exclusion');
mount('reservation','dhcp-ch3-reservation');
