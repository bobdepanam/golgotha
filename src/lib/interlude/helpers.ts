/**
 * Petits outils pour écrire des transitions.
 * D'après codrops/interlude (MIT, voir ./LICENSE).
 */
import type { Transition, TransitionContext } from './types';

export const defineTransition = (transition: Transition): Transition => transition;

interface PanelOptions {
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
}

/**
 * Ajoute un panneau plein écran à la couche et le renvoie. Styles inline (pas de
 * CSS global) ; le moteur vide la couche à la fin de chaque transition.
 */
export function panel(context: TransitionContext, { className, style }: PanelOptions = {}) {
  const el = document.createElement('div');
  el.className = className ? `interlude__panel ${className}` : 'interlude__panel';
  Object.assign(el.style, {
    position: 'absolute',
    inset: '0',
    background: 'var(--interlude-color)',
    willChange: 'transform, clip-path, opacity',
  });
  if (style) Object.assign(el.style, style);
  context.root.append(el);
  return el;
}

/** Distance d'un point au coin le plus éloigné de l'écran. */
export function farthestCorner(x: number, y: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
}

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** +1 en avant, -1 en arrière : pour inverser un mouvement au retour. */
export const sign = (context: TransitionContext) => (context.direction === 'back' ? -1 : 1);

/** Couleur d'accent GOLGOTHA (remplace le rouge de la démo Codrops), lue au moment de jouer. */
export function accentColor() {
  const css = getComputedStyle(document.documentElement);
  return (
    css.getPropertyValue('--interlude-accent').trim() ||
    css.getPropertyValue('--accent-color').trim() ||
    '#ff0303'
  );
}
