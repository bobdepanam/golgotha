'use client';

// Carte mobile (Simple : mobile-grid/MobileProjectGridItem.tsx) : ratio éditorial, légende ;
// un tap simple ouvre le panneau produit, les clics modifiés gardent le vrai lien.
import styles from '@/styles/simple/SimpleMobile.module.scss';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, MouseEvent } from 'react';
import { getEditorialLayout } from '../list/editorialLayout';
import type { SimpleItem } from '../types';

type Props = { item: SimpleItem; index: number; onOpen: (item: SimpleItem, trigger: HTMLAnchorElement) => void };

export function MobileProjectGridItem({ item, index, onOpen }: Props) {
  const ratio = getEditorialLayout(index).ratio;
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onOpen(item, e.currentTarget);
  };
  return (
    <li className={styles.item} style={{ '--item-ratio': ratio } as CSSProperties}>
      <Link href={`/simple/${item.slug}`} className={styles.link} aria-label={item.info.category ? `${item.title} — ${item.info.category}` : item.title} onClick={onClick}>
        <div className={styles.imageWrap}>
          <Image src={item.thumb} alt={item.title} fill sizes="(min-width: 768px) 46vw, 86vw" style={{ objectFit: 'cover' }} className={styles.img} />
        </div>
        <div className={styles.caption}>
          <span className={styles.title}>{item.title}</span>
          {item.info.meta && <span className={styles.meta}>{item.info.meta}</span>}
        </div>
      </Link>
    </li>
  );
}
