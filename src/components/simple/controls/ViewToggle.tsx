'use client';

// Sélecteur Grid / List (Simple : home/ViewToggle.tsx) — mêmes icônes, mêmes états.
// Placé en haut au centre, sur l'axe des contrôles du header Golgotha (position provisoire).
import styles from '@/styles/simple/SimpleControls.module.scss';
import { BodyPortal } from '../BodyPortal';
import type { DesktopMode } from '../viewState';

type Props = {
  mode: DesktopMode;
  onChange: (m: DesktopMode) => void;
  /** Libellés accessibles (Simple : Spatial / List ; Projects : Grid / List) */
  labels?: { spatial: string; list: string };
};

export function ViewToggle({ mode, onChange, labels = { spatial: 'Spatial view', list: 'List view' } }: Props) {
  return (
    <BodyPortal>
    <div className={styles.toggle} role="group" aria-label="Gallery view">
      <button
        type="button"
        className={styles.toggleBtn}
        data-active={mode === 'spatial'}
        aria-pressed={mode === 'spatial'}
        aria-label={labels.spatial}
        data-cursor="hover"
        onClick={() => onChange('spatial')}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
          <rect x="7.5" y="1" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
          <rect x="1" y="7.5" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
          <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        className={styles.toggleBtn}
        data-active={mode === 'list'}
        aria-pressed={mode === 'list'}
        aria-label={labels.list}
        data-cursor="hover"
        onClick={() => onChange('list')}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <rect x="1" y="1.5" width="11" height="1.4" rx="0.7" fill="currentColor" />
          <rect x="1" y="5.8" width="11" height="1.4" rx="0.7" fill="currentColor" />
          <rect x="1" y="10.1" width="11" height="1.4" rx="0.7" fill="currentColor" />
        </svg>
      </button>
    </div>
    </BodyPortal>
  );
}
