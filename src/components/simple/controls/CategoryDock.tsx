'use client';

// Module flottant de filtres (Simple : spatial/SpatialDock.tsx) — îlot de pastilles, pastille
// active glissante (Framer Motion, layoutId, ressort de Simple). Catégories issues des
// données (aucune liste figée) ; « All » toujours présent. Partagé par Simple (Grid, List,
// mobile) et Projects.
import styles from '@/styles/simple/SimpleControls.module.scss';
import { motion } from 'framer-motion';
import { BodyPortal } from '../BodyPortal';
import type { CategoryFilter } from '../viewState';

const spring = { type: 'spring', stiffness: 500, damping: 30, mass: 1 } as const;

type Props = {
  /** `label` : libellé affiché si différent de l'identifiant (ex. slug d'URL pour Projects) */
  categories: { id: string; count: number; label?: string }[];
  active: CategoryFilter;
  onChange: (c: CategoryFilter) => void;
  /** Variante mobile : rangée défilante sous le header */
  variant?: 'desktop' | 'mobile';
};

export function CategoryDock({ categories, active, onChange, variant = 'desktop' }: Props) {
  if (!categories.length) return null; // aucune catégorie connue : pas de filtre à proposer
  const options = [{ id: 'all', label: 'All' }, ...categories.map((c) => ({ id: c.id, label: c.label ?? c.id }))];
  return (
    <BodyPortal>
    <div className={variant === 'mobile' ? styles.dockWrapMobile : styles.dockWrap}>
      <div className={styles.island} role="group" aria-label="Filtrer par catégorie">
        {options.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              className={styles.pill}
              data-active={isActive}
              aria-pressed={isActive}
              data-cursor="hover"
              onClick={() => onChange(id)}
            >
              {isActive && <motion.span layoutId={`simple-dock-pill-${variant}`} className={styles.activeBg} transition={spring} />}
              <span className={styles.pillLabel}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
    </BodyPortal>
  );
}
