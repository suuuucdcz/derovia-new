/**
 * Derovia — démonstration par métier
 *
 * Fait défiler le même schéma — une charge répétitive, la réponse automatisée —
 * d'un métier à l'autre. Le propos n'est pas le cas montré mais le fait qu'il
 * change : l'automatisation se taille à la demande, quel que soit le domaine.
 *
 * Les cas vivent dans config.js ; ce module ne fait que les mettre en scène.
 */

import { DEMO_CASES, DEMO_INTERVAL } from './config.js';

const ACTIF = 'is-current';
const SORTIE = 'is-leaving';

export function createDemo() {
  const root = document.getElementById('demo');
  if (!root) return null;

  const onglets = root.querySelector('.demo-trades');
  const charge = root.querySelector('[data-role="charge"]');
  const reponse = root.querySelector('[data-role="reponse"]');
  const gain = root.querySelector('[data-role="gain"]');

  if (!onglets || !charge || !reponse || !gain) {
    console.error('Derovia : structure de la démonstration incomplète.');
    return null;
  }

  /** L'utilisateur qui a demandé moins d'animations garde la main. */
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let index = 0;
  let minuteur = null;

  /* --- Onglets, construits depuis la configuration --- */
  const boutons = DEMO_CASES.map((cas, i) => {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'demo-trade';
    bouton.textContent = cas.metier;
    bouton.addEventListener('click', () => {
      afficher(i);
      relancer();
    });
    onglets.append(bouton);
    return bouton;
  });

  const afficher = (i) => {
    index = i;
    const cas = DEMO_CASES[i];

    boutons.forEach((b, j) => b.classList.toggle(ACTIF, j === i));

    // Bref effacement avant réécriture : le remplacement se voit, sans à-coup.
    const champs = [
      [charge, cas.charge],
      [reponse, cas.reponse],
      [gain, cas.gain],
    ];

    if (reducedMotion.matches) {
      champs.forEach(([el, texte]) => { el.textContent = texte; });
      return;
    }

    champs.forEach(([el]) => el.classList.add(SORTIE));

    setTimeout(() => {
      champs.forEach(([el, texte]) => {
        el.textContent = texte;
        el.classList.remove(SORTIE);
      });
    }, 220);
  };

  const relancer = () => {
    clearInterval(minuteur);
    if (reducedMotion.matches) return;

    minuteur = setInterval(() => afficher((index + 1) % DEMO_CASES.length), DEMO_INTERVAL);
  };

  afficher(0);

  return {
    /** Reprend le défilement à l'arrivée sur la section. */
    play() {
      afficher(index);
      relancer();
    },

    /** Arrête le défilement en quittant : rien ne tourne hors écran. */
    reset() {
      clearInterval(minuteur);
      minuteur = null;
    },
  };
}
