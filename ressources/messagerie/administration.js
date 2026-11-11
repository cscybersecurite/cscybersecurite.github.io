/* Chapitre 8 : exercice pédagogique avec le véritable moteur mail R2D3 et Outlook partagé.
   Pas de serveur réel, de synchronisation POP/IMAP multi-appareils ni de moteur local. */
import {createMailEngine} from "https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/mail-core.js";
import {connectMailOutlook} from "https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/mail-outlook-adapter.js";

const root=document.getElementById("mail-administration");
if(root){
 const $=(s)=>root.querySelector(s);
 const status=$('[data-admin="status"]');
 const form=$('[data-admin="form"]');
 const table=$('[data-admin="mailboxes"]');
 const steps=$('[data-admin="steps"]');
 const host=$('[data-admin="outlook"]');
 const domain="atelier-kerwen.fr";
 let scenario,engine,bridge;
 const names=["contact","sav"];
 const configured=()=>bridge?.outlook.getAccounts()||[];
 const setStatus=(value,success)=>{status.textContent=value;status.dataset.state=success===true?"ok":success===false?"error":"";};
 const created=()=>engine?.listMailboxes()||[];
 function render(){
   const boxes=created();
   table.replaceChildren();
   const listed=boxes.filter(x=>names.some(name=>x.email===name+"@"+domain));
   if(!listed.length){
     const row=document.createElement("tr");
     const cell=document.createElement("td");
     cell.colSpan=3;
     cell.textContent="Aucune boîte créée pour le moment.";
     row.append(cell);
     table.append(row);
   }
   for(const box of listed){
     const row=document.createElement("tr");
     for(const value of [box.email,box.type.toUpperCase(),"Créée"]){
       const cell=document.createElement("td");cell.textContent=value;row.append(cell);
     }
     table.append(row);
   }
   const accounts=configured();
   const n=boxes.filter(x=>names.some(name=>x.email===name+"@"+domain)).length;
   steps.textContent="Boîtes créées : "+n+"/2. Comptes configurés dans Outlook : "+accounts.filter(x=>names.some(name=>x.email===name+"@"+domain)).length+"/2."+(accounts.length===2?" Tu peux maintenant essayer l'envoi d'un courriel entre les deux adresses.":"");
 }
 function start(){
   if(bridge)bridge.destroy();
   engine=createMailEngine(scenario);
   bridge=connectMailOutlook(host,scenario,{engine});
   render();
   form.reset();
   setStatus("Serveur prêt. Commence par créer les deux boîtes fictives.");
 }
 form.addEventListener("submit",event=>{
   event.preventDefault();
   const values=Object.fromEntries(new FormData(form));
   const email=values.name+"@"+domain;
   const type=values.name==="contact"?"imap":"pop3";
   const result=engine.createMailbox({email,type,password:values.password});
   setStatus(result.success?"Boîte "+email+" créée. Elle apparaît dans la liste des boîtes créées.":result.message,result.success);
   form.elements.password.value="";
   render();
 });
 $('[data-admin="reset"]').addEventListener("click",()=>{
   if(!scenario)return;
   start();
 });
 const observer=new MutationObserver(render);
 observer.observe(host,{childList:true,subtree:true,characterData:true});
 try{
   const response=await fetch("https://chaoli22000bzh.github.io/C2-Lab/r2d3-v1/mail-server-scenario.json",{cache:"no-store"});
   if(!response.ok)throw Error("Scénario R2D3 non disponible.");
   scenario=await response.json();
   if(scenario.mailServer?.domain!==domain||scenario.accounts?.length)throw Error("Scénario serveur inattendu.");
   start();
 }catch(error){
   form.querySelector('button[type="submit"]').disabled=true;
   setStatus("Impossible de charger le serveur simulé : "+(error.message||error),false);
 }
}
