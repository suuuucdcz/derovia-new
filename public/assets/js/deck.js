/**
 * Derovia — Navigation entre les diapositives plein écran
 *
 * Le déplacement est purement CSS : ce module met à jour `--slide-index` sur
 * `.deck-viewport`, synchronise les repères de navigation et notifie le reste
 * de l'application. L'en-tête vit hors du deck, donc la marque ne bouge jamais.
 *
 * Quatre manières d'avancer : molette, glissement tactile, clavier, et tout
 * élément portant `data-goto` (un identifiant de section, ou `prev` / `next`).
 */

import { REQUETE_DEFILEMENT, SLIDES } from './config.js';

/** Intensité de l'effet magnétique des boutons principaux (0 = désactivé). */
const MAGNET_STRENGTH = 0.12;

/** Molette : delta cumulé requis, et pause après un changement de section. */
const WHEEL_THRESHOLD = 40;
const WHEEL_LOCK_MS = 950;
/** Au-delà de ce silence, la molette repart d'un geste neuf. */
const WHEEL_GESTURE_GAP_MS = 180;

/** Amplitude minimale d'un glissement tactile, en pixels. */
const SWIPE_THRESHOLD = 60;

/**
 * @param {object} handlers
 * @param {(slide: {id: string, index: number}) => void} [handlers.onChange]
 */
export function createDeck({ onChange } = {}) {
  const viewport = document.getElementById('deck-viewport');
  if (!viewport) return null;

  const dots = document.getElementById('deck-dots');
  const indexOf = (id) => SLIDES.findIndex((slide) => slide.id === id);
  const sectionOf = (index) => document.getElementById(`slide-${SLIDES[index].id}`);

  /* --- Deux modes ---
     Sur grand écran, les sections glissent sous une fenêtre fixe. Sur petit
     écran, elles s'empilent et la page défile : c'est le navigateur qui gère
     le geste, et le doigt n'a plus qu'une chose à faire. --- */
  const petitEcran = window.matchMedia(REQUETE_DEFILEMENT);
  let enDefilement = petitEcran.matches;

  let current = 0;

  /**
   * @param {number|string} target Index, identifiant de section, `prev` ou `next`.
   * @returns {boolean} `true` si la section a effectivement changé.
   */
  const goTo = (target) => {
    let index;
    if (target === 'prev') index = current - 1;
    else if (target === 'next') index = current + 1;
    else if (typeof target === 'number') index = target;
    else index = indexOf(target);

    if (index < 0 || index >= SLIDES.length) return false;

    if (enDefilement) {
      // L'observateur annoncera l'arrivée : ici on ne fait que se déplacer.
      sectionOf(index)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return index !== current;
    }

    if (index === current) return false;
    viewport.style.setProperty('--slide-index', String(index));
    marquerCourante(index);
    return true;
  };

  /** Enregistre la section atteinte et prévient le reste de l'application. */
  const marquerCourante = (index) => {
    current = index;
    // Sur <body> aussi : les éléments hors du deck (en-tête) s'y adaptent.
    viewport.dataset.slide = SLIDES[index].id;
    document.body.dataset.slide = SLIDES[index].id;

    syncNav(index);
    onChange?.({ ...SLIDES[index], index });
  };

  const syncNav = (index) => {
    for (const link of document.querySelectorAll('[data-goto]')) {
      const isCurrent = indexOf(link.dataset.goto) === index;
      link.classList.toggle('is-current', isCurrent);
    }
  };

  /* --- Repères latéraux, générés depuis la configuration --- */
  if (dots) {
    for (const [index, slide] of SLIDES.entries()) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'deck-dot';
      dot.dataset.goto = slide.id;
      dot.setAttribute('aria-label', `Aller à la section ${slide.label}`);

      const label = document.createElement('span');
      label.className = 'deck-dot-label';
      label.textContent = slide.label;
      dot.append(label);

      dot.addEventListener('click', () => goTo(index));
      dots.append(dot);
    }
  }

  /* --- Mode défilement : la section visible fait foi ---
     Rien n'est imposé, on constate. La marge négative ne laisse passer qu'une
     bande étroite au milieu de l'écran : une seule section la croise à la fois,
     quelle que soit sa hauteur — un seuil en pourcentage ne se déclencherait
     jamais pour une section plus haute que la fenêtre. --- */
  const sections = SLIDES.map((_, index) => sectionOf(index)).filter(Boolean);
  const rangs = new Map(sections.map((section, index) => [section, index]));

  const observateur = new IntersectionObserver(
    (entrees) => {
      const arrivee = entrees.find((entree) => entree.isIntersecting);
      if (!arrivee) return;

      const index = rangs.get(arrivee.target);
      if (index !== undefined && index !== current) marquerCourante(index);
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
  );

  /* Le pied de page est logé dans l'accueil, où il se cale en bas d'écran.
     Sur une page qui défile, il se retrouverait au premier tiers du document :
     il rejoint la fin. Déplacé, jamais dupliqué. */
  const pied = document.querySelector('.site-footer');
  const logeDuPied = pied?.parentElement;

  /* En haut de page, rien ne passe sous l'en-tête : le voile n'y couvrirait
     que le fond animé, pour rien. Il ne s'arme qu'une fois le défilement
     entamé, et disparaît dès qu'on revient en haut. */
  const marquerDefilement = () => {
    document.body.classList.toggle('a-defile', window.scrollY > 24);
  };

  const appliquerMode = () => {
    if (pied) (enDefilement ? viewport : logeDuPied)?.append(pied);

    if (enDefilement) {
      window.addEventListener('scroll', marquerDefilement, { passive: true });
      marquerDefilement();
    } else {
      window.removeEventListener('scroll', marquerDefilement);
      document.body.classList.remove('a-defile');
    }

    if (enDefilement) {
      // C'est la page qui se déplace : le décalage des diapositives doit partir.
      viewport.style.setProperty('--slide-index', '0');
      for (const section of sections) observateur.observe(section);
    } else {
      observateur.disconnect();
      viewport.style.setProperty('--slide-index', String(current));
    }
  };

  petitEcran.addEventListener('change', (event) => {
    enDefilement = event.matches;
    appliquerMode();
  });

  /* --- Tout élément portant `data-goto` navigue --- */
  for (const trigger of document.querySelectorAll('[data-goto]')) {
    if (trigger.classList.contains('deck-dot')) continue;
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      goTo(trigger.dataset.goto);
    });
  }

  document.querySelectorAll('.btn-primary, .btn-secondary').forEach(bindMagneticEffect);

  // En mode défilement, c'est le navigateur qui fait défiler : intercepter la
  // molette, le glissement ou les flèches ne ferait que lui disputer le geste.
  const enModeDeck = () => !enDefilement;

  bindWheel(viewport, goTo, enModeDeck);
  bindSwipe(viewport, goTo, enModeDeck);
  bindKeyboard(goTo, enModeDeck);

  viewport.dataset.slide = SLIDES[0].id;
  syncNav(0);
  appliquerMode();

  return {
    goTo,
    get current() { return current; },
    get enDefilement() { return enDefilement; },
  };
}

