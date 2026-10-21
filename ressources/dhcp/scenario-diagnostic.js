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
 {id:'cable',label:'Observer les voyants réseau du PC',action:'Observer les voyants de la prise Ethernet du PC.',observation:'Voyant de liaison : allumé. Voyant d’activité : clignotant. La liaison Ethernet est établie.'}
 ]},
 {title:'Câblage',checks:[
 {id:'replugpc',label:'Débrancher et rebrancher le câble côté PC',action:'Débrancher puis rebrancher le câble Ethernet à l’arrière du PC.',observation:'Le voyant Ethernet s’éteint au débranchement puis se rallume au rebranchement. Le PC ne récupère toujours pas d’adresse DHCP.'},
 {id:'replugswitch',label:'Débrancher et rebrancher le câble côté switch',action:'Débrancher puis rebrancher le câble Ethernet sur le port du switch.',observation:'Le voyant du port s’éteint, puis se rallume. La liaison Ethernet est rétablie, mais le PC conserve une adresse APIPA.'},
 {id:'swapcable',label:'Essayer un autre câble Ethernet',action:'Remplacer le câble Ethernet par un câble testé et fonctionnel.',observation:'La liaison Ethernet reste établie. Malgré ce changement, le PC ne reçoit toujours pas de configuration DHCP.'}
 ]},
 {title:'Switch',checks:[
 {id:'switchpower',label:'Vérifier que le switch est allumé',action:'Observer l’alimentation et les voyants généraux du switch.',observation:'Le switch est sous tension. Le voyant d’alimentation est allumé et aucun voyant de défaut général n’est actif.'},
 {id:'switchport',label:'Observer les voyants du port Ethernet',action:'Observer les voyants du port du switch sur lequel le PC est connecté.',observation:'Voyant du port : allumé. Le voyant d’activité clignote. La liaison avec le PC est établie.'},
 {id:'relay',label:'Afficher le relais DHCP du VLAN 30',action:'Sur le switch de niveau 3 : consulter les paramètres du VLAN 30.',observation:{type:'command',text:'Interface VLAN 30 : 10.30.0.1/24\nRelais DHCP / IP Helper : absent'}}
 ]},
 {title:'Serveur DHCP',checks:[
 {id:'serverpower',label:'Vérifier si le serveur est allumé',action:'Observer l’état physique du serveur.',observation:'Serveur allumé ; voyants système normaux.'},
 {id:'server',label:'Contrôler le service DHCP',action:'Sur le serveur DHCP : contrôler le service et les baux attribués.',observation:{type:'command',text:'Service DHCP : démarré\nBaux VLAN 10 : attribués normalement'}},
 {id:'scope',label:'Vérifier l’étendue DHCP du VLAN 30',action:'Dans la console DHCP : vérifier l’état de l’étendue correspondant au VLAN 30.',observation:{type:'command',text:'Étendue : VLAN 30 (10.30.0.0/24)\nÉtat : active\nAdresses disponibles : 86\nPlage non épuisée'}}
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
