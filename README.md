# Derovia

Site vitrine de Derovia (IA & automatisation), construit comme un deck de huit
diapositives plein écran — qui redevient une page défilante sur téléphone. La
dernière est un questionnaire en six étapes qui chiffre le temps perdu, puis
transmet le besoin qualifié.

Aucune dépendance, aucune étape de compilation, aucun appel à un service
extérieur : `public/` est publié tel quel.

## Développement local

```bash
python server.py
```

Le site est disponible sur <http://localhost:8001>. Python 3.9 ou plus récent
suffit — `server.py` n'utilise que la bibliothèque standard.

## Mise en ligne sur Netlify

1. **Relier le dépôt** — sur Netlify, *Add new site → Import an existing
   project*, puis choisir ce dépôt GitHub. `netlify.toml` fournit déjà toute la
   configuration : rien à saisir dans l'assistant.
2. **Déployer** — le premier déploiement part automatiquement, puis à chaque
   `git push` sur la branche principale. Aucune variable d'environnement à
   déclarer : le site ne parle à aucun service extérieur.
3. **Brancher la boîte mail** — voir la section suivante.

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
pour Netlify, date de publication.

**Partout, signalé en jaune** — le **numéro de téléphone** (en-tête, pied de page,
mentions légales), les **prénoms, portraits et zones d'intervention** des deux
fondateurs, et l'**adresse de l'agenda en ligne** derrière le bouton de
réservation qui suit l'envoi du questionnaire. Les portraits se déposent dans
`public/assets/fondateurs/` ; le commentaire à côté de chaque cercle vide
montre la balise à mettre à la place.

**Ailleurs** — le domaine définitif dans `public/robots.txt` et dans les balises
`og:` de `public/index.html`, plus une image de partage 1200×630.

## Obligations couvertes

| Obligation | Où |
| --- | --- |
| Mentions légales (LCEN art. 6 III-1) | `/mentions-legales.html` |
| Information RGPD (art. 13) | `/confidentialite.html` |
| Information « vous parlez à une IA » (AI Act art. 50) | **sans objet** — le questionnaire ne fait plus appel à un modèle de langage |
| Bandeau cookies | **sans objet** — aucun cookie, aucun traceur, aucune ressource tierce |

Le site ne dépose aucun cookie, n'utilise ni `localStorage` ni mesure d'audience
et ne charge aucune ressource depuis un domaine tiers : aucun consentement n'est
requis à ce titre. Cela reste vrai tant qu'aucun outil d'analyse n'est ajouté —
le jour où vous en ajouterez un, un bandeau de consentement deviendra obligatoire.

> L'AI Act n'impose pas d'indiquer qu'une IA a servi à *développer* le site : il
> impose d'informer le visiteur qu'il *dialogue* avec une IA. Le questionnaire
> ayant cessé d'en être une, l'obligation tombe. Une phrase sur l'assistance par
> IA lors de la conception figure malgré tout dans les mentions légales, par
> transparence.

## Structure

