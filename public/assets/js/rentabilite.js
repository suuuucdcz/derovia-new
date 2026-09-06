/**
 * Derovia — rentabilité
 *
 * Traduit des heures gagnées en euros, et montre au bout de combien de temps
 * l'installation est remboursée. Le prix valant le tiers de la valeur créée
 * sur un an, le seuil tombe toujours au tiers de l'année — le graphique le
 * rend visible plutôt que de l'affirmer.
 *
 * Le modèle vit dans config.js ; ce module ne fait que le calculer et le tracer.
 */

import { ROI, ROI_REPERES } from './config.js';

/** Graphique, en unités du viewBox : calibré pour rester compact et élégant. */
const VUE = { largeur: 600, hauteur: 190, gaucheAxe: 10, basAxe: 26, hautAxe: 16 };

const euros = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/** Calcule l'économie du modèle pour un nombre d'heures hebdomadaires. */
export function calculer(heures) {
  const valeurAnnuelle = heures * ROI.semaines * ROI.coutHoraire;
  const prix = Math.round(valeurAnnuelle / ROI.fraction);
  const parMois = valeurAnnuelle / 12;

  return {
    valeurAnnuelle: Math.round(valeurAnnuelle),
    prix,
    parMois: Math.round(parMois),
    // Toujours 12 / fraction, mais on le calcule plutôt que de l'écrire en dur.
    moisAvantSeuil: prix / parMois,
    gainPremiereAnnee: Math.round(valeurAnnuelle - prix),
  };
}

export function createRentabilite() {
  const root = document.getElementById('rentabilite');
  if (!root) return null;

  const curseur = root.querySelector('#roi-heures');
  const reperes = root.querySelector('.roi-reperes');
  const graphe = root.querySelector('.roi-graphe');
  const sorties = {
    heures: root.querySelector('[data-roi="heures"]'),
    annuel: root.querySelector('[data-roi="annuel"]'),
    prix: root.querySelector('[data-roi="prix"]'),
    seuil: root.querySelector('[data-roi="seuil"]'),
    gain: root.querySelector('[data-roi="gain"]'),
    calcul: root.querySelector('[data-roi="calcul"]'),
  };

  if (!curseur || !graphe || Object.values(sorties).some((n) => !n)) {
    console.error('Derovia : structure de la rentabilité incomplète.');
    return null;
  }

  curseur.min = String(ROI.minHeures);
  curseur.max = String(ROI.maxHeures);
  curseur.step = String(ROI.pasHeures);
  curseur.value = String(ROI.defautHeures);

  /* --- Repères cliquables --- */
  for (const repere of ROI_REPERES) {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'roi-repere';
    bouton.innerHTML = `<strong>${repere.heures} h</strong><span>${repere.libelle}</span>`;
    bouton.addEventListener('click', () => {
      curseur.value = String(repere.heures);
      rendre();
    });
    reperes?.append(bouton);
  }

  const rendre = () => {
    const heures = Number(curseur.value);
    const r = calculer(heures);

    sorties.heures.textContent = `${heures} h`;
    sorties.annuel.textContent = euros.format(r.valeurAnnuelle);
    sorties.prix.textContent = euros.format(r.prix);
    sorties.seuil.textContent = `${Math.round(r.moisAvantSeuil)} mois`;
    sorties.gain.textContent = euros.format(r.gainPremiereAnnee);
    sorties.calcul.textContent =
      `${heures} h × ${ROI.semaines} sem. × ${ROI.coutHoraire} € = ${euros.format(r.valeurAnnuelle)} / an`;

    // La barre du curseur se remplit jusqu'à la valeur choisie.
    const part = (heures - ROI.minHeures) / (ROI.maxHeures - ROI.minHeures);
    curseur.style.setProperty('--part', `${part * 100}%`);

    // Met en avant le repère cliquable correspondant
    if (reperes) {
      const boutons = reperes.querySelectorAll('.roi-repere');
      boutons.forEach((btn, idx) => {
        const rep = ROI_REPERES[idx];
        if (rep && rep.heures === heures) {
          btn.classList.add('is-current');
        } else {
          btn.classList.remove('is-current');
        }
      });
    }

    tracer(graphe, r);
  };

  curseur.addEventListener('input', rendre);
  rendre();

  return { rendre };
}

/**
 * Trace l'économie cumulée face au prix payé une fois.
 * Le point de croisement est le seuil de remboursement.
 */
function tracer(svg, r) {
  const { largeur, hauteur, gaucheAxe, basAxe, hautAxe } = VUE;
  const x0 = gaucheAxe;
  const x1 = largeur - 12;
  const y0 = hauteur - basAxe;
  const y1 = hautAxe;

  const maxY = r.valeurAnnuelle;
  const px = (mois) => x0 + ((x1 - x0) * mois) / ROI.mois;
  const py = (valeur) => y0 - ((y0 - y1) * valeur) / maxY;

  const yPrix = py(r.prix);
  const xSeuil = px(r.moisAvantSeuil);
  const yFin = py(maxY);

  svg.setAttribute('viewBox', `0 0 ${largeur} ${hauteur}`);
  svg.innerHTML = `
    <defs>
      <linearGradient id="roi-remplissage" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(0,113,227,0.22)" />
        <stop offset="100%" stop-color="rgba(0,113,227,0)" />
      </linearGradient>
    </defs>

    <line class="roi-axe" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" />

    <!-- Ce que l'installation a coûté, une fois pour toutes. -->
    <line class="roi-prix" x1="${x0}" y1="${yPrix}" x2="${x1}" y2="${yPrix}" />
    <text class="roi-etiquette" x="${x0 + 6}" y="${yPrix - 9}">Installation</text>

    <!-- Ce que le temps rendu rapporte, mois après mois. -->
    <path class="roi-aire" d="M ${x0} ${y0} L ${x1} ${yFin} L ${x1} ${y0} Z"
          fill="url(#roi-remplissage)" />
    <line class="roi-courbe" x1="${x0}" y1="${y0}" x2="${x1}" y2="${yFin}" />

    <!-- Le seuil : au-delà, l'installation est payée et le reste est gagné. -->
    <line class="roi-seuil" x1="${xSeuil}" y1="${y0}" x2="${xSeuil}" y2="${yPrix}" />
    <circle class="roi-point" cx="${xSeuil}" cy="${yPrix}" r="5" />
    <text class="roi-seuil-texte" x="${xSeuil + 10}" y="${yPrix + 20}">
      Remboursé au ${Math.round(r.moisAvantSeuil)}ᵉ mois
    </text>

    <text class="roi-mois" x="${x0}" y="${y0 + 19}">Mise en service</text>
    <text class="roi-mois roi-mois-fin" x="${x1}" y="${y0 + 19}">12 mois</text>
  `;
}
