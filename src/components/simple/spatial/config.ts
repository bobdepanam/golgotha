// Galerie spatiale SIMPLE — constantes.
// Reprises de Simple (simple-bastardz@f975918, src/components/spatial/gridConfig.ts, décisions
// D-002) ; seules les valeurs marquées « BSTRDZ » diffèrent, pour la navigation infinie et un
// zoom de navigation maîtrisé (le zoom de focus reste celui de Simple).
export const GRID_CONFIG = {
  // Tuiles (identiques à Simple) : chaque image est ajustée « contain » dans cette boîte
  tileWidth: 2.0,
  tileHeight: 2.667,
  gap: 0.3,
  depthAmount: 0.6,
  hoverDepth: 0.5,
  hoverScale: 1.06,

  fov: 45,
  zoomOut: 16, // vue de départ (Simple)
  focusZoom: 8, // zoom immersif du focus (Simple) — indépendant de la plage de navigation
  // BSTRDZ : plage de zoom de navigation resserrée (Simple : 5 → 34). La grille infinie remplit
  // toujours l'écran ; un dézoom large ne montrerait que des répétitions du catalogue.
  navZoomMin: 10,
  navZoomMax: 22,

  // BSTRDZ 7.0.3a.1 : navigation infinie — le drag suit le curseur (1:1 au zoom courant) ;
  // la molette / le trackpad déplacent la grille ; le pincement (ou Ctrl + molette) zoome.
  // (Simple : drag démultiplié à 0.005 u/px, molette = zoom ; adapté à une grille finie.)
  dragFollow: 1,
  throwTime: 220, // ms : distance de lancer = vitesse lissée × ce temps (inertie)
  pinchZoomSpeed: 0.01,
  dampFactor: 0.2,
  zoomDamp: 0.28,
  tiltFactor: 40,
  tiltReferenceZoom: 5, // = zoomIn de Simple : même amplitude de tilt que l'original
  clickThreshold: 6,

  // Apparition progressive des tuiles (évite les pics d'envoi de textures au GPU)
  initialBatch: 5,
  batchSize: 3,

  proximityRadius: 4.0,
  proximityScale: 0.04,
  proximityDepth: 0.15,

  fogNear: 28,
  fogFar: 60,

  // Vignette + flou périphérique liés au zoom (Simple)
  distortionFadeStart: 8,
  distortionFadeEnd: 16,
  distortionMaxBlur: 4,

  // Courbure « fisheye » légère (Simple : 0.02, fondu 18 → 34 = zoomMax)
  // BSTRDZ : même intensité, fondu recalé sur la nouvelle plage (16 → navZoomMax)
  curvatureStrength: 0.02,
  curvatureFadeStart: 16,
  curvatureFadeEnd: 22,
  curvatureTiltMax: 0.0349, // ≈ 2°

  // BSTRDZ : marge du pool de tuiles autour de la zone visible au dézoom maximal (cellules)
  poolMargin: 2,
} as const;

export const SPACING_X = GRID_CONFIG.tileWidth + GRID_CONFIG.gap;
export const SPACING_Y = GRID_CONFIG.tileHeight + GRID_CONFIG.gap;
export const HALF_TAN = Math.tan((GRID_CONFIG.fov * Math.PI) / 180 / 2);
