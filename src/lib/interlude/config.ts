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
} as const;

/** Une navigation qui part de, ou arrive sur, une route protégée se fait sans transition. */
export function isBypassed(pathname: string) {
  return interludeConfig.bypassRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/** Clé localStorage du comparateur de transitions (développement uniquement). */
export const DEV_STORAGE_KEY = 'interlude:transition';
