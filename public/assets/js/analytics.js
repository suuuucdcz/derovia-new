/* ==========================================================================
   Derovia — Mesure d'audience first-party sans cookie (exemptée CNIL 2026)
   Zéro cookie · Zéro stockage de suivi · Respect DNT/GPC · Opt-out 1 clic
   ========================================================================== */

(() => {
  'use strict';

  const ENDPOINT = 'https://app.derovia.fr/api/collect';
  const OPTOUT_KEY = 'derovia_analytics_optout';

  const isLocalHost = () => {
    const h = window.location.hostname;
    return (
      window.location.protocol === 'file:' ||
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '[::1]'
    );
  };

  const isOptedOut = () => {
    try {
      if (window.localStorage.getItem(OPTOUT_KEY) === '1') return true;
    } catch {
      // Storage indisponible : on ne bloque pas l'exécution
    }
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return true;
    if (navigator.globalPrivacyControl === true) return true;
    return false;
  };

  // Référent tronqué au seul domaine (règle CNIL : jamais d'URL complète ni UTM)
  const getSafeReferrerOrigin = () => {
    if (!document.referrer) return null;
    try {
      const u = new URL(document.referrer);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
      return `${u.protocol}//${u.hostname}`;
    } catch {
      return null;
    }
  };

  const sendEvent = (eventName, meta) => {
    if (isLocalHost() || isOptedOut()) return;

    const payload = {
      path: window.location.pathname || '/',
      event: eventName,
      referrer: eventName === 'pageview' ? getSafeReferrerOrigin() : null,
      ...(meta ? { meta } : {}),
    };

    try {
      fetch(ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {
      // Ne jamais perturber la navigation utilisateur
    }
  };

  // Gestion du bouton d'opposition (opt-out) sur /confidentialite
  const initOptOutControl = () => {
    const btn = document.getElementById('analytics-optout-btn');
    const statusEl = document.getElementById('analytics-optout-status');
    if (!btn || !statusEl) return;

    const render = () => {
      let manualOff = false;
      try {
        manualOff = window.localStorage.getItem(OPTOUT_KEY) === '1';
      } catch {
        manualOff = false;
      }
      const dntActive =
        navigator.doNotTrack === '1' ||
        window.doNotTrack === '1' ||
        navigator.globalPrivacyControl === true;

      if (manualOff) {
        statusEl.textContent =
          'Mesure d’audience désactivée sur ce navigateur (aucune donnée envoyée).';
        btn.textContent = 'Réactiver la mesure anonyme';
        btn.setAttribute('aria-pressed', 'true');
      } else if (dntActive) {
        statusEl.textContent =
          'Votre navigateur active déjà Do Not Track / GPC : aucune mesure n’est effectuée.';
        btn.textContent = 'Désactiver manuellement';
        btn.setAttribute('aria-pressed', 'true');
      } else {
        statusEl.textContent =
          'Mesure d’audience anonyme sans cookie active sur ce navigateur.';
        btn.textContent = 'M’opposer à la mesure d’audience';
        btn.setAttribute('aria-pressed', 'false');
      }
    };

    btn.addEventListener('click', () => {
      try {
        const currentlyOff = window.localStorage.getItem(OPTOUT_KEY) === '1';
        if (currentlyOff) {
          window.localStorage.removeItem(OPTOUT_KEY);
        } else {
          window.localStorage.setItem(OPTOUT_KEY, '1');
        }
      } catch {
        // Ignore
      }
      render();
    });

    render();
  };

  // Initialisation au chargement DOM
  const init = () => {
    initOptOutControl();
    sendEvent('pageview');

    // Événements d'intention anonymes (entonnoir Derovia)
    document.addEventListener(
      'click',
      (e) => {
        const target = e.target instanceof Element ? e.target : null;
        if (!target) return;

        const modalBtn = target.closest('[data-open-modal]');
        if (modalBtn) {
          const formule = (modalBtn.getAttribute('data-open-modal') || '').slice(0, 80);
          sendEvent('modal_opened', formule ? { formule } : undefined);
          return;
        }

        const link = target.closest('a[href]');
        if (!link) return;
        const href = link.getAttribute('href') || '';
        if (href.includes('cal.com/derovia')) {
          sendEvent('cal_clicked');
        } else if (href.startsWith('tel:')) {
          sendEvent('phone_clicked');
        }
      },
      { passive: true }
    );

    // Interaction unique sur le calculateur ROI (/calculateur-temps)
    let calcTracked = false;
    const calcInput = document.getElementById('c-devis');
    if (calcInput) {
      const markCalc = () => {
        if (calcTracked) return;
        calcTracked = true;
        sendEvent('calculator_used');
      };
      document.querySelectorAll('#c-devis, #c-mindevis, #c-appels, #c-compta, #c-taux').forEach((el) => {
        el.addEventListener('change', markCalc, { passive: true });
      });
      document.querySelectorAll('.calc-preset').forEach((btn) => {
        btn.addEventListener(
          'click',
          () => {
            if (calcTracked) return;
            calcTracked = true;
            const preset = (btn.getAttribute('data-preset') || '').slice(0, 40);
            sendEvent('calculator_used', preset ? { preset } : undefined);
          },
          { passive: true }
        );
      });
    }

    // Conversion formulaire validée (événement déclenché par app.js)
    window.addEventListener('derovia:lead-submitted', () => {
      sendEvent('lead_submitted');
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
