# Maintenance du portfolio

## Contenus et liens

- Parcours et projets. Modifier les pages françaises et leurs équivalents sous `en/`. Une page avec une URL publiée conserve son chemin.
- CV. Modifier les deux pages `cv/` et les quatre documents conservés à leurs URL actuelles. Les scripts `lire-cv-word.py`, `composer-cv-word.py` et `exporter-cv.swift` permettent le contrôle du texte et le renouvellement des fichiers à partir de la même source. Ouvrir les documents et vérifier leur pagination avant publication.
- Articles et glossaire. Actualiser les deux langues, les liens réciproques et le sitemap. Exécuter `python3 scripts/generer-index-recherche.py` et inclure l’index généré dans le commit.
- Studio. Préserver les originaux Blender. Ajouter les exports Web et leur aperçu statique, puis actualiser les données de collection, le garage, le dossier d’ingénierie et les liens. Vérifier l’attribution des mesures et les interactions avec les modèles précédents.
- Jarvis. Effectuer les modifications dans le dépôt source. Reporter le répertoire `local-app` dans `jarvis/app` et actualiser `scripts/jarvis-source.txt`. Vérifier la migration du cache avant de publier.
- La Boussole. Modifier le dépôt associé et vérifier la démonstration avec des données fictives dans les deux langues.

## Publication et restauration

Ouvrir une pull request vers `main`. Vérifier les contrôles GitHub Actions et relire les fichiers modifiés. Comparer Lighthouse dans des conditions identiques et vérifier le studio à froid séparément. Après fusion, ouvrir les URL publiques et vérifier les nouvelles ressources. En cas de régression, annuler les commits concernés avec un nouveau commit de réversion pour conserver l’historique.
