/* ==========================================================================
   Derovia — Interactive Transitions & UI Engine
   Zero dependencies · 60fps CSS-driven choreography · Reduced-motion safe
   ========================================================================== */

(() => {
'use strict';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------------
   1. Sticky Frosted Navbar & Mobile Drawer
   -------------------------------------------------------------------------- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const burger = document.getElementById('nav-burger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileScrim = document.getElementById('mobile-scrim');

  if (navbar) {
    let navRaf = null;
    const updateNav = () => {
      navRaf = null;
      const stuck = window.scrollY > 24 ? 'true' : 'false';
      if (navbar.dataset.stuck !== stuck) navbar.dataset.stuck = stuck;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!navRaf) navRaf = requestAnimationFrame(updateNav);
      },
      { passive: true }
    );
    window.addEventListener('pageshow', () => requestAnimationFrame(updateNav), { passive: true });
  }

  if (burger && mobileMenu) {
    const setMenu = (open) => {
      const hadFocus = !open && mobileMenu.contains(document.activeElement);
      burger.setAttribute('aria-expanded', String(open));
      mobileMenu.dataset.open = String(open);
      mobileMenu.setAttribute('aria-hidden', String(!open));
      mobileMenu.inert = !open;
      if (mobileScrim) {
        mobileScrim.dataset.open = String(open);
        mobileScrim.setAttribute('aria-hidden', String(!open));
      }
      if (navbar) navbar.dataset.menuOpen = String(open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (hadFocus) burger.focus();
    };

    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.dataset.open === 'true';
      setMenu(!isOpen);
    });

    if (mobileScrim) {
      mobileScrim.addEventListener('click', () => setMenu(false));
    }

    mobileMenu.querySelectorAll('[data-close-menu], [data-open-modal]').forEach((el) => {
      el.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.dataset.open === 'true') {
        setMenu(false);
      }
    });
  }
}

/* --------------------------------------------------------------------------
   2. Scroll-Triggered Reveals (IntersectionObserver)
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  const finalCta = document.getElementById('final-cta');

  if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
    items.forEach((el) => (el.dataset.reveal = 'visible'));
    if (finalCta) finalCta.dataset.inview = 'true';
    return;
  }

  if (items.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.dataset.reveal = 'visible';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    );

    items.forEach((el) => observer.observe(el));
  }

  // Progressive rising animation for unified Final CTA amphitheater frieze
  if (finalCta) {
    const friezeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            finalCta.dataset.inview = 'true';
            friezeObserver.unobserve(finalCta);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    friezeObserver.observe(finalCta);
  }
}

/* --------------------------------------------------------------------------
   3. Sticky Stacking Method Cards (Physical Depth Scaling)
   -------------------------------------------------------------------------- */
function initStackCards() {
  if (REDUCED_MOTION) return;
  const track = document.getElementById('stack-track');
  const cards = Array.from(document.querySelectorAll('.stack-card'));
  if (!track || cards.length < 2) return;

  let rafId = null;
  let trackInView = !('IntersectionObserver' in window);
  const compactMQ = window.matchMedia('(max-width: 820px)');
  let isCompact = compactMQ.matches;

  const updateStack = () => {
    rafId = null;
    if (!trackInView) return;

    // 1. Batch all DOM geometry reads before any style write (zero forced reflow)
    const tops = cards.map((card) => card.getBoundingClientRect().top);

    // 2. Batch all style writes only when changed
    cards.forEach((card, i) => {
      if (i >= cards.length - 1) {
        if (card.style.transform) card.style.transform = '';
        if (card.style.filter) card.style.filter = '';
        return;
      }

      const top = tops[i];
      const nextTop = tops[i + 1];
      const overlapStart = top + (isCompact ? 170 : 205);
      const overlapEnd = top + (isCompact ? 14 : 16);
      const progress = Math.min(1, Math.max(0, (overlapStart - nextTop) / (overlapStart - overlapEnd)));

      const nextTransform = progress > 0 ? `scale(${(1 - progress * (isCompact ? 0.055 : 0.042)).toFixed(4)})` : '';
      const nextFilter = progress > 0 ? `brightness(${(1 - progress * 0.045).toFixed(3)})` : '';
      if (card.style.transform !== nextTransform) card.style.transform = nextTransform;
      if (card.style.filter !== nextFilter) card.style.filter = nextFilter;
    });
  };

  const scheduleUpdate = () => {
    if (trackInView && !rafId) rafId = requestAnimationFrame(updateStack);
  };

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        trackInView = entries[0].isIntersecting;
        if (trackInView) scheduleUpdate();
      },
      { rootMargin: '120px 0px' }
    );
    obs.observe(track);
  }

  compactMQ.addEventListener('change', (e) => {
    isCompact = e.matches;
    scheduleUpdate();
  });
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
}

