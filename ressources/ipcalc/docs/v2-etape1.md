# IPcalc V2 — interface compacte (étape 1.3)

## État de la livraison locale

Branche : `codex/ipcalc-v2-interface`. Version de l'interface et du cache : `2.0.0-step1.3`.

- Interface centrée, largeur maximale 1 080 px. À grande largeur, champs Protocole 170 px, Adresse IP environ 556 px et Masque 240 px ; ils restent fluides et passent en disposition verticale sur petit écran.
- Calculer et le bouton d'impression désactivé sont regroupés au-dessus de l'adresse. Sur ordinateur ils sont sur la ligne du titre 01 ; sur mobile ils précèdent directement l'adresse. Entrée conserve la soumission native du formulaire.
- Résultats IPv4 professionnels, trois méthodes FLSM, numérotation à zéro, pagination et binaire préservés. Toute modification de paramètre efface les résultats périmés.
- Ancien panneau d'export, Copier, CSV et sélection de portée retirés à la demande de l'utilisateur. `js/exports.js` et ses tests sont conservés pour les futurs rapports.
- Logos blanc et bleu marine copiés byte pour byte depuis les fichiers fournis. Le thème choisit le logo local adapté. Le CSS ajuste la taille et recadre uniquement les marges transparentes verticales ; les tracés et couleurs sont intacts.
- IPv6, VLSM et génération des documents non développés. Le futur catalogue de rapports est décrit dans `docs/report-architecture.md`.

## Essai dans Firefox depuis le NAS Synology

Copier tout le contenu de `dist/` dans un dossier web de test du NAS, en conservant cette arborescence (16 fichiers) :

```text
IPcalc-v2/
  index.html
  styles.css
  print.css
  manifest.webmanifest
  sw.js
  js/
    app.js
    ipv4.js
    exports.js
    pwa.js
    report-profiles.js
  icons/
    icon.svg
    icon-192.png
    icon-512.png
    maskable-512.png
    Logo_CyberNet_blanc_transparent.svg
    Logo_CyberNet_bleu_marine_transparent.svg
```

Le dossier `dist/` est généré par `node scripts/build.mjs`. Les mêmes fichiers pris à la racine du dépôt sont équivalents. Ne pas copier les tests, scripts, fichiers package, `.git` ou dépendances de développement. Aucun Node ni serveur local sur le poste de test n'est requis : le NAS sert les fichiers statiques. Ouvrir son URL web terminée par `/`. Les fichiers `.js` doivent être servis avec un type MIME JavaScript.

HTTP sur le NAS ou au lycée : les calculs fonctionnent sans Internet tant que le serveur local est accessible ; aucune bannière HTTPS n'est affichée. Le cache PWA reste réservé aux contextes sécurisés compatibles (HTTPS ou localhost). Cette restriction du navigateur ne bloque pas les calculs HTTP. Sur HTTPS, attendre « Prêt hors connexion » avant un test sans accès au serveur ; les vraies erreurs de préparation du cache et les notifications de mise à jour restent affichées.

Vérifier le résultat initial : `192.168.10.64`, `255.255.255.192`, `/26`, `192.168.10.127`, `62`. En FLSM, utiliser `192.168.10.75/24`, méthode nombre, demande `8` : réseaux visibles 0, 1, 2, 5, 6, 7, adresses extrêmes `192.168.10.0` et `192.168.10.224`. Les intermédiaires sont 3 et 4. Tester aussi hôtes et contraintes combinées, le binaire, Entrée, les paramètres modifiés et les deux thèmes. Une longue adresse IPv6 reste saisissable sans débordement de page, mais son calcul est indisponible.

Sur une installation déjà en cache, accepter « Mettre à jour » pour voir « V2 · étape 1.3 ». La copie sur le NAS et la validation Firefox sont réalisées par l'utilisateur.

## Architecture et intégration C²

- `js/ipv4.js` : moteur ES pur, sans DOM ni réseau, inchangé. Les calculs et le champ historique `number` restent intacts ; l'interface affiche `index` (0 à N−1).
- `js/app.js`, `index.html`, `styles.css` : saisie, état et rendu.
- `js/exports.js` : fonctions internes de sélection, texte et CSV conservées, sans commandes visibles.
- `js/report-profiles.js` : catalogue prévisionnel sans DOM ni génération PDF, distinguant pédagogie et rapports professionnels selon le contexte explicitement fourni.
- `print.css` : impression native du navigateur existante, indépendante du catalogue et du futur générateur PDF.
- `js/pwa.js`, `sw.js`, manifeste : installation et cache autonomes, chemins relatifs, cache limité à la portée du dossier.

