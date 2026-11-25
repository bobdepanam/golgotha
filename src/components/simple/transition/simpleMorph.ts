// Transition interne de SIMPLE (7.0.10) — continuité focus produit ↔ fiche produit.
//
// Reprise du comportement de Simple (f975918 : React <ViewTransition> + Next 16), porté sur
// Next 14 / React 18 avec l'API native des View Transitions :
// - « Open » : le visuel du produit focalisé s'agrandit depuis sa tuile jusqu'au grand
//   visuel de la fiche (groupe nommé `simple-media`, 600 ms, ease expo) ; la colonne
//   d'informations apparaît ensuite (`simple-info`, 360 ms après 200 ms) ; le reste de la
//   page se fond (240 / 340 ms) — mêmes réglages que Simple (globals.css).
// - Retour (Back mutualisé, précédent / suivant du navigateur) : mouvement inverse, le
//   visuel revient vers la tuile (« pont » posé à l'emplacement mémorisé du focus).
// Les vraies routes /simple et /simple/[slug] sont conservées (router.push / historique).
// Interlude n'anime pas ces navigations (interludeConfig.internalPairs) : jamais de
// double animation avec `peel`. Navigateur sans View Transitions ou mouvement réduit :
// navigation directe, sans animation.
//
// État module (une seule galerie à la fois) : rectangle écran du produit focalisé (écrit
// par la boucle de rendu des tuiles), dernier « Open » mémorisé (sessionStorage).

export type ScreenRect = { left: number; top: number; width: number; height: number };

type Focused = { slug: string; src: string; rect: ScreenRect };

const STORE_KEY = 'simple:morph';
const READY_TIMEOUT = 900;

let focused: Focused | null = null;
let readyWaiter: { path: string; resolve: () => void } | null = null;
let running = false;
/** Fiche quittée par un retour vers la grille (cible du pont dans le nouvel état) */
let backFrom: string | null = null;

/** Boucle des tuiles : produit focalisé et son rectangle à l'écran (null hors focus). */
export function setFocusedMedia(next: Focused | null) {
  focused = next;
}

/** Les pages /simple et /simple/[slug] signalent qu'elles sont prêtes (nouvel état). */
export function markSimpleReady(path: string) {
  if (readyWaiter && readyWaiter.path === path) {
    readyWaiter.resolve();
    readyWaiter = null;
  }
}

function waitReady(path: string) {
  return new Promise<void>((resolve) => {
    readyWaiter = { path, resolve };
    window.setTimeout(() => {
      if (readyWaiter?.resolve === resolve) readyWaiter = null;
      resolve();
    }, READY_TIMEOUT);
  });
}

export function isSimpleScope(path: string) {
  return path === '/simple' || path.startsWith('/simple/');
}

/** Paire interne : grille ↔ fiche, ou fiche ↔ fiche. */
export function isSimpleInternal(from: string, to: string) {
  return from !== to && isSimpleScope(from) && isSimpleScope(to);
}

export function canMorph() {
  return (
    typeof document !== 'undefined' &&
    typeof (document as Document & { startViewTransition?: unknown }).startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Dernier « Open » (slug + rectangle de la tuile) : cible du retour vers la grille. */
export function lastOpen(): Focused | null {
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Focused) : null;
  } catch {
    return null;
  }
}

function remember(f: Focused | null) {
  try {
    if (f) window.sessionStorage.setItem(STORE_KEY, JSON.stringify(f));
  } catch {
    /* stockage indisponible : retour sans morphing */
  }
}

/**
 * Retour vers la grille en cours : visuel à poser à l'emplacement de la tuile (dernier
 * « Open » de la même fiche, que la galerie re-focalise en se restaurant).
 */
export function backBridgeTarget(): Focused | null {
  if (typeof document === 'undefined' || document.documentElement.dataset.simpleVt !== 'back' || !backFrom) return null;
  const last = lastOpen();
  return last && last.slug === backFrom ? last : null;
}

/** Visuel « pont » : copie fixe du visuel posée sur la tuile, nommée pour le morphing. */
export function placeBridge(f: Focused): HTMLImageElement {
  const img = document.createElement('img');
  img.src = f.src;
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  img.dataset.simpleBridge = '';
  Object.assign(img.style, {
    position: 'fixed',
    left: `${f.rect.left}px`,
    top: `${f.rect.top}px`,
    width: `${f.rect.width}px`,
    height: `${f.rect.height}px`,
    objectFit: 'cover',
    zIndex: '2',
    pointerEvents: 'none',
    viewTransitionName: 'simple-media',
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(img);
  return img;
}

function clearBridges() {
  document.querySelectorAll('img[data-simple-bridge]').forEach((el) => el.remove());
}

type Run = { to: string; direction: 'forward' | 'back'; navigate?: () => void };

/**
 * Lance la transition interne. `navigate` absent : navigation déjà engagée par le
 * navigateur (popstate). Renvoie false si la transition n'est pas disponible.
 */
export function runSimpleMorph({ to, direction, navigate }: Run): boolean {
  if (running || !canMorph()) return false;
  running = true;
  const root = document.documentElement;
  root.dataset.simpleVt = direction;
  backFrom = direction === 'back' ? window.location.pathname.replace(/^\/simple\/?/, '') || null : null;

  // Aller depuis un focus : le visuel part de la tuile (pont dans l'ancien état)
  if (direction === 'forward' && focused && to === `/simple/${focused.slug}`) {
    remember(focused);
    placeBridge(focused);
  }

  const vt = (document as Document & {
    startViewTransition: (cb: () => Promise<void>) => { finished: Promise<void> };
  }).startViewTransition(async () => {
    clearBridges();
    const ready = waitReady(to);
    navigate?.();
    await ready;
  });

  vt.finished.finally(() => {
    running = false;
    delete root.dataset.simpleVt;
    clearBridges();
  });
  return true;
}
