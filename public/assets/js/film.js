/**
 * Derovia — le film de la diapositive vidéo.
 *
 * Rien n'est téléchargé tant que le visiteur n'approche pas de la section
 * (`preload="none"` dans le HTML) : les 2,3 Mo ne pèsent que sur ceux qui
 * descendent jusque-là. La lecture démarre en sourdine — seul état que les
 * navigateurs autorisent sans geste de l'utilisateur — et s'arrête dès qu'on
 * quitte la section, pour qu'aucun son ne joue derrière une autre page.
 */

export function createFilm() {
  const film = document.getElementById('film');
  if (!film) return null;

  let prepare = false;

  return {
    /**
     * Lance le téléchargement sans jouer. Appelé depuis les sections voisines :
     * le film est prêt à l'arrivée, sans faire porter ses 2,3 Mo aux visiteurs
     * qui ne descendent jamais jusque-là.
     */
    prepare() {
      if (prepare) return;

      prepare = true;
      film.preload = 'auto';
      film.load();
    },

    play() {
      this.prepare();
      // `play()` renvoie une promesse rejetée si le navigateur refuse : sans
      // capture, l'erreur remonterait dans la console à chaque visite.
      film.play().catch(() => {});
    },

    stop() {
      film.pause();
      film.currentTime = 0;
    },
  };
}
