/**
 * Attendre qu'une page soit présentable avant de la révéler.
 * Seules les images visibles en haut de page comptent ; les vidéos ne sont
 * jamais attendues (la navigation reste rapide sur une connexion lente).
 * D'après codrops/interlude (MIT, voir ./LICENSE).
 */

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const imagesToWait = (scope: ParentNode, screens: number) =>
  [...scope.querySelectorAll('img')].filter((img) => {
    const box = img.getBoundingClientRect();
    if (!box.width || !box.height) return false;
    const acrossScreen = box.right > 0 && box.left < window.innerWidth;
    const nearTop = box.bottom > 0 && box.top < window.innerHeight * screens;
    return acrossScreen && nearTop;
  });

/** Polices prêtes et images du haut décodées, ou `timeout` ms au plus. Ne rejette jamais. */
export async function mediaReady(
  scope: ParentNode = document,
  { timeout = 800, screens = 1.25 } = {}
) {
  const images = imagesToWait(scope, screens).map((img) => img.decode().catch(() => {}));
  await Promise.race([Promise.all([document.fonts.ready, ...images]), sleep(timeout)]);
}
