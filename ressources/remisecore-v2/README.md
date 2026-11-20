# RemiseCore V2 : prototype indépendant

**Ne pas modifier** `ressources/remisecore/` (version utilisée pour le prochain groupe) ni le TP existant.

## Objectif
- Une seule interface de remise, réutilisable entre TP.
- Code de session libre (majuscules, minuscules, signes), défini dans un onglet privé `Sessions`.
- Vérification par Apps Script côté serveur, sans secret dans le JavaScript publié.
- Un onglet `Remises` avec le JSON d'origine et une feuille `TP_<identifiant>` dont les colonnes sont construites depuis les clés des résultats.
- **V2 non déployée, non testée en conditions réelles**. Données fictives uniquement pendant la recette.

## Déploiement manuel (à réaliser ultérieurement)
1. Créer **un nouveau Google Sheets privé**, distinct des tableaux actuels, avec un onglet `Sessions`. Ligne 1 : `Code | Actif | Libelle`. Ligne 2 de test : un code libre, `OUI`, puis une description.
2. Créer un nouveau projet Apps Script lié à ce classeur ou autonome.
3. Copier `Code.gs` et créer un fichier HTML Apps Script nommé exactement `Formulaire`, en collant `Formulaire.html`.
4. Dans les propriétés du script, enregistrer `SPREADSHEET_ID` avec l'identifiant du **nouveau** classeur privé.
5. Après validation institutionnelle, déployer en application Web, avec exécution comme propriétaire et accès sans authentification uniquement si autorisé. Cette configuration donne au code serveur les droits d'écriture : vérifier soigneusement.
6. Tester les codes corrects et incorrects et les colonnes dans ce nouveau classeur, puis intégrer l'URL du déploiement dans l'iframe de `ressources/remisecore-v2/index.html`.

**Important** : le code partagé est un prototype, pas un dispositif anti-spam complet. Un code connu peut être partagé et un point d'entrée public peut subir des tentatives répétées. Prévoir limitation de débit et contrôles supplémentaires avant de traiter des données d'élèves. L'encodage ne constitue pas une protection RGPD. Ne jamais déposer des codes de session ou des données nominatives dans GitHub public.

L'interface Apps Script utilise `google.script.run` pour recevoir une vraie réponse du serveur, ce qui évite la limitation de l'iframe Google Forms précédente.
