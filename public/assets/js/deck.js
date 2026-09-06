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

import { SLIDES } from './config.js';

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

    if (index < 0 || index >= SLIDES.length || index === current) return false;

    current = index;
    viewport.style.setProperty('--slide-index', String(index));
    // Sur <body> aussi : les éléments hors du deck (en-tête) s'y adaptent.
    viewport.dataset.slide = SLIDES[index].id;
    document.body.dataset.slide = SLIDES[index].id;
    document.body.classList.add('has-navigated');

    syncNav(index);
    onChange?.({ ...SLIDES[index], index });
    return true;
  };

  const syncNav = (index) => {
    for (const link of document.querySelectorAll('[data-goto]')) {
      const isCurrent = indexOf(link.dataset.goto) === index;
      link.classList.toggle('is-current', isCurrent);
      if (link.dataset.navLink !== undefined) {
        link.setAttribute('aria-current', isCurrent ? 'true' : 'false');
      }
    }
  };

  /* --- Menu principal, généré depuis la configuration ---
     Écrits en dur, les liens se désynchronisaient dès qu'une section était
     ajoutée : le drapeau `nav` de SLIDES est désormais la seule référence. --- */
  const menu = document.getElementById('site-nav-links');
  if (menu) {
    for (const slide of SLIDES.filter((s) => s.nav)) {
      const lien = document.createElement('a');
      lien.href = '#';
      lien.dataset.goto = slide.id;
      lien.dataset.navLink = '';
      lien.textContent = slide.label;
      menu.append(lien);
    }
  }

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

  /* --- Tout élément portant `data-goto` navigue ---
     Requête faite après la génération du menu, pour l'inclure. --- */
  for (const trigger of document.querySelectorAll('[data-goto]')) {
    if (trigger.classList.contains('deck-dot')) continue;
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      goTo(trigger.dataset.goto);
    });
  }

  document.querySelectorAll('.btn-primary, .btn-secondary').forEach(bindMagneticEffect);

  bindWheel(viewport, goTo);
  bindSwipe(viewport, goTo);
  bindKeyboard(goTo);

  viewport.dataset.slide = SLIDES[0].id;
  syncNav(0);

  return { goTo, get current() { return current; } };
}

/* ==========================================================================
   Gestes
   ========================================================================== */

function bindWheel(viewport, goTo) {
  let accumulated = 0;
  let lastEvent = 0;
  let lockedUntil = 0;

  viewport.addEventListener(
    'wheel',
    (event) => {
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

function bindSwipe(viewport, goTo) {
  let startY = null;
  let startTarget = null;

  viewport.addEventListener(
    'touchstart',
    (event) => {
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

function bindKeyboard(goTo) {
  window.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) return;

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
