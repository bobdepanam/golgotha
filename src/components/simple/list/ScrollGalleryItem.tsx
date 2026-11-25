// Élément de la liste (Simple : scroll-gallery/ScrollGalleryItem.tsx) : variation éditoriale
// déterministe (alignement, largeur, ratio), calque de parallax, légende titre / méta.
// Différences : pas de ViewTransition (transitions Interlude), `itemRef` au lieu de la ref-prop
// React 19, attributs data-fx-item / data-layer pour l'effet List FX.
import styles from '@/styles/simple/SimpleList.module.scss';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { SimpleItem } from '../types';
import { getEditorialLayout } from './editorialLayout';

type Props = {
  item: SimpleItem;
  /** Position dans un cycle : choisit le motif de mise en page */
  index: number;
  /** Cycles suivants (défilement infini de Simple) : mêmes données, masqués aux technologies d'assistance */
  duplicate?: boolean;
  itemRef?: (el: HTMLDivElement | null) => void;
};

export function ScrollGalleryItem({ item, index, duplicate = false, itemRef }: Props) {
  const layout = getEditorialLayout(index);
  return (
    <div
      ref={itemRef}
      className={styles.item}
      data-align={layout.align}
      aria-hidden={duplicate || undefined}
      style={{ '--item-w': `${layout.widthPct}%`, '--item-ratio': layout.ratio } as CSSProperties}
    >
      <Link
        href={`/simple/${item.slug}`}
        className={styles.link}
        aria-label={item.info.category ? `${item.title} — ${item.info.category}` : item.title}
        tabIndex={duplicate ? -1 : undefined}
      >
        <div className={styles.imageWrap} data-fx-item>
          {/* Calque du parallax (rAF de la liste) et de l'effet List FX */}
          <div className={styles.parallaxLayer} data-parallax data-layer>
            <Image
              src={item.thumb}
              alt={item.title}
              fill
              sizes={`(max-width: 767px) 82vw, ${layout.widthPct}vw`}
              style={{ objectFit: 'cover' }}
              className={styles.img}
            />
          </div>
        </div>
        <div className={styles.caption}>
          <span className={styles.title}>{item.title}</span>
          {item.info.meta && <span className={styles.meta}>{item.info.meta}</span>}
        </div>
      </Link>
    </div>
  );
}
