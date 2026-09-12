# Derovia

Site vitrine de Derovia (IA & automatisation), construit comme un deck de quatre
diapositives plein écran. La dernière est un parcours conversationnel qui
qualifie le besoin du visiteur, puis transmet une synthèse structurée.

Aucune dépendance, aucune étape de compilation : `public/` est publié tel quel.

## Développement local

```bash
cp .env.example .env      # puis renseignez GROQ_API_KEY
python server.py
```

Le site est disponible sur <http://localhost:8001>. Python 3.9 ou plus récent
suffit — `server.py` n'utilise que la bibliothèque standard.

## Mise en ligne sur Netlify

1. **Relier le dépôt** — sur Netlify, *Add new site → Import an existing
   project*, puis choisir ce dépôt GitHub. `netlify.toml` fournit déjà toute la
   configuration : rien à saisir dans l'assistant.
2. **Déclarer la clé d'API** — *Site configuration → Environment variables →
   Add a variable* :

   | Clé            | Valeur                    | Portée         |
   | -------------- | ------------------------- | -------------- |
   | `GROQ_API_KEY` | votre clé Groq            | Functions      |

   La clé ne vit que là. Elle n'apparaît jamais dans le dépôt, ni dans le code
   servi au navigateur : celui-ci n'appelle que `/api/groq`, et c'est la
   fonction Netlify qui ajoute l'en-tête d'autorisation.
3. **Déployer** — le premier déploiement part automatiquement, puis à chaque
   `git push` sur la branche principale.
4. **Brancher la boîte mail** — voir la section suivante.

> Ne jamais committer `.env`, ni coller la clé dans `netlify.toml` : ces deux
> fichiers partent sur GitHub. `.gitignore` exclut déjà `.env`.

## Recevoir les besoins par courriel

Chaque parcours terminé arrive dans *Forms → besoin* sur Netlify. Pour qu'il
arrive aussi dans une boîte mail :

*Site configuration → Forms → Form notifications → Add notification → Email
notification*, puis choisir le formulaire `besoin` et saisir l'adresse.

Rien d'autre à installer : ni clé, ni service tiers, ni dépendance. Le socle
gratuit de Netlify couvre **100 envois par mois**, largement au-dessus de ce que
produit un site de prospection ; au-delà, l'option est payante.

**Quelle adresse ?** Une boîte dédiée plutôt que la messagerie personnelle : les
besoins qualifiés se retrouvent, se transfèrent et se partagent à deux sans
fouiller. Tant que le domaine n'est pas déposé, n'importe quelle adresse
gratuite convient. Une fois `derovia.fr` en main, le plan gratuit de Zoho Mail
héberge `contact@derovia.fr` sans frais.

**Ce que contient le courriel.** L'objet porte le métier et l'adresse
(`Derovia — Menuisier — jean@…`), et chaque information a son propre champ :

    subject   Derovia — Menuisier — jean@menuiserie-durand.fr
    email     jean@menuiserie-durand.fr
    company   Menuiserie Durand
    metier      Menuisier
    besoins     Devis à rédiger à la main · Relances clients oubliées
    volume      30 devis par mois
    gainTemps   environ 10 h par mois
    gainArgent  de l'ordre de 3 400 €
    echange     Prospect : Je suis menuisier

              Derovia : Combien de devis rédigez-vous par mois ?

              Prospect : 30 environ

`echange` conserve le dialogue entier : ce que le prospect a écrit de sa main
vaut souvent plus que la synthèse.

La mise en forme est construite dans [api.js](public/assets/js/api.js).
Netlify n'enregistre que les champs déclarés dans le formulaire caché en tête
d'[index.html](public/index.html) : ajouter une ligne à `SUMMARY_FIELDS`
suppose d'ajouter aussi l'`<input>` correspondant, sinon le champ est envoyé
mais jamais retenu.

## À compléter avant la mise en ligne

Les pages légales sont rédigées mais seize valeurs ne peuvent venir que de vous.
Elles sont signalées en jaune dans la page, impossibles à manquer : cherchez
`class="todo"` dans le code, ou ouvrez simplement les deux pages.

**`public/mentions-legales.html`** — dénomination sociale, forme juridique,
capital, siège, RCS/SIREN, n° de TVA, téléphone, directeur de la publication
et sa qualité, date de publication. Les coordonnées de Netlify sont
pré-remplies : vérifiez-les avant publication.

**`public/confidentialite.html`** — responsable du traitement, adresse, DPO le
cas échéant (sinon supprimer la ligne), mécanisme de transfert hors UE retenu
pour Groq et Netlify, date de publication.

