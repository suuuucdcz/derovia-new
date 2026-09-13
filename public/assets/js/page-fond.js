/**
 * Derovia — fond des pages autonomes
 *
 * La page vidéo et la page logiciel reprennent le fond organique du site, en
 * mode apaisé : on y lit ou on y regarde, le décor reste en retrait.
 */

import { OrganicBackground } from './background.js';

const background = new OrganicBackground('bg-canvas');

// Teinte de la dernière diapositive, et amplitude réduite : le fond ne dispute
// pas l'attention au contenu.
background.setPalette(1);
background.setCalm(1);

requestAnimationFrame(() => {
  requestAnimationFrame(() => document.body.classList.add('is-ready'));
});
