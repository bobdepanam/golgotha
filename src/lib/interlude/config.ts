/**
 * Réglages du moteur de transitions (GOLGOTHA).
 */
export const interludeConfig = {
  /**
   * Transition par défaut de toutes les navigations internes (7.0.9 : `peel`).
   * Modifier cette seule valeur pour en changer ; toutes les transitions de registry.ts
   * restent disponibles. En développement, le comparateur (InterludeDevPanel, absent du
   * build de production) peut la remplacer localement (?transition=… / localStorage).
   */
  defaultTransition: 'peel',
  /**
   * z-index de la couche : au-dessus du contenu et du header (100), sous le
   * curseur, qui reste visible pendant la transition.
   */
  layerZ: 9990,
  /** Attente maximale des images du haut de la nouvelle page avant la révélation (ms). */
  mediaTimeout: 800,
  /** Attente maximale de la nouvelle route ; au-delà, on révèle quand même (ms). */
  routeTimeout: 10000,
  /** Routes toujours servies sans transition (WebGL / interactions à préserver). */
  bypassRoutes: ['/experiment'],
  /**
   * Navigations internes à un univers qui ont leur propre transition (7.0.10) : SIMPLE,
   * grille ↔ fiche produit (components/simple/transition). Interlude ne les anime pas.
   */
  internalScopes: ['/simple'],
} as const;

/** Une navigation qui part de, ou arrive sur, une route protégée se fait sans transition. */
export function isBypassed(pathname: string) {
  return interludeConfig.bypassRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/** Navigation interne à un univers doté de sa propre transition (ex. /simple ↔ /simple/x). */
export function isInternalNavigation(from: string, to: string) {
  if (from === to) return false;
  const inScope = (p: string, r: string) => p === r || p.startsWith(`${r}/`);
  return interludeConfig.internalScopes.some((r) => inScope(from, r) && inScope(to, r));
}

/** Clé localStorage du comparateur de transitions (développement uniquement). */
export const DEV_STORAGE_KEY = 'interlude:transition';