**Ailleurs** — le domaine définitif dans `public/robots.txt` et dans les balises
`og:` de `public/index.html`, plus une image de partage 1200×630.

## Obligations couvertes

| Obligation | Où |
| --- | --- |
| Mentions légales (LCEN art. 6 III-1) | `/mentions-legales.html` |
| Information RGPD (art. 13) | `/confidentialite.html` |
| Information « vous parlez à une IA » (AI Act art. 50) | mention affichée dans le parcours, avant le premier échange |
| Bandeau cookies | **sans objet** — aucun cookie, aucun traceur, aucune ressource tierce |

Le site ne dépose aucun cookie, n'utilise ni `localStorage` ni mesure d'audience
et ne charge aucune ressource depuis un domaine tiers : aucun consentement n'est
requis à ce titre. Cela reste vrai tant qu'aucun outil d'analyse n'est ajouté —
le jour où vous en ajouterez un, un bandeau de consentement deviendra obligatoire.

> L'AI Act n'impose pas d'indiquer qu'une IA a servi à *développer* le site. Il
> impose d'informer le visiteur qu'il *dialogue* avec une IA, ce que fait la
> mention du parcours. Une phrase sur l'assistance par IA lors de la conception
> figure malgré tout dans les mentions légales, par transparence.

## Structure

```
.
├── netlify.toml                    Publication, en-têtes de sécurité
├── netlify/functions/groq.mjs      Proxy vers l'API Groq (production)
├── server.py                       Serveur de développement local
├── .env.example                    Modèle de configuration (copier en .env)
└── public/                         Racine web
    ├── index.html
    ├── mentions-legales.html
    ├── confidentialite.html
    ├── 404.html
    ├── robots.txt
    └── assets/
        ├── favicon.svg
        ├── css/styles.css
        └── js/
            ├── main.js         Point d'entrée : assemble et relie les modules
            ├── config.js       Diapositives, prompts, seuils, durées
            ├── deck.js         Navigation entre diapositives
            ├── menu.js         Panneau listant toutes les sections
            ├── survey.js       Parcours de qualification (4 phases)
            ├── demo.js         Déroulé de la démonstration
            ├── api.js          Appels réseau et validation des réponses
            ├── background.js   Fond organique animé
            └── shaders.js      Shaders GLSL du fond
```

## Les huit diapositives

| # | Section       | Rôle                                                        |
| - | ------------- | ----------------------------------------------------------- |
| 1 | Accueil       | Accroche et double appel à l'action                         |
| 2 | Expertises    | Quatre familles d'automatisation                            |
| 3 | En vidéo      | La présentation animée, en une minute                       |
| 4 | Méthode       | Le déroulé d'un engagement, en quatre temps                 |
| 5 | Démonstration | La même corvée déclinée d'un métier à l'autre               |
| 6 | Rentabilité   | Ce que le temps rendu rapporte, curseur à l'appui           |
| 7 | Télécharger   | La suite Windows, et l'avertissement qui va avec            |
| 8 | Parcours      | Qualification conversationnelle et transmission du besoin   |

L'ordre et les intitulés viennent de `SLIDES` dans
[config.js](public/assets/js/config.js) : ajouter une entrée et la section
correspondante dans `index.html` suffit, la navigation et les repères latéraux
s'ajustent seuls.

## Naviguer

| Geste                                   | Effet                       |
| --------------------------------------- | --------------------------- |
| Molette, glissement tactile             | Section suivante/précédente |
| ↑ ↓, Page précédente/suivante, Échap    | Idem                        |
| Origine                                 | Retour à l'accueil          |
| Pastilles à droite, bouton Retour       | Accès direct                |
| Bouton Menu                             | Le panneau de toutes les sections |

Une molette ne franchit qu'une section à la fois : le delta doit dépasser un
seuil, puis une pause d'une seconde laisse la transition se terminer. Toute zone
interne encore défilable — la conversation, une section trop haute pour la
fenêtre — garde la priorité sur le déplacement du deck.

Tout élément portant `data-goto` navigue : un identifiant de section, ou bien
`prev` / `next`.

### Le panneau de navigation

Le menu horizontal gagnait un onglet à chaque section ajoutée. Un seul bouton le
remplace ([menu.js](public/assets/js/menu.js)), qui ouvre un panneau listant
toutes les sections, numérotées et résumées d'une ligne. Les entrées viennent de
`SLIDES` : le champ `resume` n'existe que pour lui.

Le panneau passe **sous** l'en-tête, jamais par-dessus : la marque garde sa
place, et le bouton qui a ouvert referme. Il bascule par `visibility`, pas par
`display` — l'élément reste rendu, donc la transition part au premier coup sans
dépendre d'une image d'animation.

