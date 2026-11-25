// Mémoire de la grille pour la session (onglet) : position, zoom et focus sont rétablis
// au retour sur /simple (ex. page produit → Back), comme les singletons de Simple.
// Rechargement de page : mémoire vide, vue de départ.
import type { FocusCell, SpatialState } from './state';

type Saved = { x: number; y: number; tx: number; ty: number; zoom: number; focus: FocusCell | null };

let saved: Saved | null = null;

export function restoreInto(s: SpatialState): Saved | null {
  if (!saved) return null;
  s.current.set(saved.x, saved.y, 0);
  s.target.set(saved.tx, saved.ty, 0);
  s.zoom = saved.zoom;
  s.focus = saved.focus;
  return saved;
}

export function save(s: SpatialState) {
  saved = { x: s.current.x, y: s.current.y, tx: s.target.x, ty: s.target.y, zoom: s.zoom, focus: s.focus };
}
