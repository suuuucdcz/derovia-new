/**
 * Derovia — Configuration centrale
 * Toutes les constantes ajustables du site sont regroupées ici.
 */

/* --------------------------------------------------------------------------
   Deck
   -------------------------------------------------------------------------- */

/** Diapositives, dans l'ordre. `nav` à false = absente du menu principal. */
export const SLIDES = [
  { id: 'hero', label: 'Accueil', nav: false },
  { id: 'expertises', label: 'Expertises', nav: true },
  { id: 'video', label: 'En vidéo', nav: true },
  { id: 'methode', label: 'Méthode', nav: true },
  { id: 'demo', label: 'Démonstration', nav: true },
  { id: 'rentabilite', label: 'Rentabilité', nav: true },
  { id: 'telechargement', label: 'Télécharger', nav: true },
  { id: 'parcours', label: 'Parcours', nav: false },
];

export const SURVEY_SLIDE = 'parcours';
export const DEMO_SLIDE = 'demo';
export const VIDEO_SLIDE = 'video';
export const ROI_SLIDE = 'rentabilite';

/* --------------------------------------------------------------------------
   Démonstration
   -------------------------------------------------------------------------- */

/**
 * Le même schéma, décliné par métier : ce n'est pas l'automatisation d'un cas
 * précis qu'on montre, c'est qu'elle se taille à la demande. Les exemples sont
 * illustratifs — à remplacer par des cas réels dès que vous en aurez.
 */
export const DEMO_CASES = [
  {
    metier: 'Plomberie & chauffage',
    charge: 'Rédiger les devis le soir, une fois la journée de chantier finie.',
    reponse: 'Vous décrivez l’intervention ; le devis sort chiffré, mis en forme, prêt à envoyer.',
    gain: 'Les soirées ne servent plus à faire de la paperasse',
  },
  {
    metier: 'Garage & mécanique',
    charge: 'Répondre au téléphone les mains dans le moteur, ou ne pas répondre.',
    reponse: 'Les appels manqués reçoivent un message, et les rendez-vous se calent tout seuls.',
    gain: 'Plus de client perdu faute d’avoir décroché',
  },
  {
    metier: 'Cabinet comptable',
    charge: 'Courir après les pièces que les clients n’envoient jamais à temps.',
    reponse: 'Les relances partent seules, avec la liste exacte de ce qui manque à chacun.',
    gain: 'Les bilans ne se jouent plus la dernière semaine',
  },
  {
    metier: 'Restauration',
    charge: 'Refaire chaque commande fournisseur à la main, chaque semaine.',
    reponse: 'La commande se prépare depuis vos stocks et vos habitudes ; vous n’avez qu’à valider.',
    gain: 'Une commande passée en deux minutes',
  },
  {
    metier: 'Coiffure & esthétique',
    charge: 'Rappeler les rendez-vous un par un pour limiter les oublis.',
    reponse: 'Les rappels partent seuls, et un créneau libéré se repropose aussitôt.',
    gain: 'Moins de fauteuils vides dans la journée',
  },
];

/**
 * Temps d'affichage de chaque métier, en millisecondes.
 * Calé sur une lecture posée des trois blocs, pas sur un défilé.
 */
export const DEMO_INTERVAL = 9500;

/* --------------------------------------------------------------------------
   Rentabilité
   -------------------------------------------------------------------------- */

/**
 * Le prix vaut le tiers de la valeur créée sur un an. Il en découle une
 * propriété qui tient quel que soit le volume : l'installation est remboursée
 * au bout du tiers de l'année, soit quatre mois.
 *
 *   valeur annuelle = heures/semaine x semaines travaillées x coût horaire
 *   prix            = valeur annuelle / 3
 */
export const ROI = {
  /** Semaines effectivement travaillées dans l'année, congés déduits. */
  semaines: 47,
  /** Coût horaire chargé d'un salarié : salaire et charges comprises. */
  coutHoraire: 28,
  /** Le prix représente cette fraction de la valeur créée la première année. */
  fraction: 3,
  /** Bornes et pas du curseur, en heures par semaine. */
  minHeures: 2,
  maxHeures: 20,
  pasHeures: 1,
  defautHeures: 6,
  /** Étendue du graphique, en mois. */
  mois: 12,
};

/** Cas repères, pour situer son propre volume d'un coup d'œil. */
export const ROI_REPERES = [
  { heures: 3, libelle: 'Les devis du soir' },
  { heures: 6, libelle: 'La saisie des factures' },
  { heures: 12, libelle: 'Le standard téléphonique' },
];

/* --------------------------------------------------------------------------
   Questionnaire
   -------------------------------------------------------------------------- */

export const API_ENDPOINT = '/api/groq';

/**
 * Netlify intercepte les envois de formulaire postés à la racine du site ;
 * `server.py` fait de même en local. Un seul chemin pour les deux environnements.
 */
export const LEADS_ENDPOINT = '/';
export const LEADS_FORM_NAME = 'besoin';

