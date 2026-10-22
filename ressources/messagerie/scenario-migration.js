/* Diagnostic de messagerie - scénario indépendant du moteur commun DiagCore. */
(function(){
'use strict';
const host=document.getElementById('mail-search');
if(!host)return;
if(!window.DiagCore||!window.DiagCore.version?.startsWith('1.2.')){host.textContent='DiagCore 1.2 indisponible.';return;}
let latestSendSuccess=false;
const scenario={
 title:'Où veux-tu intervenir ?',groupPicker:true,minimumChecks:2,hideHypothesisUntilReady:true,
 hypothesisLabel:'Mon diagnostic',hypothesisTitle:'Quel est le problème rencontré ?',backLabel:'Continuer mes vérifications',
 groups:[
 {title:'Ancien prestataire',checks:[
  {id:'nova',label:'Documentation Nova Mail',observation:{type:'command',text:'Nova Mail - Documentation messagerie\n\nRÉCEPTION (POP3)\nServeur : pop.novamail.fr\nPort : 995\nSécurité : SSL/TLS\n\nENVOI (SMTP)\nServeur : smtp.novamail.fr\nPort : 587\nSécurité : STARTTLS'}}
 ]},
 {title:'Nouveau prestataire',checks:[
  {id:'orange',label:'Documentation Orange',observation:{type:'command',text:'Orange - Paramètres messagerie\n\nRÉCEPTION (POP3)\nServeur : pop.orange.fr\nPort : 995\nSécurité : SSL/TLS\n\nENVOI (SMTP)\nServeur : smtp.orange.fr\nPort : 465\nSécurité : SSL/TLS\nAuthentification SMTP : activée'}}
 ]},
 {title:'Paramètres',checks:[
  {id:'smtp',label:'Configuration du serveur sortant',observation:{type:'command',text:'Compte : contact@atelier-kerwen.fr\nProtocole d’envoi : SMTP\nServeur sortant : smtp.novamail.fr\nPort : 587\nSécurité : STARTTLS\nAuthentification SMTP : activée'}},
  {id:'pop',label:'Configuration du serveur entrant',observation:{type:'command',text:'Compte : contact@atelier-kerwen.fr\nProtocole : POP3\nServeur entrant : pop.orange.fr\nPort : 995\nSécurité : SSL/TLS'}}
 ]},
 {title:'E-mail',checks:[
  {id:'envoi',label:'Tester l’envoi d’un message',observation:' '},
  {id:'reception',label:'Tester la réception',observation:'Les nouveaux courriels arrivent normalement dans la boîte de réception.'}
 ]},

 ],
 hypotheses:[
  {label:'Les paramètres SMTP correspondent encore à l’ancien prestataire',correct:true,requiredChecks:['envoi','smtp','orange'],feedback:'Le serveur sortant utilise toujours les anciens paramètres. Corrige le serveur, le port et la sécurité ci-dessous.',prematureFeedback:'Vérifie le résultat de l’envoi, la configuration et les paramètres du nouveau prestataire.'},
  {label:'La réception POP3 est défaillante',correct:false,feedback:'Les courriels arrivent normalement. Le problème ne concerne pas la réception.'},
  {label:'Le nom de domaine de l’entreprise doit être changé',correct:false,feedback:'L’entreprise conserve son domaine. Recherche plutôt les paramètres du serveur sortant.'}
 ],
 correction:{title:'Quelle intervention proposes-tu ?',label:'Mettre à jour les paramètres SMTP du compte',requiredChecks:['envoi','smtp','orange'],prematureFeedback:'Poursuis les vérifications du serveur sortant.',observation:'La correction doit porter sur le serveur, le port et la sécurité. Modifie les paramètres SMTP dans Outlook, puis teste l’envoi.'},
 verification:{title:'Quel contrôle faut-il effectuer ?',label:'Vérifier le dernier test d’envoi',check:()=>latestSendSuccess,observation:'Le dernier test Outlook confirme que l’envoi fonctionne.',failure:'Le dernier test Outlook ne confirme pas l’envoi. Vérifie les paramètres et effectue un nouveau test.'},
 success:'Le diagnostic est terminé. Vérifie maintenant l’envoi avec les paramètres SMTP corrigés.'
};
// Une seule fiche par prestataire : l'ouvrir sans second clic.
host.addEventListener('click',event=>{
 const group=event.target.closest('.diagcore__equipment');
 if(!group)return;
 const name=group.textContent.trim();
 if(name!=='Ancien prestataire'&&name!=='Nouveau prestataire')return;
 const label=name==='Ancien prestataire'?'Documentation Nova Mail':'Documentation Orange';
 requestAnimationFrame(()=>{
  const choice=[...host.querySelectorAll('.diagcore__group .diagcore__choice')].find(b=>b.textContent.trim()===label);
  if(choice&&!choice.disabled)choice.click();
 });
},true);
const app=window.DiagCore.mount(host,scenario,{mode:'vertical'});
const outlook=document.querySelector('.mail-smtp-settings');
let sendRecorded=false;
let allowEngineSendClick=false;
let pendingSendButton=null;
// Ouvrir Outlook sans compter le controle : seul le clic reel sur Tester l'envoi le valide.
host.addEventListener('click',event=>{
 const button=event.target.closest('button.diagcore__choice');
 if(!button||button.textContent.trim()!=='Tester l’envoi d’un message'||sendRecorded||allowEngineSendClick)return;
 const group=button.closest('.diagcore__group');
 if(!group)return;
 event.stopImmediatePropagation();
 pendingSendButton=button;
 latestSendSuccess=false;
 out.textContent='';
 out.className='';
 group.append(outlook);
 outlook.hidden=false;outlook.style.display='';
 setEditing();
},true);

function setEditing(){
 for(const control of form.querySelectorAll('select'))control.disabled=false;
 const intro=outlook.querySelector('.mail-smtp-content>p');
 if(intro)intro.textContent='Modifie les paramètres SMTP du compte, puis teste l’envoi.';
}
host.addEventListener('click',event=>{
 const button=event.target.closest('button.diagcore__choice');
 if(!button)return;
 const label=button.textContent.trim();
 if(label==='Tester l’envoi d’un message'){
  const entry=host.querySelector('.diagcore__timeline .diagcore__entry:last-child');
  if(!entry||!entry.classList.contains('diagcore__entry--observation'))return;
  entry.querySelector('p')?.remove();
  entry.append(outlook);
  outlook.hidden=false;outlook.style.display='';
  setEditing();
 }
 if(label==='Mettre à jour les paramètres SMTP du compte'){
  setEditing();
  const entry=host.querySelector('.diagcore__timeline .diagcore__entry:last-child');
  if(entry){entry.append(outlook);outlook.hidden=false;outlook.style.display='';}
 }
});
const form=document.getElementById('mail-smtp-form'),out=document.getElementById('mail-smtp-result');
function showResult(type,message){out.className='mail-result--'+type;out.textContent=message;}
form.addEventListener('change',event=>{if(!event.target.matches('select'))return;latestSendSuccess=false;out.className='';out.textContent='Paramètres modifiés. Effectue un nouveau test d’envoi.';});
form.addEventListener('submit',function(e){
 e.preventDefault();
 // Au premier vrai test, enregistrer le controle dans DiagCore.
 if(!sendRecorded&&pendingSendButton?.isConnected){
  allowEngineSendClick=true;
  pendingSendButton.click();
  allowEngineSendClick=false;
  sendRecorded=true;
  pendingSendButton=null;
 }
 const data=new FormData(form);
 const server=String(data.get('server')||'').trim().toLowerCase();
 const port=String(data.get('port')||'').trim();
 const security=String(data.get('security')||'');
 const ok=server==='smtp.orange.fr'&&port==='465'&&security==='ssl';
 latestSendSuccess=ok;
 if(ok){
  showResult('success','E-mail envoyé.');
 }else{
  showResult('error','Échec de connexion au serveur sortant. Vérifie le serveur SMTP, le port et la sécurité.');
 }
});
document.getElementById('mail-restart').addEventListener('click',()=>{
 app.restart();form.reset();latestSendSuccess=false;sendRecorded=false;allowEngineSendClick=false;pendingSendButton=null;out.textContent='';out.className='';setEditing();outlook.hidden=true;outlook.style.display='none';document.getElementById('mail-search').after(outlook);host.scrollIntoView({block:'start',behavior:'instant'});
});
})();
