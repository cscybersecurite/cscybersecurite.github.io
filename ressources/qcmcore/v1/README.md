# QCMCore V1.0.1

Moteur de questionnaires d'entraînement, sans note ni serveur. Compatible GitHub Pages, sans dépendances.

## Contenu
- `qcmcore.js` : moteur et validation.
- `qcmcore.css` : cartes neutres, vertes et orange, styles isolés.
- `demo.json` : données de test.
- `demo.html` : page de test indépendante.

## JSON définitif V1
```json
{
  "version": 1,
  "quizzes": [
    {
      "id": "essai",
      "title": "Entraînement réseau",
      "questions": [
        {
          "id": "q-ip",
          "text": "Quelle adresse indique généralement une autoconfiguration IPv4 après un échec DHCP ?",
          "answers": [
            {
              "id": "a",
              "text": "169.254.10.5"
            },
            {
              "id": "b",
              "text": "192.168.1.10"
            },
            {
              "id": "c",
              "text": "8.8.8.8"
            }
          ],
          "correctAnswerId": "a",
          "explanation": "Les adresses 169.254.0.0/16 sont utilisées en autoconfiguration IPv4.",
          "hint": "Recherche le préfixe APIPA, utilisé sans bail DHCP."
        },
        {
          "id": "q-dns",
          "text": "Quel service traduit un nom de domaine en adresse IP ?",
          "answers": [
            {
              "id": "x",
              "text": "DHCP"
            },
            {
              "id": "y",
              "text": "DNS"
            },
            {
              "id": "z",
              "text": "SMTP"
            }
          ],
          "correctAnswerId": "y",
          "explanation": "DNS résout les noms en adresses IP.",
          "hint": "Pense à la résolution de noms."
        },
        {
          "id": "q-port",
          "text": "Quel port UDP le serveur DHCP utilise-t-il ?",
          "answers": [
            {
              "id": "p53",
              "text": "53"
            },
            {
              "id": "p67",
              "text": "67"
            },
            {
              "id": "p443",
              "text": "443"
            }
          ],
          "correctAnswerId": "p67",
          "explanation": "Le serveur DHCP écoute sur UDP 67.",
          "hint": "Le serveur et le client DHCP utilisent deux ports voisins."
        }
      ]
    }
  ]
}
```
Racine : `{ "version":1, "quizzes":[...] }`. Chaque questionnaire possède un `id` unique et `questions`. Chaque question possède `id`, `text`, `answers: [{id,text},...]`, `correctAnswerId`, `explanation`, `hint`. Les identifiants sont stables et uniques dans leur portée. Les drapeaux facultatifs `shuffleQuestions` et `shuffleAnswers` sont booléens, indépendants, et valent `true` par défaut.

## Intégration à un cours
```html
<link rel="stylesheet" href="../qcmcore/v1/qcmcore.css">
<details id="quiz-chapitre"><summary>Je me teste</summary><div id="quiz-container"></div></details>
<script src="../qcmcore/v1/qcmcore.js"></script>
<script>
QCMCore.load('qcm.json').then(data=>{
 QCMCore.bindDetails('#quiz-chapitre','#quiz-container',data,'id-du-questionnaire');
}).catch(error=>console.error(error));
</script>
```
Les chemins sont relatifs à la page qui les utilise. L'ouverture d'un `details` crée un nouveau tirage ; sa fermeture détruit l'instance. Il n'y a pas de nouveau tirage pendant les corrections successives.

API : `QCMCore.load(url)` charge et valide ; `QCMCore.validate(data)` valide des données déjà chargées ; `QCMCore.mount(container,data,id)` monte manuellement un quiz, renvoie `{open,close,destroy,getOrder}` ; `QCMCore.bindDetails(details,container,data,id)` relie un accordéon HTML, renvoie `destroy()`.

Les réponses correctes sont verrouillées après validation ; les réponses incorrectes restent modifiables. Changer une réponse efface uniquement la correction de sa carte. Les questions sans réponse sont signalées comme incomplètes, sans être considérées comme fausses. Un retour de page depuis le cache de navigation (`pageshow.persisted`) réinitialise les réponses.

L'ordre du questionnaire est aléatoire. Deux ouvertures peuvent produire par hasard le même ordre. La liste utilise systématiquement une option vide « Choisir… ». Aucune donnée élève n'est envoyée à un serveur.

La V1 ne prend en charge que les questions à **une seule bonne réponse**. Les fichiers sont servis par HTTP(S), pas par `file://` pour le chargement JSON via `fetch`.

## V1.0.1 : propositions longues sur mobile

Les listes déroulantes restent natives. Lorsqu'une réponse est sélectionnée, son libellé complet est également affiché en dessous, avec retour automatique à la ligne. Cette présentation permet de lire les choix longs sur les navigateurs qui tronquent le texte dans un `<select>`. Aucun changement du JSON, du mélange, de l'évaluation ni de l'API. Les cours chargeant ces fichiers communs bénéficieront de l'amélioration après actualisation du cache.