C² peut importer le moteur, ou ultérieurement embarquer l'application dans une iframe isolée. Une intégration directe de l'interface comme composant multi-instance nécessitera de scoper les styles et identifiants DOM et de prévoir montage/démontage des événements. Il faudra coordonner les service workers de C² et IPcalc. Aucun dépôt C² n'est modifié et aucun contrat d'échange n'est imposé ici.

## Validation

Les validations des étapes précédentes restent dans l'historique Git (commits `fc6eb7f` et `0fde3f7`). Pour cette étape : tests de calcul et des fonctions internes conservés ; ajout de tests de catalogue de rapports, d'interface d'export absente, des logos par thème, de la saisie longue sur huit largeurs et du comportement HTTP non sécurisé sans bannière. Les scénarios clavier, FLSM, pagination et PWA restent couverts.

Privilégier les vérifications statiques et les tests du moteur. En cas de blocage Windows ou d'environnement, signaler les tests navigateur non exécutés sans multiplier les relances. Firefox et le NAS réels sont validés par l'utilisateur.

Résultat de cette étape (9 octobre 2026) : **56 tests Node et 51 tests navigateur réussis**. Une seule passe navigateur, avec le serveur connu, arrêté après vérification. Edge/Chromium a testé 17 scénarios sur trois formats, dont huit largeurs de 320 à 1 440 px. L'origine HTTP non sécurisée a été simulée via le serveur local, sans contacter le NAS. Les captures sombres desktop/mobile ont été inspectées ; chargement et sélection des deux logos vérifiés automatiquement. Les empreintes SHA-256 des SVG du dépôt correspondent aux fichiers originaux fournis. Build, syntaxe et cohérence des 16 fichiers de `dist/` vérifiés. Aucun moteur de calcul ni fonction interne d'export modifié.


## Lisibilité FLSM — étape 1.3

Le tableau FLSM utilise des valeurs monospace à 16 px et des numéros à 16 px gras, sans dièse. Les en-têtes et messages d'intermédiaires sont à 14 px. Sur ordinateur, les cellules ont 16 px de marge verticale (lignes d'environ 57 px hors binaire). Le binaire FLSM est porté à 12 px. La carte du réseau initial et le formulaire conservent leurs styles.

Sur téléphone jusqu'à 540 px, chaque sous-réseau est présenté dans une carte à une colonne avec les mêmes valeurs à 16 px ; entre 541 et 900 px, la carte dispose de deux colonnes. Le tableau conserve son conteneur de défilement pour les cas qui le nécessitent, sans élargir la page. Les sous-réseaux intermédiaires et non demandés restent consultables avec leur pagination existante.

Le texte de résumé devient « Affichage des 3 premiers et des 3 derniers sous-réseaux. » au-delà de six réseaux. Jusqu'à six, le texte indique toujours que tous les réseaux concernés sont affichés.

L'ancien pictogramme vert a été retiré uniquement de la barre supérieure. Le nom IPcalc, le logo officiel CyberNet adapté au thème, la version et l'état de connexion sont conservés. Les SVG originaux ne sont pas modifiés ; les icônes du manifeste PWA et le favicon sont conservés.

Pour mettre à jour un NAS déjà en étape 1.2, les fichiers applicatifs modifiés sont `index.html`, `styles.css`, `js/app.js` et `sw.js`. Une copie complète des 16 fichiers du dossier `dist/` reste possible. Accepter la mise à jour du cache, le cas échéant, puis vérifier la version 1.3.

Validation étape 1.3 : 56 tests unitaires réussis, 57 tests navigateur réussis en une passe sur Edge/Chromium. Les nouveaux contrôles mesurent les styles calculés (16 px/14 px), la hauteur des cellules et les limites des textes sur huit largeurs de 320 à 1 440 px pour 4, 8 et 16 réseaux. Les numéros 48 et 128, leurs adresses et les déplacements de pagination ont été vérifiés. Les captures desktop/mobile ont été inspectées. Les tests existants HTTP/PWA, modes, clavier et invalidation des résultats restent réussis. Build, syntaxe et conformité des 16 fichiers de `dist/` vérifiés. Aucun moteur ni SVG modifié. La vérification réelle Firefox/NAS reste à effectuer par l'utilisateur ; aucun test Firefox automatisé n'est revendiqué. Serveur de test arrêté après les contrôles.
