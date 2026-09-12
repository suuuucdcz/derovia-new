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

  /**
   * @param {number} i Index du métier à montrer.
   * @param {boolean} anime Effacer brièvement avant de réécrire. Faux à
   *   l'arrivée sur la section : le contenu ne change pas, et l'effacement
   *   laisserait les panneaux vides le temps de la transition.
   */
  const afficher = (i, anime = true) => {
    index = i;
    const cas = DEMO_CASES[i];

    boutons.forEach((b, j) => b.classList.toggle(ACTIF, j === i));

    // Sur téléphone, les onglets forment un rail horizontal : le métier retenu
    // serait hors champ au fil du défilement automatique. On déplace le rail
    // lui-même, jamais la page — `scrollIntoView` l'entraînerait avec elle.
    const bouton = boutons[i];
    if (bouton && onglets.scrollWidth > onglets.clientWidth) {
      onglets.scrollTo({
        left: bouton.offsetLeft - (onglets.clientWidth - bouton.offsetWidth) / 2,
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      });
    }

    const champs = [
      [charge, cas.charge],
      [reponse, cas.reponse],
      [gain, cas.gain],
    ];

    const ecrire = () => {
      champs.forEach(([el, texte]) => {
        el.textContent = texte;
        el.classList.remove(SORTIE);
      });
    };

    if (!anime || reducedMotion.matches) {
      ecrire();
      return;
    }

    champs.forEach(([el]) => el.classList.add(SORTIE));
    setTimeout(ecrire, 220);
  };

  const relancer = () => {
    clearInterval(minuteur);
    if (reducedMotion.matches) return;

    minuteur = setInterval(() => afficher((index + 1) % DEMO_CASES.length), DEMO_INTERVAL);
  };

  afficher(0, false);

  return {
    /** Reprend le défilement à l'arrivée sur la section. */
    play() {
      afficher(index, false);
      relancer();
    },

    /** Arrête le défilement en quittant : rien ne tourne hors écran. */
    reset() {
      clearInterval(minuteur);
      minuteur = null;
    },
  };
}