export const MODEL = {
  name: 'openai/gpt-oss-20b',
  temperature: 0.4,
  /**
   * Large marge volontaire : ce modèle raisonne avant de répondre et consomme
   * couramment 900 jetons — davantage au dernier tour, où il pose un calcul
   * avant de conclure. Trop juste, la sortie JSON est tronquée et l'API
   * rejette la requête (`json_validate_failed`).
   */
  maxTokens: 2600,
};

/** Une seconde tentative suffit à absorber un échec ponctuel de génération. */
export const MODEL_RETRIES = 1;

/** Pause avant la reprise : laisse aussi passer une limite de débit momentanée. */
export const MODEL_RETRY_DELAY = 700;

/** Nombre d'échanges avant la synthèse. Sert aussi de jauge de progression. */
export const MAX_TURNS = 4;

/** Première question, écrite en machine à écrire à l'ouverture du parcours. */
export const OPENING_QUESTION = 'Quel est votre métier ?';

/** Réponses proposées d'emblée : un clic suffit pour démarrer. */
export const TRADE_SUGGESTIONS = [
  'Bâtiment & travaux',
  'Plomberie & chauffage',
  'Garage & mécanique',
  'Restauration',
  'Coiffure & esthétique',
  'Commerce de proximité',
  'Cabinet comptable',
  'Agence immobilière',
];

/**
 * Consigne système. Le modèle répond en JSON : c'est le site qui met en forme,
 * ce qui permet les réponses cliquables, la jauge et la synthèse finale.
 */
export const SYSTEM_PROMPT = `Tu es consultant en automatisation chez Derovia. Tes interlocuteurs dirigent de petites entreprises : artisans du bâtiment, garagistes, restaurateurs, coiffeurs, commerçants, mais aussi cabinets comptables et agences immobilières. Ils manquent de temps, pas d'idées.

TA MISSION : repartir avec DEUX CHIFFRES — combien de fois par mois il fait la tâche, et combien de temps elle lui prend à chaque fois. Sans eux tu ne peux rien chiffrer, et c'est le chiffrage qui emporte la décision.

DÉROULÉ : le prospect indique d'abord son métier. Tu mènes au maximum ${MAX_TURNS} échanges, puis tu conclus.
- Échange 1 : cite 2 ou 3 tâches concrètes de SON métier qu'on peut lui enlever des mains, puis demande laquelle lui coûte le plus.
- Échange 2 : demande le VOLUME — combien de fois par semaine ou par mois.
- Échange 3 : demande la DURÉE — « ça vous prend combien de temps à chaque fois ? »
- Dernier échange : tu conclus avec "done": true.

FAIS MONTER LE COMPTEUR. Dès qu'il te donne un CHIFFRE, ouvre ta réponse en disant ce que ce chiffre représente, puis enchaîne sur ta question. Il doit voir ce qu'il perd grandir à chaque réponse, pas seulement à la fin.
Le mouvement, sans jamais recopier une formule toute faite : tu ramènes le volume qu'il vient d'annoncer à un temps parlant (une demi-journée par semaine, deux jours par mois), puis tu demandes la suite.
INTERDIT tant qu'il n'a rien chiffré : tu n'avances aucun volume ni aucune durée qu'il n'a pas prononcés. Tu poses ta question, c'est tout. Et tu ne réutilises jamais deux fois la même tournure.

S'il refuse de chiffrer ou répond à côté, prends un ordre de grandeur courant de son métier, annonce-le comme tel (« pour une activité comme la vôtre, on est en général sur… ») et avance. N'insiste jamais deux fois sur la même question.

TON : parle comme à un chef d'entreprise pressé, pas comme à un directeur informatique. Phrases courtes, mots de tous les jours. Jamais de jargon : ni « flux », ni « processus », ni « solution », ni « optimisation ». Tu dis « devis », « factures », « rendez-vous », « appels », « planning ». Vouvoiement, zéro emoji. Typographie française : une espace avant « ? » et « : ».

FORMAT : réponds UNIQUEMENT en JSON valide, sans texte ni balise autour.
{"message": "...", "suggestions": ["...", "..."], "done": false, "summary": null}

"message" : 2 à 3 phrases maximum.

"suggestions" : 3 ou 4 RÉPONSES que le prospect pourrait cliquer, rédigées à la première
personne, 6 mots maximum chacune. Elles doivent répondre à la question que tu viens de poser.
JAMAIS de questions. Valide : ["Les devis", "Une trentaine par mois"].
Invalide : ["Quel est votre volume ?"].

DERNIER ÉCHANGE ("done": true) : "suggestions" vaut [], et "message" fait ces cinq choses,
dans cet ordre, en 5 à 7 phrases :
1. Tu nommes ce qu'on lui enlèverait, en reprenant ses mots à lui. Une phrase entière, jamais un fragment.
2. LE TEMPS — tu poses le calcul en toutes lettres à partir de SES chiffres :
   « 30 devis par mois à 20 minutes, c'est environ 10 heures par mois. »
3. L'ARGENT — tu convertis ces heures en euros sur un an et tu dis d'où vient le taux :
   heures par mois × 12 × ${ROI.coutHoraire}, arrondi à la centaine.
   « Sur la base d'un coût horaire chargé de ${ROI.coutHoraire} €, c'est de l'ordre de 3 400 € par an. »
4. L'IMAGE — tu ramènes ces heures à des journées de travail (heures par an ÷ 7) pour que
   le chiffre parle : « l'équivalent de 17 journées rendues dans l'année. »
5. Une phrase : la synthèse part à l'équipe Derovia, qui revient vers lui.
N'ANNONCE JAMAIS CE PLAN. Pas de numéros, pas d'intitulés recopiés (« Le temps : », « Ce qu'on
vous enlève : »). Tu écris d'un trait, comme un consultant qui parle.

RÈGLE SUR LES CHIFFRES : ce sont des estimations, et tu le dis (« environ », « de l'ordre de »).
Le montant en euros est ce que ce temps lui RAPPORTE, ce qu'on lui REND. Ne l'appelle jamais
un « coût », jamais un « prix » : il ne doit à aucun moment pouvoir se lire comme le tarif de
Derovia. Ne cite jamais le prix d'une installation, ne t'engage sur aucun délai.

Et "summary" est rempli :
{"metier": "...", "besoins": ["3 besoins maximum"], "volume": "...", "gainTemps": "...", "gainArgent": "..."}
"besoins" ne contient QUE ce qu'il a lui-même cité, jamais une tâche que tu as ajoutée.
"gainTemps" : le temps rendu, en une ligne (« environ 10 h par mois »).
"gainArgent" : la valeur sur un an, en une ligne (« de l'ordre de 3 400 € »).
Chaque champ de "summary" est une chaîne courte ; utilise "Non précisé" si l'information manque,
mais "gainTemps" et "gainArgent" doivent TOUJOURS porter un chiffre, quitte à partir d'un ordre
de grandeur du métier.`;

