/**
 * Frame : une fois la page suivante prête, un rectangle (couleur d'accent
 * GOLGOTHA) grandit depuis une bande au centre de l'écran par-dessus l'ancienne
 * page, suivi un temps après d'une fenêtre sur la page suivante : la nouvelle
 * page apparaît dans un cadre. Au retour arrière, le film est joué à l'envers.
 * Rien ne bouge pendant le chargement : la copie figée tient la place de la page.
 *
 * D'après `src/transitions/frame.ts` de codrops/interlude (MIT, voir ../LICENSE),
 * lui-même inspiré de benmarzouvanlian.com. Adaptations : couleur d'accent du
 * site au lieu du rouge Codrops, durée un peu plus courte.
 */
import { gsap } from 'gsap';
import { accentColor, defineTransition, panel } from '../helpers';
import { copyPage, keepOldPage, oldPage, pageColor } from '../old-page';
import type { TransitionContext } from '../types';

// Réglages
const GROW = { duration: 1.0, ease: 'expo.out' }; // départ rapide : depuis une hauteur nulle, un départ lent scintille
const SHRINK = { duration: GROW.duration * 0.7, ease: 'power3.inOut' }; // au retour
const STAGGER = 0.12; // la fenêtre part ce temps après le rectangle d'accent
const START_WIDTH = 0.3; // largeur de départ (part de l'écran) ; hauteur de départ nulle

// Un rectangle = un panneau plein écran découpé par `clip-path: inset(...)`.
// Les deux bornes sont données à chaque tween (`fromTo`) : le navigateur abrège
// les valeurs qu'il rapporte, ce que GSAP ne saurait pas apparier.
const SIDE = ((1 - START_WIDTH) / 2) * 100;
const SMALL = `inset(50% ${SIDE}% 50% ${SIDE}%)`; // une bande plate au centre
const FULL = 'inset(0% 0% 0% 0%)';

/** Aller : le rectangle d'accent grandit sur l'ancienne page, puis la fenêtre sur la nouvelle. */
function open(context: TransitionContext) {
  const accent = panel(context, { style: { background: accentColor(), clipPath: SMALL } });
  const view = panel(context, {
    style: { background: pageColor(), overflow: 'hidden', clipPath: SMALL },
  });
  view.append(copyPage(context)); // la nouvelle page, figée, à taille réelle
  return gsap
    .timeline()
    .fromTo(accent, { clipPath: SMALL }, { clipPath: FULL, ...GROW }, 0)
    .fromTo(view, { clipPath: SMALL }, { clipPath: FULL, ...GROW }, STAGGER);
}

/** Retour : la page quittée rétrécit d'abord, puis le rectangle d'accent. */
function close(context: TransitionContext, old: HTMLElement) {
  const accent = panel(context, { style: { background: accentColor(), clipPath: FULL } });
  context.root.insertBefore(accent, old);
  return gsap
    .timeline()
    .fromTo(old, { clipPath: FULL }, { clipPath: SMALL, ...SHRINK }, 0)
    .fromTo(accent, { clipPath: FULL }, { clipPath: SMALL, ...SHRINK }, STAGGER);
}

export default defineTransition({
  name: 'frame',
  solidCover: false, // la copie de l'ancienne page fait la couverture
  entrance: false,

  // Rien ne bouge encore : la copie remplace la page, à l'identique, pendant le chargement.
  leave(context) {
    keepOldPage(context);
  },

  enter(context) {
    const old = oldPage(context);
    if (!old) {
      const fade = panel(context);
      return gsap.fromTo(fade, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: 'power1.out' });
    }
    old.style.clipPath = FULL;
    return context.direction === 'back' ? close(context, old) : open(context);
  },
});
