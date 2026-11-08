/* Incidents : micro-diagnostics et diagnostic final, indépendants du moteur DiagCore. */
(function(){'use strict';
let investigationAlternativeReader=false,investigationRevision=0;
window.resetIncidentInvestigation=()=>{investigationAlternativeReader=false;investigationRevision=0;};
const common={groupPicker:true,hideHypothesisUntilReady:true,hypothesisLabel:'Mon diagnostic',backLabel:'Continuer les vérifications'};
const scenarios={
qualification:{...common,title:'Que faut-il vérifier ?',minimumChecks:2,groups:[
{title:'Signalement',checks:[{id:'users',label:'Combien de personnes sont touchées ?',observation:'Tout le service comptabilité, soit 18 personnes, ne peut plus utiliser le logiciel.'},{id:'delay',label:'Quel est le délai ?',observation:'La clôture comptable est attendue cet après-midi.'}]},
{title:'Contexte',checks:[{id:'scope',label:'Le problème concerne-t-il un seul PC ?',observation:'Le même message apparaît sur plusieurs postes.'}]}
],hypotheses:[{label:'Impact élevé et urgence à évaluer rapidement',correct:true,requiredChecks:['users','delay'],feedback:'Oui. Plusieurs salariés sont bloqués et une échéance approche.',prematureFeedback:'Il faut connaître les personnes concernées et le délai.'},{label:'Incident sans impact, à reporter à la semaine prochaine',correct:false,feedback:'Plusieurs utilisateurs sont empêchés de travailler.'},{label:'Simple demande de matériel',correct:false,feedback:'Un service utilisé habituellement ne fonctionne plus.'}],
correction:{title:'Que proposes-tu ?',label:'Enregistrer un incident prioritaire selon la matrice du service',requiredChecks:['users','delay'],observation:'Le ticket indique le service touché, l’échéance et les symptômes.'},
verification:{title:'Que contrôler ?',label:'Vérifier que le ticket reflète bien impact et urgence',check:()=>true,observation:'Qualification cohérente et traçable.'},success:'La qualification est étayée par des faits.'},
investigation:{...common,title:'Où commencer les contrôles ?',minimumChecks:2,
 workTitle:'Poursuivre le diagnostic et les essais',
 workPrompt:'Observe les résultats. Tu peux essayer une autre méthode puis effectuer de nouveaux contrôles.',
 interventionTitle:'Essais possibles',closeLabel:'Terminer le diagnostic',
 groups:[
  {title:'Utilisateur',checks:[
   {id:'symptom',label:'Demander ce qui se passe',observation:'Le document PDF est lisible à l’écran. Les lignes disparaissent dans l’aperçu avant impression.'},
   {id:'other',label:'Essayer un autre PDF',observation:'Un autre PDF s’affiche et s’imprime correctement.'}
  ]},
  {title:'Logiciel',checks:[
   {id:'preview',label:'Observer l’aperçu avant impression',
    observation:'Les lignes manquent déjà dans l’aperçu de ce fichier.',
    verify:()=>({executed:true,passed:investigationAlternativeReader,
     observation:investigationAlternativeReader?'Avec le second lecteur, les lignes apparaissent dans l’aperçu du PDF.':'Avec le lecteur initial, les lignes manquent toujours dans l’aperçu du PDF.'})},
   {id:'printer',label:'Contrôler le voyant de l’imprimante',observation:'L’imprimante est disponible, sans alerte.'},
   {id:'print',label:'Effectuer une impression test',observe:()=>({executed:true,observation:'Le document PDF présente encore des lignes manquantes à l’impression.'}),
    verify:()=>({executed:true,passed:investigationAlternativeReader,
     observation:investigationAlternativeReader?'Le document imprimé avec le second lecteur est complet.':'L’impression réalisée avec le lecteur initial présente toujours des lignes manquantes.'})}
  ]}
 ],
 hypotheses:[
  {label:'Le problème apparaît avant la sortie papier, lors de la préparation de ce PDF',
   correct:true,requiredChecks:['symptom','preview'],feedback:'L’aperçu confirme que le défaut existe avant l’impression.',
   prematureFeedback:'Compare le symptôme et l’aperçu avant de conclure.'},
  {label:'Le câble réseau de l’imprimante est forcément coupé',correct:false,feedback:'Le défaut est visible avant l’envoi à l’imprimante.'},
  {label:'Tous les documents sont corrompus',correct:false,feedback:'L’autre PDF fonctionne.'}
 ],
 getRevision:()=>investigationRevision,
 interventions:[
  {id:'retry',label:'Réessayer l’impression avec le lecteur actuel',execute:()=>({
   executed:true,changed:false,observation:'Le second essai présente les mêmes lignes manquantes. Aucun réglage n’a changé.'
  })},
  {id:'reader',label:'Ouvrir le PDF dans un autre lecteur',execute:()=>{
   const changed=!investigationAlternativeReader;
   investigationAlternativeReader=true;
   if(changed)investigationRevision++;
   return {executed:true,changed,observation:'Le PDF est maintenant ouvert dans un autre lecteur. Effectue un nouvel aperçu et une impression test.'};
  }}
 ],
 canClose:({revision,interventions,verifications})=>{
  const attempted=interventions.some(x=>x.id==='reader'&&x.executed);
  const preview=verifications.some(x=>x.id==='preview'&&x.revision===revision&&x.passed);
  const print=verifications.some(x=>x.id==='print'&&x.revision===revision&&x.passed);
  return {allowed:investigationAlternativeReader&&attempted&&preview&&print,
   feedback:'Confirme le résultat par un nouvel aperçu et une impression test après avoir essayé un autre lecteur.'};
 },
 success:'Diagnostic terminé : le nouvel aperçu et l’impression test confirment le résultat. Note les essais réalisés dans le ticket.'
},
final:{...common,title:'Où veux-tu intervenir ?',minimumChecks:3,
 workTitle:'Compléter l’investigation',
 workPrompt:'La panne n’est pas réparée. Vérifie tes constats et prépare une transmission argumentée.',
 interventionTitle:'Actions professionnelles',closeLabel:'Terminer le diagnostic',
 groups:[
  {title:'Utilisateur',checks:[
   {id:'message',label:'Lire le signalement',observation:'À 9 h, quatre personnes de l’accueil ne peuvent plus ouvrir le dossier partagé « Accueil ». Un message indique « Accès refusé ». Elles ont besoin du dossier pour recevoir les visiteurs.'},
   {id:'who',label:'Demander qui est touché',observation:'Quatre personnes du même service. Les autres services accèdent à leurs dossiers.'}
  ]},
  {title:'Poste',checks:[
   {id:'network',label:'Tester l’accès à un autre partage',observation:'Sur le PC de Léa, un autre partage réseau s’ouvre normalement.',
    verify:()=>({executed:true,passed:true,observation:'Un autre partage réseau fonctionne toujours sur le PC de Léa.'})},
   {id:'login',label:'Vérifier la session utilisateur',observation:'Léa est connectée avec son compte habituel. Le même problème touche trois collègues.'}
  ]},
  {title:'Serveur',checks:[
   {id:'folder',label:'Vérifier la disponibilité du dossier',observation:'Le dossier « Accueil » existe. L’administrateur peut l’ouvrir.'},
   {id:'rights',label:'Consulter les autorisations du dossier',
    observation:'Le groupe « Accueil » n’apparaît plus dans la liste des groupes autorisés. Modifier ces droits nécessite une habilitation administrateur.',
    verify:()=>({executed:true,passed:true,
     observation:'Les autorisations consultées confirment que le groupe Accueil est absent. Leur modification relève d’un administrateur habilité.'})}
  ]}
 ],
 hypotheses:[
  {label:'Les quatre utilisateurs ne font plus partie du groupe Accueil',correct:false,
   feedback:'On a constaté que le groupe Accueil manque dans les autorisations du dossier. Rien ne montre que les comptes des utilisateurs ont quitté ce groupe.'},
  {label:'Le dossier partagé « Accueil » a été déplacé sur le serveur',correct:false,
   feedback:'Le dossier existe toujours : l’administrateur peut l’ouvrir. Le problème vient des autorisations du dossier.'},
  {label:'Les autorisations du dossier partagé ne donnent plus accès au groupe Accueil',
   correct:true,requiredChecks:['message','network','rights'],
   feedback:'Les tests réseau sont bons, mais le groupe n’a plus les droits sur le dossier.',
   prematureFeedback:'Confirme le symptôme, le fonctionnement d’un autre partage et les autorisations du dossier.'}
 ],
 interventions:[
  {id:'record',label:'Consigner les résultats utiles au ticket',execute:()=>({
   executed:true,changed:false,observation:'Les constats sont prêts pour le suivi : quatre utilisateurs touchés, autre partage accessible, groupe Accueil absent des autorisations.'
  })},
  {id:'handoff',label:'Préparer la transmission au spécialiste systèmes',execute:()=>({
   executed:true,changed:false,observation:'L’intervention sur les droits doit être confiée à un administrateur habilité. La transmission sera enregistrée dans le ticket après le diagnostic.'
  })}
 ],
 canClose:({interventions,verifications,revision})=>{
  const recorded=interventions.some(x=>x.id==='record'&&x.executed);
  const handedOff=interventions.some(x=>x.id==='handoff'&&x.executed);
  const checked=verifications.some(x=>x.id==='rights'&&x.revision===revision&&x.passed);
  return {allowed:recorded&&handedOff&&checked,
   feedback:'Complète les constats, prépare la transmission et confirme les autorisations avant de terminer le diagnostic.'};
 },
 success:'Diagnostic terminé. L’incident n’est pas réparé : ajoute maintenant le suivi au ticket, puis organise l’intervention du spécialiste.'
}
};
window.INCIDENTS_SCENARIOS=scenarios;
})();