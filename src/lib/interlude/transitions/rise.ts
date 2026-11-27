/**
 * Rise (BSTRDZ 7.1, navigation immersive entre créations) : la création suivante semble se
 * trouver juste en dessous. Seul le contenu de la page (#pageContent) bouge — léger glissement
 * vers le haut et fondu, puis la nouvelle création monte de quelques pixels en apparaissant.
 * SiteDock, Back, Contextual Widget et bascule de thème (hors #pageContent) restent immobiles :
 * aucune couverture pleine (`solidCover: false`), la couche reste transparente mais bloque les
 * clics pendant la transition. Retour arrière : mouvement inversé. Mouvement réduit : Interlude
 * n'anime pas (transition « none »).
 */
import { gsap } from 'gsap';
import { defineTransition, sign } from '../helpers';

// Réglages : courts et premium (grammaire de mouvement BSTRDZ)
const LEAVE = { duration: 0.3, ease: 'power2.in' };
const ENTER = { duration: 0.55, ease: 'power3.out' };
const OUT = 14; // px, la création courante monte en s'effaçant
const IN = 24; // px, la suivante arrive d'en dessous

export default defineTransition({
  name: 'rise',
  solidCover: false,
  entrance: false,

  leave(context) {
    const s = sign(context); // 1 en avant, -1 en arrière
    return gsap.to(context.content, { y: -OUT * s, opacity: 0, ...LEAVE });
  },

  enter(context) {
    const s = sign(context);
    return gsap.fromTo(
      context.content,
      { y: IN * s, opacity: 0 },
      { y: 0, opacity: 1, ...ENTER, clearProps: 'transform,opacity' }
    );
  },
});
