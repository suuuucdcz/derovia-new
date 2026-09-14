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
  { id: 'fondateurs', label: 'Qui nous sommes', resume: 'Les deux personnes qui répondront' },
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

/**
 * Pages autonomes, listées sous les sections dans le panneau de navigation.
 * Le logiciel y a sa place plutôt qu'une diapositive : il chargeait la page
 * d'accueil d'une information que peu de visiteurs viennent y chercher.
 */
export const PAGES = [
  {
    href: '/logiciel.html',
    label: 'Le logiciel',
    resume: 'La suite d’outils Windows, gratuite',
  },
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

/**
 * Netlify intercepte les envois de formulaire postés à la racine du site ;
 * `server.py` fait de même en local. Un seul chemin pour les deux environnements.
 */
export const LEADS_ENDPOINT = '/';
export const LEADS_FORM_NAME = 'besoin';

/** Second formulaire : les adresses laissées avant un téléchargement. */
export const DOWNLOAD_FORM_NAME = 'telechargement';

/**
 * Adresse du fichier. Elle pointe sur « latest » : elle ne change jamais d'une
 * version à l'autre, seul le numéro affiché dans logiciel.html est à reprendre.
 */
export const DOWNLOAD_URL =
  'https://github.com/suuuucdcz/derovia-suite/releases/latest/download/Derovia-setup.exe';

/**
 * Le questionnaire, écrit en données. Chaque étape porte son titre, une phrase
 * qui dit pourquoi on demande, et ses champs ; `formulaire.js` ne fait que les
 * mettre en page.
 *
 * Types de champ : `choix` (une réponse), `multi` (plusieurs), `curseur`
 * (une valeur chiffrée), `texte`, `email`, `tel`.
 *
 * ⚠ Ajouter un champ ici ne suffit pas : il faut aussi le déclarer dans le
 *   formulaire caché d'index.html, sinon Netlify ne l'enregistrera jamais.
 */
export const FORM_STEPS = [
  {
    titre: 'Votre activité',
    aide: 'Pour savoir à qui on parle, et avec quels usages.',
    champs: [
      {
        nom: 'metier',
        label: 'Votre métier',
        type: 'choix',
        requis: true,
        autre: 'Précisez votre métier',
        options: [
          'Bâtiment & travaux',
          'Plomberie & chauffage',
          'Garage & mécanique',
          'Restauration',
          'Coiffure & esthétique',
          'Commerce de proximité',
          'Cabinet comptable',
          'Agence immobilière',
        ],
      },
      {
        nom: 'taille',
        label: 'Combien êtes-vous ?',
        type: 'choix',
        options: ['Je suis seul', '2 à 5', '6 à 20', 'Plus de 20'],
      },
    ],
  },

  {
    titre: 'Ce qui vous prend du temps',
    aide: 'Cochez tout ce qui vous mange des heures, même un peu.',
    champs: [
      {
        nom: 'taches',
        label: 'Les tâches qui reviennent sans cesse',
        type: 'multi',
        requis: true,
        options: [
          'Rédiger les devis',
          'Facturer et relancer',
          'Prendre les rendez-vous',
          'Répondre aux appels et messages',
          'Organiser le planning et les tournées',
          'Préparer les papiers du comptable',
          'Commander chez les fournisseurs',
          'Suivre les chantiers ou les dossiers',
        ],
      },
      {
        nom: 'priorite',
        label: 'Et celle qui vous coûte le plus ?',
        type: 'choix',
        requis: true,
        // Les réponses reprennent ce qui vient d'être coché à l'étape d'avant :
        // on ne fait jamais choisir entre des options qu'on a déjà écartées.
        optionsDe: 'taches',
      },
    ],
  },

  {
    titre: 'Combien de temps, au juste',
    aide: 'Une estimation suffit. Le calcul se fait sous vos yeux.',
    calcul: true,
    champs: [
      {
        nom: 'frequence',
        label: 'Combien de fois par mois ?',
        type: 'curseur',
        min: 1,
        max: 100,
        pas: 1,
        defaut: 20,
        unite: 'fois par mois',
      },
      {
        nom: 'duree',
        label: 'Combien de temps à chaque fois ?',
        type: 'curseur',
        min: 5,
        max: 120,
        pas: 5,
        defaut: 20,
        unite: 'minutes',
      },
    ],
  },

  {
    titre: 'Quand ça passe à travers',
    aide: 'C’est souvent ce qui coûte le plus cher, et ça ne se compte jamais.',
    champs: [
      {
        nom: 'consequence',
        label: 'Qu’est-ce qui arrive quand la tâche traîne ?',
        type: 'choix',
        options: [
          'Il m’arrive d’oublier',
          'J’envoie souvent en retard',
          'J’ai déjà perdu un client comme ça',
          'Je suis payé plus tard',
          'Rien de grave, ça se passe bien',
        ],
      },
      {
        nom: 'precision',
        label: 'Un exemple concret ? (facultatif)',
        type: 'texte',
        lignes: 2,
        placeholder: 'Un devis parti trois jours trop tard, un rendez-vous manqué…',
      },
    ],
  },

  {
    titre: 'Vos outils d’aujourd’hui',
    aide: 'Ce que vous avez déjà décide de ce qu’on peut brancher dessus.',
    champs: [
      {
        nom: 'outils',
        label: 'Avec quoi travaillez-vous ?',
        type: 'multi',
        options: [
          'Papier et carnet',
          'Excel ou Google Sheets',
          'Un logiciel métier',
          'Ma boîte mail',
          'WhatsApp ou SMS',
          'Rien de particulier',
        ],
      },
      {
        nom: 'logiciel',
        label: 'Lequel ? (facultatif)',
        type: 'texte',
        placeholder: 'EBP, Batappli, Sage, Zelty…',
      },
    ],
  },

  {
    titre: 'Comment vous joindre',
    aide: 'On vous répond sous 2 jours ouvrés, sans relance automatique.',
    recapitulatif: true,
    champs: [
      {
        nom: 'email',
        label: 'Adresse professionnelle',
        type: 'email',
        requis: true,
        placeholder: 'prenom@entreprise.com',
        autocomplete: 'email',
      },
      {
        nom: 'company',
        label: 'Société (facultatif)',
        type: 'texte',
        placeholder: 'Nom de votre société',
        autocomplete: 'organization',
      },
      {
        nom: 'telephone',
        label: 'Téléphone (facultatif)',
        type: 'tel',
        placeholder: '06 12 34 56 78',
        autocomplete: 'tel',
      },
      {
        nom: 'contact',
        label: 'Vous préférez qu’on vous',
        type: 'choix',
        options: ['rappelle', 'écrive par mail'],
        defaut: 'rappelle',
      },
    ],
  },
];

/** Intitulés du récapitulatif, dans l'ordre d'affichage. */
export const RECAP_FIELDS = [
  { key: 'metier', label: 'Métier' },
  { key: 'priorite', label: 'Ce qu’on vous enlève' },
  { key: 'volume', label: 'Volume' },
  { key: 'consequence', label: 'Ce qu’un oubli coûte' },
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
};

