// Changement de représentation (7.0.1) — Grid ⇄ List, filtres des listes : fondu sortant
// court, application du changement, fondu entrant (≈ 140 + 220 ms). Opacité seule : un
// transform sur le conteneur casserait les éléments `position: fixed` des listes.
// Clics rapides : la dernière demande l'emporte (les précédentes sont abandonnées).
// Mouvement réduit ou conteneur absent : changement immédiat.
import { gsap } from 'gsap';

import { MOTION } from './tokens';

const OUT = MOTION.instant + 0.02;
const IN = MOTION.text;

export function swapView(el: HTMLElement | null, apply: () => void) {
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    apply();
    return;
  }
  gsap.to(el, {
    opacity: 0,
    duration: OUT,
    ease: 'power1.in',
    overwrite: true,
    onComplete: () => {
      apply();
      // Après le rendu du nouvel état (React applique la mise à jour avant la frame suivante)
      requestAnimationFrame(() =>
        gsap.to(el, { opacity: 1, duration: IN, ease: 'power2.out', overwrite: true, clearProps: 'opacity' })
      );
    },
  });
}

/** Démontage : aucune animation orpheline sur le conteneur. */
export function killSwap(el: HTMLElement | null) {
  if (el) gsap.killTweensOf(el);
}
