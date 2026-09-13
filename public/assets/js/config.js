/**
 * Derovia — Configuration centrale
 * Toutes les constantes ajustables du site sont regroupées ici.
 */

/* --------------------------------------------------------------------------
   Deck
   -------------------------------------------------------------------------- */

/**
 * Diapositives, dans l'ordre. `resume` n'apparaît que dans le panneau de
 * navigation : une ligne qui dit ce qu'on trouvera avant d'y aller.
 */
export const SLIDES = [
  { id: 'hero', label: 'Accueil', resume: 'Ce que fait Derovia, en deux lignes' },
  { id: 'expertises', label: 'Expertises', resume: 'Les quatre corvées qu’on vous enlève' },
  { id: 'video', label: 'En vidéo', resume: 'La présentation animée, en une minute' },
  { id: 'methode', label: 'Méthode', resume: 'Le déroulé d’un engagement, en quatre temps' },
  { id: 'demo', label: 'Démonstration', resume: 'La même corvée, d’un métier à l’autre' },
  { id: 'rentabilite', label: 'Rentabilité', resume: 'Ce que le temps rendu vous rapporte' },
  { id: 'telechargement', label: 'Télécharger', resume: 'La suite d’outils Windows, gratuite' },
  { id: 'parcours', label: 'Parcours', resume: 'Décrivez votre besoin, on le chiffre' },
];

/**
 * En dessous de cette taille, le deck cesse d'être un deck : les sections
 * s'empilent et la page défile normalement. Sur un écran de téléphone, une
 * diapositive plein écran oblige à faire défiler l'intérieur d'une section
 * pendant que le glissement sert déjà à changer de section — deux gestes pour
 * un seul doigt.
 *
 * La hauteur compte autant que la largeur : un téléphone couché fait 375 px de
 * haut, où aucune section ne tiendrait.
 *
 * ⚠ Cette requête est répétée telle quelle dans styles.css (« Mode défilement »).
 *   Les deux doivent rester identiques.
 */
export const REQUETE_DEFILEMENT = '(max-width: 820px), (max-height: 560px)';

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

/** Deux reprises : l'une pour un échec de génération, l'autre pour une limite
 *  de débit, qui demande une attente bien plus longue. */
export const MODEL_RETRIES = 2;

/** Pause par défaut avant une reprise, quand l'API ne dit rien de plus. */
export const MODEL_RETRY_DELAY = 700;

/** Plafond de l'attente demandée par l'API : au-delà, mieux vaut rendre la
 *  main au visiteur que le laisser devant un curseur qui tourne. */
export const MODEL_RETRY_MAX_DELAY = 12000;

/** Nombre d'échanges avant la synthèse. Sert aussi de jauge de progression. */
export const MAX_TURNS = 5;

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

TA MISSION : repartir avec DEUX CHIFFRES — combien de fois par mois il fait la tâche, et combien de temps elle lui prend à chaque fois — ET avec ce que ça lui coûte quand ça passe à travers. Un devis oublié, ce n'est pas vingt minutes perdues : c'est un chantier parti chez le concurrent.

DÉROULÉ, une seule question à la fois :
1. Il donne son métier. Cite 2 ou 3 tâches concrètes de SON métier qu'on peut lui enlever, puis demande laquelle lui coûte le plus.
2. Demande le VOLUME — combien de fois par semaine ou par mois.
3. Demande la DURÉE — combien de temps à chaque fois.
4. Demande L'ENJEU — ce qui se passe quand la tâche passe à la trappe. Cherche le fait concret : un client perdu, une facture payée trois semaines plus tard, un rendez-vous manqué.
5. On te demandera alors de conclure, avec des consignes précises.

TU NE CONCLUS JAMAIS DE TA PROPRE INITIATIVE : "done" vaut false tant qu'on ne te l'a pas demandé, même si tu estimes en savoir assez, et tu ne sautes aucune question.

