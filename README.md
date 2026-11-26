# Portfolio de Raphaël Flipo

Site public : https://raphaelflipo.github.io/

Portfolio statique hébergé gratuitement sur GitHub Pages. Aucun serveur PHP, service d'hébergement externe ou abonnement n'est nécessaire.

## Organisation

- `index.html` et `en/index.html` : accueil, projets, compétences, parcours et contact dans les deux langues.
- `assets/refonte.css` : charte graphique et mise en page responsive.
- `aileron-f1/index.html` : page du projet de Sciences de l'ingénieur.
- `aileron-f1/aileron-F1-2019.glb` : modèle 3D issu du STEP original.
- `aileron-f1/vendor/model-viewer.min.js` : visionneuse Google model-viewer 4.1.0 hébergée localement.
- `aileron-f1/vendor/LICENSE` : licence Apache 2.0 de la visionneuse.
- `aileron-f1/visionneuse.js` : état de chargement et adaptation mobile.
- `jarvis/index.html` et `en/jarvis/index.html` : présentation, versions et téléchargements de Jarvis.
- `jarvis/app/` : application web autonome Jarvis Local.
- `cv/` et `cv/en/` : CV consultables en français et en anglais.
- `studio-3d/` et `en/studio-3d/` : garage, chronologie et détails W15/W16, avec liens vers les visualisations individuelles et le comparateur dans chaque langue.
- `confidentialite/` et `en/confidentialite/` : mentions légales et confidentialité.
- `img/` et `fonts/` : médias et polices locales.

Le site de La Boussole est publié séparément depuis `raphaelflipo/la-boussole`, à l'adresse `/la-boussole/`. Ne pas créer un second dossier de même nom dans ce dépôt.

## Modèle F1

Les fichiers GLB sont chargés depuis GitHub Pages à la demande. Les pages affichent immédiatement les rendus du modèle. Une fois la scène activée, les vues prédéfinies et les commandes au clavier offrent une alternative aux gestes de rotation. Le GLB de l’aileron est également téléchargeable. Les visionneuses utilisent des dépendances hébergées avec le site.

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

- `node scripts/audit.mjs` : syntaxe JavaScript, liens locaux, présence des CSP, contrastes et cohérence des URL canoniques, des langues et du sitemap.
- `node scripts/visual-check.mjs` : captures et vérifications Chromium à 390, 768 et 1440 pixels, avec navigation mobile, visionneuses et comparateur 3D.
- Le workflow produit quatre rapports Lighthouse pour comparer l’accueil mobile et ordinateur au commit de base de chaque pull request. Le résumé est visible dans GitHub Actions.

Les workflows utilisent Ubuntu 24.04 pour Playwright. Un seul lancement est effectué par mise à jour de la pull request, afin d'éviter les exécutions en double.

## Développement local

Depuis la racine du dépôt :

```sh
python3 -m http.server 8000
```

Ouvrir http://localhost:8000/. Le déploiement public ne dépend pas de Python.

GitHub Pages publie `main` depuis le dossier racine. Conserver `.nojekyll`, `404.html`, `robots.txt` et `sitemap.xml`.

Dans la propriété Search Console du site, vérifier que la méthode de la balise HTML est toujours active puis soumettre `sitemap.xml` dans la rubrique Sitemaps. Les entrées bilingues portent des liens réciproques vers leurs traductions. Vérifier leur prise en compte avec l’inspection d’URL.

## Mises à jour

Les pages CV et leurs versions PDF/Word sont indépendantes : actualiser tous les formats après une modification du parcours, tout en conservant les noms de fichiers.

L'application Jarvis Local a ses sources principales dans `raphaelflipo/jarvis/local-app/`. Lors d'une mise à jour, copier l'ensemble de `jarvis/app/`, y compris les licences, les dépendances, le manifeste et le service worker. Incrémenter la version du cache dans `sw.js`.

Les polices sont distribuées sous les licences indiquées dans `fonts/licences/`.

## Portfolio et dossiers d’ingénierie

- `projets/` et `en/projets/` regroupent les projets et études de cas. Les filtres restent dans le navigateur. Le raccourci Cmd + K ou Ctrl + K charge la recherche rapide à la demande.
- `telechargements/` centralise les actifs déjà publiés et les documents CV. Les conditions de compatibilité restent sur la fiche de chaque produit.
- `statut/` lance, à la demande, des requêtes HEAD vers les pages publiques. Le délai affiché correspond à une requête du navigateur. Ce contrôle porte sur la page consultable.
- Le garage charge une monoplace à la fois. Les dossiers `ingenierie/` séparent faits publics, principes physiques et reconstitution Blender. Les mesures du comparateur s’appliquent aux exports consultés.
- Le service worker Jarvis reste sous `jarvis/app/`. Le portfolio utilise ses pages statiques et les CV téléchargeables. Une installation hors ligne du portfolio demanderait une politique de mise à jour des pages partagées avec les applications sur la même origine.

### Étendre la collection

La W11 et la W12 permettraient d’illustrer l’architecture qui précède le règlement 2022. La W17 demande une documentation propre au règlement 2026, notamment pour ses deux ailerons à géométrie variable. La W196 nécessite de choisir une carrosserie et une configuration de course avant de réunir des références. Une fiche documentaire seule et un modèle 3D validé constituent deux étapes distinctes. [Présentation de la W17 par Mercedes](https://www.mercedesamgf1.com/news/mercedes-amg-f1-2026-challenger-w17-revealed)

### Contrôles des parcours

`node scripts/parcours-v3.mjs` exerce les pages clés, la recherche, le raccourci clavier et le contrôle de disponibilité. La matrice de pull request utilise Chromium, WebKit, Firefox, Chrome et Edge sur les runners publics standards.

### Publication de Jarvis Local

Le répertoire `local-app` de [raphaelflipo/jarvis](https://github.com/raphaelflipo/jarvis/tree/main/local-app) est la source de référence. Intégrer les changements web dans ce dépôt, puis copier le répertoire complet vers `jarvis/app` et reporter le commit dans `scripts/jarvis-source.txt`. Le contrôle de publication compare les arbres Git complets avec la source épinglée et avec la branche principale.

### Reproduction des ateliers de composants

Les six exports dans `assets/composants/mercedes-*.json` relient les triangles des GLB d’origine aux objets des projets Blender. Le script `scripts/composants/exporter.py` lit un maître Blender, son GLB publié et un chemin JSON de sortie. L’index conserve les groupes par primitive et l’empreinte SHA-256 du GLB. Le navigateur partage les attributs de sommets et les matériaux d’origine et partitionne uniquement la liste des triangles. Le mode éclaté déplace des ensembles existants. Les marquages non attribués restent des éléments de contexte. Sur la W13, la rampe correspond aux objets Blender nommés. Sur les W14, W15 et W16, une section sur la remontée arrière de chaque demi-tunnel délimite une région pédagogique. Le barycentre des faces détermine leur côté de cette limite. Les roues proposent trois sélections supplémentaires, pneumatiques, jantes et flasques, freins et écopes. La projection orthographique utilise une caméra à rayons parallèles et se conserve dans le lien partagé. Les fentes sont des vides entre profils.
