import { createContext, useContext } from 'react';
import * as THREE from 'three';
import { GRID_CONFIG } from './config';

export type FocusCell = { i: number; j: number; slug: string };

/**
 * État mutable d'une galerie (lu / écrit dans useFrame, sans re-rendu React).
 * Équivalent de rigState / pointerState de Simple, mais par instance (rien ne fuit d'une
 * route à l'autre) ; le focus désigne une cellule précise (i, j) et son produit (slug).
 */
export function createSpatialState(onFocusChange: (focus: FocusCell | null) => void) {
  const s = {
    target: new THREE.Vector3(0, 0, 0),
    current: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    zoom: GRID_CONFIG.zoomOut as number,
    isDragging: false,
    focus: null as FocusCell | null,
    pointer: { worldX: 0, worldY: -999 },
    /** Compteurs de diagnostic (relevé ?debug=1, développement uniquement) */
    stats: { downs: 0, moves: 0, wheels: 0, wraps: 0 },
    /** Seul point d'entrée du focus (Simple : clic tuile, re-clic, drag, Échap) */
    setFocus(next: FocusCell | null) {
      if (next) {
        s.target.set(-next.i * (GRID_CONFIG.tileWidth + GRID_CONFIG.gap), next.j * (GRID_CONFIG.tileHeight + GRID_CONFIG.gap), 0);
        s.zoom = GRID_CONFIG.focusZoom;
      } else if (s.focus) {
        s.zoom = GRID_CONFIG.zoomOut;
      }
      const same = next && s.focus && next.i === s.focus.i && next.j === s.focus.j;
      if (same || (!next && !s.focus)) return;
      s.focus = next;
      onFocusChange(next);
    },
  };
  return s;
}

export type SpatialState = ReturnType<typeof createSpatialState>;

export const SpatialStateContext = createContext<SpatialState | null>(null);

export function useSpatialState() {
  const s = useContext(SpatialStateContext);
  if (!s) throw new Error('useSpatialState : hors de SpatialStateContext');
  return s;
}
