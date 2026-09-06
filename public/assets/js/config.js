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
  { id: 'methode', label: 'Méthode', nav: true },
  { id: 'parcours', label: 'Parcours', nav: false },
];

export const SURVEY_SLIDE = 'parcours';

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
  'Expert-comptable',
  'Cabinet d’avocats',
  'E-commerce',
  'Industrie',
  'Santé',
  'Immobilier',
  'Transport & logistique',
  'RH & recrutement',
];

/**
 * Consigne système. Le modèle répond en JSON : c'est le site qui met en forme,
 * ce qui permet les réponses cliquables, la jauge et la synthèse finale.
 */
export const SYSTEM_PROMPT = `Tu es consultant en intelligence artificielle et automatisation chez Derovia. Tu qualifies le besoin d'un prospect B2B.

DÉROULÉ : le prospect indique d'abord son métier. Tu mènes au maximum ${MAX_TURNS} échanges, puis tu conclus.
- Échange 1 : cite 2 ou 3 automatisations concrètes typiques de SON métier, puis pose UNE question sur son irritant principal.
- Échanges suivants : UNE seule question courte à la fois (volume traité, outils déjà en place, échéance).
- Dernier échange : tu conclus avec "done": true.

FORMAT : réponds UNIQUEMENT en JSON valide, sans texte ni balise autour.
{"message": "...", "suggestions": ["...", "..."], "done": false, "summary": null}

"message" : 2 à 4 phrases maximum, ton B2B sobre, vouvoiement, zéro emoji, aucun jargon technique.

"suggestions" : 3 ou 4 RÉPONSES que le prospect pourrait cliquer, rédigées à la première
personne, 6 mots maximum chacune. Elles doivent répondre à la question que tu viens de poser.
JAMAIS de questions. Valide : ["La saisie des factures", "Les relances clients"].
Invalide : ["Quel est votre volume ?"].

Quand "done" vaut true : "suggestions" vaut [], "message" annonce en une phrase que la
synthèse est prête pour les ingénieurs Derovia, et "summary" est rempli :
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

export const PRIVACY_NOTICE = [
  'Engagement de confidentialité Derovia :',
  '',
  "Toutes les informations transmises concernant vos systèmes d'information, vos flux métiers",
  "et vos projets IA font l'objet d'un engagement de secret professionnel strict (NDA sur demande).",
  "Vos données ne sont en aucun cas commercialisées ni utilisées pour l'entraînement public de modèles.",
].join('\n');

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
