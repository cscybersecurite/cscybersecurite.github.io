/* Chapitre 8 : administration d'un serveur mail et Outlook réels (simulation R2D3).
 * Pas de moteur de messagerie indépendant : seules des opérations de présentation ici. */
import {createMailEngine} from "https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/mail-core.js";
import {connectMailOutlook} from "https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/mail-outlook-adapter.js";

const root=document.getElementById("mail-admin-lab");
if(root){
  const by=key=>root.querySelector('[data-mail-admin="'+key+'"]');
  const status=by("status"),ready=by("ready"),finalStatus=by("final");
  const form=by("form"),names=by("mailboxes"),outlookHost=by("outlook");
  const verify=by("verify"),reset=by("reset");
  const text=(host,message,state)=>{host.textContent=message;host.dataset.state=state||"";};
  const norm=value=>String(value||"").trim().toLowerCase();
  let scenario,engine,bridge;
  function showServers(){
    const settings=engine.getServerSettings(scenario.mailServer.domain);
    for(const proto of ["imap","pop3","smtp"]){
      const row=by(proto+"-settings");
      row.textContent=settings[proto].host+" • "+settings[proto].port+" • "+(settings[proto].security==="ssl"?"SSL/TLS":"STARTTLS");
    }
  }
  function paint(){
    names.replaceChildren();
    const mailboxes=engine.listMailboxes();
    if(!mailboxes.length){
      const tr=document.createElement("tr"),td=document.createElement("td");
      td.colSpan=2;td.textContent="Aucune boîte créée.";tr.append(td);names.append(tr);
    }else{
      for(const entry of mailboxes){
        const tr=document.createElement("tr");
        for(const value of [entry.email,entry.type==="pop3"?"POP3":"IMAP"]){
          const td=document.createElement("td");td.textContent=value;tr.append(td);
        }
        names.append(tr);
      }
    }
    const configured=new Set(bridge.outlook.getAccounts().map(a=>norm(a.email)));
    const required=["contact@atelier-kerwen.fr","sav@atelier-kerwen.fr"];
    const created=required.filter(e=>mailboxes.some(a=>norm(a.email)===e));
    const active=required.filter(e=>configured.has(e));
    ready.textContent="Boîtes créées : "+created.length+"/2. Comptes configurés dans Outlook : "+active.length+"/2.";
  }
  function start(){
    if(bridge)bridge.destroy();
    engine=createMailEngine(scenario);
    bridge=connectMailOutlook(outlookHost,scenario,{engine,accounts:[]});
    form.reset();
    by("local").value="contact";
    by("type").value="imap";
    text(status,"Commence par créer la boîte IMAP contact@atelier-kerwen.fr.");
    text(finalStatus,"");
    showServers();paint();
  }
  try{
    const response=await fetch("https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/mail-server-scenario.json",{cache:"no-store"});
    if(!response.ok)throw new Error("Scénario du serveur R2D3 indisponible.");
    scenario=await response.json();
    if(scenario.mailServer?.domain!=="atelier-kerwen.fr"||scenario.accounts?.length)
      throw new Error("Le scénario attendu pour cet exercice n'est pas disponible.");
    start();
    form.addEventListener("submit",event=>{
      event.preventDefault();
      const local=norm(by("local").value);
      const password=by("password").value;
      const type=by("type").value;
      if(!/^[a-z0-9][a-z0-9._-]{0,39}$/.test(local)){
        text(status,"Nom de boîte invalide : utilise des lettres sans accent, des chiffres, des points ou des tirets.","error");return;
      }
      const email=local+"@"+scenario.mailServer.domain;
      const result=engine.createMailbox({email,password,type});
      text(status,result.success?"Boîte créée : "+email+" ("+type.toUpperCase()+").":result.message,result.success?"success":"error");
      if(result.success){
        by("password").value="";
        if(email==="contact@atelier-kerwen.fr"){
          by("local").value="sav";by("type").value="pop3";
        }
      }
      paint();
    });
    verify.addEventListener("click",()=>{
      paint();
      const accounts=bridge.outlook.getAccounts();
      const get=e=>accounts.find(a=>norm(a.email)===e);
      const contact=get("contact@atelier-kerwen.fr"),sav=get("sav@atelier-kerwen.fr");
      if(!contact||!sav){
        text(finalStatus,"Configure d'abord les deux comptes dans Outlook : contact en IMAP et sav en POP3.","error");return;
      }
      if(contact.type!=="imap"||sav.type!=="pop3"){
        text(finalStatus,"Contrôle les protocoles : contact doit être en IMAP et sav en POP3.","error");return;
      }
      const mails=engine.getSnapshot().messages;
      const exchanged=mails.some(m=>m.folder==="sent"&&norm(m.accountEmail)===norm(contact.email)&&norm(m.to)===norm(sav.email))
        &&mails.some(m=>m.folder==="inbox"&&norm(m.accountEmail)===norm(sav.email)&&norm(m.from)===norm(contact.email));
      text(finalStatus,exchanged
        ?"Bravo ! Les deux comptes sont configurés et le courriel envoyé depuis contact a été reçu par sav."
        :"Les deux comptes sont correctement configurés. Pour terminer, envoie un courriel de contact vers sav dans Outlook, puis clique à nouveau sur « Vérifier ».",exchanged?"success":"");
    });
    reset.addEventListener("click",start);
  }catch(error){
    text(status,"Impossible de charger le serveur pédagogique : "+(error.message||error)+". Actualise la page pour réessayer.","error");
    form.querySelector('button[type="submit"]').disabled=true;
    verify.disabled=true;reset.disabled=true;
  }
}
