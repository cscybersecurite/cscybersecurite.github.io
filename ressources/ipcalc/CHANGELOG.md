# Journal des versions

## 1.0.0 — 8 octobre 2026

- Moteur IPv4 réutilisable, `/0` à `/31`, masques contigus et normalisation d’adresses d’hôte.
- Découpage FLSM selon trois méthodes avec diagnostic des contraintes impossibles.
- Règle papier, pagination et séparation des sous-réseaux demandés et supplémentaires.
- Interface française responsive, thèmes automatiques et binaire facultatif.
- Copie et exports CSV bornés, UTF-8 et point-virgule.
- PWA avec ressources locales, icônes d’installation, cache versionné et activation choisie des mises à jour.
- Tests Node et Chromium, documentation de recette et workflow GitHub Pages.

Validation de livraison : 53 tests Node et 30 parcours Chromium réussis, dont le lancement hors connexion et le calcul sur les trois profils. Installation reproductible avec `npm ci` et build statique validés. Publication GitHub Pages et recette sur Firefox Windows / Chrome Android physiques restent à effectuer.
