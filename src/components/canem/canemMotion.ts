// Réglages du mouvement de CANEM — portés tels quels de Simple (aboutMotion.ts, f975918).
// Every tunable value for the About experience, centralized — mirrors the
// pattern already used for the intro (introConfig.ts) and the editorial
// scroll's layout presets.
export const CANEM_MOTION = {
  // Scroll smoothing — target/current/ease, the same technique family as
  // the vendor's Column.js, minus its perpetual autonomous drift: SIMPLE's
  // version only moves in response to real wheel/touch input, so an idle
  // page genuinely comes to rest (the brief's "retour à l'arrêt" needs a
  // rest state to return to).
  scrollEase:      0.08,
  wheelFactor:     0.9,
  touchFactor:     1.6,

  // How many times each column's paragraph set is stacked back-to-back for
  // the infinite loop (mission's option B — "duplication contrôlée", not
  // per-item repositioning). Fixed, not measured — the placeholder copy in
  // about.ts is written to comfortably exceed viewportHeight/3 per single
  // copy on realistic viewports; 4 copies keeps a live buffer on both
  // sides of the visible window even then. See ABOUT_V1 doc for the
  // reasoning and its limits.
  columnRepeats: 5,
  imageRepeats:  3,

  // The right column moves at a fraction of the left column's offset —
  // "vitesse différente" (mission's V1.1 QA, § Infinite Vertical Flow):
  // the two sides must not scroll in lockstep, but the wrap/modulo math
  // stays simple (a scaled offset, not a sign flip) so it never risks a
  // seam or an inconsistent loop.
  rightColumnSpeedFactor: 0.78,

  // Line distortion — sin (left) / cos (right), amplitude dominated by
  // scroll velocity rather than a constant time-based wave (the vendor's
  // curve() always has a non-zero baseline even at v=0; SIMPLE's baseline
  // is small enough to read as "quasi aucun mouvement" at idle). Raised in
  // V1.1 (About V1.1 QA — "la V1 peut être légèrement plus démonstrative
  // que les valeurs extrêmement prudentes actuelles"): still near-still at
  // rest, clearly wave-like once scrolling, strong on a fast scroll.
  distortionBase:        2,    // px, present even at zero velocity — still reads as "almost still"
  distortionVelocityGain: 2.4, // px added per px/frame of velocity — was 1.1
  distortionVelocityCap:  16,  // clamps velocity's contribution before the gain multiplies it — was 12
  distortionTimeFactor:   0.00045, // slow phase drift over time, subtle

  // Image track — opposite direction, slower, "contrepoint calme".
  imageSpeedFactor: -0.4,

  // Reduced motion / mobile "simple mode" — no custom engine at all.
  simpleFadeMs: 220,
} as const;

// Left column: sin(). Right column: cos() — 90° out of phase, so the two
// columns visibly "breathe" differently without any artificial symmetry.
export function distortionOffset(
  lineProgress: number, // 0..1, this line's vertical position within the viewport
  elapsedMs: number,
  velocity: number,     // px/frame, this column's current scroll velocity
  reverse: boolean,
): number {
  const phase = lineProgress * Math.PI + elapsedMs * CANEM_MOTION.distortionTimeFactor;
  const wave = reverse ? Math.cos(phase) : Math.sin(phase);
  const clampedVelocity = Math.min(Math.abs(velocity), CANEM_MOTION.distortionVelocityCap);
  const amplitude = CANEM_MOTION.distortionBase + clampedVelocity * CANEM_MOTION.distortionVelocityGain;
  return wave * amplitude;
}

// Wraps a value into [0, size) — the modulo that makes a duplicated,
// fixed-count content block read as an endless loop.
export function wrap(value: number, size: number): number {
  if (size <= 0) return 0;
  return ((value % size) + size) % size;
}