Pendant l'ouverture, le deck et les pastilles sont rendus `inert` : le focus ne
part jamais derrière le panneau. Le clavier du deck se tait de lui-même tant que
`menu-ouvert` est posé sur `<body>` — la règle vit dans
[deck.js](public/assets/js/deck.js) plutôt que d'être interceptée ailleurs, pour
ne dépendre ni de l'ordre d'inscription des écouteurs, ni de la phase de
propagation.

Sur téléphone, c'est un gain net : les liens horizontaux y étaient simplement
masqués, il n'y avait aucun menu.

### Le mode défilement

En dessous de `REQUETE_DEFILEMENT` ([config.js](public/assets/js/config.js)) —
820 px de large **ou** 560 px de haut — le deck cesse d'être un deck : les
sections s'empilent et la page défile normalement.

La raison est un conflit de gestes. Une diapositive plein écran sur un téléphone
oblige à faire défiler l'intérieur d'une section pendant que le glissement sert
déjà à en changer : deux gestes pour un seul doigt, et un contenu comprimé dans
une hauteur qui ne lui convient pas. La hauteur compte autant que la largeur —
un téléphone couché fait 375 px de haut, où aucune section ne tiendrait.

Ce que le mode change :

- `deck.js` cesse d'intercepter molette, glissement et flèches : c'est le
  navigateur qui fait défiler.
- Un `IntersectionObserver` remplace la position imposée. Une marge négative de
  45 % ne laisse passer qu'une bande étroite au milieu de l'écran : une seule
  section la croise à la fois, quelle que soit sa hauteur. Un seuil en
  pourcentage ne se déclencherait jamais pour une section plus haute que la
  fenêtre.
- `goTo` déplace la page au lieu du deck, avec `scroll-margin-top` pour que
  l'en-tête fixe ne recouvre pas la section visée.
- Le pied de page, logé dans l'accueil où il se cale en bas d'écran, rejoint la
  fin du document. Déplacé, jamais dupliqué.
- L'en-tête prend un voile : flottant au-dessus de diapositives centrées il n'en
  avait pas besoin, sur une page qui défile le texte lui passe dessous. Le voile
  est porté par un pseudo-élément en dégradé, dont le flou est fondu par le même
  masque — un fond plein tracé jusqu'à un filet donnait un bandeau blanc coupé
  net. Le calque est un pseudo-élément et non l'en-tête lui-même, sinon le
  masque emporterait aussi la marque et les boutons.
- Le parcours de qualification ne se remet plus à zéro quand on le quitte : on
  ne le quitte pas volontairement, on le dépasse du pouce.

La bascule est vivante : redimensionner la fenêtre au-delà du seuil rebranche
l'autre mode sans rechargement.

**Ce qui disparaît sur petit écran** : les pastilles latérales (la barre du
navigateur dit déjà où l'on en est), le graphique de rentabilité (ses libellés
ne se lisent plus à 280 px de large, et les montants juste en dessous portent
seuls la démonstration), et le mot « Derovia » à côté du monogramme sous 480 px,
qui coûtait exactement la place manquante à l'appel à l'action.

S'y ajoutent deux retraits propres au téléphone et à la rentabilité. Tout ce qui
décrit l'installation disparaît — l'avertissement SmartScreen, sa marche à
suivre, la note du premier lancement : un téléphone n'installe pas une
application Windows, et ces éléments décrivent des moments qui n'arriveront pas
là. Ils reviennent en entier sur l'ordinateur, avant le clic qui compte, si bien
que rien n'est caché à qui s'apprête à installer. À la place, la seule chose
utile ici : `.dl-plateforme`, une ligne qui dit où ça s'installe. Et la ligne
« 6 h × 47 sem. × 28 € = 7 896 € / an » s'efface, parce qu'elle répète le montant
que la carte « Valeur annuelle créée » affiche trois lignes plus bas : côte à
côte les deux se lisaient d'un coup d'œil, empilés c'était deux fois la même
chose.

**Ce qui change de forme.** Empilé tel quel, le site devenait un ruban vertical
de 8 000 px. Trois corrections l'ont ramené à 6 200 sans qu'un mot disparaisse :

- *La largeur utile.* Les cartes s'emboîtaient — gouttière 48, carte de section
  34, panneau intérieur 18 — et il ne restait que 263 px de texte sur un écran
  de 375. En rognant les deux premiers niveaux : 311 px, soit presque une ligne
  gagnée à chaque paragraphe.