/* --------------------------------------------------------------------------
   4. Hero Interactive Auto-Playing Automation Card Deck
      Symmetry-style sequential deal-in + downward-peeking stack choreography
   -------------------------------------------------------------------------- */
function initHeroDeck() {
  const deckEl = document.getElementById('hero-deck');
  if (!deckEl) return;

  const cards = Array.from(deckEl.querySelectorAll('.deck-card'));
  const controlsEl = document.getElementById('deck-controls');
  const dots = Array.from(document.querySelectorAll('[data-deck-goto]'));
  const toggleBtn = document.getElementById('deck-toggle');
  const toggleLabel = document.getElementById('deck-toggle-label');
  const iconPause = document.getElementById('deck-icon-pause');
  const iconPlay = document.getElementById('deck-icon-play');
  const progressBar = document.getElementById('deck-progress-bar');

  const total = cards.length;
  const CYCLE_MS = 2800;
  const DEAL_START_MS = 520;
  const DEAL_STAGGER_MS = 420;
  const DEAL_SETTLE_MS = 950;

  let current = 0;
  let paused = REDUCED_MOTION;
  let busy = false;
  let dealing = !REDUCED_MOTION;
  let hasStartedDeal = false;
  let cycleTimer = null;
  let stepTimers = [];

  const clearStepTimers = () => {
    clearTimeout(cycleTimer);
    stepTimers.forEach((t) => clearTimeout(t));
    stepTimers = [];
  };

  const setCardActive = (card, isFront) => {
    card.inert = !isFront;
    if (isFront) {
      card.removeAttribute('aria-hidden');
    } else {
      card.setAttribute('aria-hidden', 'true');
    }
  };

  const renderPositions = () => {
    cards.forEach((card, idx) => {
      const pos = (idx - current + total) % total;
      card.dataset.pos = String(pos);
      card.removeAttribute('data-state');
      card.removeAttribute('data-exit');
      card.querySelectorAll('[data-deck-action]').forEach((b) => b.removeAttribute('data-active'));
      setCardActive(card, pos === 0);
    });

    dots.forEach((dot, idx) => {
      dot.setAttribute('aria-selected', String(idx === current));
    });
  };

  const finishDealImmediately = () => {
    if (!dealing) return;
    clearStepTimers();
    dealing = false;
    hasStartedDeal = true;
    if (controlsEl) controlsEl.dataset.ready = 'true';
    renderPositions();
  };

  const resetProgress = (animate) => {
    if (!progressBar) return;
    progressBar.style.transition = 'none';
    progressBar.style.transform = 'scaleX(0)';
    if (animate && !paused) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (paused || dealing) return;
          progressBar.style.transition = `transform ${CYCLE_MS}ms linear`;
          progressBar.style.transform = 'scaleX(1)';
        });
      });
    }
  };

  const scheduleNext = () => {
    clearStepTimers();
    if (paused || dealing) {
      resetProgress(false);
      return;
    }

    resetProgress(true);
    const activeCard = cards[current];
    const defaultAction = activeCard.dataset.defaultAction || 'accept';

    // 1. Highlight working state + press pill visually
    stepTimers.push(
      setTimeout(() => {
        if (paused || busy || dealing) return;
        activeCard.dataset.state = 'working';
        const btn = activeCard.querySelector(`[data-deck-action="${defaultAction}"]`);
        if (btn) btn.dataset.active = 'true';
      }, CYCLE_MS - 720)
    );

    // 2. Confirm done state + dismiss with physics
    cycleTimer = setTimeout(() => {
      if (paused || busy || dealing) return;
      dismissCurrent(defaultAction);
    }, CYCLE_MS);
  };

  const startDealIn = () => {
    if (hasStartedDeal || REDUCED_MOTION) return;
    hasStartedDeal = true;
    dealing = true;
    clearStepTimers();

    // Ensure every card starts cleanly in its pre-deal offset above the deck
    cards.forEach((card, idx) => {
      card.dataset.state = 'incoming';
      card.removeAttribute('data-exit');
      setCardActive(card, idx === 0);
    });

    // Deal cards back-to-front so Card 0 ("Devis automatique") lands last on top
    const dealOrder = Array.from({ length: total }, (_, i) => total - 1 - i);
    const dealtStack = [];

    dealOrder.forEach((cardIdx, step) => {
      stepTimers.push(
        setTimeout(() => {
          dealtStack.unshift(cardIdx);
          current = cardIdx;

          // Promote newly dealt card to d=0 and step earlier cards down d=1, d=2, d=3
          requestAnimationFrame(() => {
            dealtStack.forEach((idx, depth) => {
              const card = cards[idx];
              card.dataset.pos = String(depth);
              card.removeAttribute('data-state');
              setCardActive(card, depth === 0);
            });
          });

          dots.forEach((dot, idx) => {
            dot.setAttribute('aria-selected', String(idx === current));
          });

          if (step === dealOrder.length - 1) {
            if (controlsEl) controlsEl.dataset.ready = 'true';
            stepTimers.push(
              setTimeout(() => {
                dealing = false;
                current = 0;
                if (!paused) scheduleNext();
              }, DEAL_SETTLE_MS)
            );
          }
        }, DEAL_START_MS + step * DEAL_STAGGER_MS)
      );
    });
  };

  const dismissCurrent = (action = 'accept', targetIndex = null) => {
    if (dealing) finishDealImmediately();
    if (busy) return;
    busy = true;
    clearStepTimers();

    const exitingCard = cards[current];
    const btn = exitingCard.querySelector(`[data-deck-action="${action}"]`);
    if (btn) btn.dataset.active = 'true';
    exitingCard.dataset.state = 'done';

    const nextIdx = targetIndex !== null ? targetIndex : (current + 1) % total;

    // Trigger exit fly-out
    requestAnimationFrame(() => {
      exitingCard.dataset.exit = action;
      setCardActive(exitingCard, false);

      // Promote remaining cards forward simultaneously
      cards.forEach((card, idx) => {
        if (idx === current) return;
        const pos = (idx - nextIdx + total) % total;
        card.dataset.pos = String(pos);
        setCardActive(card, pos === 0);
      });
    });

    dots.forEach((dot, idx) => {
      dot.setAttribute('aria-selected', String(idx === nextIdx));
    });

    stepTimers.push(
      setTimeout(() => {
        // Snap exiting card cleanly to back of stack without reverse transition
        exitingCard.style.transition = 'none';
        exitingCard.removeAttribute('data-exit');
        exitingCard.removeAttribute('data-state');
        exitingCard.querySelectorAll('[data-deck-action]').forEach((b) => b.removeAttribute('data-active'));
        current = nextIdx;
        const backPos = (Number(exitingCard.dataset.cardIndex) - current + total) % total;
        exitingCard.dataset.pos = String(backPos);

        requestAnimationFrame(() => {
          exitingCard.style.transition = '';
          busy = false;
          scheduleNext();
        });
      }, 500)
    );
  };

  // Interactive button clicks inside cards
  deckEl.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-deck-action]');
    if (!actionBtn) return;
    const card = actionBtn.closest('.deck-card');
    if (!card || card.dataset.pos !== '0') return;
    dismissCurrent(actionBtn.dataset.deckAction);
  });

  // Dot controls
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      if (dealing) finishDealImmediately();
      const target = Number(dot.dataset.deckGoto);
      if (target === current || busy) return;
      dismissCurrent('auto', target);
    });
  });

  // Pause / Play toggle
  const syncToggleUI = () => {
    if (!toggleBtn) return;
    toggleBtn.setAttribute('aria-pressed', String(paused));
    toggleLabel.textContent = paused ? 'Reprendre' : 'Pause';
    iconPause.toggleAttribute('hidden', paused);
    iconPlay.toggleAttribute('hidden', !paused);
  };

  if (toggleBtn) {
    syncToggleUI();
    toggleBtn.addEventListener('click', () => {
      if (dealing) finishDealImmediately();
      paused = !paused;
      syncToggleUI();
      if (paused) {
        clearStepTimers();
        resetProgress(false);
      } else {
        scheduleNext();
      }
    });
  }

  // Keyboard shortcuts V / R / A when hero is visible and no modal/input active
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const modal = document.getElementById('contact-modal');
    if (modal && modal.dataset.open === 'true') return;
    const rect = deckEl.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    const key = e.key.toLowerCase();
    if (key === 'v') dismissCurrent('accept');
    else if (key === 'r') dismissCurrent('remind');
    else if (key === 'a') dismissCurrent('auto');
  });

  // Pause cleanly when page is hidden; start deal-in on first view if opened in background
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (dealing) {
        clearStepTimers();
        hasStartedDeal = false;
      } else {
        clearStepTimers();
        resetProgress(false);
      }
    } else if (!hasStartedDeal && !REDUCED_MOTION) {
      startDealIn();
    } else if (!paused && !dealing) {
      scheduleNext();
    }
  });

  if (REDUCED_MOTION) {
    if (controlsEl) controlsEl.dataset.ready = 'true';
    renderPositions();
  } else if (!document.hidden) {
    startDealIn();
  }
}

