# Portfolio de Raphaël Flipo

Site public : https://raphaelflipo.github.io/

Portfolio statique hébergé gratuitement sur GitHub Pages. Aucun serveur PHP, service d'hébergement externe ou abonnement n'est nécessaire.

## Organisation

- `index.html` : accueil, projets, compétences, expériences et contact.
- `assets/refonte.css` : charte graphique et mise en page responsive.
- `aileron-f1/index.html` : page du projet de Sciences de l'ingénieur.
- `aileron-f1/aileron-F1-2019.glb` : modèle 3D issu du STEP original.
- `aileron-f1/vendor/model-viewer.min.js` : visionneuse Google model-viewer 4.1.0 hébergée localement.
- `aileron-f1/vendor/LICENSE` : licence Apache 2.0 de la visionneuse.
- `aileron-f1/visionneuse.js` : état de chargement et adaptation mobile.
- `jarvis/index.html` : présentation, versions et téléchargements de Jarvis.
- `jarvis/app/` : application web autonome Jarvis Local.
- `cv/` et `cv/en/` : CV consultables en français et en anglais.
- `img/` et `fonts/` : médias et polices locales.

Le site de La Boussole est publié séparément depuis `raphaelflipo/la-boussole`, à l'adresse `/la-boussole/`. Ne pas créer un second dossier de même nom dans ce dépôt.

## Modèle F1

Le modèle GLB est chargé automatiquement depuis GitHub Pages. La visionneuse fonctionne sans CDN ni envoi du fichier vers un service externe. Le modèle peut aussi être téléchargé depuis sa page.

Le fichier a été conservé sans modification après son export depuis le STEP fourni :

- Taille : 1 754 320 octets.
- SHA-256 : `c4311c09fc5d96909eabeee4fa281d15a0b99233fbfb86d4519128146afeed50`.
- SHA Git du blob : `007ac6094b739ef0d365eb1840817e2dc25476ce`.

En cas de remplacement, exporter un nouveau GLB depuis le logiciel CAO, vérifier son rendu et actualiser les empreintes dans ce document.

## Sécurité

Les politiques CSP adaptées aux pages sont définies dans les balises `meta` HTML. GitHub Pages ne permet pas de personnaliser librement les en-têtes HTTP `X-Frame-Options` ou `X-Content-Type-Options`. Aucun fichier de configuration d'un hébergeur tiers n'est utilisé.

Les pages publiques n'envoient aucun formulaire à un serveur. Les fonctions web de Jarvis et les liens d'action Firebase du site La Boussole utilisent des CSP spécifiques à leurs besoins. Les codes d'authentification ne doivent jamais figurer dans le dépôt.

## Tests

La pull request lance les contrôles GitHub Actions définis dans `.github/workflows/qualite.yml` :

- `node scripts/audit.mjs` : syntaxe JavaScript, liens locaux, présence des CSP et contrastes de la palette.
- `node scripts/visual-check.mjs` : captures et vérifications Chromium aux largeurs 390, 768 et 1440 pixels, navigation mobile et chargement de la page F1.

Les workflows utilisent Ubuntu 24.04 pour Playwright. Un seul lancement est effectué par mise à jour de la pull request, afin d'éviter les exécutions en double.

## Développement local

Depuis la racine du dépôt :

```sh
python3 -m http.server 8000
```

Ouvrir http://localhost:8000/. Le déploiement public ne dépend pas de Python.

GitHub Pages publie `main` depuis le dossier racine. Conserver `.nojekyll`, `404.html`, `robots.txt` et `sitemap.xml`.

## Mises à jour

Les pages CV et leurs versions PDF/Word sont indépendantes : actualiser tous les formats après une modification du parcours, tout en conservant les noms de fichiers.

L'application Jarvis Local a ses sources principales dans `raphaelflipo/jarvis/local-app/`. Lors d'une mise à jour, copier l'ensemble de `jarvis/app/`, y compris les licences, les dépendances, le manifeste et le service worker. Incrémenter la version du cache dans `sw.js`.

Les polices sont distribuées sous les licences indiquées dans `fonts/licences/`.
