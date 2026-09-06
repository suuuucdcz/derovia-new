/**
 * Derovia — page vidéo
 *
 * Reprend le fond organique du site, en mode apaisé : la page se regarde,
 * elle ne se contemple pas. Aucune autre logique n'est nécessaire ici.
 */

import { OrganicBackground } from './background.js';

const background = new OrganicBackground('bg-canvas');

// Teinte de la dernière diapositive, et amplitude réduite : le fond reste en
// retrait derrière la vidéo au lieu de lui disputer l'attention.
background.setPalette(1);
background.setCalm(1);

requestAnimationFrame(() => {
  requestAnimationFrame(() => document.body.classList.add('is-ready'));
});
