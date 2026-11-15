/* Laboratoire autonome : ChatCore + véritable Outlook partagé + mail-core R2D3.
 * Pas de DiagCore et aucune modification des composants communs.
 */
import { connectMailOutlook } from 'https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/mail-outlook-adapter.js';
import { createMailEngine } from 'https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/mail-core.js';

const outlookHost=document.getElementById('outlook-host');
const chatHost=document.getElementById('chat-host');
const status=document.getElementById('status');
const reset=document.getElementById('reset');
const completion=document.getElementById('completion');
const chatTitle=document.getElementById('chat-title');
const email='contact@atelier-kerwen.fr';
const secret='AtelierKerwenDemo';
const orange={
 outgoingHost:'smtp.orange.fr',outgoingPort:'465',outgoingSecurity:'ssl'
};
const oldConfig={
 id:'atelier-mail',email,type:'pop3',
 incomingHost:'pop.orange.fr',incomingPort:'995',incomingSecurity:'ssl',
 incomingUsername:email,incomingPassword:secret,
 outgoingHost:'smtp.novamail.fr',outgoingPort:'587',outgoingSecurity:'starttls',
 outgoingUsername:email,outgoingPassword:secret,smtpAuthMode:'same'
};
const scenario={
 accounts:[{
  email,type:'pop3',settings:{
   incomingHost:'pop.orange.fr',incomingPort:'995',incomingSecurity:'ssl',
   incomingUsername:email,incomingPassword:secret,
   ...orange,outgoingUsername:email,outgoingPassword:secret
  }
 }],
 messages:[{
  from:'service@atelier-kerwen.fr',to:email,subject:'Compte client : envoi des courriels',
  body:'La réception fonctionne, mais les messages ne partent plus depuis la migration de prestataire.',minutesAgo:90
 }]
};
let bridge=null,chat=null,unsubscribeClosure=null,closureTimer=null;
let state={inspected:false,testAttempted:false,testPassed:false,detailsShown:false,closed:false};
function inform(message,error=false){
 status.textContent=message;
 status.setAttribute('role',error?'alert':'status');
}
function loadScript(src){
 return new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src=src;s.onload=resolve;
  s.onerror=()=>reject(new Error('Chargement impossible : '+src));document.head.append(s);
 });
}
function facts(){
 chat?.setFacts({inspected:state.inspected,testAttempted:state.testAttempted,testPassed:state.testPassed});
}
// La clôture est une décision du client, distincte de la réussite technique.
function watchClosure(snapshot){
 if(state.closed||!state.testPassed)return;
 const history=snapshot.history;
 const last=history.at(-1);
 const before=history.at(-2);
 if(!last||!before||before.role!=='me'||before.id!=='close'||
    last.role!=='client'||last.id!=='close'||
    last.text!=='Oui, l’envoi fonctionne à nouveau. Merci pour votre intervention !')return;
 state.closed=true;
 clearTimeout(closureTimer);
 // Laisser apparaître la réponse positive du client avant le bilan.
 closureTimer=setTimeout(()=>{
  if(!state.closed)return;
  chatHost.hidden=true;
  completion.hidden=false;
  chatTitle.textContent='Intervention terminée';
  inform('Demande d’assistance clôturée avec l’accord du client.');
 },2400);
}
function inspectedOutgoingSettings(){
 if(state.inspected)return;
 // On ne valide la consultation que lorsque la configuration SMTP
 // existante est effectivement visible dans les paramètres Outlook.
 const field=outlookHost.querySelector('.ou-settings #ou-account [name="outgoingHost"]');
 if(!field||field.value.trim().toLowerCase()!=='smtp.novamail.fr')return;
 const form=field.form;
 if(form?.elements.namedItem('outgoingPort')?.value!=='587'||
    form?.elements.namedItem('outgoingSecurity')?.value!=='starttls')return;
 state.inspected=true;
 facts();
 inform('Ancienne configuration SMTP consultée. Tu peux maintenant demander au client les paramètres Orange.');
}
let watchedOutgoingField=null;
let outgoingVisibilityObserver=null;
function watchOutgoingSettings(){
 if(state.inspected)return;
 const settings=outlookHost.querySelector('.ou-settings');
 const field=settings?.querySelector('#ou-account [name="outgoingHost"]');
 if(!settings||!field||watchedOutgoingField===field)return;
 outgoingVisibilityObserver?.disconnect();
 watchedOutgoingField=field;
 // Un champ réellement affiché dans le panneau des paramètres est une
 // preuve de consultation, sans exiger de clic ou de double vérification.
 outgoingVisibilityObserver=new IntersectionObserver(entries=>{
  if(entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=0.5)){
   inspectedOutgoingSettings();
   if(state.inspected)outgoingVisibilityObserver?.disconnect();
  }
 },{root:settings,threshold:[0.5]});
 outgoingVisibilityObserver.observe(field);
}
const settingsChanges=new MutationObserver(watchOutgoingSettings);
settingsChanges.observe(outlookHost,{subtree:true,childList:true});
outlookHost.addEventListener('focusin',event=>{
 if(event.target.matches('.ou-settings #ou-account [name="outgoingHost"],.ou-settings #ou-account [name="outgoingPort"],.ou-settings #ou-account [name="outgoingSecurity"]'))
  inspectedOutgoingSettings();
});
function makeChatScenario(){
 return {
  clientName:'Client de l’Atelier Kerwen',typingSpeed:'normal',
  greeting:"Bonjour. Depuis notre changement de prestataire, je reçois les courriels dans Outlook, mais je n'arrive plus à en envoyer. Pouvez-vous m'aider ?",
  facts:{inspected:false,testAttempted:false,testPassed:false},
  messages:[
   {id:'since',text:'Depuis quand rencontrez-vous ce problème ?',answer:'Depuis notre passage de Nova Mail à Orange.'},
   {id:'reception',text:'Recevez-vous encore les messages dans Outlook ?',answer:'Oui, la réception fonctionne normalement. Seul l’envoi ne fonctionne plus.'},
   {id:'permission',text:'Puis-je vérifier les paramètres de votre compte Outlook ?',answer:'Oui, bien sûr. Vous pouvez consulter la configuration.'},
   {id:'orange',text:'Pouvez-vous me communiquer les nouveaux paramètres Orange ?',once:false,
    answer:'Je vous les communiquerai après la vérification de la configuration actuelle.',
    resolve:({facts})=>facts.inspected?
     'Oui, voici les informations reçues d’Orange : serveur SMTP smtp.orange.fr, port 465, sécurité SSL/TLS et authentification SMTP activée.':
     'J’ai le document Orange, mais pouvez-vous d’abord contrôler les paramètres SMTP actuellement enregistrés dans Outlook ?'},
   {id:'test',text:"Puis-je effectuer un test d'envoi depuis votre messagerie ?",once:false,
    answer:'Oui, bien sûr. Vous pouvez effectuer le test.'},
   {id:'close',text:'Puis-je clôturer votre demande ?',once:false,
    answer:'Je préfère attendre un test d’envoi réussi.',
    resolve:({facts})=>facts.testPassed?
      'Oui, l’envoi fonctionne à nouveau. Merci pour votre intervention !':
      'Non, merci de vérifier que les courriels partent correctement avant de clôturer.'}
  ]
 };
}
async function begin(){
 try{
  if(!window.ChatCore)await loadScript('https://chaoli22000bzh.github.io/chatcore/v0.1/chatcore.js');
  if(!window.ChatCoreUI)await loadScript('https://chaoli22000bzh.github.io/chatcore/v0.1/chatcore-ui.js');
  const engine=createMailEngine(scenario);
  bridge=connectMailOutlook(outlookHost,scenario,{
   engine,accounts:[structuredClone(oldConfig)],
   callbacks:{
    async onTestAccount(account){
     const report=engine.validateAccount(account);
     if(report.success){
      // La configuration validée ne prouve PAS qu'un courriel a été envoyé.
      state.testAttempted=false;state.testPassed=false;facts();
      inform('Configuration reconnue par R2D3. Envoie maintenant un véritable message de test.');
     }else inform('Test du compte : '+report.message,true);
     return {success:report.success,message:report.message,code:report.code};
    },
    async onSend(mail){
     const report=engine.send({from:mail.from,to:mail.to,subject:mail.subject,body:mail.body});
     if(report.success)bridge.sync();
     state.testAttempted=true;state.testPassed=report.success;facts();
     inform(report.success?'Envoi réussi dans le moteur R2D3. Demande une confirmation au client.':'Échec de l’envoi : '+report.message,!report.success);
     return {success:report.success,message:report.message,code:report.code};
    }
   }
  });
  chat=window.ChatCoreUI.mount(chatHost,makeChatScenario());
  unsubscribeClosure=chat.chat.subscribe(watchClosure);
  inform('Laboratoire prêt. Le dialogue et Outlook sont deux interfaces distinctes.');
 }catch(error){
  inform('Laboratoire indisponible : '+error.message,true);
 }
}
reset.addEventListener('click',()=>{
 clearTimeout(closureTimer);closureTimer=null;
 unsubscribeClosure?.();unsubscribeClosure=null;
 completion.hidden=true;chatHost.hidden=false;
 chatTitle.textContent='Échanger avec le client';
 outgoingVisibilityObserver?.disconnect();outgoingVisibilityObserver=null;
 watchedOutgoingField=null;
 bridge?.destroy();bridge=null;
 chat?.destroy?.();chat=null;
 chatHost.replaceChildren();
 state={inspected:false,testAttempted:false,testPassed:false,detailsShown:false,closed:false};
 begin();
});
begin();
