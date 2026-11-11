/* Mini-exercices POP3 / IMAP : trois situations identiques, observation des conséquences sur le téléphone. */
(()=>{'use strict';
const situations=[
  {title:'1. Lire un message',action:'Sur le PC, Camille ouvre un message non lu.',local:'Le message reste non lu sur le téléphone.',sync:'Le message devient lu sur le téléphone.',whyLocal:'Avec POP3, la lecture est enregistrée sur le PC. Elle n’est pas automatiquement transmise au téléphone.',whySync:'Avec IMAP, l’état « lu » est synchronisé par le serveur entre les appareils.'},
  {title:'2. Classer un message',action:'Sur le PC, Camille déplace ce message dans le dossier « Clients ».',local:'Le message reste dans la boîte de réception du téléphone.',sync:'Le message apparaît dans « Clients » sur le téléphone.',whyLocal:'Avec POP3, le classement est local : le dossier du PC n’est pas automatiquement synchronisé.',whySync:'Avec IMAP, le déplacement dans un dossier du serveur se répercute sur le téléphone.'},
  {title:'3. Supprimer un message',action:'Sur le PC, Camille supprime le message.',local:'Le message reste visible sur le téléphone.',sync:'Le message disparaît aussi de la boîte de réception du téléphone.',whyLocal:'Avec POP3, supprimer la copie déjà téléchargée sur le PC ne supprime pas automatiquement celle du téléphone.',whySync:'Avec IMAP, la suppression est synchronisée après mise à jour des appareils.'}
];
const choices=[{id:'local',name:'Le téléphone ne suit pas automatiquement l’action du PC'},{id:'sync',name:'Le téléphone retrouve le changement après synchronisation'}];
const create=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x};
for(const root of document.querySelectorAll('[data-mail-sync-mode]')){
  const mode=root.dataset.mailSyncMode;
  if(!['pop3','imap'].includes(mode))continue;
  const expected=mode==='pop3'?'local':'sync';
  const done=new Set();
  const status=create('p','mail-sync-progress','0 situation sur 3 réussie.');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const lead=create('p','mail-sync-context','Camille consulte la même adresse sur un PC et un téléphone. Les deux appareils ont déjà reçu le message. En POP3, une copie est conservée sur le serveur après téléchargement. En IMAP, les deux appareils consultent les dossiers du serveur.');
  const instruction=create('p','mail-sync-instruction','Pour chacune des trois situations, choisis ce qui se passe sur le téléphone après l’action effectuée sur le PC.');
  const cards=create('div','mail-sync-cards');
  function progress(){status.textContent=done.size+' situation'+(done.size>1?'s':'')+' sur 3 réussie'+(done.size>1?'s':'')+'.'+(done.size===3?' Bravo, les trois situations sont comprises !':'')}
  situations.forEach((s,i)=>{
    const card=create('section','mail-sync-card');
    const title=create('h4','',s.title);
    const flow=create('div','mail-sync-flow');
    const pc=create('div','mail-sync-device');pc.append(create('strong','','💻 Sur le PC'),create('span','',s.action));
    const arrow=create('span','mail-sync-arrow','→');arrow.setAttribute('aria-hidden','true');
    const phone=create('div','mail-sync-device');phone.append(create('strong','','📱 Sur le téléphone'),create('span','','Que devient ce message ?'));
    flow.append(pc,arrow,phone);
    const q=create('p','mail-sync-question','Que constates-tu sur le téléphone ?');
    const answers=create('div','mail-sync-answers');
    const feedback=create('p','mail-sync-feedback','');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
    const buttons=[];
    for(const choice of choices){
      const button=create('button','mail-sync-choice',choice.name);
      button.type='button';button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>{
        if(done.has(i))return;
        const good=choice.id===expected;
        buttons.forEach(b=>{b.classList.remove('mail-sync-selected','mail-sync-wrong');b.setAttribute('aria-pressed','false')});
        button.classList.add(good?'mail-sync-selected':'mail-sync-wrong');button.setAttribute('aria-pressed','true');
        if(good){done.add(i);buttons.forEach(b=>b.disabled=true);feedback.dataset.state='success';feedback.textContent='✓ '+s[expected]+ ' '+(expected==='local'?s.whyLocal:s.whySync);progress();}
        else{feedback.dataset.state='retry';feedback.textContent='Pas tout à fait. '+(expected==='local'?'En POP3, le PC et le téléphone ne synchronisent pas ces modifications.':'En IMAP, les deux appareils retrouvent les modifications du serveur après synchronisation.')+' Essaie l’autre proposition.';}
      });
      buttons.push(button);answers.append(button);
    }
    card.append(title,flow,q,answers,feedback);cards.append(card);
  });
  const reset=create('button','mail-sync-reset','Recommencer');
  reset.type='button';reset.addEventListener('click',()=>{done.clear();root.querySelectorAll('.mail-sync-choice').forEach(b=>{b.disabled=false;b.classList.remove('mail-sync-selected','mail-sync-wrong');b.setAttribute('aria-pressed','false')});root.querySelectorAll('.mail-sync-feedback').forEach(f=>{f.textContent='';delete f.dataset.state});progress()});
  root.replaceChildren(lead,instruction,status,cards,reset);
  progress();
}
})();
