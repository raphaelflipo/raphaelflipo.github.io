# ImportClair Pro — phase 1 de lancement

## Décision

Un seul produit : ImportClair Pro, pour les professionnels qui préparent régulièrement des fichiers contacts avant import CRM. Réutiliser la RC1 existante. Tarif expérimental : 49 € par an, renouvellement automatique, accès pendant l’abonnement. Ce tarif remplace la proposition historique de 29 € en paiement unique uniquement pour la nouvelle offre annuelle ; aucun client existant ne doit être migré ou facturé sans accord.

Le prix et la demande restent à valider. Aucune vente, aucun revenu, aucun taux de conversion établi. Le renouvellement repose sur l’usage répété de l’outil, sans promesse de nouvelles fonctions mensuelles. Aucun enrichissement de contacts, connecteur CRM, sauvegarde cloud ou prestation manuelle n’est vendu.

## État réel au 15 novembre 2026

- Historique accessible interrogé et code actuel du portfolio consulté via GitHub. L’intégralité des conversations n’est pas exportée ni accessible comme un dossier exhaustif.
- Archive source RC1 identifiée ; le téléchargement local a échoué sur une erreur DNS. Le moteur Pro existant n’a donc pas été récupéré, inspecté ou retesté pendant cette phase.
- Couche commerciale construite : vitrine, souscription annuelle Stripe, contrôle serveur de l’abonnement à chaque accès, cookies signés, code de récupération, portail de facturation/résiliation, refus des accès non autorisés.
- 22 tests Node passent : 20 tests du Worker avec Stripe simulé et 2 tests de l’adaptateur de prévisualisation. Aucun appel Stripe réel, aucune transaction, aucun déploiement Cloudflare effectué.
- Le logiciel Pro est absent de cette livraison publique ; sa place reste explicitement vide. Aucun code Pro, clé, base clients FD ou renseignement juridique privé n’est publié.
- Vente désactivée par défaut. Le précontrôle doit échouer dans cet état.

## Architecture

Navigateur → Worker Cloudflare → Stripe Checkout et vérification d’abonnement.

Le Worker sert le HTML Pro seulement après vérification. Une fois servi, le logiciel traite les fichiers localement. Le serveur ne reçoit pas les fichiers contacts. Aucun stockage payant, aucune base de données, aucun envoi d’email, aucune API de génération ou d’enrichissement. Le serveur appelle Stripe pour les droits d’accès et la facturation.

L’accès de session dure 30 jours ; le code de récupération dure 400 jours et est renouvelé lors d’une récupération. Une résiliation en fin de période conserve l’accès tant que Stripe indique `active`. Un statut impayé, annulé ou inconnu ferme l’accès au logiciel. Le code de récupération permet aussi de retrouver la facturation d’un abonnement inactif, sans rétablir l’accès au logiciel. L’espace compte affiche alors l’inactivité et le bouton de facturation/résiliation.

`SALES_ENABLED=false` ferme uniquement les nouvelles souscriptions. Les abonnés conservent leur accès et leur facturation ; un paiement déjà commencé peut encore être activé. Ces routes restent protégées par les clés, l’origine configurée et les contrôles d’identité. La présence des informations vendeur est exigée pour ouvrir les ventes, sans bloquer la résiliation si un champ vendeur devient temporairement absent.

Les cookies sont HttpOnly, Secure et SameSite=Lax. Les POST exigent la même origine. Le retour de paiement est lié au navigateur qui a commencé l’achat. L’application privée est isolée sans réseau dans un document sandboxé. Les journaux de requêtes Cloudflare sont désactivés dans la configuration fournie.

## Essai local sans compte

Node 22 ou ultérieur, sans installation de dépendances :

```sh
npm test
npm run preview
```

La prévisualisation écoute sur `http://127.0.0.1:8787` et ne permet aucun paiement. Les requêtes POST transmettent leur corps au Worker ; les erreurs de requête sont contenues. `GET /health` indique séparément l’intégration du produit et l’activation de la vente.

Dans l’environnement utilisé pour cette reprise, l’écoute sur localhost est refusée (`listen EPERM`) et le téléchargement de l’archive Pro échoue toujours par DNS. Les tests de prévisualisation exercent donc l’adaptateur de requête sans ouvrir de port. Aucun essai du logiciel Pro dans un navigateur ni parcours réel Stripe TEST n’est déclaré validé. Les onglets Cloudflare et Stripe affichent encore leurs pages de connexion.

## Raccorder la RC1

Récupérer le HTML Pro autonome déjà produit et vérifier l’archive contre les empreintes RC1. Ensuite :

```sh
node scripts/integrate-pro.mjs /chemin/absolu/ImportClair-Pro.html
```

L’intégrateur écrit un module privé ignoré par Git et modifie l’import de `src/pro.mjs`. Ne jamais pousser ce module dans le dépôt public. L’examen des dépendances et un essai navigateur sont obligatoires : le sandbox peut bloquer le stockage local, les scripts externes, les workers ou certaines fonctions de téléchargement. Adapter le conditionnement de la RC1 après observation, sans prétendre que cette intégration a déjà été validée.

