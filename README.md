# Raphaël Flipo — Portfolio

Site : https://raphaelflipo.github.io/

Portfolio statique en HTML, CSS et JavaScript. Les images et les polices sont
hébergées dans le dépôt. Aucun framework ni compilation n’est nécessaire.

## Pages et fichiers

- `index.html` : présentation, projets, parcours, CV et contact.
- `assets/site.css` : styles, thèmes clair et sombre, mobile et impression.
- `assets/site.js` : navigation, thème, copie de l’adresse et aperçus agrandis.
- `assets/theme.js` : application du thème enregistré avant l’affichage.
- `jarvis/index.html` : présentation, installation et limites de Jarvis.
- `jarvis/app/` : application autonome Jarvis Local et ses dépendances.
- `cv/index.html` et `cv/en/index.html` : CV français et anglais en ligne.
- `cv/*.docx` et `cv/*.pdf` : versions modifiables et téléchargeables des CV.
- `img/` : portrait et captures des applications.
- `fonts/` : polices locales et leurs licences.

La navigation, les pages, les téléchargements et les liens vers les images
restent accessibles sans JavaScript. Les aperçus agrandis, le menu repliable,
le thème mémorisé et la copie de l’adresse sont des améliorations facultatives.
Les animations respectent la préférence de réduction des mouvements.

Le choix de thème est conservé sous la clé `rf-theme` dans le navigateur.
Aucun outil de mesure d’audience ni cookie publicitaire n’est ajouté.

## Mettre à jour le parcours

Les pages HTML et les documents téléchargeables sont indépendants. Après une
modification, actualiser les deux pages CV, les deux Word, puis réexporter les
PDF. Conserver leurs noms pour préserver les liens existants. Vérifier le rendu
sur une page A4 et les propriétés des documents avant publication.

Les pages contiennent un bloc JSON-LD et une politique de sécurité. Après une
modification du JSON-LD, recalculer son empreinte SHA-256 dans la directive
`script-src`. Ne pas ajouter de scripts ni de styles en ligne.

## Jarvis Local

L’application est accessible à https://raphaelflipo.github.io/jarvis/app/.
Ses sources principales sont maintenues dans `raphaelflipo/jarvis/local-app/`.
Pour une mise à jour de l’application, copier le dossier complet, y compris
`vendor/`, les licences, le manifeste et le service worker. Incrémenter la
version du cache dans `sw.js` lorsque des fichiers distribués changent.

Les modèles et conversations de Jarvis sont gérés dans les réglages de
l’application. Ne jamais inclure de profils utilisateurs ou de modèles privés
dans le dépôt public. La page de présentation distingue l’édition web
installable de l’édition native Mac, avec leurs prérequis respectifs.

Le guide d’utilisation et les essais propres à l’application sont dans
`jarvis/app/README.md` et `jarvis/app/VERIFICATION.md`.

## La Boussole

Le chemin `/la-boussole/` est publié depuis le dépôt distinct
`raphaelflipo/la-boussole`. Ne pas créer de dossier `la-boussole` dans ce dépôt.
Le portfolio utilise son URL publique pour que le lien fonctionne aussi
pendant une prévisualisation locale.

## Prévisualiser et publier

Depuis ce dossier :

```sh
python3 -m http.server 8000
```

Ouvrir http://localhost:8000/. Le site publié ne dépend pas de Python.

GitHub Pages utilise la branche `main`, dossier `/`. Conserver `.nojekyll`,
`404.html`, `robots.txt` et `sitemap.xml`.

Avant publication, vérifier les pages sur mobile et ordinateur, les thèmes,
le menu au clavier, la fermeture des aperçus avec Échap, les téléchargements,
les liens vers les deux projets et la console du navigateur. Les contrôles du
portfolio ne remplacent pas les essais des applications présentées.

Polices sous SIL Open Font License : voir `fonts/licences/`.
