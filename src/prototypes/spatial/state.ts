import { createContext, useContext } from 'react';
import * as THREE from 'three';
import { GRID_CONFIG } from './config';

/**
 * État mutable d'UNE galerie (lu et écrit dans useFrame, sans re-rendu React).
 * Créé par instance : rien ne persiste d'une route à l'autre (Simple utilisait des
 * singletons de module). Le focus est identifié par slug.
 */
export function createSpatialState(onFocusChange: (slug: string | null) => void) {
  const state = {
    target: new THREE.Vector3(0, 0, 0),
    current: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    zoom: GRID_CONFIG.zoomOut as number,
    isDragging: false,
    activeSlug: null as string | null,
    pointer: { worldX: 0, worldY: 0 },
    /** Seul point d'entrée pour changer le focus : notifie l'interface React. */
    setFocus(slug: string | null, center?: { x: number; y: number }) {
      if (slug && center) {
        state.target.set(-center.x, -center.y, 0);
        state.zoom = GRID_CONFIG.focusZoom;
      } else if (!slug) {
        state.zoom = GRID_CONFIG.zoomOut;
      }
      if (state.activeSlug === slug) return;
      state.activeSlug = slug;
      onFocusChange(slug);
    },
  };
  return state;
}

export type SpatialState = ReturnType<typeof createSpatialState>;

export const SpatialStateContext = createContext<SpatialState | null>(null);

export function useSpatialState() {
  const s = useContext(SpatialStateContext);
  if (!s) throw new Error('useSpatialState : hors de SpatialStateContext');
  return s;
}
