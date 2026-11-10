# Portfolio de Raphaël Flipo

Site : https://raphaelflipo.github.io/

HTML, CSS et JavaScript statiques. Aucun framework, installation de dépendances,
compilation, abonnement ou domaine payant n'est nécessaire pour le publier.
Les polices et images sont hébergées dans ce dépôt.

## Modifier le site

- `index.html` : accueil, présentation, expériences et contact.
- `assets/site.css` : couleurs, typographie, mise en page, mobile et impression.
- `assets/site.js` : menu mobile, thème, copie de l'adresse, galerie et impression.
- `assets/theme.js` : lecture du thème enregistré, avant l'affichage.
- `jarvis/index.html` : présentation et installation des deux éditions de Jarvis.
- `jarvis/app/` : application autonome Jarvis Local, moteur et licences inclus.
- `cv/index.html` et `cv/en/index.html` : CV consultables en ligne.
- `cv/*.docx` : CV modifiables dans Word ou un logiciel compatible.
- `cv/*.pdf` : versions diffusées, à remplacer après export des fichiers Word.
- `img/` : portrait et captures existantes ; `fonts/` : polices et licences.

Les textes des pages et les CV sont indépendants : après une évolution du
parcours, modifier les deux pages HTML, les deux Word, puis réexporter les PDF.
Conserver les noms des fichiers PDF pour préserver les liens déjà partagés.

Les variables de couleur sont au début de `assets/site.css`. Le thème suit
le système sauf choix explicite du visiteur, enregistré dans le stockage local
du navigateur (`rf-theme`). Jarvis Local conserve aussi ses modèles et la
conversation sur l'appareil ; ses réglages permettent de les effacer. Les
éléments essentiels du portfolio restent accessibles sans JavaScript ;
l'inférence de Jarvis nécessite JavaScript et WebAssembly. Les animations respectent
la préférence de réduction des mouvements.

## Jarvis Local

L'application est accessible à `https://raphaelflipo.github.io/jarvis/app/`.
Il s'agit d'une bêta web installable, autonome sur l'appareil. Elle ne dépend
pas du serveur Python de l'édition Mac. Le premier téléchargement du modèle
nécessite Internet ; le service worker conserve ensuite l'interface et le
moteur pour le mode hors connexion.

Les sources principales sont maintenues dans `raphaelflipo/jarvis/local-app/`
et copiées ici sans étape de compilation. Pour une mise à jour, copier le
dossier complet, y compris `vendor/`, les licences, le manifeste et le service
worker. Incrémenter la version du cache dans `sw.js` lorsque des fichiers
distribués changent. Ne jamais copier un profil utilisateur ou des modèles
privés dans ce dépôt public.

Le guide et les limites sont dans `jarvis/app/README.md`, les essais réalisés
dans `jarvis/app/VERIFICATION.md`. Les archives publiques sont publiées dans
les releases du dépôt Jarvis. L'édition Mac et la version conversationnelle
installable ont des fonctions et des prérequis distincts.

## La Boussole est un site séparé

Le chemin `/la-boussole/` est publié depuis le dépôt distinct
`raphaelflipo/la-boussole`. Ne pas créer un dossier `la-boussole` dans ce dépôt :
les liens existants mènent déjà au site du projet. Sa démonstration et sa page
d'actions de compte restent dans ce dépôt séparé.

Aucun téléchargement public de l'application n'a été trouvé lors de cette
révision. Le site distingue les plateformes visées, la démo fictive et les
versions réellement publiées. Les tarifs de 0 €, 19 € et 49 € restent prévus,
avec abonnements simulés et sans paiement actif.

## Prévisualiser et publier

Pour une prévisualisation avec un serveur local, depuis ce dossier :

```sh
python3 -m http.server 8000
```

Ouvrir `http://localhost:8000/`. Le lien La Boussole nécessite le site séparé
ou son URL publique. Le site lui-même ne dépend pas de Python.

La publication GitHub Pages actuelle utilise la branche `main`, dossier `/`.
Conserver `.nojekyll`, `404.html`, `robots.txt` et `sitemap.xml`.

Les pages contiennent une politique de sécurité et un bloc de données SEO
JSON-LD. Si ce bloc JSON-LD est modifié, recalculer son empreinte SHA-256
dans la directive `script-src` de la même page. Les autres contenus sont
modifiables sans toucher à cette empreinte. Ne pas ajouter de script ou de
style en ligne : utiliser les fichiers `assets/`.

## État vérifié le 10 novembre 2026

Parcours mis à jour : deuxième année de BUT TC à l'IUT de Roubaix,
marketing digital, e-business et entrepreneuriat, en alternance chez
Florimond Deprez. Les dates professionnelles proviennent du CV précédent.
Les versions française et anglaise du CV tiennent chacune sur une page A4.

Contrôles : liens et ressources locaux, syntaxe JavaScript, navigation,
thèmes, menu clavier, changement de langue, galerie clavier et tailles
320/390/768/1440 px dans un navigateur Chromium. Pas de validation native
distincte sur Safari iOS ou Firefox. Les applications La Boussole et Jarvis
ne sont pas certifiées par ces contrôles du site.

Polices sous SIL Open Font License : voir `fonts/licences/`.
