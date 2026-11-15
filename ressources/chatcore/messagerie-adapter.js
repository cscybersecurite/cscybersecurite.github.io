/* ChatCore + exercice existant Messagerie chapitre 9.
 * Autonome : aucun changement du scénario DiagCore, du formulaire SMTP ou du cours.
 * Activation future possible via un unique script dans la page hôte.
 */
(()=>{
'use strict';
const diag=document.getElementById('mail-search');
const form=document.getElementById('mail-smtp-form');
const result=document.getElementById('mail-smtp-result');
const restart=document.getElementById('mail-restart');
if(!diag||!form||!result||!restart)return;
if(document.getElementById('mail-chatcore'))return;
const chapter=diag.closest('details.chapter');
const inside=diag.parentElement;
const incident=inside.querySelector('.mail-incident');
const smtp=inside.querySelector('.mail-smtp-settings');
const actions=inside.querySelector('.mail-diagnostic-actions');
if(!chapter||!incident||!smtp||!actions)return;
const layout=document.createElement('div');layout.id='mail-chatcore';layout.className='mail-chatcore-layout';layout.setAttribute('aria-label','Diagnostic et conversation client');
const technical=document.createElement('div');technical.className='mail-chatcore-technical';
const dialogue=document.createElement('section');dialogue.className='mail-chatcore-dialogue';
const heading=document.createElement('h3');heading.textContent='Échanger avec le client';
const mount=document.createElement('div');mount.id='mail-chatcore-mount';
const note=document.createElement('p');note.className='mail-chatcore-hint';
note.textContent="Le technicien effectue les manipulations. Le client décrit son problème et constate le résultat.";
dialogue.append(heading,mount,note);
inside.insertBefore(layout,incident);
layout.append(technical,dialogue);
technical.append(diag,smtp,actions);
// Le dialogue ChatCore remplace la demande initiale, uniquement dans ce laboratoire.
incident.hidden=true;
const sheet=document.createElement('link');sheet.rel='stylesheet';
sheet.href='https://chaoli22000bzh.github.io/chatcore/v0.1/chatcore.css';
document.head.append(sheet);
const localStyle=document.createElement('style');
localStyle.textContent=`
.mail-chatcore-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(310px,.8fr);gap:18px;align-items:start}
.mail-chatcore-technical,.mail-chatcore-dialogue{min-width:0}
.mail-chatcore-dialogue{position:sticky;top:12px;border:1px solid var(--line,#b5c8d9);border-radius:12px;padding:13px;background:var(--panel,#fff)}
.mail-chatcore-dialogue h3{margin:0 0 12px;font-size:19px}
.mail-chatcore-hint{font-size:13px;line-height:1.45;color:var(--muted,#50647b);margin:10px 0 0}
#mail-chatcore-mount .cc-history{height:clamp(240px,34vh,390px)}
@media(max-width:920px){.mail-chatcore-layout{grid-template-columns:minmax(0,1fr)}.mail-chatcore-dialogue{position:static;grid-row:1}}
`;
document.head.append(localStyle);
const scenario={
 clientName:'Cliente de l’Atelier Kerwen',typingSpeed:'normal',
 greeting:"Bonjour. Depuis notre passage de Nova Mail à Orange, je reçois mes courriels, mais je n'arrive plus à en envoyer depuis Outlook. Pouvez-vous m'aider ?",
 facts:{testAttempted:false,testPassed:false},
 messages:[
  {id:'since',text:"Depuis quand ne pouvez-vous plus envoyer de courriels ?",answer:"Depuis le changement de prestataire, quand nous sommes passés de Nova Mail à Orange."},
  {id:'receive',text:"Est-ce que vous recevez toujours les courriels ?",answer:"Oui, la réception fonctionne. C'est uniquement l'envoi qui pose problème."},
  {id:'account',text:"Quelle adresse de messagerie est concernée ?",answer:"Il s'agit de contact@atelier-kerwen.fr. Notre nom de domaine n'a pas changé."},
  {id:'permission',text:"Je vais contrôler les paramètres d'envoi dans Outlook. Est-ce que je peux intervenir ?",answer:"Oui, bien sûr. Vous pouvez vérifier les paramètres, merci."},
  {id:'status',text:"Pouvez-vous me confirmer si le problème d'envoi est résolu ?",answer:"Aucun test concluant n'a encore été effectué.",once:false,
   resolve:({facts})=>{
    if(facts.testPassed)return "Oui, après votre correction, le test d'envoi est réussi. L'envoi fonctionne maintenant, merci !";
    if(facts.testAttempted)return "Non, le dernier test d'envoi a échoué. Je ne peux pas encore confirmer la résolution.";
    return "Pas encore. Vous n'avez pas effectué de test d'envoi concluant sur mon compte.";
   }},
  {id:'closing',text:"Puis-je clôturer votre demande d'assistance ?",answer:"Vérifiez d'abord l'envoi d'un message.",once:false,
   resolve:({facts})=>facts.testPassed?
     "Oui, vous avez vérifié le rétablissement de l'envoi. Merci pour votre aide, bonne journée !":
     "Je préfère que vous vérifiiez d'abord l'envoi d'un message avant de clôturer ma demande."}
 ]
};
function loadScript(src){
 return new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=src;
  script.onload=resolve;script.onerror=()=>reject(new Error('Impossible de charger '+src));
  document.head.append(script);
 });
}
async function begin(){
 try{
  if(!window.ChatCore)await loadScript('https://chaoli22000bzh.github.io/chatcore/v0.1/chatcore.js');
  if(!window.ChatCoreUI)await loadScript('https://chaoli22000bzh.github.io/chatcore/v0.1/chatcore-ui.js');
  const ui=window.ChatCoreUI.mount(mount,scenario);
  // Un changement de paramètres invalide un ancien test réussi.
  form.addEventListener('change',event=>{
   if(!event.target.matches('select'))return;
   ui.setFacts({testAttempted:false,testPassed:false});
  });
  // Observer UNIQUEMENT le résultat affiché par le véritable formulaire,
  // après son gestionnaire existant. Aucun résultat n'est inventé par ChatCore.
  form.addEventListener('submit',()=>{
   queueMicrotask(()=>{
    const data=new FormData(form);
    const valid=String(data.get('server'))==='smtp.orange.fr'&&
      String(data.get('port'))==='465'&&String(data.get('security'))==='ssl';
    const passed=valid&&result.classList.contains('mail-result--success')&&
      result.textContent.trim()==='E-mail envoyé.';
    ui.setFacts({testAttempted:true,testPassed:passed});
   });
  });
  // Aide propre au laboratoire : le verrou d'Outlook ne se libère
  // qu'après l'action DiagCore, pas après les seuls contrôles.
  form.addEventListener('click',event=>{
   if(!event.target.closest('.mail-smtp-guard'))return;
   const hint=document.getElementById('mail-smtp-lock-message');
   const correct=Boolean(diag.querySelector('.diagcore__entry--hypothesis-correct'));
   const observations=[...diag.querySelectorAll('.diagcore__entry--observation h3')].map(el=>el.textContent.trim());
   const required=['Tester l’envoi d’un message','Configuration du serveur sortant','Documentation Orange'];
   const missing=required.filter(label=>!observations.includes(label));
   const message=missing.length
    ? 'Dans DiagCore, termine ces contrôles : '+missing.join(' ; ')+'. Puis clique sur Mon diagnostic.'
    :correct
      ? 'Diagnostic validé. Dans DiagCore, clique sur « Ouvrir les paramètres SMTP du compte » sous « Interventions possibles ».'
      : 'Les trois contrôles sont effectués. Dans DiagCore, clique sur « Mon diagnostic », puis choisis « Les paramètres SMTP correspondent encore à l’ancien prestataire ».';
   if(hint){hint.hidden=false;hint.textContent=message;}
   diag.querySelector('.diagcore__next')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
  restart.addEventListener('click',()=>ui.restart());
 }catch(error){mount.textContent='ChatCore indisponible : '+error.message;}
}
begin();
})();
