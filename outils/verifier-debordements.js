/**
 * Derovia — contrôle des débordements
 *
 * À coller dans la console du navigateur, sur n'importe quelle page du site.
 * Mesure, pour chaque section, ce qui dépasse de la fenêtre — verticalement
 * (une barre de défilement apparaît dans la carte) comme horizontalement (la
 * page glisse latéralement).
 *
 * Il existe parce que le défaut est revenu cinq fois : une section ajoutée
 * tient à la taille où on la regarde, et déborde à une autre. L'œil ne suffit
 * pas, la mesure si.
 *
 *   verifierDebordements()        → la taille courante
 *   verifierDebordements(true)    → n'affiche que les défauts
 */
globalThis.verifierDebordements = function verifierDebordements(defautsSeulement = false) {
  const doc = document.documentElement;
  const lignes = [];

  const horizontal = doc.scrollWidth - doc.clientWidth;
  if (horizontal > 1) {
    lignes.push(`⚠ la page glisse de ${horizontal} px sur le côté`);

    // Le coupable est le premier élément en flux plus large que la fenêtre.
    for (const el of document.querySelectorAll('body *')) {
      if (getComputedStyle(el).position === 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.width > doc.clientWidth + 1) {
        lignes.push(`   → ${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} : ${Math.round(r.width)} px`);
        break;
      }
    }
  }

  for (const inner of document.querySelectorAll('.slide-inner')) {
    const section = inner.closest('.slide-section');
    const nom = section ? section.id.replace('slide-', '') : '?';
    const deborde = inner.scrollHeight - inner.clientHeight;

    // Au-delà de deux pixels, une barre apparaît vraiment.
    if (deborde > 2) lignes.push(`⚠ ${nom} déborde de ${deborde} px en hauteur`);
    else if (!defautsSeulement) lignes.push(`✓ ${nom}`);
  }

  if (!lignes.some((l) => l.startsWith('⚠'))) lignes.push('✓ aucun débordement');

  console.log(`— ${innerWidth}×${innerHeight} —\n` + lignes.join('\n'));
  return lignes;
};
