# Cahier des charges — IPcalc V1
**Projet :** IPcalc — CyberNet
**Destination :** développement avec ChatGPT Codex
**Statut :** spécification V1 prête pour développement

## 1. Objectif

Développer une calculatrice IPv4 gratuite, ergonomique, rapide et utilisable hors connexion.

IPcalc est destinée initialement aux enseignants et aux professionnels de l'informatique. Elle devra pouvoir être intégrée ultérieurement dans l'application pédagogique C², notamment dans les TP de gestion de parc informatique et de réseaux.

L'application doit reprendre les principes de la calculatrice papier existante, notamment l'affichage synthétique des sous-réseaux.

## 2. Plateformes et distribution

IPcalc doit fonctionner :
- Sur ordinateur, notamment avec Firefox sous Windows.
- Sur smartphone Android, notamment avec Chrome.
- En mode portrait et paysage, avec une interface responsive.
- Sans connexion Internet après sa première installation.

L'application sera une **Progressive Web App (PWA)** hébergée gratuitement sur GitHub Pages, dans un dépôt GitHub distinct de C².

Technologies privilégiées : HTML, CSS et JavaScript natif. Aucun serveur PHP, aucune base de données et aucun service distant ne doivent être nécessaires au calcul.

Les ressources nécessaires doivent être hébergées localement dans le projet et mises en cache pour le fonctionnement hors connexion.

## 3. Saisie des données IPv4

L'utilisateur doit pouvoir saisir :
- Une adresse IPv4 avec préfixe CIDR, par exemple `192.168.10.75/26`.
- Une adresse IPv4 avec masque décimal, par exemple `192.168.10.75` et `255.255.255.192`.

IPcalc doit identifier automatiquement l'adresse réseau correspondant à une adresse d'hôte saisie.

Exemple : `192.168.10.75/26` correspond au réseau `192.168.10.64/26`.

Les saisies incorrectes doivent être détectées : adresse invalide, octet hors limites, masque non contigu, préfixe invalide, etc.

La V1 prend en charge les réseaux IPv4 de `/0` à `/31`. Le `/32` est exclu de cette première version.

## 4. Calcul d'un réseau simple

L'utilisateur doit pouvoir calculer les caractéristiques d'un réseau sans demander de découpage en sous-réseaux.

Afficher les cinq informations suivantes :

1. Adresse réseau.
2. Masque en notation décimale.
3. Préfixe CIDR.
4. Adresse de broadcast.
5. Nombre d'hôtes utilisables.

**Ne pas afficher la première ni la dernière adresse d'hôte utilisable.**

Pour les préfixes `/0` à `/30`, appliquer les règles classiques du calcul IPv4.

Pour un `/31`, reconnaître une liaison point à point : deux adresses utilisables et absence de broadcast conventionnel. Afficher « Sans broadcast » à la place d'une adresse de diffusion.

## 5. Découpage en sous-réseaux FLSM

IPcalc doit permettre un découpage en sous-réseaux de taille identique (FLSM), suivant trois méthodes :

**Méthode A — Nombre de sous-réseaux :** l'utilisateur indique combien de sous-réseaux il souhaite obtenir.

**Méthode B — Nombre d'hôtes :** l'utilisateur indique le nombre minimal d'hôtes utilisables par sous-réseau.

**Méthode C — Contraintes combinées :** l'utilisateur indique simultanément le nombre de sous-réseaux et le nombre minimal d'hôtes utilisables dans chacun.

Le moteur doit déterminer le préfixe adapté et vérifier que le découpage est réalisable.

Pour la méthode B, en l'absence de nombre de sous-réseaux demandé, considérer l'ensemble des sous-réseaux possibles.

Pour les méthodes A et C, distinguer les sous-réseaux demandés de la capacité totale du découpage. Ne pas présenter les sous-réseaux supplémentaires comme s'ils avaient été demandés.

En cas d'impossibilité, expliquer la cause et proposer une solution pertinente : réseau initial plus grand, moins de sous-réseaux ou moins d'hôtes par sous-réseau.

## 6. Présentation des sous-réseaux

**Reproduire impérativement la règle de la calculatrice papier.**

- Si le résultat contient au maximum six sous-réseaux, les afficher tous.
- Si le résultat en contient plus de six, afficher uniquement les trois premiers et les trois derniers.
- Insérer des points de suspension entre les deux groupes.
- Indiquer systématiquement le nombre total de sous-réseaux concernés.

Exemple : pour 16 sous-réseaux, afficher les numéros 1, 2, 3, puis 14, 15 et 16.

Lorsque l'utilisateur a demandé exactement dix sous-réseaux, les trois derniers affichés sont les sous-réseaux 8, 9 et 10, même si le réseau permet théoriquement d'en créer davantage.

Chaque sous-réseau affiché doit présenter les mêmes cinq informations qu'un réseau simple : adresse réseau, masque décimal, CIDR, broadcast et nombre d'hôtes utilisables.

Prévoir une commande facultative pour consulter les sous-réseaux intermédiaires, avec un affichage progressif afin d'éviter les listes excessivement longues.

Lorsque le découpage permet davantage de sous-réseaux que demandé, prévoir également une option distincte permettant de consulter les sous-réseaux non demandés.