## Configuration et déploiement

Utiliser un compte Cloudflare **Workers Free**, sans passage à une offre payante. Le forfait gratuit a des quotas ; une saturation doit interrompre le service, jamais provoquer une mise à niveau automatique. L’absence de coût fixe n’est pas une garantie de disponibilité illimitée.

Installer une version courante de Wrangler après vérification de sa provenance officielle. Les commandes de déploiement ne sont pas exécutées par ce dépôt :

```sh
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put SESSION_SECRET
wrangler deploy
```

Ces commandes demandent les valeurs dans le terminal. Ne jamais placer de secret dans un argument de commande, un fichier suivi ou une conversation. `SESSION_SECRET` doit être généré aléatoirement avec au moins 32 octets d’entropie. Changer ce secret révoque tous les codes et sessions ; les anciens codes ne sont pas révoqués individuellement dans cette phase.

Renseigner les variables non secrètes dans `wrangler.jsonc` : origine HTTPS exacte, identité complète du vendeur, adresse professionnelle, SIREN, contact support, conditions et confidentialité complètes. Les textes fournis ne sont pas des documents juridiques validés. La vérification de présence du code ne certifie ni leur exactitude ni la conformité de l’activité.

Configurer le portail Stripe pour les factures et la résiliation en fin de période. Activer les reçus, les emails de renouvellement et les relances dans Stripe. Choisir exclusivement la facturation Stripe Billing à l’utilisation, sans engagement fixe, et ne pas activer d’options facturées supplémentaires. Vérifier les frais applicables au compte avant activation. Taxes, remboursements, contestations et obligations du vendeur restent à traiter ; aucune garantie de coût nul absolu n’est faite après commercialisation.

Faire d’abord le parcours avec une clé Stripe TEST : achat à 49 EUR/an, retour de paiement, import/export RC1, récupération sur un deuxième navigateur, facturation et résiliation. La vitrine n’affiche pas de badge de test : garder les essais privés et ne jamais communiquer de lien commercial avant passage au réel validé.

L’activation `SALES_ENABLED=true` n’est admise qu’après ces essais, le raccordement RC1 et le renseignement des informations du vendeur. `npm run check` vérifie la présence des données depuis les variables de l’environnement local ; il ne charge pas automatiquement `wrangler.jsonc` et n’effectue aucun achat.

## Limites avant ouverture commerciale

- Pas de preuve de demande payante ni de trafic suffisant. Le portfolio est un point d’orientation futur, pas une audience acquise. Aucune prospection n’a été envoyée.
- Pas de déploiement en production ni de test de l’API Stripe réelle. La compatibilité du bundle et du sandbox reste inconnue jusqu’au raccordement RC1.
- Pas de webhook ni de livraison par email. Le droit d’accès est vérifié directement auprès de Stripe à chaque visite. Si l’acheteur ferme son navigateur avant l’activation ou perd son code et son cookie, un rétablissement manuel sera nécessaire. Prévoir cette procédure de support avant la vente.
- Un remboursement ne résilie pas automatiquement un abonnement Stripe ; la procédure du vendeur doit traiter les deux actions. Pas de suppression autonome d’un compte Stripe ni de révocation individuelle des codes dans cette phase.
- Un même acheteur sans session peut souscrire deux fois. Prévoir un compte client vérifié ou un parcours anti-doublon avant d’ouvrir largement.
- Ajouter et tester une protection contre les abus avant ouverture publique. Le forfait gratuit limite les ressources mais ne remplace pas cette protection.
- Le contrôle serveur protège la distribution et les visites ultérieures, pas contre la copie du HTML par un abonné. Ne pas présenter ce mécanisme comme une protection absolue contre le partage.
- Des factures, données de paiement et données d’accès existent chez Stripe/Cloudflare : traitement local des contacts ne signifie pas absence de données personnelles ni conformité RGPD automatique.
- L’objectif est une activité peu chronophage ; support, maintenance et obligations administratives ne disparaissent pas.

## Sources vérifiées

- GitHub Pages exclut l’hébergement d’un commerce ou d’un SaaS commercial : https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Quotas et prix Workers : https://developers.cloudflare.com/workers/platform/pricing/
- Sessions Checkout : https://docs.stripe.com/api/checkout/sessions/create
- Récupération d’une session : https://docs.stripe.com/api/checkout/sessions/retrieve
- Tarifs Stripe France, y compris offre Billing à l’utilisation : https://stripe.com/fr/pricing
- Directive CSP `form-action` : https://www.w3.org/TR/CSP/#directive-form-action — la politique des pages de facturation autorise les origines exactes Stripe Checkout et Billing, sans autoriser le réseau dans le logiciel privé.

Ne pas fusionner les fichiers privés du logiciel dans le site GitHub Pages. Le code de lancement est proposé sur une branche dédiée pour revue ; le site commercial doit être déployé sur Cloudflare après levée des blocages.