/* ==========================================================================
   Gestes
   ========================================================================== */

function bindWheel(viewport, goTo, enModeDeck) {
  let accumulated = 0;
  let lastEvent = 0;
  let lockedUntil = 0;

  viewport.addEventListener(
    'wheel',
    (event) => {
      if (!enModeDeck()) return;

      // Une zone interne encore défilable garde la main : la conversation et
      // les sections trop hautes doivent pouvoir défiler normalement.
      if (findScrollable(event.target, event.deltaY, viewport)) return;

      event.preventDefault();

      const now = event.timeStamp;
      if (now < lockedUntil) return;
      if (now - lastEvent > WHEEL_GESTURE_GAP_MS) accumulated = 0;
      lastEvent = now;

      accumulated += normalizeDelta(event, viewport);
      if (Math.abs(accumulated) < WHEEL_THRESHOLD) return;

      const direction = Math.sign(accumulated);
      accumulated = 0;

      // La pause n'est posée que si l'on a réellement changé de section, sinon
      // un geste en butée bloquerait la navigation pendant une seconde.
      if (goTo(direction > 0 ? 'next' : 'prev')) lockedUntil = now + WHEEL_LOCK_MS;
    },
    { passive: false },
  );
}

function bindSwipe(viewport, goTo, enModeDeck) {
  let startY = null;
  let startTarget = null;

  viewport.addEventListener(
    'touchstart',
    (event) => {
      if (!enModeDeck()) return;
      startY = event.touches[0]?.clientY ?? null;
      startTarget = event.target;
    },
    { passive: true },
  );

  viewport.addEventListener(
    'touchend',
    (event) => {
      if (startY === null) return;

      const endY = event.changedTouches[0]?.clientY ?? startY;
      const delta = startY - endY;
      startY = null;

      if (Math.abs(delta) < SWIPE_THRESHOLD) return;
      if (findScrollable(startTarget, delta, viewport)) return;

      goTo(delta > 0 ? 'next' : 'prev');
    },
    { passive: true },
  );
}

function bindKeyboard(goTo, enModeDeck) {
  window.addEventListener('keydown', (event) => {
    if (!enModeDeck()) return;

    const target = event.target;
    if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) return;

    // Le panneau de navigation a la main tant qu'il est ouvert : ni Échap ni
    // les flèches ne doivent déplacer une pile qu'on ne voit plus. La règle est
    // posée ici plutôt qu'interceptée ailleurs — elle ne dépend alors ni de
    // l'ordre d'inscription des écouteurs, ni de la phase de propagation.
    if (document.body.classList.contains('menu-ouvert')) return;

    if (event.key === 'ArrowDown' || event.key === 'PageDown') goTo('next');
    if (event.key === 'ArrowUp' || event.key === 'PageUp') goTo('prev');
    if (event.key === 'Home') goTo(0);
    if (event.key === 'Escape') goTo('prev');
  });
}

/**
 * Remonte depuis `node` jusqu'au deck à la recherche d'une zone défilable qui
 * peut encore avancer dans la direction demandée.
 * @returns {Element|null}
 */
function findScrollable(node, delta, boundary) {
  for (let el = node; el instanceof Element && el !== boundary; el = el.parentElement) {
    const overflow = getComputedStyle(el).overflowY;
    if (overflow !== 'auto' && overflow !== 'scroll') continue;

    const room = el.scrollHeight - el.clientHeight;
    if (room <= 1) continue;

    // 1px de tolérance : les hauteurs fractionnaires ne tombent jamais juste.
    if (delta > 0 && el.scrollTop < room - 1) return el;
    if (delta < 0 && el.scrollTop > 1) return el;
  }
  return null;
}

/** Ramène le delta en pixels, quel que soit le mode rapporté par le navigateur. */
function normalizeDelta(event, viewport) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * viewport.clientHeight;
  return event.deltaY;
}

/** Fait suivre légèrement le curseur au bouton, façon Apple. */
function bindMagneticEffect(button) {
  button.addEventListener('mousemove', (event) => {
    const rect = button.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;

    button.style.transform =
      `translate(${offsetX * MAGNET_STRENGTH}px, ${offsetY * MAGNET_STRENGTH}px) scale(1.02)`;
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = '';
  });
}