/* --------------------------------------------------------------------------
   5. Interactive Trade Accordion + Color-Morphing Isometric Stage
   -------------------------------------------------------------------------- */
function initTradesAccordion() {
  const widget = document.getElementById('trades-widget');
  const stage = document.getElementById('trade-stage');
  if (!widget || !stage) return;

  const items = Array.from(widget.querySelectorAll('.acc-item'));
  const scenes = Array.from(stage.querySelectorAll('.trade-scene'));
  const mobileMQ = window.matchMedia('(max-width: 820px)');
  const DWELL_MS = 6200;

  let activeIndex = 0;
  let timer = null;
  let inView = false;
  let userPaused = REDUCED_MOTION;

  const dockStage = (index) => {
    if (mobileMQ.matches) {
      const targetInner = items[index]?.querySelector('.acc-panel__inner');
      if (targetInner && stage.parentElement !== targetInner) {
        targetInner.appendChild(stage);
      }
    } else if (stage.parentElement !== widget) {
      widget.appendChild(stage);
    }
  };

  mobileMQ.addEventListener('change', () => dockStage(activeIndex));

  const activate = (index, restartAuto = true) => {
    activeIndex = index;

    items.forEach((item, i) => {
      const open = i === index;
      item.dataset.open = String(open);
      item.classList.remove('is-playing');
      const trigger = item.querySelector('.acc-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', String(open));
    });

    const activeItem = items[index];
    dockStage(index);
    stage.dataset.tint = activeItem.dataset.tint || 'blue';

    scenes.forEach((scene, i) => {
      scene.dataset.active = String(i === index);
    });

    clearTimeout(timer);
    if (restartAuto && inView && !userPaused) {
      requestAnimationFrame(() => {
        if (!inView || userPaused || activeIndex !== index) return;
        activeItem.classList.add('is-playing');
      });
      timer = setTimeout(() => {
        activate((activeIndex + 1) % items.length, true);
      }, DWELL_MS);
    }
  };

  if ('IntersectionObserver' in window) {
    const dockObs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          dockStage(activeIndex);
          dockObs.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );
    dockObs.observe(widget);
  } else {
    dockStage(0);
  }

  items.forEach((item, i) => {
    const trigger = item.querySelector('.acc-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      userPaused = false;
      activate(i, true);
    });
  });

  // Pause auto-advance while hovering the widget so user can read comfortably
  widget.addEventListener('mouseenter', () => {
    userPaused = true;
    clearTimeout(timer);
    items.forEach((item) => item.classList.remove('is-playing'));
  });
  widget.addEventListener('mouseleave', () => {
    if (REDUCED_MOTION) return;
    userPaused = false;
    activate(activeIndex, true);
  });

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        if (inView && !userPaused) {
          activate(activeIndex, true);
        } else {
          clearTimeout(timer);
          items.forEach((item) => item.classList.remove('is-playing'));
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(widget);
  } else {
    inView = true;
    activate(0, !REDUCED_MOTION);
  }
}