```
.
├── netlify.toml                    Publication, en-têtes de sécurité
├── server.py                       Serveur de développement local
├── .env.example                    Modèle de configuration (copier en .env)
└── public/                         Racine web
    ├── index.html                   Le deck
    ├── logiciel.html                Page autonome : la suite Windows
    ├── video.html                   Page autonome : la vidéo seule
    ├── mentions-legales.html
    ├── confidentialite.html
    ├── 404.html
    ├── robots.txt
    └── assets/
        ├── favicon.svg
        ├── css/styles.css
        └── js/
            ├── main.js         Point d'entrée : assemble et relie les modules
            ├── config.js       Diapositives, questionnaire, seuils
            ├── deck.js         Navigation entre diapositives
            ├── menu.js         Panneau listant sections et pages
            ├── formulaire.js   Le questionnaire, en six étapes
            ├── demo.js         Déroulé de la démonstration
            ├── rentabilite.js  Curseur et graphique du retour sur temps
            ├── film.js         Lecture de la vidéo du deck
            ├── api.js          Transmission du besoin
            ├── page-fond.js    Fond des pages autonomes
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
| 7 | Qui nous sommes | Les deux fondateurs : prénom, photo, zone d'intervention  |
| 8 | Parcours      | Le questionnaire en six étapes, et sa transmission          |

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
| Bouton Menu                             | Le panneau des sections et des pages |

Une molette ne franchit qu'une section à la fois : le delta doit dépasser un
seuil, puis une pause d'une seconde laisse la transition se terminer. Toute zone
interne encore défilable — une section trop haute pour la fenêtre — garde la
priorité sur le déplacement du deck.

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
- Aucun panneau ne défile dans son coin. Une zone défilante à l'intérieur
  d'une page qui défile déjà, c'est deux gestes pour un pouce : le
  questionnaire comme les sections prennent leur taille naturelle.

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

## Le questionnaire

Six étapes courtes, décrites en données dans `FORM_STEPS`
([config.js](public/assets/js/config.js)) :
[formulaire.js](public/assets/js/formulaire.js) ne fait que les mettre en page,
les valider et les transmettre. Ajouter une question, c'est ajouter une entrée —
mais il faut aussi déclarer son nom dans le formulaire caché d'index.html,
sinon Netlify ne l'enregistrera jamais.

1. **Votre activité** — métier, taille
2. **Ce qui vous prend du temps** — les corvées, puis la principale
3. **Combien de temps, au juste** — fréquence et durée
4. **Quand ça passe à travers** — ce qu'un oubli coûte
5. **Vos outils d'aujourd'hui** — ce qui décide de la faisabilité
6. **Comment vous joindre** — le récapitulatif à gauche, les coordonnées à droite

La dernière étape se compose en deux colonnes sur grand écran. Empilés, le
récapitulatif et les coordonnées formaient un ruban de 440 px qui débordait de
la carte et faisait apparaître une barre de défilement ; côte à côte, on voit
ce qu'on a répondu pendant qu'on saisit son adresse. Sur téléphone la page
défile, donc une seule colonne — mais l'annulation doit viser exactement les
mêmes sélecteurs que les placements, sinon la seconde colonne renaît en
colonne implicite.

### Le calcul, en direct

L'étape 3 affiche le temps rendu et sa valeur annuelle pendant qu'on déplace les
curseurs, au même coût horaire chargé que la page Rentabilité. C'est le moment
qui décide, et il n'a jamais demandé autre chose qu'une multiplication —
`fréquence × durée × 12 × coût horaire`.

Le site a d'abord confié cet échange à un modèle de langage. Il produisait le
même chiffre, mais après trois secondes d'attente, contre une clé d'API, une
fonction serveur et une limite de huit mille jetons par minute que le palier
gratuit de Groq atteignait dès le troisième tour — le visiteur lisait alors
« une erreur est survenue » au milieu du questionnaire. Le calcul est revenu
dans le navigateur ; il ne peut plus échouer.

En repartant, l'intelligence artificielle a emporté avec elle la fonction
Netlify, la variable d'environnement, la mention obligatoire au titre de
l'article 50 du règlement (UE) 2024/1689, et Groq comme sous-traitant dans la
politique de confidentialité.

### Types de champ

`choix` (une réponse), `multi` (plusieurs), `curseur`, `texte`, `email`, `tel`.
Les pastilles sont de vrais boutons radio et cases à cocher, seulement
habillés : le clavier, le lecteur d'écran et l'état coché fonctionnent sans
qu'on ait à les réécrire.

Un champ peut tirer ses réponses d'un autre (`optionsDe`) : « celle qui vous
coûte le plus » ne propose que les corvées cochées juste avant, et se met à jour
à la coche, pas à l'étape suivante.

⚠ Trois fois dans ce projet, `display: flex` a discrètement annulé l'attribut
`hidden` — sur le panneau de navigation, sur les étapes, sur les boutons. Une
règle `[hidden] { display: none }` accompagne donc chaque composant que le
script masque.

## La démonstration

Le même schéma — une charge répétitive, la réponse automatisée, le temps rendu —
défile d'un métier à l'autre. Le propos n'est pas le cas montré mais le fait
qu'il change : l'automatisation se taille à la demande, quel que soit le
domaine. Les cas vivent dans `DEMO_CASES` ([config.js](public/assets/js/config.js)),
[demo.js](public/assets/js/demo.js) ne fait que les mettre en scène. Un clic sur
un onglet fige le métier choisi. Si le visiteur a demandé moins d'animations,
le défilement ne démarre pas.

## La page logiciel

Elle a d'abord été la septième diapositive du deck. Elle en est sortie parce
qu'elle chargeait la page d'accueil d'une information que peu de visiteurs
viennent y chercher. Elle vit maintenant dans `public/logiciel.html`,
atteignable par le panneau de navigation — sous les sections, séparée d'un
filet — et par le pied de page.

Les pages autonomes se déclarent dans `PAGES`
([config.js](public/assets/js/config.js)) ; `menu.js` les rend comme de vrais
liens, avec une flèche au lieu d'un numéro d'ordre qu'elles n'ont pas. Elles
partagent l'en-tête `.page-header` et le module `page-fond.js` avec la page
vidéo.

Seul **l'arbitrage** est en vitrine. Le convertisseur et le compresseur restent
dans l'application mais n'y sont plus annoncés : ils ne disent rien du métier
de Derovia, et diluaient une page dont le rôle est de faire installer un outil.

**L'adresse est demandée avant le lien**, jamais imposée : un lien discret
permet de passer outre, parce qu'un mur strict ferait surtout fuir et qu'une
adresse arrachée ne vaut rien. Elle part dans un formulaire Netlify distinct
(`telechargement`) — ce n'est pas un besoin qualifié, et les deux ne se rangent
pas dans la même boîte. Si la transmission échoue, le fichier part quand même :
le visiteur est venu chercher un fichier, pas nous rendre service.

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

## La seule route

| Route      | En local (`server.py`)           | En production (Netlify)             |
| ---------- | -------------------------------- | ----------------------------------- |
| `POST /`   | ajoute une ligne à `leads.jsonl` | Netlify Forms (formulaire `besoin`) |

Le navigateur envoie exactement la même requête dans les deux cas ; seule
l'implémentation côté serveur diffère. C'est le seul appel réseau du site.

## Configuration

| Variable | Rôle                                      | Défaut |
| -------- | ----------------------------------------- | ------ |
| `PORT`   | Port du serveur local, ignoré sur Netlify | `8001` |

Les questions, les métiers proposés et le coût horaire de référence se règlent
dans [config.js](public/assets/js/config.js).
