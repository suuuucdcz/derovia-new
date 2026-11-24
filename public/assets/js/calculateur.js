/* ==========================================================================
   Derovia — Interactive Time & Administrative Cost Calculator (/calculateur-temps)
   Zero dependencies · 100% CSP-safe (no inline handlers) · Zero cookies
   ========================================================================== */

(() => {
  'use strict';

  const PRESETS = {
    plombier:     { devis: 8,  minDevis: 30, appels: 7,  compta: 3.5, taux: 58 },
    garage:       { devis: 10, minDevis: 20, appels: 14, compta: 3.0, taux: 62 },
    comptable:    { devis: 6,  minDevis: 25, appels: 8,  compta: 7.0, taux: 75 },
    restauration: { devis: 4,  minDevis: 25, appels: 9,  compta: 4.5, taux: 48 },
    coiffure:     { devis: 3,  minDevis: 15, appels: 12, compta: 2.5, taux: 50 }
  };

  const fields = {
    devis:    document.getElementById('c-devis'),
    minDevis: document.getElementById('c-mindevis'),
    appels:   document.getElementById('c-appels'),
    compta:   document.getElementById('c-compta'),
    taux:     document.getElementById('c-taux')
  };

  if (!fields.devis) return;

  const out = {
    devisVal:    document.getElementById('v-devis'),
    minDevisVal: document.getElementById('v-mindevis'),
    appelsVal:   document.getElementById('v-appels'),
    comptaVal:   document.getElementById('v-compta'),
    tauxVal:     document.getElementById('v-taux'),
    hoursYear:   document.getElementById('r-hours-year'),
    hoursWeek:   document.getElementById('r-hours-week'),
    daysYear:    document.getElementById('r-days-year'),
    costYear:    document.getElementById('r-cost-year'),
    savedYear:   document.getElementById('r-saved-year'),
    payback:     document.getElementById('r-payback')
  };

  const fmtInt = (n) => Math.round(n).toLocaleString('fr-FR');
  const fmtOne = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const clamp = (v, min, max) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min);

  function recalculate() {
    const devis = clamp(Number(fields.devis.value), 0, 30);
    const minDevis = clamp(Number(fields.minDevis.value), 10, 60);
    const appels = clamp(Number(fields.appels.value), 0, 40);
    const compta = clamp(Number(fields.compta.value), 0.5, 15);
    const taux = clamp(Number(fields.taux.value), 30, 150);

    out.devisVal.textContent = `${devis} / sem.`;
    out.minDevisVal.textContent = `${minDevis} min`;
    out.appelsVal.textContent = `${appels} / sem.`;
    out.comptaVal.textContent = `${fmtOne(compta)} h / sem.`;
    out.tauxVal.textContent = `${taux} € / h`;

    // Weekly hours spent on repetitive admin:
    // - quotes & follow-ups: devis * minDevis / 60
    // - missed calls / manual SMS / scheduling back-and-forth: ~8 min per call
    // - supplier invoices, photos, accounting prep: compta hours
    const hWeek = (devis * minDevis) / 60 + (appels * 8) / 60 + compta;
    const weeksPerYear = 46;
    const hYear = hWeek * weeksPerYear;
    const daysYear = hYear / 8;
    const costYear = hYear * taux;

    // Conservative 72% automation savings (remaining 28% = human review / 1-click approval)
    const savedHoursYear = hYear * 0.72;
    const savedEuroYear = costYear * 0.72;
    const monthlySaved = savedEuroYear / 12;

    // Reference baseline: Automatisation Ciblée starting at 1 490 € HT
    const paybackMonths = monthlySaved > 0 ? Math.max(0.5, 1490 / monthlySaved) : 12;

    out.hoursYear.textContent = `${fmtInt(hYear)} h / an`;
    out.hoursWeek.textContent = `Soit ${fmtOne(hWeek)} h par semaine sur 46 semaines travaillées`;
    out.daysYear.textContent = `${fmtInt(daysYear)} jours`;
    out.costYear.textContent = `${fmtInt(costYear)} €`;
    out.savedYear.textContent = `+${fmtInt(savedHoursYear)} h / an`;
    out.payback.textContent = paybackMonths < 1.2
      ? `< 1 mois`
      : `~${fmtOne(paybackMonths)} mois`;
  }

  Object.values(fields).forEach((el) => {
    el.addEventListener('input', recalculate);
  });

  const presetBtns = document.querySelectorAll('.calc-preset');
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.preset;
      const p = PRESETS[key];
      if (!p) return;

      presetBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      fields.devis.value = String(p.devis);
      fields.minDevis.value = String(p.minDevis);
      fields.appels.value = String(p.appels);
      fields.compta.value = String(p.compta);
      fields.taux.value = String(p.taux);
      recalculate();
    });
  });

  recalculate();
})();
