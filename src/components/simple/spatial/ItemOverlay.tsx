'use client';

// Panneau latéral du focus (Quick View) — portage de Simple (spatial/ItemOverlay.tsx) :
// même composition (en-tête, fermeture, séparateur, texte court, caractéristiques, CTA Open),
// même animation (Framer Motion : opacité + 10 px, 0,2 s). Couleurs et surface : thème Golgotha.
// Seules les informations connues sont affichées (aucune valeur de repli inventée).

import styles from '@/styles/simple/ItemOverlay.module.scss';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import type { SpatialItem } from './types';

type Props = {
  item: SpatialItem | null;
  onClose: () => void;
  /** Produit déjà sélectionné au montage (retour depuis sa page) : pas d'animation d'entrée */
  restoredSlug?: string | null;
};

export function ItemOverlay({ item, onClose, restoredSlug = null }: Props) {
  const info = item?.info;
  return (
    <div className={styles.positioner}>
      <AnimatePresence>
        {item && info && (
          <motion.aside
            key={item.slug}
            className={styles.panel}
            initial={item.slug === restoredSlug ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.25, 0, 0, 1] }}
            aria-label={`Product details — ${info.title}`}
            data-lenis-prevent=""
          >
            <header className={styles.header}>
              <div className={styles.headerMeta}>
                {info.heroTag && <p className={styles.heroTag}>Collection piece</p>}
                {info.meta && <p className={styles.meta}>{info.meta}</p>}
                <h2 className={styles.title}>{info.title}</h2>
                {info.tagline && <p className={styles.tagline}>{info.tagline}</p>}
              </div>
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close product details" data-cursor="hover">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <hr className={styles.divider} />

            {info.summary && <p className={styles.description}>{info.summary}</p>}

            {info.specs.length > 0 && (
              <dl className={styles.specs}>
                {info.specs.slice(0, 3).map((s) => (
                  <div key={s.label} className={styles.specRow}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {info.provisional && <p className={styles.provisional}>Données provisoires — prévisualisation locale</p>}

            <Link href={`/simple/${item.slug}`} className={styles.cta}>
              Open <span aria-hidden="true">→</span>
            </Link>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
