import {createAssetRegistry} from 'https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/asset-profiles.js';
/* Interface pédagogique : utilise le moteur partagé R2D3, sans recopier ses règles. */
const el=id=>document.getElementById(id);
const msg=(text,ok)=>{const x=el('r2-result');x.textContent=text;x.classList.remove('good','warn');if(ok!==undefined)x.classList.add(ok?'good':'warn');};
const assert=(r,label)=>{if(!r.success)throw Error(label+' : '+r.message);return r;};
let reg,scenario;
function setup(){
 reg=createAssetRegistry();
 const root=assert(reg.createPlace({name:'Entreprise Démonstration'}),'Lieu').place.id;
 const bureau1=assert(reg.createPlace({name:'Bureau 1',parentId:root}),'Bureau 1').place.id;
 const bureau2=assert(reg.createPlace({name:'Bureau 2',parentId:root}),'Bureau 2').place.id;
 const local=assert(reg.createPlace({name:'Placard technique',parentId:root}),'Local').place.id;
 const panel=assert(reg.createPanel({name:'Panneau P1',placeId:local,count:2,start:1,prefix:'P'}),'Panneau').panel;
 const outlet1=assert(reg.createWallOutlet({name:'P01',location:'Bureau 1'}),'Prise 1').outlet;
 const outlet2=assert(reg.createWallOutlet({name:'P02',location:'Bureau 2'}),'Prise 2').outlet;
 const pcProfile=assert(reg.createProfile('Poste informatique'),'Profil PC').profile.id;
 assert(reg.addPortGroup(pcProfile,{type:'ethernet-rj45',prefix:'LAN',start:1,count:1,digits:2}),'Port PC');
 const swProfile=assert(reg.createProfile('Switch 4 ports'),'Profil switch').profile.id;
 assert(reg.addPortGroup(swProfile,{type:'ethernet-rj45',prefix:'LAN',start:1,count:4,digits:2}),'Ports switch');
 const pc1=assert(reg.createAsset(pcProfile,{name:'PC1'}),'PC1').asset;
 const pc2=assert(reg.createAsset(pcProfile,{name:'PC2'}),'PC2').asset;
 const sw=assert(reg.createAsset(swProfile,{name:'SW01'}),'Switch').asset;
 assert(reg.moveAssetToPlace(pc1.id,bureau1),'Installer PC1');
 assert(reg.moveAssetToPlace(pc2.id,bureau2),'Installer PC2');
 assert(reg.moveAssetToPlace(sw.id,local),'Installer switch');
 scenario={pcs:[pc1.ports[0].id,pc2.ports[0].id],switchPorts:[sw.ports[0].id,sw.ports[1].id],panel,wall:[outlet1,outlet2]};
 // Deux câbles permanents préinstallés, directement via les opérations R2D3.
 for(let i=0;i<2;i++){
  const c=assert(reg.createCable({connectors:['rj45-male','rj45-male']}),'Câble permanent').cable;
  assert(reg.connectCableEnd(c.id,0,scenario.wall[i].ports[0].back.id),'Prise arrière');
  assert(reg.connectCableEnd(c.id,1,panel.ports[i].back.id),'Panneau arrière');
 }
 redraw();
 el('r2-paths').replaceChildren();for(let i=0;i<2;i++){const a=document.createElement('div');a.textContent='PC'+(i+1)+' : à contrôler';el('r2-paths').append(a);}
 msg('Deux liaisons permanentes sont préinstallées. À toi de poser les quatre cordons de brassage.');
}
const endpointLabel=p=>p.assetName+' / '+p.portName+(p.occupied?' (occupé)':'');
function selectFill(id,points){const node=el(id),prior=node.value;node.replaceChildren();for(const p of points){const opt=document.createElement('option');opt.value=p.portId;opt.textContent=endpointLabel(p);opt.disabled=p.occupied;node.append(opt);}if(points.some(x=>x.portId===prior&&!x.occupied))node.value=prior;}
function redraw(){
 const pts=reg.listCablePoints();
 selectFill('r2-a',pts);
 selectFill('r2-b',pts);
 const containers=el('r2-cables');containers.replaceChildren();
 const cables=reg.listCables(),byId=new Map(pts.map(p=>[p.portId,p]));
 for(const c of cables){const card=document.createElement('div');const a=c.ends[0]?.portId,b=c.ends[1]?.portId;card.textContent=c.id+'\nA : '+(a?endpointLabel(byId.get(a)):'libre')+'\nB : '+(b?endpointLabel(byId.get(b)):'libre');card.style.whiteSpace='pre-line';containers.append(card);}
 const remove=el('r2-remove-select'),previous=remove.value;remove.replaceChildren();
 for(const c of cables){const opt=document.createElement('option');opt.value=c.id;opt.textContent=c.id+' : '+(c.ends[0]&&c.ends[1]?'raccordé':'incomplet');remove.append(opt);}if(cables.some(x=>x.id===previous))remove.value=previous;
}
el('r2-connect').addEventListener('click',()=>{
 const a=el('r2-a').value,b=el('r2-b').value;
 if(!a||!b||a===b){msg('Sélectionne deux ports différents et libres.',false);return;}
 const c=reg.createCable({connectors:['rj45-male','rj45-male']});
 if(!c.success){msg(c.message,false);return;}
 let r=reg.connectCableEnd(c.cable.id,0,a);
 if(!r.success){reg.deleteCable(c.cable.id);msg('Extrémité A : '+r.message,false);redraw();return;}
 r=reg.connectCableEnd(c.cable.id,1,b);
 if(!r.success){reg.deleteCable(c.cable.id);msg('Extrémité B : '+r.message,false);redraw();return;}
 redraw();msg('Câble '+c.cable.id+' raccordé. Le moteur R2D3 a validé les deux extrémités.',true);
});
el('r2-remove').addEventListener('click',()=>{const c=el('r2-remove-select').value;if(!c)return;const fixed=reg.listCables().slice(0,2).some(x=>x.id===c);if(fixed){msg('Cette liaison permanente est déjà installée et ne doit pas être retirée dans cette mission.',false);return;}const r=reg.deleteCable(c);msg(r.message,r.success);redraw();});
el('r2-test').addEventListener('click',()=>{
 const box=el('r2-paths');box.replaceChildren();let count=0;
 for(let i=0;i<2;i++){
  const p=reg.explorePhysicalPath(scenario.pcs[i],scenario.switchPorts[i]);
  const row=document.createElement('div');const ok=p.success&&p.connected;if(ok)count++;
  const headline=document.createElement('b');headline.textContent='PC'+(i+1)+' vers SW01 / LAN0'+(i+1)+' : '+(ok?'chemin continu':'chemin interrompu');
  const detail=document.createElement('small');detail.textContent=ok?' '+p.segments.filter(x=>x.kind==='cable').length+' câbles traversés.':' Vérifie les prises, la face avant du panneau et le port du switch.';
  row.append(headline,detail);box.append(row);
 }
 msg(count===2?'Mission réussie : les deux chemins physiques sont continus. Il reste, dans la réalité, à contrôler les paramètres du réseau.':'Contrôle : '+count+'/2 chemins complets. Le moteur n’invente aucun raccordement manquant.',count===2);
});
el('r2-reset').addEventListener('click',setup);
try{setup()}catch(error){console.error(error);msg('Le moteur R2D3 ne peut pas initialiser le scénario : '+error.message,false);}