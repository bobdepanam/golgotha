// Élément de la liste (Simple : scroll-gallery/ScrollGalleryItem.tsx) : variation éditoriale
// déterministe (alignement, largeur, ratio), calque de parallax, légende titre / méta.
// Différences : pas de ViewTransition (transitions Interlude), `itemRef` au lieu de la ref-prop
// React 19, attributs data-fx-item / data-layer pour l'effet List FX, entrée générique
// (Simple et Projects) avec ratio réel optionnel.
import styles from '@/styles/simple/SimpleList.module.scss';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getEditorialLayout } from './editorialLayout';
import type { ListEntry } from './types';

type Props = {
  entry: ListEntry;
  /** Position dans un cycle : choisit le motif de mise en page */
  index: number;
  /** Cycles suivants (défilement infini de Simple) : mêmes données, masqués aux technologies d'assistance */
  duplicate?: boolean;
  itemRef?: (el: HTMLDivElement | null) => void;
};

export function ScrollGalleryItem({ entry, index, duplicate = false, itemRef }: Props) {
  const layout = getEditorialLayout(index);
  const ratio = entry.ratio ?? layout.ratio;
  return (
    <div
      ref={itemRef}
      className={styles.item}
      data-align={layout.align}
      aria-hidden={duplicate || undefined}
      style={{ '--item-w': `${layout.widthPct}%`, '--item-ratio': ratio } as CSSProperties}
    >
      <Link
        href={entry.href}
        className={styles.link}
        aria-label={entry.ariaLabel}
        tabIndex={duplicate ? -1 : undefined}
      >
        <div className={styles.imageWrap} data-fx-item>
          {/* Calque du parallax (rAF de la liste) et de l'effet List FX */}
          <div className={styles.parallaxLayer} data-parallax data-layer>
            <Image
              src={entry.image}
              alt={entry.title}
              fill
              sizes={`(max-width: 767px) 82vw, ${layout.widthPct}vw`}
              style={{ objectFit: 'cover' }}
              className={styles.img}
            />
          </div>
        </div>
        <div className={styles.caption}>
          <span className={styles.title}>{entry.title}</span>
          {entry.meta && <span className={styles.meta}>{entry.meta}</span>}
        </div>
      </Link>
    </div>
  );
}
