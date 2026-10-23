# Recette IPcalc V1

## Validation automatisée

Les tests Node couvrent les `/8`, `/16`, `/24`, `/26`, `/30`, `/31` et `/0`, la normalisation des adresses, tous les masques contigus pris en charge et les saisies invalides. Ils vérifient les trois méthodes FLSM, les impossibilités et leurs solutions, la règle papier, la pagination, les limites numériques, la copie et les trois périmètres CSV.

Les parcours Playwright utilisent le build distribué, monté sous `/IPcalc/`, avec trois profils Chromium : ordinateur, Pixel 7 portrait et Pixel 7 paysage sombre. Ils vérifient les résultats, erreurs, consultations détaillées, exports téléchargés, copie, limites d’allocation, thèmes et absence de débordement jusqu’à 320 pixels. La copie est injectée dans le navigateur de test ; son contenu et l’appel sont vérifiés, les permissions du presse-papiers doivent aussi être vérifiées sur les appareils réels.

Le parcours hors connexion attend l’installation complète du service worker, bloque le réseau puis ouvre une nouvelle page et effectue un calcul `/31` ainsi qu’un découpage combiné. Une requête non mise en cache doit échouer pour prouver la coupure. Chromium récent distingue le blocage réseau de l’état du renderer : les tests coupent également cet état via le protocole DevTools, sans remplacer `navigator.onLine` par un faux résultat JavaScript.

## Résultats dans l’environnement de développement

- Moteur / exports : 53 tests réussis.
- Navigateur : 30 parcours réussis (10 sur chaque profil), sous Chromium 151 dans Linux. Le lancement d’une nouvelle page hors connexion est vérifié sur les trois profils.
- `npm ci`, contrôles de syntaxe et assemblage `dist/` : réussis ; les instructions d’installation ont été rejouées.
- Pas de test physique Windows/Android, d’installation Android réelle ou de publication GitHub dans cet environnement Linux.

## Recette sur Firefox Windows et Chrome Android

À faire sur l’adresse HTTPS fournie par GitHub Pages. Cocher après constat réel, en portrait et paysage lorsque disponible, thème clair puis thème sombre de l’appareil.

- [ ] `192.168.10.75/26` → réseau `192.168.10.64`, masque `255.255.255.192`, `/26`, broadcast `192.168.10.127`, 62 hôtes.
- [ ] Adresse `192.168.10.75` et masque séparé `255.255.255.192` → même résultat.
- [ ] `10.0.0.1/31` → réseau `10.0.0.0`, deux hôtes et « Sans broadcast ».
- [ ] `256.1.2.3/24`, masque `255.0.255.0`, `/32` et préfixe manquant → erreurs compréhensibles.
- [ ] `192.168.10.75/24`, méthode A, dix sous-réseaux → `/28`, capacité seize, numéros 1, 2, 3, 8, 9 et 10.
- [ ] Consulter les intermédiaires 4 à 7 et les non demandés 11 à 16 dans leurs sections distinctes.
- [ ] Même réseau, méthode B, 30 hôtes → huit réseaux `/27` ; méthode C, trois réseaux et 50 hôtes → trois réseaux `/26`.
- [ ] Même réseau, cinq réseaux et 50 hôtes → impossibilité expliquée avec alternatives.
- [ ] Binaire activé : 32 bits, frontière réseau/hôte correcte ; désactivé au lancement suivant.
- [ ] Copie autorisée, refusée, puis CSV ouvert dans Excel/LibreOffice : accents, cinq colonnes, périmètre explicite.
- [ ] `/0` et deux hôtes par réseau : résumé immédiat, pagination de 50 ; export complet refusé avant génération.
- [ ] Navigation clavier, focus visible, saisie tactile, lecture et absence de débordement dans les deux orientations.
- [ ] Première ouverture en ligne : attendre « Prêt hors connexion ».
- [ ] Chrome Android : installer, fermer IPcalc, activer le mode avion, relancer depuis son icône et refaire les calculs, y compris FLSM et CSV.
- [ ] Firefox Windows : charger en ligne, couper le réseau, fermer l’onglet, rouvrir la même adresse ; vérifier les calculs depuis le cache.
- [ ] Retour en ligne : publier une version avec un cache incrémenté, rouvrir, observer la proposition de mise à jour et l’activer. Vérifier la nouvelle version hors connexion.

L’éviction ou l’effacement des données du navigateur supprime le cache hors connexion ; une nouvelle ouverture en ligne est alors nécessaire. Une session ou un profil de navigateur différent doit préparer son propre cache.
