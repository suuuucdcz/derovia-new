/**
 * Derovia — Démonstration animée
 *
 * Rejoue le traitement d'une facture : lecture, extraction des données, écriture
 * comptable. Les données affichées sont fictives et figurent dans le HTML ;
 * ce module ne fait qu'orchestrer leur apparition.
 */

import { DEMO_TIMELINE } from './config.js';

const REVEALED = 'is-revealed';

export function createDemo() {
  const root = document.getElementById('demo');
  if (!root) return null;

  const fields = [...root.querySelectorAll('.demo-field')];
  const result = root.querySelector('.demo-result');
  const replay = document.getElementById('demo-replay');

  /** L'utilisateur qui a demandé moins d'animations voit l'état final d'emblée. */
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let timers = [];

  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  const at = (delay, action) => timers.push(setTimeout(action, delay));

  const reset = () => {
    clearTimers();
    root.classList.remove('is-scanning', 'is-done');
    fields.forEach((field) => field.classList.remove(REVEALED));
    result.classList.remove(REVEALED);
  };

  const showEverything = () => {
    root.classList.add('is-done');
    fields.forEach((field) => field.classList.add(REVEALED));
    result.classList.add(REVEALED);
  };

  const play = () => {
    reset();

    if (reducedMotion.matches) {
      showEverything();
      return;
    }

    at(DEMO_TIMELINE.scan, () => root.classList.add('is-scanning'));

    fields.forEach((field, index) => {
      at(DEMO_TIMELINE.firstField + index * DEMO_TIMELINE.fieldInterval, () => {
        field.classList.add(REVEALED);
      });
    });

    at(DEMO_TIMELINE.result, () => {
      root.classList.add('is-done');
      result.classList.add(REVEALED);
    });
  };

  replay?.addEventListener('click', play);

  return { play, reset };
}
