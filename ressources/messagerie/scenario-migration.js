/* Adaptation Messagerie à DiagCore V1.3 : Outlook conserve ses états et ses formulaires. */
(function(){
'use strict';
const host=document.getElementById('mail-search');
if(!host)return;
if(!window.DiagCore?.version?.startsWith('1.3.')){host.textContent='DiagCore V1.3 indisponible.';return;}
const outlook=document.querySelector('.mail-smtp-settings');
const form=document.getElementById('mail-smtp-form'),out=document.getElementById('mail-smtp-result');
const hint=document.getElementById('mail-smtp-lock-message');
let latestSendSuccess=false,diagnosticValidated=false,technicalRevision=0,operationSeq=0;
let pendingSend=null;
let app;
function smtpInfo(){
 const data=new FormData(form);
 return 'Compte : contact@atelier-kerwen.fr\nProtocole d’envoi : SMTP\nServeur sortant : '+data.get('server')+
  '\nPort : '+data.get('port')+'\nSécurité : '+data.get('security')+'\nAuthentification SMTP : activée';
}
function showOutlook(){
 outlook.hidden=false;outlook.style.display='';
 requestAnimationFrame(()=>outlook.scrollIntoView({block:'start',behavior:'smooth'}));
}
function setEditing(){
 for(const control of form.querySelectorAll('select')){
  const wrapper=control.parentElement;
  wrapper.classList.toggle('mail-smtp-locked',!diagnosticValidated);
  const guard=wrapper.querySelector('.mail-smtp-guard');
  if(guard)guard.hidden=diagnosticValidated;
  control.tabIndex=diagnosticValidated?0:-1;
 }
 hint.hidden=true;hint.textContent='';
}
function requestSend(){
 showOutlook();
 return new Promise(resolve=>{pendingSend=resolve;});
}
const scenario={
 title:'Où veux-tu intervenir ?',getRevision:()=>technicalRevision,
 workTitle:'Intervenir ou vérifier',
 workPrompt:"Le dépannage n'est pas terminé. Vérifie si l'incident est résolu.",
 interventionTitle:'Interventions possibles',groupPicker:true,minimumChecks:2,hideHypothesisUntilReady:true,
 hypothesisLabel:'Mon diagnostic',hypothesisTitle:'Quel est le problème rencontré ?',backLabel:'Continuer mes vérifications',
 groups:[
 {title:'Ancien prestataire',checks:[
  {id:'nova',label:'Documentation Nova Mail',observation:{type:'command',text:'Nova Mail - Documentation messagerie\n\nRÉCEPTION (POP3)\nServeur : pop.novamail.fr\nPort : 995\nSécurité : SSL/TLS\n\nENVOI (SMTP)\nServeur : smtp.novamail.fr\nPort : 587\nSécurité : STARTTLS'}}
 ]},
 {title:'Nouveau prestataire',checks:[
  {id:'orange',label:'Documentation Orange',observation:{type:'command',text:'Orange - Paramètres messagerie\n\nRÉCEPTION (POP3)\nServeur : pop.orange.fr\nPort : 995\nSécurité : SSL/TLS\n\nENVOI (SMTP)\nServeur : smtp.orange.fr\nPort : 465\nSécurité : SSL/TLS\nAuthentification SMTP : activée'}}
 ]},
 {title:'Paramètres',checks:[
  {id:'smtp',label:'Configuration du serveur sortant',observe:()=>({type:'command',text:smtpInfo()}),observation:{type:'command',text:'Compte : contact@atelier-kerwen.fr\nProtocole d’envoi : SMTP\nServeur sortant : smtp.novamail.fr\nPort : 587\nSécurité : STARTTLS\nAuthentification SMTP : activée'}},
  {id:'pop',label:'Configuration du serveur entrant',observation:{type:'command',text:'Compte : contact@atelier-kerwen.fr\nProtocole : POP3\nServeur entrant : pop.orange.fr\nPort : 995\nSécurité : SSL/TLS'}}
 ]},
 {title:'E-mail',checks:[
  {id:'envoi',label:'Tester l’envoi d’un message',observe:requestSend,verify:requestSend},
  {id:'reception',label:'Tester la réception',observation:'Les nouveaux courriels arrivent normalement dans la boîte de réception.'}
 ]},

 ],
 hypotheses:[
  {label:'Les paramètres SMTP correspondent encore à l’ancien prestataire',correct:true,requiredChecks:['envoi','smtp','orange'],feedback:'Le serveur sortant utilise toujours les anciens paramètres. Corrige le serveur, le port et la sécurité ci-dessous.',prematureFeedback:'Vérifie le résultat de l’envoi, la configuration et les paramètres du nouveau prestataire.'},
  {label:'La réception POP3 est défaillante',correct:false,feedback:'Les courriels arrivent normalement. Le problème ne concerne pas la réception.'},
  {label:'Le nom de domaine de l’entreprise doit être changé',correct:false,feedback:'L’entreprise conserve son domaine. Recherche plutôt les paramètres du serveur sortant.'}
 ],
 interventions:[{id:'smtp-edit',label:'Ouvrir les paramètres SMTP du compte',execute:()=>{
  diagnosticValidated=true;setEditing();showOutlook();
  return {executed:true,changed:false,observation:'Configuration Outlook ouverte. Modifie les paramètres SMTP, puis teste l’envoi.'};
 }}],
 canClose:({revision,verifications})=>({
  allowed:latestSendSuccess&&verifications.some(v=>v.id==='envoi'&&v.revision===revision&&v.passed),
  feedback:"Effectue un nouveau test d'envoi après ta dernière modification des paramètres SMTP."
 }),
 success:'Le test d’envoi confirme que la messagerie fonctionne. Incident résolu.'
};
for(const select of form.querySelectorAll('select')){
 const guard=document.createElement('button');guard.type='button';guard.className='mail-smtp-guard';
 guard.setAttribute('aria-label','Paramètre verrouillé. Valide d’abord Mon diagnostic pour le modifier.');
 guard.addEventListener('click',()=>{
  hint.hidden=false;hint.textContent='Valide d’abord ton diagnostic, puis choisis une intervention.';
 });
 select.parentElement.append(guard);
}
setEditing();
app=window.DiagCore.mount(host,scenario,{mode:'vertical'});
form.addEventListener('change',event=>{
 if(!event.target.matches('select')||!diagnosticValidated)return;
 technicalRevision++;
 latestSendSuccess=false;out.textContent='';out.className='';
 const value=event.target.value;
 app.reportExternal({
  generation:app.getGeneration(),operationId:'smtp-change-'+(++operationSeq),
  kind:'intervention',id:'smtp-edit',
  result:{executed:true,changed:true,revision:technicalRevision,
   observation:'Paramètre SMTP modifié : '+event.target.name+' = '+value}
 });
});
form.addEventListener('submit',event=>{
 event.preventDefault();
 const data=new FormData(form);
 const ok=String(data.get('server')).toLowerCase()==='smtp.orange.fr'&&
  String(data.get('port'))==='465'&&String(data.get('security'))==='ssl';
 latestSendSuccess=ok;
 out.className=ok?'mail-result--success':'mail-result--error';
 out.textContent=ok?'E-mail envoyé.':'Échec de connexion au serveur sortant. Vérifie le serveur SMTP, le port et la sécurité.';
 const result={executed:true,passed:ok,observation:out.textContent};
 if(pendingSend){const resolve=pendingSend;pendingSend=null;resolve(result);}
 else app.reportExternal({
  generation:app.getGeneration(),operationId:'smtp-send-'+(++operationSeq),
  kind:'verification',id:'envoi',result
 });
});
document.getElementById('mail-restart').addEventListener('click',()=>{
 app.restart();form.reset();latestSendSuccess=false;diagnosticValidated=false;technicalRevision=0;
 pendingSend=null;out.textContent='';out.className='';setEditing();
 outlook.hidden=true;outlook.style.display='none';
 host.scrollIntoView({block:'start',behavior:'instant'});
});
})();
