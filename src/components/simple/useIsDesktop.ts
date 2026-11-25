'use client';

// Frontière desktop / mobile de Simple (D-006) : ≥ 1024 px = galerie spatiale et liste FX ;
// en dessous = expérience DOM tactile, sans WebGL. `null` : pas encore résolu (rendu
// serveur et premier affichage) — à traiter comme un état neutre, jamais comme « mobile ».
import { useSyncExternalStore } from 'react';

const DESKTOP_QUERY = '(min-width: 1024px)';

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

export function useIsDesktop(): boolean | null {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => null
  );
}
