/**
 * Derovia — Panneau de navigation
 *
 * Un seul bouton dans l'en-tête, un panneau qui liste toutes les sections.
 * Le menu horizontal d'origine se chargeait d'une section à chaque ajout ;
 * celui-ci tient quel qu'en soit le nombre.
 *
 * Le panneau passe sous l'en-tête : la marque ne bouge jamais, et le bouton
 * qui a ouvert sert aussi à refermer.
 */

import { SLIDES } from './config.js';

/**
 * @param {{goTo: (id: string) => boolean}} deck Le deck à piloter.
 */
export function createMenu(deck) {
  const bouton = document.getElementById('btn-menu');
  const panneau = document.getElementById('menu-panneau');
  const liste = document.getElementById('menu-liste');

  if (!bouton || !panneau || !liste) {
    console.error('Derovia : structure du panneau de navigation incomplète.');
    return null;
  }

  /** Rendus inertes pendant l'ouverture : le focus ne part jamais derrière. */
  const arriere = [document.getElementById('deck-viewport'), document.getElementById('deck-dots')];

  let ouvert = false;

  /* --- Entrées, générées depuis la configuration --- */
  const entrees = SLIDES.map((slide, index) => {
    const entree = document.createElement('button');
    entree.type = 'button';
    entree.className = 'menu-entree';
    entree.dataset.slide = slide.id;

    const numero = document.createElement('span');
    numero.className = 'menu-numero';
    numero.textContent = String(index + 1).padStart(2, '0');

    const texte = document.createElement('span');
    texte.className = 'menu-texte';

    const titre = document.createElement('span');
    titre.className = 'menu-titre';
    titre.textContent = slide.label;

    const resume = document.createElement('span');
    resume.className = 'menu-resume';
    resume.textContent = slide.resume;

    texte.append(titre, resume);
    entree.append(numero, texte);

    entree.addEventListener('click', () => {
      fermer();
      deck.goTo(slide.id);
    });

    const ligne = document.createElement('li');
    // Rang de la ligne : la feuille de style en tire le décalage d'apparition.
    ligne.style.setProperty('--i', String(index));
    ligne.append(entree);
    liste.append(ligne);
    return entree;
  });

  /* --- Ouverture et fermeture --- */

  /** Signale la section où l'on se trouve, relue à chaque ouverture. */
  const marquerCourante = () => {
    const courante = document.body.dataset.slide;
    for (const entree of entrees) {
      const estCourante = entree.dataset.slide === courante;
      entree.classList.toggle('is-current', estCourante);
      entree.setAttribute('aria-current', estCourante ? 'true' : 'false');
    }
  };

  const ouvrir = () => {
    if (ouvert) return;
    ouvert = true;

    marquerCourante();
    // La feuille de style bascule la visibilité : rien à attendre, rien à
    // remettre en forme après coup.
    panneau.classList.add('is-open');

    bouton.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-ouvert');
    for (const zone of arriere) if (zone) zone.inert = true;

    // Le clavier prend la main sur la liste ; la souris n'y est pas forcée.
    entrees.find((e) => e.classList.contains('is-current'))?.focus({ preventScroll: true });
  };

  const fermer = ({ rendreLeFocus = false } = {}) => {
    if (!ouvert) return;
    ouvert = false;

    panneau.classList.remove('is-open');
    bouton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-ouvert');
    for (const zone of arriere) if (zone) zone.inert = false;

    if (rendreLeFocus) bouton.focus({ preventScroll: true });
  };

  bouton.addEventListener('click', () => (ouvert ? fermer({ rendreLeFocus: true }) : ouvrir()));

  // Cliquer à côté de la liste referme, comme on referme un tiroir.
  panneau.addEventListener('click', (event) => {
    if (event.target === panneau) fermer({ rendreLeFocus: true });
  });

  /* --- Clavier ---
     Échap referme. Le deck, lui, se tait de lui-même tant que `menu-ouvert`
     est posé sur le corps du document : rien à intercepter ici. --- */
  window.addEventListener('keydown', (event) => {
    if (!ouvert || event.key !== 'Escape') return;
    event.preventDefault();
    fermer({ rendreLeFocus: true });
  });

  return { ouvrir, fermer };
}
