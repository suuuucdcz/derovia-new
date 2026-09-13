/**
 * Derovia — Transmission du besoin
 *
 * Un seul appel réseau sur tout le site : l'envoi du questionnaire rempli.
 * Il est intercepté par Netlify Forms en production, par `server.py` en local.
 *
 * Chaque réponse part dans son propre champ, en texte lisible : le courriel de
 * notification devient une fiche qu'on lit d'un coup d'œil sur un téléphone.
 */

import { LEADS_ENDPOINT, LEADS_FORM_NAME } from './config.js';

/**
 * @param {Record<string, string|number|string[]>} reponses Le questionnaire
 *   rempli, augmenté des valeurs calculées (volume, gains).
 */
export async function submitLead(reponses) {
  const body = new URLSearchParams({
    'form-name': LEADS_FORM_NAME,
    // Netlify reprend ce champ comme objet du courriel de notification.
    subject: sujet(reponses),
  });

  // Ajouter une question à FORM_STEPS suffit ici — mais il faut aussi la
  // déclarer dans le formulaire caché d'index.html : Netlify n'enregistre que
  // les champs qu'il a vus au déploiement.
  for (const [cle, valeur] of Object.entries(reponses)) {
    body.set(cle, lisible(valeur));
  }

  const response = await fetch(LEADS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) throw new Error(`Réponse ${response.status} lors de la transmission`);
}

/** Une réponse est un texte, un nombre ou une liste de cases cochées. */
const lisible = (valeur) =>
  Array.isArray(valeur) ? valeur.join(' · ') : String(valeur ?? '').trim();

/** Objet du courriel : le métier et l'adresse suffisent à trier une boîte. */
function sujet(reponses) {
  const metier = lisible(reponses.metier) || 'Nouveau besoin';
  return `Derovia — ${metier} — ${reponses.email}`;
}
