'use client';

// Grille mobile DOM (Simple : mobile-grid/MobileProjectGrid.tsx) : LIST = fil vertical ;
// GRID = défilement horizontal natif (molette verticale convertie, bords libres).
import styles from '@/styles/simple/SimpleMobile.module.scss';
import { type RefObject, useEffect } from 'react';
import type { SimpleItem } from '../types';
import type { MobileMode } from '../viewState';
import { MobileProjectGridItem } from './MobileProjectGridItem';

type Props = {
  items: SimpleItem[];
  mode: MobileMode;
  listRef: RefObject<HTMLUListElement>;
  onOpen: (item: SimpleItem, trigger: HTMLAnchorElement) => void;
};

export function MobileProjectGrid({ items, mode, listRef, onOpen }: Props) {
  useEffect(() => {
    const list = listRef.current;
    if (mode !== 'grid' || !list) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) * 2) return;
      const max = list.scrollWidth - list.clientWidth;
      if (max <= 0) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? list.clientWidth : 1;
      const delta = e.deltaY * unit;
      if (delta < 0 && list.scrollLeft <= 0) return;
      if (delta > 0 && list.scrollLeft >= max - 1) return;
      e.preventDefault();
      list.scrollBy({ left: delta, behavior: 'instant' as ScrollBehavior });
    };
    list.addEventListener('wheel', onWheel, { passive: false });
    return () => list.removeEventListener('wheel', onWheel);
  }, [mode, listRef]);

  return (
    <div className={styles.root} data-mode={mode}>
      <ul ref={listRef} className={styles.grid} data-lenis-prevent={mode === 'grid' ? '' : undefined}>
        {items.map((item, index) => (
          <MobileProjectGridItem key={item.slug} item={item} index={index} onOpen={onOpen} />
        ))}
      </ul>
    </div>
  );
}
