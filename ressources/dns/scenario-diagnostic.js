/* Diagnostic DNS - scénario indépendant du moteur partagé DiagCore. */
(function(){
'use strict';
window.DNS_DIAGNOSTIC_SCENARIO={
 title:'Où veux-tu intervenir ?',
 minimumChecks:2,groupPicker:true,hideHypothesisUntilReady:true,
 hypothesisLabel:'Mon diagnostic',hypothesisTitle:'Quelle est la cause de la panne ?',
 backLabel:'Continuer mes vérifications',
 groups:[
 {title:'Documentation',checks:[
  {id:'dossier',label:'Documentation réseau',observation:{type:'command',text:'Réseau local         192.168.10.0/24\nPasserelle           192.168.10.1\nServeur DHCP         192.168.10.2\nPlage DHCP           192.168.10.100 à 192.168.10.200\nServeur DNS          192.168.10.5\nServeur de fichiers  192.168.10.10\nPC-01                DHCP\nPC-02                DHCP\nPC-03                DHCP\nPC-04                DHCP'}}
 ]},
 {title:'PC-01',checks:[
  {id:'ipconfig1',label:'ipconfig /all',observation:{type:'command',text:'PC-01> ipconfig /all\\nNom de l’hôte          PC-01\\nDHCP activé            Oui\\nAdresse IPv4           192.168.10.142\\nMasque                 255.255.255.0\\nPasserelle par défaut  192.168.10.1\\nServeur DHCP           192.168.10.2\\nServeur DNS            192.168.10.5'}},
  {id:'nslookup1',label:'nslookup SRV-FICHIERS',observation:{type:'command',text:'PC-01> nslookup SRV-FICHIERS\\nServeur : dns-interne\\nAddress: 192.168.10.5\\nNom : SRV-FICHIERS\\nAddress: 192.168.10.10'}}
 ]},
 {title:'PC-02',checks:[
  {id:'pingip',label:'ping 192.168.10.10',observation:{type:'command',text:'PC-02> ping 192.168.10.10\nRéponse de 192.168.10.10 : octets=32 temps<1 ms TTL=128'}},
  {id:'pingname',label:'ping SRV-FICHIERS',observation:{type:'command',text:'PC-02> ping SRV-FICHIERS\nLa requête Ping n’a pas pu trouver l’hôte SRV-FICHIERS.'}},
  {id:'ipconfig2',label:'ipconfig /all',observation:{type:'command',text:'PC-02> ipconfig /all\nNom de l’hôte          PC-02\nDHCP activé            Oui\nAdresse IPv4           192.168.10.187\nMasque                 255.255.255.0\nPasserelle par défaut  192.168.10.1\nServeur DHCP           192.168.10.2\nServeur DNS            8.8.8.8'}},
  {id:'nslookup2',label:'nslookup SRV-FICHIERS',observation:{type:'command',text:'PC-02> nslookup SRV-FICHIERS\nServeur : dns.google\nAddress: 8.8.8.8\n*** dns.google ne parvient pas à trouver SRV-FICHIERS : domaine inexistant'}},
 ]},
 {title:'Infrastructure',checks:[
  {id:'dnsserver',label:'Serveur DNS interne',observation:{type:'command',text:'Serveur DNS : 192.168.10.5\nEnregistrement A\nSRV-FICHIERS -> 192.168.10.10\nService DNS : démarré'}},
  {id:'dhcpserver',label:'Serveur DHCP',observation:{type:'command',text:'Serveur DHCP : 192.168.10.2\nPlage : 192.168.10.100 à 192.168.10.200\nPasserelle : 192.168.10.1\nDNS distribué : 192.168.10.5'}}
 ]}
 ],
 hypotheses:[
  {label:'Le DNS de PC-02 a été configuré manuellement avec une mauvaise adresse',correct:true,requiredChecks:['dossier','ipconfig2','nslookup2'],feedback:'Les contrôles confirment une mauvaise configuration DNS sur PC-02.',prematureFeedback:'Il te manque des informations pour proposer un diagnostic.'},
  {label:'Le serveur de fichiers est arrêté',correct:false,feedback:'Les résultats ne confirment pas cette hypothèse. Continue les vérifications.'},
  {label:'Le serveur DNS interne ne possède pas le nom du serveur de fichiers',correct:false,feedback:'Les résultats ne confirment pas cette hypothèse. Continue les vérifications.'}
 ],
 correction:{title:'Quelle correction proposes-tu ?',label:'Remettre le DNS de PC-02 en attribution automatique (DHCP)',requiredChecks:['dossier','ipconfig2','nslookup2'],prematureFeedback:'Il te manque des informations pour proposer un diagnostic.',observation:{type:'command',text:'PC-02 : attribution DNS automatique (DHCP) rétablie.\nServeur DNS reçu : 192.168.10.5'}},
 verification:{title:'Comment vérifies-tu la réparation ?',label:'Tester la résolution DNS sur PC-02',check:()=>true,observation:{type:'command',text:'PC-02 > nslookup SRV-FICHIERS\nServeur : dns-interne\nAddress: 192.168.10.5\nNom : SRV-FICHIERS\nAddress: 192.168.10.10'}},
 success:'PC-02 résout maintenant le nom SRV-FICHIERS. Incident résolu.'
};
})();
