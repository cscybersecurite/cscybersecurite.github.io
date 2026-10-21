/* Scénario pédagogique DHCP du prototype vertical.
   Modifie les rubriques, vérifications, observations et règles ici.
   Le moteur partagé DiagCore reste dans ressources/diagcore/v1/. */
(function(){
'use strict';
window.DHCP_DIAGNOSTIC_SCENARIO = {
 title:'Où veux-tu intervenir ?',
 minimumChecks:1,
 groupPicker:true,
 hideHypothesisUntilReady:true,
 hypothesisLabel:'Mon diagnostic',
 hypothesisTitle:'Quelle est la cause de la panne ?',
 backLabel:'Continuer mes vérifications',
 groups:[
 {title:'PC',checks:[
 {id:'ip',label:'Exécuter ipconfig /all',action:'Sur un PC du VLAN 30 : ipconfig /all',observation:{type:'command',text:'Carte Ethernet :\nDHCP activé : Oui\nAdresse IPv4 d’autoconfiguration : 169.254.18.27\nMasque de sous-réseau : 255.255.0.0\nPasserelle par défaut : (aucune)\nServeur DHCP : (aucun)'}},
 {id:'renew',label:'Exécuter ipconfig /renew',action:'Sur un PC du VLAN 30 : ipconfig /renew',observation:{type:'command',text:'Impossible de contacter le serveur DHCP.\nLe renouvellement du bail a échoué.'}}
 ]},
 {title:'Câblage',checks:[
 {id:'cable',label:'Regarder les voyants du PC',action:'Observer les voyants près de la prise Ethernet.',observation:'Voyant de liaison : allumé. Voyant d’activité : clignotant.'},
 {id:'switchport',label:'Regarder le port du switch',action:'Repérer le port sur lequel le PC est branché.',observation:'Voyant du port : allumé. Liaison établie.'}
 ]},
 {title:'Switch',checks:[
 {id:'relay',label:'Afficher le relais DHCP du VLAN 30',action:'Sur le switch L3 : examiner la configuration de l’interface VLAN 30.',observation:{type:'command',text:'Interface VLAN 30 : 10.30.0.1/24\nRelais DHCP / IP Helper : absent'}}
 ]},
 {title:'Serveur DHCP',checks:[
 {id:'serverpower',label:'Vérifier si le serveur est allumé',action:'Observer l’état physique du serveur.',observation:'Serveur allumé ; voyants système normaux.'},
 {id:'server',label:'Contrôler le service DHCP',action:'Sur le serveur DHCP : contrôler le service et les baux attribués.',observation:{type:'command',text:'Service DHCP : démarré\nBaux VLAN 10 : attribués normalement'}}
 ]}
 ],
 hypotheses:[
 {label:'Le relais DHCP du VLAN 30 est absent',correct:true,requiredChecks:['relay','server'],feedback:'Hypothèse confirmée par les contrôles.',prematureFeedback:'Cette piste est possible, mais il faut vérifier le relais du VLAN 30 et le service DHCP avant d’intervenir.'},
 {label:'Le serveur DNS est arrêté',correct:false,feedback:'Les éléments relevés ne confirment pas cette hypothèse.'},
 {label:'Tous les câbles des PC sont débranchés',correct:false,feedback:'Les éléments relevés ne confirment pas cette hypothèse.'}
 ],
 correction:{
 title:'Quelle correction proposes-tu ?',
 label:'Configurer le relais DHCP sur le VLAN 30',
 requiredChecks:['relay','server'],
 observation:{type:'command',text:'Interface VLAN 30\nRelais DHCP configuré vers 10.10.0.10'}
 },
 verification:{
 title:'Comment vérifies-tu la réparation ?',
 label:'Exécuter ipconfig /renew sur un PC du VLAN 30',
 check:()=>true,
 observation:{type:'command',text:'> ipconfig /renew\nAdresse IPv4 : 10.30.0.42\nMasque : 255.255.255.0\nPasserelle : 10.30.0.1'}
 },
 success:'Le PC a reçu un bail DHCP. Incident résolu.'
};
})();