- *Les sélecteurs deviennent des rails.* « Plomberie & chauffage » fait 170 px :
  deux pastilles n'ont jamais tenu sur une ligne, et le retour à la ligne les
  empilait une par une — cinq lignes, 275 px. En rail horizontal, 36 px. La
  démonstration y fait glisser le métier retenu au fil de son défilement, en
  déplaçant le rail et jamais la page. Un rail exige `min-width: 0` sur toute
  sa lignée d'ancêtres, sans quoi il élargit la carte au lieu de défiler.
- *L'icône passe à gauche du titre* dans les cartes et les étapes. Une carte
  mesure 80 px au lieu de 130 ; les quatre expertises tiennent désormais sur un
  écran, bouton compris.

⚠ La requête est écrite deux fois, dans `config.js` et dans `styles.css`. Elles
doivent rester identiques : modifier l'une sans l'autre laisserait le script et
la mise en page dans deux modes différents.

## Le parcours de qualification

Quatre phases, portées par `data-phase` sur le conteneur `#survey` :

1. **intro** — la question d'accroche et huit métiers proposés en un clic.
2. **chat** — au plus quatre échanges. Le modèle répond en JSON
   (`message`, `suggestions`, `done`, `summary`), ce qui permet de proposer à
   chaque tour des réponses cliquables et de suivre la progression.
3. **summary** — la synthèse structurée, relue par le visiteur, puis ses
   coordonnées.
4. **sent** — la confirmation.

Ce modèle raisonne avant de répondre et consomme couramment 900 jetons : le
budget est fixé à 2000 pour que la sortie JSON ne soit jamais tronquée, ce que
l'API rejetterait (`json_validate_failed`). Une seconde tentative, après une
courte pause, absorbe un échec ponctuel ou une limite de débit.

## La démonstration

Le même schéma — une charge répétitive, la réponse automatisée, le temps rendu —
défile d'un métier à l'autre. Le propos n'est pas le cas montré mais le fait
qu'il change : l'automatisation se taille à la demande, quel que soit le
domaine. Les cas vivent dans `DEMO_CASES` ([config.js](public/assets/js/config.js)),
[demo.js](public/assets/js/demo.js) ne fait que les mettre en scène. Un clic sur
un onglet fige le métier choisi. Si le visiteur a demandé moins d'animations,
le défilement ne démarre pas.

## La section de téléchargement

L'adresse pointe sur `releases/latest/download/` : elle ne change jamais d'une
version à l'autre, et il n'y a donc pas d'historique des versions à tenir.

Le seul élément à reprendre après une publication est le **numéro de version
affiché**, en clair dans [index.html](public/index.html) — l'oublier reste sans
conséquence, le visiteur reçoit de toute façon la dernière version.

L'avertissement SmartScreen est annoncé avant le clic, jamais après : sans
préavis, la majorité des visiteurs abandonnent devant l'écran bleu de Windows.
L'encadré est bleu et non rouge pour la même raison — il désamorce, il n'alarme
pas. La fenêtre reproduite est une illustration en HTML, pas une capture : rien
à charger, et elle suit le thème du site.

C'est la seule section entièrement fonctionnelle sans JavaScript.

## Sans JavaScript

Le deck ne peut pas naviguer sans JavaScript. Un bloc `<noscript>` le convertit
alors en page qui défile : les cinq sections s'empilent, les repères et le
parcours s'effacent, et une adresse de contact remplace le questionnaire. Le
contenu reste donc entièrement accessible.

## Le fond animé

Rendu WebGL (bruit simplex à déformation de domaine), avec repli automatique sur
un rendu Canvas 2D. Deux uniformes le pilotent :

- `u_transition` — la palette dérive régulièrement de la première à la dernière
  diapositive ;
- `u_calm` — sur le parcours, le fond ralentit et se rapproche de sa teinte de
  base pour ne pas concurrencer la lecture.

## Les deux routes

| Route            | En local (`server.py`)          | En production (Netlify)          |
| ---------------- | ------------------------------- | -------------------------------- |
| `POST /api/groq` | proxy avec la clé du `.env`     | `netlify/functions/groq.mjs`     |
| `POST /`         | ajoute une ligne à `leads.jsonl`| Netlify Forms (formulaire `besoin`) |

Le navigateur envoie exactement la même requête dans les deux cas ; seule
l'implémentation côté serveur diffère.

## Configuration

| Variable       | Rôle                                       | Défaut |
| -------------- | ------------------------------------------ | ------ |
| `GROQ_API_KEY` | Clé d'API Groq (obligatoire)               | —      |
| `PORT`         | Port du serveur local, ignoré sur Netlify  | `8001` |

Le modèle, les consignes qui lui sont données, le nombre d'échanges et les
métiers proposés se règlent dans [config.js](public/assets/js/config.js).