/* --------------------------------------------------------------------------
   6. Quick Project Request Modal (Netlify Forms Ready)
   -------------------------------------------------------------------------- */
function initModal() {
  const modal = document.getElementById('contact-modal');
  const closeBtn = document.getElementById('modal-close');
  const form = document.getElementById('lead-form');
  const success = document.getElementById('modal-success');
  const errorEl = document.getElementById('lead-error');
  const formuleInput = document.getElementById('form-formule');
  const tachesInput = document.getElementById('form-taches');
  const taskChips = Array.from(document.querySelectorAll('#task-chips .choice-chip'));
  const submitBtn = document.getElementById('lead-submit');

  if (!modal || !form) return;

  const showSuccess = () => {
    form.hidden = true;
    if (errorEl) errorEl.hidden = true;
    if (success) success.dataset.visible = 'true';
    form.reset();
    taskChips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
    if (tachesInput) tachesInput.value = '';
  };

  let lastOpener = null;

  const setOpen = (open, formule = '') => {
    if (open) {
      lastOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    modal.dataset.open = String(open);
    modal.setAttribute('aria-hidden', String(!open));
    modal.inert = !open;
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) {
      if (formule && formuleInput) formuleInput.value = formule;
      form.hidden = false;
      if (errorEl) errorEl.hidden = true;
      if (success) success.dataset.visible = 'false';
      setTimeout(() => {
        const firstInput = document.getElementById('f-metier');
        if (firstInput) firstInput.focus();
      }, 120);
    } else if (lastOpener) {
      lastOpener.focus();
      lastOpener = null;
    }
  };

  document.querySelectorAll('[data-open-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setOpen(true, btn.dataset.openModal || 'Demande de contact');
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', () => setOpen(false));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.dataset.open === 'true') setOpen(false);
  });

  // Multi-select task chips
  taskChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const active = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', String(!active));
      const selected = taskChips
        .filter((c) => c.getAttribute('aria-pressed') === 'true')
        .map((c) => c.textContent.trim());
      if (tachesInput) tachesInput.value = selected.join(' · ');
    });
  });

  // Strip control characters and neutralize spreadsheet/CSV formula prefixes
  const sanitizeField = (raw, maxLen, { multiline = false, allowPhonePlus = false } = {}) => {
    const ctrl = multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
    let val = String(raw || '').replace(ctrl, '').trim().slice(0, maxLen);
    if (!val) return '';
    if (allowPhonePlus && /^\+[\d\s().-]+$/.test(val)) return val;
    if (/^[=+\-@]/.test(val)) val = `'${val}`;
    return val;
  };

  let submitting = false;
  let lastSubmitAt = 0;
  const metierEl = document.getElementById('f-metier');
  const emailEl = document.getElementById('f-email');

  if (metierEl) metierEl.addEventListener('input', () => metierEl.setCustomValidity(''));
  if (emailEl) emailEl.addEventListener('input', () => emailEl.setCustomValidity(''));

  // Form submission (Netlify Forms in prod + honeypot + input hygiene + cooldown)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (errorEl) errorEl.hidden = true;
    if (metierEl) metierEl.setCustomValidity('');
    if (emailEl) emailEl.setCustomValidity('');

    const data = new FormData(form);
    const botField = String(data.get('bot-field') || '').trim();
    if (botField) {
      showSuccess();
      return;
    }

    const metier = sanitizeField(data.get('metier'), 100);
    const nom = sanitizeField(data.get('nom'), 100);
    const email = sanitizeField(data.get('email'), 160);
    const telephone = sanitizeField(data.get('telephone'), 30, { allowPhonePlus: true });
    const message = sanitizeField(data.get('message'), 1200, { multiline: true });
    const formule = sanitizeField(data.get('formule'), 80);
    const taches = sanitizeField(data.get('taches'), 200);

    if (!metier) {
      if (metierEl) metierEl.setCustomValidity('Veuillez indiquer votre métier.');
      form.reportValidity();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      if (emailEl) emailEl.setCustomValidity('Veuillez saisir une adresse e-mail valide.');
      form.reportValidity();
      return;
    }

    const isLocalPreview =
      window.location.protocol === 'file:' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === 'localhost';

    if (isLocalPreview) {
      showSuccess();
      return;
    }

    // 10s anti-flood cooldown between real submissions
    const now = Date.now();
    if (now - lastSubmitAt < 10000) {
      showSuccess();
      return;
    }

    const body = new URLSearchParams();
    body.append('form-name', 'besoin');
    body.append('bot-field', '');
    body.append('subject', `Derovia — ${metier} — ${email}`);
    body.append('formule', formule);
    body.append('taches', taches);
    body.append('metier', metier);
    body.append('nom', nom);
    body.append('email', email);
    body.append('telephone', telephone);
    body.append('message', message);

    submitting = true;
    if (submitBtn) submitBtn.disabled = true;
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      lastSubmitAt = Date.now();
      showSuccess();
    } catch {
      if (errorEl) errorEl.hidden = false;
    } finally {
      submitting = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/* --------------------------------------------------------------------------
   Bootstrap
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initStackCards();
  initHeroDeck();
  initTradesAccordion();
  initModal();
});
})();
