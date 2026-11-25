'use client';

// Vignette + flou périphérique liés au zoom (portage de Simple, spatial/ZoomDistortionOverlay).
// Intensité 0 en focus ou zoomé, 1 au zoom de départ et au-delà. Boucle rAF, sans re-rendu.
import styles from '@/styles/simple/SimpleSpatial.module.scss';
import { useEffect, useRef } from 'react';
import { GRID_CONFIG } from './config';
import type { SpatialState } from './state';

export function ZoomDistortionOverlay({ state }: { state: SpatialState }) {
  const vignetteRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const range = GRID_CONFIG.distortionFadeEnd - GRID_CONFIG.distortionFadeStart;
    let intensity = 0;
    let raf = 0;
    const tick = () => {
      const raw = (state.zoom - GRID_CONFIG.distortionFadeStart) / range;
      const target = state.focus ? 0 : Math.max(0, Math.min(1, raw));
      intensity += (target - intensity) * 0.08;
      const i = Math.max(0, Math.min(1, intensity));
      if (vignetteRef.current) vignetteRef.current.style.opacity = i.toFixed(3);
      if (blurRef.current) {
        const blur = `blur(${(i * GRID_CONFIG.distortionMaxBlur).toFixed(2)}px)`;
        blurRef.current.style.setProperty('backdrop-filter', blur);
        blurRef.current.style.setProperty('-webkit-backdrop-filter', blur);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  return (
    <div className={styles.distortion} aria-hidden="true">
      <div ref={vignetteRef} className={styles.vignette} style={{ opacity: 0 }} />
      <div ref={blurRef} className={styles.blurRing} />
    </div>
  );
}
