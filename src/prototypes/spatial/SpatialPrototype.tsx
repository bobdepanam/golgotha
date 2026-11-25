'use client';

// Prototype technique de la galerie spatiale (BSTRDZ 7.0.1) — voir README.md.
// Canvas R3F + Rig + tuiles montées par lots. Sortie du focus : re-clic, drag,
// Échap ou bouton explicite. Diagnostic : mémoire GPU, contexte WebGL libéré au
// démontage (bouton Démonter / Remonter).

import { useTexture } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { type MutableRefObject, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GRID_CONFIG } from './config';
import { computeGridLayout, gridHalfExtents } from './layout';
import { Plane } from './Plane';
import { Rig } from './Rig';
import { createSpatialState, type SpatialState, SpatialStateContext } from './state';
import styles from './SpatialPrototype.module.scss';
import type { GridTile, SpatialItem } from './types';

/** Tuiles montées par lots (évite les pics d'envoi de textures au GPU). */
function Tiles({ tiles }: { tiles: GridTile[] }) {
  const [count, setCount] = useState<number>(GRID_CONFIG.initialBatch);
  const half = useMemo(() => gridHalfExtents(tiles.length), [tiles.length]);
  useFrame(() => {
    if (count < tiles.length) setCount((c) => Math.min(c + GRID_CONFIG.batchSize, tiles.length));
  });
  return (
    <>
      {tiles.slice(0, count).map((t) => (
        <Suspense key={t.slug} fallback={null}>
          <Plane tile={t} half={half} />
        </Suspense>
      ))}
    </>
  );
}

type Diag = { textures: number; geometries: number; calls: number; programs: number };

function Gallery({ items, onFocusChange, onRenderer, stateRef }: {
  items: SpatialItem[];
  onFocusChange: (slug: string | null) => void;
  onRenderer: (gl: THREE.WebGLRenderer | null) => void;
  /** Accès du parent à l'état (bouton de sortie explicite du focus) */
  stateRef: MutableRefObject<SpatialState | null>;
}) {
  const [state] = useState(() => createSpatialState(onFocusChange));
  const tiles = useMemo(() => computeGridLayout(items), [items]);
  const urls = useMemo(() => items.map((i) => i.thumb), [items]);

  // Échap : sortie du focus (uniquement tant que la galerie est montée)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.activeSlug) state.setFocus(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  // Démontage : textures retirées du cache de drei (sinon conservées en mémoire JS)
  useEffect(() => () => urls.forEach((u) => useTexture.clear(u)), [urls]);

  // Exposé au parent pour le bouton de sortie explicite
  useEffect(() => {
    stateRef.current = state;
    return () => {
      stateRef.current = null;
    };
  }, [state, stateRef]);

  return (
    <Canvas
      camera={{ position: [0, 0, GRID_CONFIG.zoomOut], fov: GRID_CONFIG.fov }}
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
      onCreated={({ gl }) => onRenderer(gl)}
      aria-label="Prototype — galerie spatiale"
    >
      <SpatialStateContext.Provider value={state}>
        <color attach="background" args={['#0a0a0a']} />
        <fog attach="fog" args={['#0a0a0a', GRID_CONFIG.fogNear, GRID_CONFIG.fogFar]} />
        <Rig />
        <Tiles tiles={tiles} />
      </SpatialStateContext.Provider>
    </Canvas>
  );
}

export default function SpatialPrototype({ items }: { items: SpatialItem[] }) {
  const [mounted, setMounted] = useState(true);
  const [mounts, setMounts] = useState(1);
  const [focus, setFocus] = useState<string | null>(null);
  const [diag, setDiag] = useState<Diag | null>(null);
  const [released, setReleased] = useState<string>('—');
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const stateRef = useRef<SpatialState | null>(null);

  // Lecture périodique de la mémoire GPU (diagnostic uniquement)
  useEffect(() => {
    const id = window.setInterval(() => {
      const gl = glRef.current;
      if (!gl) return setDiag(null);
      setDiag({
        textures: gl.info.memory.textures,
        geometries: gl.info.memory.geometries,
        calls: gl.info.render.calls,
        programs: gl.info.programs?.length ?? 0,
      });
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const toggleMount = () => {
    if (mounted) {
      const gl = glRef.current;
      setMounted(false);
      setFocus(null);
      // Après démontage, le contexte WebGL doit être perdu (libéré) par R3F
      window.setTimeout(() => {
        const lost = gl?.getContext().isContextLost();
        setReleased(lost === undefined ? 'inconnu' : lost ? 'oui (contexte perdu)' : 'NON (contexte actif)');
        glRef.current = null;
      }, 300);
    } else {
      setMounted(true);
      setMounts((n) => n + 1);
      setReleased('—');
    }
  };

  const exitFocus = () => stateRef.current?.setFocus(null);

  if (!items.length) {
    return (
      <div className={styles.empty}>
        Aucune fixture. Copier quelques miniatures dans <code>public/_local-test/spatial/</code>.
      </div>
    );
  }

  return (
    <div className={styles.root} data-lenis-prevent="">
      <div className={styles.stage}>
        {mounted && (
          <Gallery
            key={mounts}
            items={items}
            onFocusChange={setFocus}
            stateRef={stateRef}
            onRenderer={(gl) => {
              glRef.current = gl;
            }}
          />
        )}
      </div>

      {focus && (
        <button type="button" className={styles.close} onClick={exitFocus} aria-label="Fermer le focus">
          Fermer ✕ <span>{focus}</span>
        </button>
      )}

      <aside className={styles.hud} aria-label="Diagnostic du prototype">
        <strong>DEV · prototype spatial</strong>
        <span>{items.length} fixtures · montages : {mounts}</span>
        <span>focus : {focus ?? 'aucun'}</span>
        <span>
          GPU : {diag ? `${diag.textures} textures · ${diag.geometries} géométries · ${diag.programs} programmes · ${diag.calls} draw calls` : 'canvas démonté'}
        </span>
        <span>contexte libéré au démontage : {released}</span>
        <button type="button" onClick={toggleMount}>
          {mounted ? 'Démonter le canvas' : 'Remonter le canvas'}
        </button>
      </aside>
    </div>
  );
}