/**
 * Injecté au dernier tour pour garantir une conclusion. Le mot « json » y figure
 * volontairement : l'API refuse une sortie structurée si aucun message ne le
 * mentionne, et cette consigne doit rester valable même isolée.
 */
export const CLOSING_INSTRUCTION = `C'est le dernier échange. Quoi qu'il vienne de répondre — un chiffre, un refus, un hors-sujet — tu conclus MAINTENANT. Tu ne poses plus aucune question, tu ne redemandes rien.

Le json de "message" doit obligatoirement contenir ces cinq choses, dans cet ordre :
1. Ce qu'on lui enlève concrètement, avec ses mots à lui, en une phrase entière — jamais un fragment comme « Les devis. ».
2. Le temps gagné, calcul posé en toutes lettres à partir de SES chiffres : « 30 devis par mois à 20 minutes, c'est environ 10 heures par mois ». S'il n'a rien chiffré, pars d'un ordre de grandeur courant de son métier et annonce-le comme tel.
3. La valeur de ce temps sur un an : heures par mois × 12 × ${ROI.coutHoraire}, arrondi à la centaine, en précisant qu'il s'agit d'un coût horaire chargé de ${ROI.coutHoraire} €. Ce montant n'est ni un prix, ni une promesse.
4. Ce que ça représente en journées de travail rendues dans l'année (heures par an ÷ 7).
5. Une phrase disant que la synthèse part à l'équipe Derovia.

N'annonce jamais ce plan : ni numéros, ni intitulés recopiés. Tu écris d'un trait, comme on parle.

"done" vaut true, "suggestions" vaut [], et "summary" est complet : "gainTemps" et "gainArgent" portent chacun un chiffre.`;

/**
 * Relance quand le modèle repose une question au lieu de conclure — ce qui
 * arrive lorsque la dernière réponse est un refus de chiffrer. Sans elle, le
 * prospect resterait indéfiniment dans l'échange.
 */
export const CLOSING_FALLBACK = `Tu viens de reposer une question alors que l'échange est terminé. C'est fini : plus AUCUNE question.

Réponds en json avec "done": true, "suggestions": [], et un "summary" complet. S'il n'a pas voulu chiffrer, pars d'un ordre de grandeur courant de son métier et annonce-le comme tel — mais "gainTemps" et "gainArgent" portent un chiffre.`;

/** Intitulés des champs de la synthèse, dans l'ordre d'affichage. */
export const SUMMARY_FIELDS = [
  { key: 'metier', label: 'Métier' },
  { key: 'besoins', label: 'Ce qu’on vous enlève' },
  { key: 'volume', label: 'Volume' },
  { key: 'gainTemps', label: 'Temps rendu' },
  { key: 'gainArgent', label: 'Ce que ça vaut sur un an' },
];

/* --------------------------------------------------------------------------
   Divers
   -------------------------------------------------------------------------- */

/** Durées d'animation, en millisecondes. */
export const TIMING = {
  /** Doit rester aligné sur la transition `.deck-track` de styles.css. */
  slideTransition: 850,
  typewriterStart: 400,
  typewriterMinDelay: 30,
  typewriterMaxDelay: 80,
  inputFocus: 1400,
};

/** Hauteur maximale du champ de saisie auto-extensible, en pixels. */
export const TEXTAREA_MAX_HEIGHT = 140;
