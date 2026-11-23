'use client';

/**
 * Comparateur de transitions — DÉVELOPPEMENT UNIQUEMENT (`npm run dev`).
 * Chargé par InterludeProvider seulement si NODE_ENV === 'development' :
 * absent du build de production. Choix mémorisé dans localStorage ;
 * `?transition=<nom>` dans l'URL le règle aussi.
 */

import { DEV_STORAGE_KEY, interludeConfig } from '@/lib/interlude/config';
import { loadTransition, transitionNames } from '@/lib/interlude/registry';
import { useEffect, useState } from 'react';

export default function InterludeDevPanel() {
  const [current, setCurrent] = useState<string>(interludeConfig.defaultTransition);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DEV_STORAGE_KEY);
      if (saved) setCurrent(saved);
    } catch {}
  }, []);

  const choose = (name: string) => {
    setCurrent(name);
    try {
      if (name === interludeConfig.defaultTransition) window.localStorage.removeItem(DEV_STORAGE_KEY);
      else window.localStorage.setItem(DEV_STORAGE_KEY, name);
    } catch {}
    void loadTransition(name); // prête pour le prochain clic (et le bouton retour)
  };

  return (
    <div
      data-interlude-skip=""
      style={{
        position: 'fixed',
        left: 8,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 12000,
        font: '11px/1.2 ui-monospace, monospace',
        color: '#fff',
        background: 'rgba(0,0,0,0.72)',
        border: '1px dashed rgba(255,255,255,0.35)',
        borderRadius: 4,
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <label htmlFor="interlude-dev-select" style={{ opacity: 0.7, letterSpacing: '0.08em' }}>
        DEV · transition
      </label>
      <select
        id="interlude-dev-select"
        value={current}
        onChange={(e) => choose(e.target.value)}
        style={{ font: 'inherit', background: '#111', color: '#fff', border: '1px solid #444' }}
      >
        {transitionNames().map((n) => (
          <option key={n} value={n}>
            {n}
            {n === interludeConfig.defaultTransition ? ' (défaut)' : ''}
          </option>
        ))}
      </select>
      {current !== interludeConfig.defaultTransition && (
        <button
          type="button"
          onClick={() => choose(interludeConfig.defaultTransition)}
          style={{ font: 'inherit', background: 'none', color: '#fff', border: '1px solid #444', cursor: 'pointer' }}
        >
          ← revenir à {interludeConfig.defaultTransition}
        </button>
      )}
    </div>
  );
}
