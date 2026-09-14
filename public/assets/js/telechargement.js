/**
 * Derovia — l'adresse avant le téléchargement
 *
 * Le fichier est gratuit ; l'adresse en est la contrepartie. Elle est demandée
 * avant le lien, mais jamais imposée : un lien discret permet de passer outre.
 * Un mur strict ferait surtout fuir, et une adresse arrachée ne vaut rien.
 *
 * Si la transmission échoue, le téléchargement part quand même : le visiteur
 * est venu chercher un fichier, pas nous rendre service.
 */

import { submitDownload } from './api.js';
import { DOWNLOAD_URL } from './config.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function createTelechargement() {
  const form = document.getElementById('dl-capture');
  if (!form) return null;

  const champ = document.getElementById('dl-email');
  const erreur = document.getElementById('dl-erreur');
  const merci = document.getElementById('dl-merci');
  const sansAdresse = document.getElementById('dl-sans-adresse');
  const envoyer = document.getElementById('dl-envoyer');

  if (!champ || !erreur || !merci || !sansAdresse || !envoyer) {
    console.error('Derovia : structure du téléchargement incomplète.');
    return null;
  }

  const lancerLeFichier = () => {
    form.hidden = true;
    merci.hidden = false;
    // Une adresse directe : le navigateur enregistre le fichier sans quitter
    // la page, l'extension n'étant pas affichable.
    window.location.href = DOWNLOAD_URL;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = champ.value.trim();
    if (!EMAIL_PATTERN.test(email)) {
      erreur.textContent = 'Merci d’indiquer une adresse valide, ou de passer outre.';
      erreur.hidden = false;
      champ.focus();
      return;
    }

    erreur.hidden = true;
    envoyer.disabled = true;

    try {
      await submitDownload(email);
    } catch (defaut) {
      // Le fichier part tout de même : c'est ce qu'il est venu chercher.
      console.error('Derovia : adresse non transmise.', defaut);
    }

    lancerLeFichier();
  });

  sansAdresse.addEventListener('click', lancerLeFichier);

  return { lancerLeFichier };
}
