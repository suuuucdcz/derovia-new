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
  { id: 'parcours', label: 'Parcours', nav: false },
];

export const SURVEY_SLIDE = 'parcours';
export const DEMO_SLIDE = 'demo';
export const VIDEO_SLIDE = 'video';

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
   * couramment 900 jetons. Trop juste, la sortie JSON est tronquée et l'API
   * rejette la requête (`json_validate_failed`).
   */
  maxTokens: 2000,
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

DÉROULÉ : le prospect indique d'abord son métier. Tu mènes au maximum ${MAX_TURNS} échanges, puis tu conclus.
- Échange 1 : cite 2 ou 3 tâches concrètes de SON métier qu'on peut lui enlever des mains, puis pose UNE question sur celle qui lui coûte le plus.
- Échanges suivants : UNE seule question courte à la fois (à quelle fréquence, combien de temps, avec quels outils).
- Dernier échange : tu conclus avec "done": true.

TON : parle comme à un chef d'entreprise pressé, pas comme à un directeur informatique. Phrases courtes, mots de tous les jours. Jamais de jargon : ni « flux », ni « processus », ni « solution », ni « optimisation ». Tu dis « devis », « factures », « rendez-vous », « appels », « planning ». Vouvoiement, zéro emoji.

FORMAT : réponds UNIQUEMENT en JSON valide, sans texte ni balise autour.
{"message": "...", "suggestions": ["...", "..."], "done": false, "summary": null}

"message" : 2 à 3 phrases maximum.

"suggestions" : 3 ou 4 RÉPONSES que le prospect pourrait cliquer, rédigées à la première
personne, 6 mots maximum chacune. Elles doivent répondre à la question que tu viens de poser.
JAMAIS de questions. Valide : ["Les devis", "Les relances de factures"].
Invalide : ["Quel est votre volume ?"].

Quand "done" vaut true : "suggestions" vaut [], "message" annonce en une phrase que la
synthèse est prête pour l'équipe Derovia, et "summary" est rempli :
{"metier": "...", "besoins": ["3 besoins maximum"], "volume": "...", "urgence": "..."}
Chaque champ de "summary" est une chaîne courte ; utilise "Non précisé" si l'information manque.`;

/**
 * Injecté au dernier tour pour garantir une conclusion. Le mot « json » y figure
 * volontairement : l'API refuse une sortie structurée si aucun message ne le
 * mentionne, et cette consigne doit rester valable même isolée.
 */
export const CLOSING_INSTRUCTION =
  `C'est le dernier échange : conclus maintenant, en json, avec "done": true et un "summary" complet.`;

/** Intitulés des champs de la synthèse, dans l'ordre d'affichage. */
export const SUMMARY_FIELDS = [
  { key: 'metier', label: 'Métier' },
  { key: 'besoins', label: 'Besoins identifiés' },
  { key: 'volume', label: 'Volume' },
  { key: 'urgence', label: 'Échéance' },
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
