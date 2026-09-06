/**
 * Derovia — Point d'entrée
 *
 * Instancie les modules et les relie : la navigation pilote la teinte du fond,
 * son degré d'apaisement et le cycle de vie du parcours de qualification.
 */

import { OrganicBackground } from './background.js';
import { createDeck } from './deck.js';
import { createSurvey } from './survey.js';
import { SLIDES, SURVEY_SLIDE, TIMING } from './config.js';

const background = new OrganicBackground('bg-canvas');
const survey = createSurvey();

let leaveTimer = null;

createDeck({
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
  },
});

// Deux images plus tard, le fond a peint sa première passe : on peut montrer.
requestAnimationFrame(() => {
  requestAnimationFrame(() => document.body.classList.add('is-ready'));
});
