/**
 * Derovia — Questionnaire
 *
 * Six étapes courtes, décrites dans `FORM_STEPS` (config.js) : ce module ne
 * fait que les mettre en page, les valider et les transmettre.
 *
 * Le moment qui compte est l'étape chiffrée : le temps rendu et sa valeur se
 * calculent pendant qu'on déplace les curseurs. Ce calcul n'a jamais demandé
 * autre chose qu'une multiplication — c'est pour ça qu'il tient ici, sans
 * dépendre d'un service extérieur qui peut être indisponible.
 *
 * Trois phases, portées par `data-phase` :
 *   questions → les étapes, une à la fois
 *   envoi     → la transmission en cours
 *   envoye    → la confirmation
 */

import { submitLead } from './api.js';
import { FORM_STEPS, RECAP_FIELDS, ROI } from './config.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const euros = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export function createFormulaire() {
  const root = document.getElementById('parcours');
  if (!root) return null;

  const el = {
    etapes: document.getElementById('etapes'),
    progress: document.getElementById('form-progress-fill'),
    step: document.getElementById('form-step'),
    erreur: document.getElementById('form-error'),
    precedent: document.getElementById('btn-precedent'),
    suivant: document.getElementById('btn-suivant'),
    envoyer: document.getElementById('btn-envoyer'),
    form: document.getElementById('form-besoin'),
    recap: document.getElementById('form-recap'),
  };

  if (Object.values(el).some((node) => !node)) {
    console.error('Derovia : structure du questionnaire incomplète.');
    return null;
  }

  /** Réponses saisies, indexées par nom de champ. */
  const reponses = Object.create(null);
  let courante = 0;

  /* ----------------------------------------------------------------------
     Construction
     ---------------------------------------------------------------------- */

  const panneaux = FORM_STEPS.map((etape, index) => {
    const panneau = document.createElement('section');
    panneau.className = 'etape';
    panneau.dataset.index = String(index);
    panneau.hidden = index !== 0;

    const titre = document.createElement('h3');
    titre.className = 'etape-titre';
    titre.textContent = etape.titre;

    const aide = document.createElement('p');
    aide.className = 'etape-aide';
    aide.textContent = etape.aide;

    panneau.append(titre, aide);

    for (const def of etape.champs) panneau.append(construireChamp(def));

    // L'étape chiffrée montre son résultat sous les curseurs, en direct.
    if (etape.calcul) {
      const resultat = document.createElement('div');
      resultat.className = 'calcul';
      resultat.innerHTML = `
        <p class="calcul-libelle">Ce que ça vous rendrait</p>
        <p class="calcul-temps" data-calcul="temps">—</p>
        <p class="calcul-argent" data-calcul="argent">—</p>
        <p class="calcul-base">
          Sur la base d'un coût horaire chargé de ${ROI.coutHoraire}&nbsp;€, le même que
          <button type="button" class="lien-texte" data-goto="rentabilite">la page Rentabilité</button>.
        </p>`;
      panneau.append(resultat);
    }

    if (etape.recapitulatif) panneau.insertBefore(el.recap, panneau.children[2]);

    el.etapes.append(panneau);
    return panneau;
  });

  /** Rend un champ selon son type. Chaque type reste un cas court et lisible. */
  function construireChamp(def) {
    const bloc = document.createElement('div');
    bloc.className = `champ champ-${def.type}`;
    bloc.dataset.nom = def.nom;

    const label = document.createElement('p');
    label.className = 'champ-label';
    label.textContent = def.label;
    bloc.append(label);

    if (def.type === 'choix' || def.type === 'multi') {
      const groupe = document.createElement('div');
      groupe.className = 'pastilles';
      groupe.setAttribute('role', def.type === 'choix' ? 'radiogroup' : 'group');
      groupe.setAttribute('aria-label', def.label);
      bloc.append(groupe);

      remplirPastilles(groupe, def, def.options ?? []);

      if (def.autre) bloc.append(champAutre(def));
      return bloc;
    }

    if (def.type === 'curseur') {
      const ligne = document.createElement('div');
      ligne.className = 'curseur-ligne';

      const input = document.createElement('input');
      input.type = 'range';
      input.className = 'roi-curseur';
      input.name = def.nom;
      input.min = String(def.min);
      input.max = String(def.max);
      input.step = String(def.pas);
      input.value = String(def.defaut);
      input.setAttribute('aria-label', def.label);

      const valeur = document.createElement('output');
      valeur.className = 'curseur-valeur';

      const majValeur = () => {
        reponses[def.nom] = Number(input.value);
        valeur.textContent = `${input.value} ${def.unite}`;
        const part = (input.value - def.min) / (def.max - def.min);
        input.style.setProperty('--part', `${part * 100}%`);
        rafraichirCalcul();
      };

      input.addEventListener('input', majValeur);
      ligne.append(input, valeur);
      bloc.append(ligne);
      queueMicrotask(majValeur);
      return bloc;
    }

    const saisie = document.createElement(def.lignes ? 'textarea' : 'input');
    saisie.className = 'champ-saisie';
    saisie.name = def.nom;
    if (def.lignes) saisie.rows = def.lignes;
    else saisie.type = def.type === 'texte' ? 'text' : def.type;
    if (def.placeholder) saisie.placeholder = def.placeholder;
    if (def.autocomplete) saisie.autocomplete = def.autocomplete;

    saisie.addEventListener('input', () => {
      reponses[def.nom] = saisie.value.trim();
      cacherErreur();
    });

    bloc.append(saisie);
    return bloc;
  }

  /** Les pastilles sont de vrais boutons radio : le clavier et le lecteur
   *  d'écran fonctionnent sans qu'on ait à les réinventer. */
  function remplirPastilles(groupe, def, options) {
    groupe.replaceChildren();

    for (const option of options) {
      const label = document.createElement('label');
      label.className = 'pastille';

      const input = document.createElement('input');
      input.type = def.type === 'choix' ? 'radio' : 'checkbox';
      input.name = def.nom;
      input.value = option;
      if (def.defaut === option) input.checked = true;

      const texte = document.createElement('span');
      texte.textContent = option;

      input.addEventListener('change', () => {
        reponses[def.nom] =
          def.type === 'choix'
            ? option
            : [...groupe.querySelectorAll('input:checked')].map((i) => i.value);
        // Une question peut dépendre de celle-ci, et vivre sur la même étape :
        // ses réponses doivent suivre la coche, pas attendre l'étape suivante.
        rafraichirDependances(def.nom);
        cacherErreur();
      });

      label.append(input, texte);
      groupe.append(label);
    }

    if (def.defaut && options.includes(def.defaut)) reponses[def.nom] = def.defaut;
  }

  /** « Autre » ouvre un champ libre plutôt que d'exclure un métier. */
  function champAutre(def) {
    const label = document.createElement('label');
    label.className = 'champ-autre';

    const saisie = document.createElement('input');
    saisie.type = 'text';
    saisie.className = 'champ-saisie';
    saisie.name = `${def.nom}Autre`;
    saisie.placeholder = def.autre;

    saisie.addEventListener('input', () => {
      const valeur = saisie.value.trim();
      reponses[`${def.nom}Autre`] = valeur;
      // Une saisie libre vaut réponse : elle libère les champs obligatoires.
      if (valeur) {
        for (const i of label.parentElement.querySelectorAll('input[type="radio"]')) i.checked = false;
        reponses[def.nom] = valeur;
      }
      cacherErreur();
    });

    label.append(saisie);
    return label;
  }

  /* ----------------------------------------------------------------------
     Le calcul
     ---------------------------------------------------------------------- */

  /** Heures rendues par mois, et ce qu'elles valent sur un an. */
  const calculer = () => {
    const heuresMois = ((reponses.frequence ?? 0) * (reponses.duree ?? 0)) / 60;
    const valeurAn = heuresMois * 12 * ROI.coutHoraire;
    return { heuresMois, valeurAn: Math.round(valeurAn / 100) * 100 };
  };

  function rafraichirCalcul() {
    const { heuresMois, valeurAn } = calculer();
    const temps = root.querySelector('[data-calcul="temps"]');
    const argent = root.querySelector('[data-calcul="argent"]');
    if (!temps || !argent) return;

    const heures = heuresMois >= 10 ? Math.round(heuresMois) : Math.round(heuresMois * 10) / 10;
    temps.textContent = `${heures} h par mois`.replace('.', ',');
    argent.textContent = `${euros.format(valeurAn)} par an`;
  }

  /* ----------------------------------------------------------------------
     Navigation
     ---------------------------------------------------------------------- */

  const setPhase = (phase) => {
    root.dataset.phase = phase;
  };

  const cacherErreur = () => {
    el.erreur.hidden = true;
  };

  const montrerErreur = (message) => {
    el.erreur.textContent = message;
    el.erreur.hidden = false;
  };

  const majProgression = () => {
    const part = (courante / FORM_STEPS.length) * 100;
    el.progress.style.width = `${part}%`;
    el.step.textContent = `Étape ${courante + 1} sur ${FORM_STEPS.length}`;

    el.precedent.hidden = courante === 0;
    const dernier = courante === FORM_STEPS.length - 1;
    el.suivant.hidden = dernier;
    el.envoyer.hidden = !dernier;
  };

  const afficher = (index) => {
    courante = index;
    panneaux.forEach((p, i) => {
      p.hidden = i !== index;
    });

    const etape = FORM_STEPS[index];
    for (const def of etape.champs) {
      if (def.optionsDe) rafraichirOptionsLiees(def);
    }
    if (etape.recapitulatif) remplirRecap();
    if (etape.calcul) rafraichirCalcul();

    majProgression();
    cacherErreur();
  };

  /** Met à jour les questions dont les réponses viennent d'un autre champ. */
  function rafraichirDependances(source) {
    for (const etape of FORM_STEPS) {
      for (const def of etape.champs) {
        if (def.optionsDe === source) rafraichirOptionsLiees(def);
      }
    }
  }

  /** Les réponses d'un champ reprennent ce qui a été coché plus tôt. */
  function rafraichirOptionsLiees(def) {
    const groupe = root.querySelector(`.champ[data-nom="${def.nom}"] .pastilles`);
    if (!groupe) return;

    const source = reponses[def.optionsDe];
    const options = Array.isArray(source) && source.length ? source : [];
    const ancienne = reponses[def.nom];

    remplirPastilles(groupe, def, options);

    // Une seule tâche cochée : inutile de faire choisir entre elle et elle-même.
    if (options.length === 1) {
      groupe.querySelector('input').checked = true;
      reponses[def.nom] = options[0];
    } else if (options.includes(ancienne)) {
      groupe.querySelector(`input[value="${CSS.escape(ancienne)}"]`).checked = true;
    } else {
      delete reponses[def.nom];
    }
  }

  /** Vérifie l'étape affichée. Renvoie le premier manque, ou null. */
  function manque(index) {
    for (const def of FORM_STEPS[index].champs) {
      if (!def.requis) continue;

      const valeur = reponses[def.nom];
      const vide = Array.isArray(valeur) ? valeur.length === 0 : !valeur;
      if (vide) return `Merci de renseigner : ${def.label.toLowerCase()}.`;

      if (def.type === 'email' && !EMAIL_PATTERN.test(String(valeur))) {
        return 'Merci d’indiquer une adresse professionnelle valide.';
      }
    }
    return null;
  }

  /* ----------------------------------------------------------------------
     Récapitulatif et transmission
     ---------------------------------------------------------------------- */

  /** Les valeurs telles qu'elles partiront : une seule source pour l'écran
   *  et pour le courriel. */
  function synthese() {
    const { heuresMois, valeurAn } = calculer();
    const heures = heuresMois >= 10 ? Math.round(heuresMois) : Math.round(heuresMois * 10) / 10;

    return {
      ...reponses,
      volume: `${reponses.frequence} fois par mois, ${reponses.duree} min à chaque fois`,
      gainTemps: `environ ${String(heures).replace('.', ',')} h par mois`,
      gainArgent: `de l’ordre de ${euros.format(valeurAn)}`,
    };
  }

  function remplirRecap() {
    const data = synthese();
    el.recap.replaceChildren();

    const titre = document.createElement('h4');
    titre.className = 'recap-titre';
    titre.textContent = 'Ce que vous nous dites';
    el.recap.append(titre);

    const liste = document.createElement('dl');
    liste.className = 'summary-fields';

    for (const { key, label } of RECAP_FIELDS) {
      const valeur = data[key];
      const texte = Array.isArray(valeur) ? valeur.join(' · ') : valeur;
      if (!texte) continue;

      const dt = document.createElement('dt');
      dt.dataset.key = key;
      dt.textContent = label;

      const dd = document.createElement('dd');
      dd.dataset.key = key;
      dd.textContent = String(texte);

      liste.append(dt, dd);
    }

    el.recap.append(liste);
  }

  const envoyer = async (event) => {
    event.preventDefault();

    const defaut = manque(courante);
    if (defaut) {
      montrerErreur(defaut);
      return;
    }

    setPhase('envoi');
    el.envoyer.disabled = true;

    try {
      await submitLead(synthese());
      setPhase('envoye');
    } catch (error) {
      console.error('Derovia : échec de la transmission du besoin.', error);
      setPhase('questions');
      el.envoyer.disabled = false;
      montrerErreur('La transmission a échoué. Merci de réessayer dans un instant.');
    }
  };

  /* ----------------------------------------------------------------------
     Cycle de vie
     ---------------------------------------------------------------------- */

  el.suivant.addEventListener('click', () => {
    const defaut = manque(courante);
    if (defaut) {
      montrerErreur(defaut);
      return;
    }
    afficher(Math.min(courante + 1, FORM_STEPS.length - 1));
  });

  el.precedent.addEventListener('click', () => afficher(Math.max(courante - 1, 0)));
  el.form.addEventListener('submit', envoyer);

  // Entrée passe à la suite, sauf dans une zone de texte où elle sert à aller
  // à la ligne.
  el.form.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.target instanceof HTMLTextAreaElement) return;
    event.preventDefault();
    (courante === FORM_STEPS.length - 1 ? el.envoyer : el.suivant).click();
  });

  afficher(0);

  return {
    /** Remet le questionnaire à zéro pour une prochaine visite. */
    reset() {
      if (root.dataset.phase === 'envoye') return;
      afficher(0);
    },
  };
}
