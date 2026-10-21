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
 {id:'ip',label:'Exécuter ipconfig /all',action:'Sur un PC du VLAN 30 : ipconfig /all',observation:[{type:'command',text:'C:\\Users\\chaoli>ipconfig /all'},{type:'image',src:'./ipconfig-all-mobile.svg?v=001',alt:'Configuration IP de Windows en deux colonnes : nom REN-PC-01, DHCP activé, adresse d’autoconfiguration 169.254.159.39, masque 255.255.0.0, pas de passerelle.',caption:'Configuration IP de Windows : paramètres de la carte Ethernet.'}]},
 {id:'renew',label:'Exécuter ipconfig /renew',action:'Sur un PC du VLAN 30 : ipconfig /renew',observation:{type:'command',text:'Impossible de contacter le serveur DHCP.\nLe renouvellement du bail a échoué.'}},
 {id:'cable',label:'Observer les voyants réseau du PC',action:'Je regarde les voyants de la prise RJ45 du PC.',observation:'Je vois un voyant allumé et un autre qui clignote.'}
 ]},
 {title:'Câblage',checks:[
 {id:'replugpc',label:'Débrancher et rebrancher le cordon RJ45 entre le PC et la prise murale',action:'Je débranche puis je rebranche le cordon RJ45 entre le PC et la prise murale, aux deux extrémités.',observation:'Je vois le voyant du PC se rallumer. Le PC n’obtient toujours pas d’adresse IP.'},
 {id:'replugswitch',label:'Débrancher et rebrancher le cordon RJ45 entre le panneau de brassage et le switch',action:'Je débranche puis je rebranche le cordon RJ45 entre le panneau de brassage et le switch, aux deux extrémités.',observation:'Je vois le voyant du switch se rallumer. Le PC garde son adresse APIPA.'},
 {id:'swapcable',label:'Remplacer le cordon RJ45 entre le PC et la prise murale',action:'Je remplace le cordon RJ45 entre le PC et la prise murale par un cordon qui fonctionne.',observation:'Je vois le voyant du PC allumé. Le PC n’obtient toujours pas d’adresse IP.'},
 {id:'swappatch',label:'Remplacer le cordon RJ45 entre le panneau de brassage et le switch',action:'Je remplace le cordon RJ45 entre le panneau de brassage et le switch par un cordon qui fonctionne.',observation:'Je vois le voyant du switch allumé. Le PC n’obtient toujours pas d’adresse IP.'}
 ]},
 {title:'Switch',checks:[
 {id:'switchpower',label:'Vérifier l’alimentation du switch',action:'Je regarde le voyant d’alimentation du switch.',observation:'Je vois que le voyant est allumé.'},
 {id:'switchport',label:'Contrôler les voyants du port RJ45',action:'Je regarde les voyants du port RJ45 du switch relié au PC.',observation:'Je vois un voyant allumé et un autre qui clignote.'},
 {id:'switchvlan',label:'Vérifier l’affectation du port au VLAN 30',action:'Je vérifie le VLAN du port du switch relié au PC.',observation:'Je constate que ce port appartient au VLAN 30.'},
 {id:'relay',label:'Vérifier le relais DHCP du VLAN 30',action:'Je vérifie le relais DHCP du VLAN 30 sur le switch.',observation:{type:'command',text:'Je constate que le relais DHCP (IP Helper) n’est pas configuré.\nVLAN 30 : 10.30.0.1/24'}}
 ]},
 {title:'Serveur DHCP',checks:[
 {id:'serverpower',label:'Vérifier si le serveur est allumé',action:'Je regarde les voyants du serveur DHCP.',observation:'Je vois que le serveur est allumé.'},
 {id:'server',label:'Contrôler le service DHCP',action:'Je vérifie le service DHCP et les adresses IP données aux PC du VLAN 10.',observation:{type:'command',text:'Je constate que le service DHCP est démarré.\nLe serveur donne des adresses IP aux PC du VLAN 10.'}},
 {id:'scope',label:'Vérifier l’étendue DHCP du VLAN 30',action:'J’ouvre l’étendue du VLAN 30 sur le serveur DHCP.',observation:{type:'command',text:'Je constate que l’étendue du VLAN 30 est active.\nIl reste 86 adresses IP disponibles.\nRéseau : 10.30.0.0/24'}}
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
 observation:{type:'command',text:'Interface VLAN 30\nRelais DHCP configuré vers 10.99.0.10'}
 },
 verification:{
 title:'Comment vérifies-tu la réparation ?',
 label:'Exécuter ipconfig /renew sur un PC du VLAN 30',
 check:()=>true,
 observation:{type:'command',text:'> ipconfig /renew\nAdresse IPv4 : 10.30.0.142\nMasque : 255.255.255.0\nPasserelle : 10.30.0.1'}
 },
 success:'Le PC a reçu un bail DHCP. Incident résolu.'
};
})();
