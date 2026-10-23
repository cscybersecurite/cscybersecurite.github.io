# IPcalc

Calculatrice IPv4 gratuite, en français, conçue pour les enseignants et les professionnels. Application web native et PWA autonome : tous les calculs ont lieu sur l’appareil, sans API, compte ni historique.

## Utiliser et développer

Node.js 22 ou supérieur suffit pour lancer l’application et les tests du moteur. Node.js 24 est utilisé en CI. Aucune dépendance n’est nécessaire dans le navigateur.

```sh
npm start
```

Ouvrir le port **4173** dans le navigateur local. Le service worker exige HTTPS, sauf sur `localhost` et `127.0.0.1`. Ne pas ouvrir directement `index.html` avec `file://` : les modules JavaScript et la PWA nécessitent un serveur HTTP. Arrêter le serveur avec Ctrl+C. `PORT` et `HOST` sont configurables.

```sh
npm test                 # Moteur et exports : aucune installation npm nécessaire
npm ci                   # Dépendance de développement Playwright, lockfile conservé
npx playwright install chromium  # Seulement si aucun Chromium compatible n’est disponible
npm run check            # Syntaxe JavaScript et tests unitaires
npm run test:e2e          # Parcours Chromium, portrait, paysage sombre et hors connexion
npm run build            # Ressources publiables dans dist/
```

Les tests navigateur utilisent `/IPcalc/`, comme GitHub Pages, et démarrent leur propre serveur sur le port 4173. Libérer ce port avant de les exécuter. Sur Linux, le Chromium de `/usr/bin/chromium` est utilisé s’il existe ; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` permet de choisir un autre exécutable. Le dossier `dist/` ne contient que les ressources de l’application, sans outils, tests ni dépendances npm. Il peut être servi avec `node scripts/serve.mjs dist`.

Pendant le développement, le cache PWA peut conserver une ancienne version des fichiers. Dans les outils du navigateur, activer le contournement du service worker pour le réseau, ou désinscrire le service worker et effacer uniquement le cache IPcalc local avant de recharger. Garder le cache actif pour la recette hors connexion.

## Fonctionnalités V1

- Saisie IPv4/CIDR ou IPv4 et masque décimal ; masques contigus et préfixes `/0` à `/31`.
- Cinq informations : adresse réseau, masque décimal, préfixe CIDR, broadcast, hôtes utilisables. Aucun affichage des premières/dernières adresses d’hôte.
- `/31` : deux adresses utilisables, « Sans broadcast ».
- FLSM par nombre de sous-réseaux, minimum d’hôtes ou les deux. La méthode hôtes choisit le préfixe le plus long compatible ; 1 ou 2 hôtes produisent des liaisons `/31`.
- Jusqu’à six sous-réseaux : tous. Ensuite : trois premiers et trois derniers du périmètre concerné. Dix demandés donnent les numéros 1, 2, 3, 8, 9 et 10, même si la capacité est seize.
- Intermédiaires et sous-réseaux non demandés dans deux sections distinctes, par pages de 50. Aucun tableau de millions d’adresses n’est créé.
- Binaire désactivé par défaut ; bits réseau verts et bits hôte bruns, également soulignés. Thème automatique et interface responsive.
- Copie et CSV UTF-8 avec BOM, point-virgule et CRLF. Le périmètre figure dans l’export : visibles, demandés ou ensemble. Les lignes visibles incluent les pages détaillées ouvertes. Limite de **10 000 réseaux** pour la copie comme pour le CSV, vérifiée avant allocation.
- Les résultats modifiés mais non recalculés ne peuvent pas être copiés/exportés.
- Installation Android et cache hors connexion ; toutes les ressources sont locales.

## Architecture

| Fichier | Rôle |
| --- | --- |
| `js/ipv4.js` | Moteur pur : analyse, calculs, FLSM et pagination ; sans DOM ni accès réseau |
| `js/exports.js` | Sélection du périmètre, CSV et texte ; copie injectée pour les tests |
| `js/app.js` | Formulaire, rendu, interactions et téléchargements |
| `js/pwa.js` | Installation, état du cache et mise à jour |
| `sw.js` | Cache versionné isolé par périmètre de l’application |
| `manifest.webmanifest`, `icons/` | Installation PWA et icônes locales |
| `scripts/` | Serveur local et assemblage des ressources statiques |
| `tests/` | Tests Node et parcours Playwright |

Le moteur utilise des entiers JavaScript exacts inférieurs à `2 ** 32` et des divisions, sans opérations binaires signées sur 32 bits.

Pour une future page PHP de C², copier ces ressources sur le serveur local et importer le moteur côté navigateur :

```js
import { parseNetwork, planSubnets, subnetAt } from './js/ipv4.js';
const network = parseNetwork('192.168.10.75/26');
const plan = planSubnets(network, { method: 'count', count: 4 });
console.log(subnetAt(plan, 0));
```

Les modules sont indépendants de la session C². Le calcul sur un serveur local HTTP ne demande aucun accès Internet ; l’installation PWA et les service workers exigent HTTPS ou localhost. Aucune intégration C², transmission automatique ni modification de base de données n’est développée ici.

## PWA et mises à jour

Ouvrir une première fois IPcalc en ligne et attendre **« Prêt hors connexion »**. Installer depuis le bouton proposé par Chrome Android ou le menu du navigateur. Le bouton dépend des capacités du navigateur et disparaît lorsque l’installation est terminée. Firefox Windows peut utiliser le cache hors connexion sans offrir l’installation native.

Le service worker prépare toutes les ressources avant activation. Il sert une version cohérente depuis le cache et vérifie les mises à jour au lancement et au retour de la connexion. Une nouvelle version reste en attente jusqu’au bouton **« Mettre à jour »**, puis la page se recharge et les anciens caches IPcalc de ce périmètre sont supprimés. Les caches d’autres applications sont préservés. Les saisies courantes ne sont pas conservées lors du rechargement ; il n’y a pas d’historique.

À chaque livraison modifiant les ressources, mettre à jour **`package.json`**, **`sw.js`** et la version affichée dans **`index.html`**, puis générer un commit explicite. Le build vérifie que la version du cache correspond à celle du package.

## GitHub Pages

Le workflow `.github/workflows/pages.yml` est préparé :

1. Dans le dépôt GitHub, ouvrir **Settings → Pages → Build and deployment**, choisir **GitHub Actions**.
2. Publier les commits sur `main`, ou lancer **Validate and deploy IPcalc** depuis Actions après leur publication.
3. Le workflow exécute les tests Node et navigateur, assemble `dist/`, puis déploie ce dossier avec les actions officielles Pages. Les pull requests sont testées sans déploiement.
4. Ouvrir l’adresse fournie par le job Pages et vérifier l’installation sur Android.

Les chemins relatifs, le manifeste et le scope du service worker conviennent au sous-chemin `/IPcalc/`. La configuration ne publie rien à elle seule : une exécution réussie sur GitHub est nécessaire. Aucun jeton personnel, secret applicatif ni serveur de calcul n’est requis.

## Validation et périmètre

Voir [la procédure de recette](docs/validation.md), [le cahier des charges](docs/cahier-des-charges.md) et [le journal des versions](CHANGELOG.md).

La V1 exclut IPv6, VLSM, `/32`, comptes, base de données, historique, application Android native et intégration C². Les contrôles Playwright sur profils mobiles restent une émulation ; la recette physique Firefox Windows et Chrome Android est requise avant de déclarer ces plateformes validées.
