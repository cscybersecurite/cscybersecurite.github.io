# Contrat prévisionnel des rapports IPcalc / C²

Le module ES `js/report-profiles.js` expose `plannedReports({ context, device, mode })`. Il ne génère aucun document et n'active aucune impression. Tous ses profils portent `status: 'planned'`.

Le contexte est fourni explicitement par le futur adaptateur d'interface : `standalone` ou `c2`, appareil `desktop` ou `mobile`, mode `ipv4`, `flsm`, `ipv6` ou `vlsm`. Ne pas déduire l'intégration C² de l'URL, ni assimiler automatiquement une petite fenêtre d'ordinateur à un smartphone. La détection/classification finale de l'appareil reste à définir lors de l'étape impression.

| Contexte | Mode | Documents prévus | Papier prévu |
| --- | --- | --- | --- |
| Site, ordinateur | IPv4 simple | Fiche élève, corrigé | A4 portrait |
| Site, ordinateur | FLSM | Fiche élève, corrigé | A3 paysage |
| Site, ordinateur | FLSM | Rapport professionnel CyberNet | À définir |
| Site, ordinateur | IPv6, VLSM | Rapport technique professionnel CyberNet | À définir |
| Site, smartphone | FLSM, VLSM | Rapport professionnel CyberNet uniquement | À définir |
| C², tout appareil | FLSM, VLSM | Rapport professionnel CyberNet uniquement | À définir |

Aucun document scolaire sur smartphone ou dans C². Les autres combinaisons smartphone/C² n'ont pas de profil à ce stade. Les champs `paper` et `orientation` des rapports professionnels restent `null` plutôt que d'inventer une spécification.

Les futurs générateurs recevront un résultat validé issu du moteur (`base`, `plan` le cas échéant), un profil choisi et les options du document. Ils ne devront ni relire les champs DOM ni recalculer les réseaux. Les besoins de sélection/formatage pourront réutiliser les fonctions de `js/exports.js`. La présentation du rapport professionnel et celle du document pédagogique resteront distinctes. Le rendu ne doit pas reprendre un calcul invalidé par une modification de formulaire.

`PROFESSIONAL_LOGO` désigne le SVG bleu marine original par une URL relative au module. Les deux SVG d'identité sont locaux et mis en cache par le service worker. Le catalogue n'est pas branché au bouton désactivé : aucun faux flux d'impression n'est présenté à l'utilisateur. L'impression navigateur existante via `print.css` reste indépendante.
