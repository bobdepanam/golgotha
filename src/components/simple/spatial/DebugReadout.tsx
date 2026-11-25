'use client';

// Relevé de diagnostic de la navigation (développement uniquement, URL ?debug=1).
import { useEffect, useRef } from 'react';
import { SPACING_X, SPACING_Y } from './config';
import type { SpatialState } from './state';

export function DebugReadout({ state }: { state: SpatialState }) {
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (ref.current) {
        const { current: c, target: t, zoom, focus, stats } = state;
        ref.current.textContent =
          `décalage  x ${c.x.toFixed(1)} (${(c.x / SPACING_X).toFixed(1)} col) · y ${c.y.toFixed(1)} (${(c.y / SPACING_Y).toFixed(1)} rg)\n` +
          `cible     x ${t.x.toFixed(1)} · y ${t.y.toFixed(1)} · zoom ${zoom.toFixed(1)}\n` +
          `focus     ${focus ? `${focus.slug} (${focus.i}, ${focus.j})` : '—'}\n` +
          `pointerdown ${stats.downs} · drag ${stats.moves} · molette ${stats.wheels} · tuiles recyclées ${stats.wraps}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);
  return (
    <pre
      ref={ref}
      aria-hidden
      style={{
        position: 'fixed',
        top: 'calc(var(--header-h, 72px) + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        margin: 0,
        padding: '8px 10px',
        font: '11px/1.5 ui-monospace, monospace',
        color: '#fff',
        background: 'rgba(0,0,0,0.75)',
        borderRadius: 6,
        pointerEvents: 'none',
      }}
    />
  );
}
