/**
 * Derovia — Point d'entrée
 *
 * Instancie les modules et les relie : la navigation pilote la teinte du fond,
 * son degré d'apaisement et le cycle de vie du parcours de qualification.
 */

import { OrganicBackground } from './background.js';
import { createDeck } from './deck.js';
import { createDemo } from './demo.js';
import { createFilm } from './film.js';
import { createMenu } from './menu.js';
import { createRentabilite } from './rentabilite.js';
import { createSurvey } from './survey.js';
import { DEMO_SLIDE, SLIDES, SURVEY_SLIDE, TIMING, VIDEO_SLIDE } from './config.js';

const background = new OrganicBackground('bg-canvas');
const survey = createSurvey();
const demo = createDemo();
const film = createFilm();
createRentabilite();

let leaveTimer = null;
let demoTimer = null;

const deck = createDeck({
  onChange({ id, index }) {
    // La palette dérive régulièrement de la première à la dernière diapositive.
    background.setPalette(index / Math.max(SLIDES.length - 1, 1));

    const isSurvey = id === SURVEY_SLIDE;
    // Sur le parcours on lit : le fond se met en retrait.
    background.setCalm(isSurvey ? 1 : 0);

    clearTimeout(leaveTimer);
    if (isSurvey) {
      survey?.start();
    } else {
      // On attend la fin du glissement pour que la remise à zéro reste invisible.
      leaveTimer = setTimeout(() => survey?.reset(), TIMING.slideTransition);
    }

    // Le film ne joue que sur sa propre section : jamais de son en arrière-plan.
    // Les sections voisines déclenchent seulement son téléchargement.
    const distanceAuFilm = Math.abs(index - SLIDES.findIndex((s) => s.id === VIDEO_SLIDE));

    if (id === VIDEO_SLIDE) {
      film?.play();
    } else {
      film?.stop();
      if (distanceAuFilm === 1) film?.prepare();
    }

    // La démonstration se rejoue à chaque venue, et se remet à zéro en partant.
    if (id === DEMO_SLIDE) {
      clearTimeout(demoTimer);
      demoTimer = setTimeout(() => demo?.play(), TIMING.slideTransition);
    } else {
      clearTimeout(demoTimer);
      demo?.reset();
    }
  },
});

// Le panneau pilote le deck plutôt que de poser ses propres `data-goto` : la
// dépendance est explicite, et l'ordre d'initialisation cesse d'avoir un sens.
if (deck) createMenu(deck);

// Deux images plus tard, le fond a peint sa première passe : on peut montrer.
requestAnimationFrame(() => {
  requestAnimationFrame(() => document.body.classList.add('is-ready'));
});
