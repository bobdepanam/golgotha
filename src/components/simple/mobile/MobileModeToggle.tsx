'use client';

// Sélecteur LIST / GRID mobile (Simple : mobile-grid/MobileModeToggle.tsx).
import styles from '@/styles/simple/SimpleControls.module.scss';
import { BodyPortal } from '../BodyPortal';
import type { MobileMode } from '../viewState';

export function MobileModeToggle({ mode, onChange }: { mode: MobileMode; onChange: (m: MobileMode) => void }) {
  return (
    <BodyPortal>
    <div className={styles.mobileToggleWrap}>
      <div className={styles.island} role="group" aria-label="Browsing mode">
        <button type="button" className={styles.mobileToggleBtn} data-active={mode === 'list'} aria-pressed={mode === 'list'} aria-label="List view" onClick={() => onChange('list')}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <rect x="1" y="1.5" width="11" height="1.4" rx="0.7" fill="currentColor" />
            <rect x="1" y="5.8" width="11" height="1.4" rx="0.7" fill="currentColor" />
            <rect x="1" y="10.1" width="11" height="1.4" rx="0.7" fill="currentColor" />
          </svg>
        </button>
        <button type="button" className={styles.mobileToggleBtn} data-active={mode === 'grid'} aria-pressed={mode === 'grid'} aria-label="Grid view" onClick={() => onChange('grid')}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
            <rect x="7.5" y="1" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
            <rect x="1" y="7.5" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
            <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
    </BodyPortal>
  );
}
