/**
 * Registre des transitions : chaque transition est un module chargé à la demande
 * (import dynamique → fichier JS séparé). Seule la transition par défaut est
 * préchargée ; les autres ne sont téléchargées que si on les sélectionne.
 */
import type { Transition } from './types';

type Loader = () => Promise<{ default: Transition }>;

export const TRANSITIONS: Record<string, Loader> = {
  // Transition retenue par défaut
  frame: () => import('./transitions/frame'),
  // Comparaison (CSS + GSAP, sans WebGL) — sélectionnables en développement
  circle: () => import('./transitions/circle'),
  columns: () => import('./transitions/columns'),
  corner: () => import('./transitions/corner'),
  cube: () => import('./transitions/cube'),
  curtain: () => import('./transitions/curtain'),
  peel: () => import('./transitions/peel'),
  // Navigation immersive entre créations (bouton Next des pages projet, 7.1)
  rise: () => import('./transitions/rise'),
  slices: () => import('./transitions/slices'),
  'slide-over': () => import('./transitions/slide-over'),
  stack: () => import('./transitions/stack'),
  tear: () => import('./transitions/tear'),
  wipe: () => import('./transitions/wipe'),
};

export const transitionNames = () => Object.keys(TRANSITIONS);

const cache = new Map<string, Transition>();
const pending = new Map<string, Promise<Transition | null>>();

/** Charge une transition ; `null` si elle est inconnue ou si son fichier n'a pas pu être chargé. */
export function loadTransition(name: string): Promise<Transition | null> {
  const ready = cache.get(name);
  if (ready) return Promise.resolve(ready);
  const inFlight = pending.get(name);
  if (inFlight) return inFlight;
  const loader = TRANSITIONS[name];
  if (!loader) return Promise.resolve(null);
  const p = loader()
    .then((m) => {
      cache.set(name, m.default);
      return m.default;
    })
    .catch((error) => {
      console.warn(`[interlude] transition "${name}" non chargée`, error);
      return null;
    })
    .finally(() => pending.delete(name));
  pending.set(name, p);
  return p;
}

/** Transition déjà chargée (synchrone), pour le bouton retour du navigateur. */
export const loadedTransition = (name: string) => cache.get(name) ?? null;