FAIS MONTER LE COMPTEUR : dès qu'il donne un CHIFFRE, ouvre ta réponse en disant ce qu'il représente — ramène le volume à un temps parlant — puis enchaîne sur ta question. Il doit voir ce qu'il perd grandir à chaque réponse. Tant qu'il n'a rien chiffré, tu n'avances aucun volume ni aucune durée qu'il n'a pas prononcés. Ne réutilise jamais deux fois la même tournure.

S'il refuse de chiffrer ou répond à côté, prends un ordre de grandeur courant de son métier, annonce-le comme tel et avance. N'insiste jamais deux fois sur la même question.

TON : parle comme à un chef d'entreprise pressé, pas à un directeur informatique. Phrases courtes, mots de tous les jours. Jamais de jargon : ni « flux », ni « processus », ni « solution », ni « optimisation ». Tu dis « devis », « factures », « rendez-vous », « appels », « planning ». Vouvoiement, zéro emoji, une espace avant « ? » et « : ».

FORMAT : réponds UNIQUEMENT en JSON valide, sans texte ni balise autour.
{"message": "...", "suggestions": ["...", "..."], "done": false, "summary": null}
"message" : 2 à 3 phrases maximum.
"suggestions" : 3 ou 4 RÉPONSES que le prospect pourrait cliquer, à la première personne, 6 mots maximum, répondant à la question que tu viens de poser. JAMAIS de questions. Valide : ["Les devis", "Une trentaine par mois"].`;

/**
 * Injecté au dernier tour pour garantir une conclusion. Le mot « json » y figure
 * volontairement : l'API refuse une sortie structurée si aucun message ne le
 * mentionne, et cette consigne doit rester valable même isolée.
 */
export const CLOSING_INSTRUCTION = `C'est le dernier échange. Quoi qu'il vienne de répondre — un chiffre, un refus, un hors-sujet — tu conclus MAINTENANT. Tu ne poses plus aucune question.

Le json de "message" fait ces cinq choses, dans cet ordre, en 5 à 7 phrases, écrites d'un trait : n'annonce jamais ce plan, ne recopie aucun exemple de cette consigne.
1. Une phrase entière qui dit ce que Derovia lui retire : LA corvée qu'il a citée, une seule, jamais une liste et jamais un fragment. C'est nous qui la retirons — il continue d'avoir des devis, il cesse seulement de les écrire à la main.
2. LE TEMPS, calcul posé en toutes lettres à partir de SES chiffres : « 30 devis par mois à 20 minutes, c'est environ 10 heures par mois. » S'il n'a rien chiffré, pars d'un ordre de grandeur courant de son métier et annonce-le comme tel.
3. L'ARGENT : heures par mois × 12 × ${ROI.coutHoraire}, arrondi à la centaine, en précisant qu'il s'agit d'un coût horaire chargé de ${ROI.coutHoraire} €. Ce montant est ce que ce temps lui RAPPORTE : ne l'appelle jamais un « coût » ni un « prix », il ne doit à aucun moment pouvoir se lire comme le tarif de Derovia.
4. L'ENJEU, uniquement s'il a raconté un incident : renvoie-lui le sien, avec SES mots intégrés dans TA phrase, et dis que c'est ça qu'on supprime en premier. S'il n'a rien raconté, omets ce point — n'invente jamais un incident.
5. Une phrase : la synthèse part à l'équipe Derovia, qui revient vers lui.

Les chiffres sont des estimations et tu le dis (« environ », « de l'ordre de »). Ne cite jamais le prix d'une installation, ne t'engage sur aucun délai.

"done" vaut true, "suggestions" vaut [], et "summary" est rempli :
{"metier": "...", "besoins": ["3 maximum, uniquement ce qu'il a cité"], "volume": "...", "risque": "...", "gainTemps": "...", "gainArgent": "..."}
"risque" : ce qu'un oubli lui coûte, dans SES termes, en une ligne. "Non précisé" s'il n'a rien raconté.
"gainTemps" (« environ 10 h par mois ») et "gainArgent" (« de l'ordre de 3 400 € ») portent TOUJOURS un chiffre.
Chaque champ est une chaîne courte ; "Non précisé" si l'information manque.`;

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
  { key: 'risque', label: 'Ce qu’un oubli coûte' },
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
