/* Migration messagerie : DiagCore pour la recherche, parcours guidé local pour la migration. */
(function(){
'use strict';
const host=document.getElementById('mail-migration');if(!host)return;
const scenario={
 title:'Où veux-tu chercher ?',groupPicker:true,groups:[
 {title:'Dossier client',checks:[
 {id:'client',label:'Fiche client',observation:{type:'command',text:'Entreprise : Atelier Kerwen\\nUtilisateur : Morgan, technicien de maintenance\\nAdresse : maintenance@atelier-kerwen.fr\\nPrestataire : Hébergeur Kerwen Mail\\nCompte : messagerie classique POP3 + SMTP'}},
 {id:'provider',label:'Paramètres du prestataire',observation:{type:'command',text:'RECEPTION : pop.kerwen-mail.fr\\nPort : 995\\nSécurité : SSL/TLS\\nENVOI : smtp.kerwen-mail.fr\\nPort : 587\\nSécurité : STARTTLS\\nAuthentification SMTP : obligatoire'}}]},
 {title:'Ancien PC',checks:[
 {id:'account',label:'Paramètres du compte Outlook',observation:{type:'command',text:'Adresse : maintenance@atelier-kerwen.fr\\nNom de connexion : m.maintenance\\nRéception : POP3\\nEnvoi : SMTP\\nMot de passe : ******** (non affiché)\\nAuthentification SMTP : activée'}},
 {id:'profile',label:'Emplacement des données Outlook',observation:{type:'command',text:'Fichier de données actif :\\nC:\\Users\\Morgan\\Documents\\Fichiers Outlook\\Maintenance.pst\\nTaille : 4,2 Go\\nLe fichier contient des messages et des dossiers locaux.'}},
 {id:'oldpc',label:'État de l’ancien PC',observation:'L’ancien PC fonctionne. Outlook s’ouvre et les anciens courriels sont visibles. Le nouveau PC ne contient pas encore les archives.'}]},
 {title:'Accès au compte',checks:[
 {id:'password',label:'Vérifier les identifiants disponibles',observation:'Le client peut saisir lui-même le mot de passe du compte lors de la configuration. Le technicien ne doit pas l’extraire de l’ancien PC ni le noter sur la fiche.'},
 {id:'tests',label:'Vérifier la messagerie actuelle',observation:'Sur l’ancien PC, la réception et l’envoi fonctionnent. Le remplacement doit conserver la configuration et les anciens messages.'}]}
 ]};
const root=document.getElementById('mail-search');let app=null;
if(!window.DiagCore||!window.DiagCore.version?.startsWith('1.2.')){root.textContent='DiagCore 1.2 indisponible.';return;}
app=window.DiagCore.mount(root,scenario,{mode:'vertical'});
const byId=id=>document.getElementById(id);
const answers={address:'maintenance@atelier-kerwen.fr',username:'m.maintenance',incoming:'pop.kerwen-mail.fr',incomingport:'995',outgoing:'smtp.kerwen-mail.fr',outgoingport:'587',file:'maintenance.pst',securityin:'ssl',securityout:'starttls',protocol:'pop3',auth:'yes',password:'available'};
const fields=[
 ['address','Adresse e-mail','text','ex. maintenance@...'],
 ['username','Identifiant de connexion','text','Il peut être différent de l’adresse e-mail'],
 ['protocol','Réception','select',[['','Choisir…'],['pop3','POP3'],['imap','IMAP'],['exchange','Exchange']]],
 ['incoming','Serveur entrant','text','nom du serveur'],
 ['incomingport','Port entrant','text','Numéro'],
 ['securityin','Sécurité entrante','select',[['','Choisir…'],['ssl','SSL/TLS'],['starttls','STARTTLS'],['none','Aucune']]],
 ['outgoing','Serveur sortant','text','nom du serveur'],
 ['outgoingport','Port sortant','text','Numéro'],
 ['securityout','Sécurité sortante','select',[['','Choisir…'],['ssl','SSL/TLS'],['starttls','STARTTLS'],['none','Aucune']]],
 ['auth','Authentification SMTP','select',[['','Choisir…'],['yes','Activée'],['no','Désactivée']]],
 ['file','Fichier de données locales','text','Nom du fichier avec son extension'],
 ['password','Mot de passe','select',[['','Choisir…'],['available','Le client le saisira'],['extract','Extraire le mot de passe de l’ancien PC'],['write','Le noter dans la fiche']]]
];
const form=byId('mail-migration-form');
fields.forEach(([id,label,type,option])=>{const wrap=document.createElement('label');wrap.className='mail-field';const span=document.createElement('span');span.textContent=label;wrap.append(span);const el=document.createElement(type==='select'?'select':'input');el.name=id;el.id='migration-'+id;if(type==='select')option.forEach(([value,txt])=>{const o=document.createElement('option');o.value=value;o.textContent=txt;el.append(o);});else{el.type='text';el.autocomplete='off';el.placeholder=option;}wrap.append(el);form.insertBefore(wrap,byId('mail-migration-submit'));});
const normal=x=>String(x||'').trim().toLowerCase().replace(/\\s+/g,'');
form.addEventListener('submit',e=>{
 e.preventDefault();const data=new FormData(form),wrong=[];
 for(const [id,expected] of Object.entries(answers)){let value=normal(data.get(id));if(id==='file'&&value.endsWith('\\\\maintenance.pst'))value='maintenance.pst';if(value!==normal(expected))wrong.push(id);}
 const out=byId('mail-migration-feedback');out.hidden=false;out.className='mail-result '+(wrong.length?'mail-result--error':'mail-result--ok');
 if(wrong.length){out.textContent=wrong.length+' information(s) à revoir. Vérifie les champs signalés, puis réessaie.';fields.forEach(([id])=>{const el=byId('migration-'+id);el.classList.toggle('mail-invalid',wrong.includes(id));});return;}
 fields.forEach(([id])=>{const el=byId('migration-'+id);el.classList.remove('mail-invalid');el.disabled=true;});
 byId('mail-migration-submit').disabled=true;out.textContent='Bravo ! Tu as retrouvé les paramètres de messagerie et repéré les données à préserver. La partie 1 est réussie !';
 byId('mail-success').hidden=false;byId('mail-success').scrollIntoView({behavior:'smooth',block:'nearest'});
});
byId('mail-finish').addEventListener('click',()=>{byId('mail-success-msg').textContent='Mission terminée : la partie 1 est validée. Bien joué !';});
byId('mail-continue').addEventListener('click',()=>{byId('mail-success').hidden=true;byId('mail-phase2').hidden=false;step=0;draw();byId('mail-phase2').scrollIntoView({behavior:'smooth',block:'start'});});
const steps=[
 {title:'1. Protéger les anciennes données',question:'Quelle action fais-tu avant de transférer les anciens messages ?',choices:['Supprimer le profil Outlook sur l’ancien PC','Fermer Outlook et sauvegarder le fichier .pst','Configurer le compte et oublier l’ancien PC'],correct:1,explanation:'Le fichier .pst contient des messages locaux. Fermer Outlook avant la copie permet d’éviter une sauvegarde incohérente.'},
 {title:'2. Vérifier la copie',question:'Tu as copié le fichier .pst. Que vérifies-tu ?',choices:['Que le fichier est présent, complet et dans un emplacement sécurisé','Uniquement que le nouveau PC est connecté au Wi-Fi','Que le nom du fichier est plus court'],correct:0,explanation:'La copie doit être complète et exploitable. Ne supprime pas la source avant d’avoir contrôlé le transfert.'},
 {title:'3. Configurer la messagerie',question:'Sur le nouveau PC, quelle configuration correspond à la fiche validée ?',choices:['IMAP 993 et SMTP 25, sans authentification','POP3 995 SSL/TLS et SMTP 587 STARTTLS, avec authentification','POP3 110 sans chiffrement et HTTP 80'],correct:1,explanation:'Les valeurs proviennent de la documentation du prestataire et de l’ancien compte.'},
 {title:'4. Retrouver les anciens messages',question:'La nouvelle boîte fonctionne, mais les anciens messages manquent. Que fais-tu ?',choices:['Importer ou ouvrir le fichier .pst sauvegardé dans Outlook','Effacer les messages sur l’ancien PC','Changer le serveur DNS sans vérifier le fichier'],correct:0,explanation:'La réception de nouveaux messages ne restaure pas automatiquement les archives stockées localement.'},
 {title:'5. Vérifier la migration',question:'Quel contrôle permet de clôturer correctement l’intervention ?',choices:['Vérifier seulement que Outlook s’ouvre','Tester envoi, réception et présence des anciens dossiers et messages','Éteindre l’ancien PC sans aucun test'],correct:1,explanation:'Une migration réussie conserve les anciens messages et permet d’envoyer et de recevoir.'}
];
let step=0;
function draw(){const s=steps[step];byId('mail-step-title').textContent=s.title;byId('mail-step-question').textContent=s.question;const zone=byId('mail-step-choices');zone.replaceChildren();s.choices.forEach((choice,i)=>{const b=document.createElement('button');b.type='button';b.className='mail-choice';b.textContent=choice;b.addEventListener('click',()=>{if(i!==s.correct){byId('mail-step-feedback').textContent='Pas tout à fait. Réfléchis aux données du client et essaie encore.';return;}byId('mail-step-feedback').textContent='Bonne réponse ! '+s.explanation;zone.querySelectorAll('button').forEach(btn=>btn.disabled=true);byId('mail-step-next').hidden=false;});zone.append(b);});byId('mail-step-feedback').textContent='';byId('mail-step-next').hidden=true;byId('mail-progress').textContent='Étape '+(step+1)+' sur '+steps.length;}
byId('mail-step-next').addEventListener('click',()=>{step++;if(step<steps.length){draw();byId('mail-phase2').scrollIntoView({behavior:'smooth',block:'start'});}else{byId('mail-phase2-work').hidden=true;byId('mail-full-success').hidden=false;}});
byId('mail-restart').addEventListener('click',()=>window.location.reload());
})();