## 7. Représentation binaire

Prévoir un affichage facultatif des adresses IPv4 en binaire sur 32 bits.

Cet affichage est désactivé par défaut.

Utiliser deux couleurs visuellement distinctes pour différencier les bits réseau des bits hôte, avec un contraste suffisant en thème clair comme en thème sombre.

Le rendu doit rester lisible sur smartphone.

## 8. Interface graphique

Interface en français, simple et adaptée aux écrans tactiles.

Le thème clair ou sombre doit suivre automatiquement les préférences de l'appareil, sans nécessiter de sélection manuelle.

Prévoir une identité graphique sobre, avec une référence discrète à CyberNet.

Séparer clairement :
- La saisie du réseau.
- Les paramètres de découpage.
- Les résultats du calcul.
- Les actions de copie et d'export.

Ne pas créer d'historique des calculs.

## 9. Copie et export

Prévoir :
- Une fonction de copie des résultats.
- Un export CSV compatible avec les tableurs courants.

Utiliser de préférence un CSV UTF-8 avec séparateur point-virgule, adapté à Excel en configuration française.

Les exports doivent respecter les cinq informations définies dans ce cahier des charges et ne doivent pas ajouter les premières et dernières adresses utilisables.

L'export doit préciser le périmètre exporté : sous-réseaux demandés, sous-réseaux visibles ou ensemble des sous-réseaux, selon l'action choisie.

Les exports volumineux doivent être protégés par une limite raisonnable et un message explicatif.

## 10. Performances et robustesse

Les calculs doivent être exacts, y compris pour les grands réseaux IPv4.

Ne jamais générer une liste complète de millions de sous-réseaux uniquement pour afficher les trois premiers et les trois derniers.

Calculer directement les sous-réseaux nécessaires à l'affichage.

Éviter les erreurs liées aux opérations JavaScript sur les entiers signés de 32 bits.

Prévoir une pagination ou un chargement progressif pour la consultation détaillée.

Les calculs et l'interface doivent rester réactifs sur smartphone.

## 11. Fonctionnement hors connexion

L'application PWA doit inclure :
- Un manifeste d'installation.
- Un service worker.
- Un cache versionné des ressources indispensables.
- Une stratégie de mise à jour permettant de récupérer une nouvelle version lorsque Internet est disponible.

Tester explicitement l'installation initiale en ligne, puis le lancement et les calculs en mode avion.

Aucun appel à une API, à un CDN ou à un serveur distant ne doit être nécessaire pendant l'utilisation.

## 12. Architecture pour une future intégration dans C²

**Cette intégration ne doit pas être développée dans la V1.**

Cependant, l'architecture doit permettre de réutiliser IPcalc dans les TP de C² sans dépendance à Internet.

Séparer :
- Le moteur de calcul IPv4.
- L'interface utilisateur.
- Les fonctions propres à la PWA (installation, cache et mise à jour).

Le moteur de calcul doit pouvoir être réutilisé dans une page PHP de C².

L'interface doit pouvoir être distribuée avec ses ressources statiques sur le serveur local de l'établissement.

Les élèves doivent pouvoir utiliser IPcalc depuis leur session C² sans accès Internet, même si l'enseignant a initialement téléchargé ou préparé les fichiers depuis une session connectée.

Aucune communication avec C², transmission automatique de résultats ou modification de sa base de données n'est demandée dans cette version.

## 13. Hors périmètre de la V1

Ne pas développer :
- Le découpage VLSM.
- Le calcul IPv6.
- Le préfixe IPv4 `/32`.
- Un historique des calculs.
- Des comptes utilisateurs.
- Une base de données.
- Une application Android native.
- L'intégration effective dans C².

## 14. Tests et validation

Prévoir des tests automatisés du moteur de calcul couvrant notamment :

- Les réseaux classiques `/8`, `/16`, `/24`, `/26` et `/30`.
- Le cas particulier `/31`.
- Les adresses d'hôtes converties en adresses réseau.
- Les masques décimaux valides et invalides.
- Les découpages FLSM selon chacune des trois méthodes.
- Les contraintes impossibles et les messages associés.
- La sélection exacte des trois premiers et trois derniers sous-réseaux.
- Les cas limites de grands réseaux.
- La copie et l'export CSV.

Effectuer également des vérifications manuelles sur Firefox Windows et Chrome Android, en affichage portrait et paysage, avec et sans connexion Internet.

## 15. Organisation du développement avec Codex

Le projet est indépendant du dépôt GitHub C².

Codex doit :
1. Examiner le dépôt IPcalc avant toute modification.
2. Proposer une architecture simple et maintenable.
3. Développer le moteur de calcul et ses tests.
4. Construire l'interface responsive.
5. Ajouter les fonctions PWA et les exports.
6. Vérifier les tests et documenter les procédures de lancement.
7. Préparer le déploiement GitHub Pages.

Utiliser des commits explicites et conserver la traçabilité des versions.

Ne pas modifier le dépôt C².

**Livrable attendu :** une première version d'IPcalc fonctionnelle, testée, installable sur Android, utilisable hors connexion et conçue pour une future réutilisation locale dans C².
