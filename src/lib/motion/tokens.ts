// Grammaire de mouvement (7.0.1) — miroir JS des jetons --ds-dur-* / --ds-stagger de
// globals.scss, pour les animations GSAP (secondes). Référence : le SiteDock.
// Pas de rebond : courbes « power » uniquement.
export const MOTION = {
  instant: 0.12,
  fast: 0.16,
  text: 0.22,
  morph: 0.36,
  grid: 0.4,
  stagger: 0.03,
  shift: 6, // px — déplacement d'apparition
  ease: { out: 'power2.out', inOut: 'power2.inOut', surface: 'power3.inOut', in: 'power1.in' },
} as const;
