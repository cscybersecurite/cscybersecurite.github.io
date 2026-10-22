/* Diagnostic de messagerie - scénario indépendant du moteur commun DiagCore. */
(function(){
'use strict';
const host=document.getElementById('mail-search');
if(!host)return;
if(!window.DiagCore||!window.DiagCore.version?.startsWith('1.2.')){host.textContent='DiagCore 1.2 indisponible.';return;}
const scenario={
 title:'Où veux-tu intervenir ?',groupPicker:true,minimumChecks:2,hideHypothesisUntilReady:true,
 hypothesisLabel:'Mon diagnostic',hypothesisTitle:'Quel est le problème rencontré ?',backLabel:'Continuer mes vérifications',
 groups:[
 {title:'Courriel',checks:[
  {id:'envoi',label:'Tester l’envoi d’un message',observation:{type:'command',text:'Outlook - Envoyer/Recevoir\n\n✉ Message : essai d’envoi\nCompte : contact@atelier-kerwen.fr\nÉtat : Échec de l’envoi\n\nImpossible d’établir une connexion avec le serveur de courrier sortant.\nLe message reste dans la boîte d’envoi.'}},
  {id:'reception',label:'Tester la réception',observation:'Les nouveaux courriels arrivent normalement dans la boîte de réception.'}
 ]},
 {title:'Paramètres',checks:[
  {id:'smtp',label:'Configuration du serveur sortant',observation:{type:'command',text:'Compte : contact@atelier-kerwen.fr\nProtocole d’envoi : SMTP\nServeur sortant : smtp.novamail.example\nPort : 587\nSécurité : STARTTLS\nAuthentification SMTP : activée'}},
  {id:'pop',label:'Configuration du serveur entrant',observation:{type:'command',text:'Compte : contact@atelier-kerwen.fr\nProtocole : POP3\nServeur entrant : pop.orange.fr\nPort : 995\nSécurité : SSL/TLS'}}
 ]},
 {title:'Ancien prestataire',checks:[
  {id:'nova',label:'Documentation Nova Mail',observation:{type:'command',text:'Nova Mail - Documentation messagerie\n\nRÉCEPTION (POP3)\nServeur : pop.novamail.example\nPort : 995\nSécurité : SSL/TLS\n\nENVOI (SMTP)\nServeur : smtp.novamail.example\nPort : 587\nSécurité : STARTTLS'}}
 ]},
 {title:'Nouveau prestataire',checks:[
  {id:'orange',label:'Documentation Orange',observation:{type:'command',text:'Orange - Paramètres messagerie\n\nRÉCEPTION (POP3)\nServeur : pop.orange.fr\nPort : 995\nSécurité : SSL/TLS\n\nENVOI (SMTP)\nServeur : smtp.orange.fr\nPort : 465\nSécurité : SSL/TLS\nAuthentification SMTP : activée'}}
 ]}
 ],
 hypotheses:[
  {label:'Les paramètres SMTP correspondent encore à l’ancien prestataire',correct:true,requiredChecks:['envoi','smtp','orange'],feedback:'Le serveur sortant utilise toujours les anciens paramètres. Corrige le serveur, le port et la sécurité ci-dessous.',prematureFeedback:'Vérifie le résultat de l’envoi, la configuration et les paramètres du nouveau prestataire.'},
  {label:'La réception POP3 est défaillante',correct:false,feedback:'Les courriels arrivent normalement. Le problème ne concerne pas la réception.'},
  {label:'Le nom de domaine de l’entreprise doit être changé',correct:false,feedback:'L’entreprise conserve son domaine. Recherche plutôt les paramètres du serveur sortant.'}
 ],
 correction:{title:'Quelle intervention proposes-tu ?',label:'Mettre à jour les paramètres SMTP du compte',requiredChecks:['envoi','smtp','orange'],prematureFeedback:'Poursuis les vérifications du serveur sortant.',observation:'La correction doit porter sur le serveur, le port et la sécurité. Utilise le formulaire de configuration sous le diagnostic.'},
 verification:{title:'Quel contrôle faut-il effectuer ?',label:'Envoyer un courriel de test',check:()=>true,observation:'Effectue le test réel de la configuration avec le bouton « Tester l’envoi » situé sous le diagnostic.'},
 success:'Le diagnostic est terminé. Applique et teste maintenant les trois paramètres SMTP.'
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
const form=document.getElementById('mail-smtp-form'),out=document.getElementById('mail-smtp-result');
form.addEventListener('submit',function(e){
 e.preventDefault();
 const data=new FormData(form);
 const server=String(data.get('server')||'').trim().toLowerCase();
 const port=String(data.get('port')||'').trim();
 const security=String(data.get('security')||'');
 const ok=server==='smtp.orange.fr'&&port==='465'&&security==='ssl';
 if(ok){
  out.textContent='Envoi réussi : les trois paramètres du serveur SMTP sont corrects. Incident résolu.';
  out.style.color='inherit';
 }else{
  out.textContent='Échec de connexion au serveur sortant. Vérifie le serveur SMTP, le port et la sécurité.';
  out.style.color='inherit';
 }
});
document.getElementById('mail-restart').addEventListener('click',()=>{
 app.restart();form.reset();out.textContent='';host.scrollIntoView({block:'start',behavior:'instant'});
});
})();
