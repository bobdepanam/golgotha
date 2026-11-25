'use client';

// Galerie spatiale SIMPLE (BSTRDZ 7.0.3a) — grille infinie, intégrée à Golgotha.
// Canvas R3F + Rig + pool de tuiles + vignette / flou périphériques (Simple).
// Navigation : drag (suit le curseur, inertie), molette / trackpad (déplacement), pincement ou
// Ctrl + molette (zoom), clic (focus), Échap / re-clic / drag (sortie du focus).
// Compatibilité Golgotha : thème (fond du canvas = --background-color), curseur personnalisé,
// Lenis (data-lenis-prevent), Interlude (démontage propre), SiteDock (aucun conflit d'Échap :
// le widget ne traite Échap que lorsque le focus clavier est dans son panneau).

import { useTheme } from '@/context/ThemeContext';
import styles from '@/styles/simple/SimpleSpatial.module.scss';
import { useTexture } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { GRID_CONFIG } from './config';
import { Rig } from './Rig';
import { DebugReadout } from './DebugReadout';
import { ItemOverlay } from './ItemOverlay';
import { restoreInto, save } from './memory';
import { createSpatialState, type FocusCell, SpatialStateContext } from './state';
import { Tiles } from './Tiles';
import type { SpatialItem } from './types';
import { ZoomDistortionOverlay } from './ZoomDistortionOverlay';

/** Couleur de fond du thème courant (le canvas suit le thème du site). */
function useThemeBackground() {
  const { theme } = useTheme();
  const [bg, setBg] = useState('#0f0f0f');
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim();
    if (v) setBg(v);
  }, [theme]);
  return bg;
}

export default function SimpleSpatial({ items }: { items: SpatialItem[] }) {
  const [focus, setFocus] = useState<FocusCell | null>(null);
  // État de la grille ; position, zoom et focus rétablis au retour (mémoire de session)
  const [{ state, restored }] = useState(() => {
    const st = createSpatialState(setFocus);
    return { state: st, restored: restoreInto(st) };
  });
  const [restoredSlug] = useState(() => restored?.focus?.slug ?? null);
  useEffect(() => {
    if (restored?.focus) setFocus(restored.focus);
    return () => save(state); // mémorisé à la sortie de /simple
  }, [restored, state]);
  const focusedItem = useMemo(() => (focus ? (items.find((i) => i.slug === focus.slug) ?? null) : null), [focus, items]);
  const bg = useThemeBackground();
  const urls = useMemo(() => items.map((i) => i.thumb), [items]);
  // Relevé de diagnostic : développement uniquement, avec ?debug=1
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') setDebug(new URLSearchParams(window.location.search).has('debug'));
  }, []);

  // Échap : sortie du focus (Simple)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.focus) state.setFocus(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  // Démontage (changement de route) : textures libérées et retirées du cache de drei.
  // Le contexte WebGL lui-même est libéré par R3F au démontage du Canvas.
  useEffect(
    () => () => {
      for (const u of urls) useTexture.clear(u);
    },
    [urls]
  );

  return (
    <div className={styles.root} data-lenis-prevent="">
      <Canvas
        className={styles.canvas}
        camera={{ position: [0, 0, restored?.zoom ?? GRID_CONFIG.zoomOut], fov: GRID_CONFIG.fov }}
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
        aria-label="Simple — collection. Glisser ou faire défiler pour naviguer, pincer ou Ctrl + molette pour zoomer, clic pour isoler une pièce, Échap pour revenir."
      >
        <SpatialStateContext.Provider value={state}>
          <color attach="background" args={[bg]} />
          <fog attach="fog" args={[bg, GRID_CONFIG.fogNear, GRID_CONFIG.fogFar]} />
          <Rig />
          <Suspense fallback={null}>
            <Tiles items={items} />
          </Suspense>
        </SpatialStateContext.Provider>
      </Canvas>
      <ZoomDistortionOverlay state={state} />
      <ItemOverlay item={focusedItem} onClose={() => state.setFocus(null)} restoredSlug={restoredSlug} />
      {debug && <DebugReadout state={state} />}
    </div>
  );
}
