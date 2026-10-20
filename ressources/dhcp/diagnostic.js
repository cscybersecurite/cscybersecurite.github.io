/* Diagnostic APIPA DHCP : scenario local utilisant DiagCore v1. */
(function(){
'use strict';
const mount=document.getElementById('dhcp-diagcore');
const observation=document.getElementById('dhcp-diag-observation');
const result=document.getElementById('dhcp-diag-result');
if(!mount||!observation||!result)return;
if(!window.DiagCore){mount.textContent='Le moteur DiagCore est indisponible. Vérifie la connexion Internet et recharge la page.';return;}
const facts=new Set();
const nodes={
 start:{title:'Plusieurs postes du VLAN 30 sont en APIPA',text:'À Rennes, les postes du VLAN 30 affichent des adresses 169.254.x.x. Les postes du VLAN 10 fonctionnent. Par quel contrôle veux-tu commencer ?',choices:[['ip','Examiner la configuration IPv4'],['link','Contrôler la liaison réseau'],['server','Vérifier le service DHCP']]},
 link:{title:'Contrôler la liaison réseau',text:'Clique sur « Vérifier la liaison » dans le panneau d’observation pour relever le résultat.',check:()=>facts.has('link'),fail:'Effectue le contrôle de liaison avant de poursuivre.',next:'linkResult'},
 linkResult:{title:'Liaison réseau vérifiée',text:'Les liens Ethernet sont actifs. Cette vérification ne suffit pas à expliquer pourquoi plusieurs postes restent en APIPA.',next:'investigate'},
 ip:{title:'Examiner la configuration IPv4',text:'Effectue le contrôle IP dans le panneau d’observation.',check:()=>facts.has('ip'),fail:'Commence par effectuer le contrôle IP.',next:'ipResult'},
 ipResult:{title:'Configuration IPv4 observée',text:'Les postes du VLAN 30 ont une adresse 169.254.x.x/16, sans bail DHCP. La cause n’est pas encore identifiée.',next:'investigate'},
 server:{title:'Vérifier le service DHCP',text:'Effectue le contrôle du serveur DHCP dans le panneau d’observation.',check:()=>facts.has('server'),fail:'Vérifie le service DHCP avant de continuer.',next:'serverResult'},
 serverResult:{title:'Serveur DHCP vérifié',text:'Le service DHCP est actif et distribue des baux aux postes du VLAN 10. Il faut comprendre pourquoi les demandes du VLAN 30 ne lui parviennent pas.',next:'investigate'},
 investigate:{title:'Quelle vérification poursuivre ?',text:'Recueille les informations manquantes dans l’ordre de ton choix avant de conclure.',choices:[['ip','Consulter les adresses IP'],['server','Tester le serveur DHCP'],['link','Tester la liaison réseau'],['relay','Contrôler le relais DHCP du VLAN 30'],['conclude','Formuler une hypothèse']]},
 relay:{title:'Contrôler le relais DHCP',text:'Consulte la configuration du relais DHCP sur l’interface du VLAN 30.',check:()=>facts.has('relay'),fail:'Effectue le contrôle du relais DHCP.',next:'relayResult'},
 relayResult:{title:'Résultat sur le VLAN 30',text:'L’interface VLAN 30 ne comporte aucune destination de relais DHCP (IP Helper).',next:'investigate'},
 conclude:{title:'Quelle cause retiens-tu ?',text:'Choisis une conclusion à partir de tes vérifications.',choices:[['fix','Le relais DHCP du VLAN 30 est absent'],['wrongServer','Le serveur DHCP est nécessairement arrêté'],['wrongCable','Tous les câbles des postes sont défectueux'],['investigate','Je préfère poursuivre mes contrôles']]},
 wrongServer:{title:'Hypothèse à vérifier',text:'Les postes du VLAN 10 obtiennent bien des baux. Il faut distinguer une panne générale du serveur d’un défaut de relais vers le VLAN 30.',next:'investigate'},
 wrongCable:{title:'Hypothèse à vérifier',text:'Plusieurs postes sont concernés, mais le lien Ethernet actif ne suffit pas à identifier la cause. Compare les vérifications du serveur et du relais.',next:'investigate'},
 fix:{title:'Confirmer le diagnostic et corriger',text:'Avant de configurer le relais, vérifie les résultats IP, serveur DHCP et relais. Ensuite, choisis « Configurer le relais » dans le panneau.',check:()=>facts.has('ip')&&facts.has('server')&&facts.has('relay')&&facts.has('fixed'),fail:'Il faut contrôler les adresses IP, le serveur et le relais, puis configurer ce dernier.',next:'retest'},
 retest:{title:'Vérifier le résultat de la correction',text:'Après la configuration du relais, renouvelle le bail DHCP dans le panneau d’observation.',check:()=>facts.has('retest')&&facts.has('fixed'),fail:'Renouvelle le bail DHCP après la correction.',next:'done'},
 done:{title:'Incident DHCP résolu',text:'Après la correction du relais, le poste a reçu une adresse 10.30.0.42/24 du VLAN 30. Le fonctionnement DHCP est vérifié.',complete:true}
};
const messages={
 ip:'ipconfig : adresse 169.254.18.27, masque 255.255.0.0, aucune passerelle.',
 link:'Liaison Ethernet active sur les postes concernés.',
 server:'Service DHCP actif : les postes du VLAN 10 obtiennent un bail.',
 relay:'Interface VLAN 30 : aucune adresse IP Helper configurée.',
 fixed:'Relais configuré sur le VLAN 30 vers le serveur DHCP central.',
 retest:'Renouvellement réussi : adresse 10.30.0.42/24 reçue.'
};
const app=window.DiagCore.mount(mount,nodes,{
 subtitle:'Incident APIPA · VLAN 30',
 onStep:({id})=>{if(id!=='done')result.textContent='';},
 onComplete:()=>{result.textContent='Diagnostic terminé : cause identifiée, correction appliquée et testée.';}
});
document.querySelectorAll('[data-dhcp-check]').forEach(button=>button.addEventListener('click',()=>{
 const action=button.dataset.dhcpCheck;
 if(action==='fixed'&&!(facts.has('ip')&&facts.has('server')&&facts.has('relay'))){observation.textContent='Pour corriger, contrôle d’abord la configuration IP, le serveur DHCP et le relais.';return;}
 if(action==='retest'&&!facts.has('fixed')){observation.textContent='Configure d’abord le relais DHCP.';return;}
 facts.add(action);
 observation.textContent=messages[action];
}));
document.getElementById('dhcp-diag-reset')?.addEventListener('click',()=>{facts.clear();observation.textContent='Aucun contrôle effectué.';result.textContent='';app.restart();});
})();
