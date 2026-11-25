'use client';

// Expérience mobile / tablette (< 1024 px) de Simple (mobile-grid/MobileExperience.tsx) :
// DOM uniquement, sans WebGL. LIST ⇄ GRID avec ancrage sur la carte réellement visible,
// panneau produit en surimpression (chargé au premier tap). La Nav de Simple n'est pas
// reprise : header et SiteDock de Golgotha. Filtres : rangée défilante sous le header.
import dynamic from 'next/dynamic';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { CategoryDock } from '../controls/CategoryDock';
import type { SimpleItem } from '../types';
import { type CategoryFilter, type MobileMode, simpleViewState } from '../viewState';
import { MobileModeToggle } from './MobileModeToggle';
import { MobileProjectGrid } from './MobileProjectGrid';

const MobileProjectOverlay = dynamic(() => import('./MobileProjectOverlay').then((m) => m.MobileProjectOverlay), { ssr: false });

function contentLeft(list: HTMLUListElement) {
  return list.getBoundingClientRect().left + parseFloat(getComputedStyle(list).paddingLeft);
}

function findAnchorIndex(list: HTMLUListElement, mode: MobileMode, topLine: number): number | null {
  const items = Array.from(list.children) as HTMLElement[];
  const i =
    mode === 'list'
      ? items.findIndex((li) => {
          const r = li.getBoundingClientRect();
          return r.bottom - Math.max(r.top, topLine) >= r.height / 2;
        })
      : (() => {
          const edge = contentLeft(list);
          return items.findIndex((li) => {
            const r = li.getBoundingClientRect();
            return r.right - Math.max(r.left, edge) >= r.width / 2;
          });
        })();
  return i === -1 ? null : i;
}

function alignToAnchor(list: HTMLUListElement, mode: MobileMode, index: number) {
  const li = list.children[index] as HTMLElement | undefined;
  if (!li) return;
  const r = li.getBoundingClientRect();
  if (mode === 'grid') {
    list.scrollTo({ left: list.scrollLeft + (r.left - contentLeft(list)), behavior: 'instant' as ScrollBehavior });
    return;
  }
  const root = list.parentElement;
  const topLine = root ? parseFloat(getComputedStyle(root).paddingTop) : 0;
  window.scrollTo({ top: window.scrollY + (r.top - topLine), left: 0, behavior: 'instant' as ScrollBehavior });
}

type Props = {
  items: SimpleItem[];
  categories: { id: string; count: number }[];
  category: CategoryFilter;
  onCategory: (c: CategoryFilter) => void;
};

export function MobileExperience({ items, categories, category, onCategory }: Props) {
  const [selected, setSelected] = useState<SimpleItem | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [mode, setMode] = useState<MobileMode>(() => simpleViewState.mobileMode);
  const listRef = useRef<HTMLUListElement>(null);
  const switchedRef = useRef(false);

  const open = useCallback(
    (item: SimpleItem, trigger: HTMLAnchorElement) => {
      triggerRef.current = trigger;
      const index = items.indexOf(item);
      if (index !== -1) simpleViewState.mobileAnchorIndex = index;
      setSelected(item);
      setOverlayVisible(true);
    },
    [items]
  );
  const close = useCallback(() => setSelected(null), []);
  const exited = useCallback(() => setOverlayVisible(false), []);

  const switchMode = useCallback(
    (next: MobileMode) => {
      if (next === mode) return;
      const list = listRef.current;
      const headerBottom = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
      const index = list ? findAnchorIndex(list, mode, headerBottom) : null;
      if (index !== null) simpleViewState.mobileAnchorIndex = index;
      simpleViewState.mobileMode = next;
      switchedRef.current = true;
      setMode(next);
    },
    [mode]
  );

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (mode === 'grid') alignToAnchor(list, 'grid', simpleViewState.mobileAnchorIndex);
    else if (switchedRef.current) alignToAnchor(list, 'list', simpleViewState.mobileAnchorIndex);
    switchedRef.current = false;
  }, [mode]);

  const inertProps = selected !== null ? ({ inert: '' } as Record<string, string>) : {};

  return (
    <>
      <div style={{ display: 'contents' }} {...inertProps}>
        <CategoryDock categories={categories} active={category} onChange={onCategory} variant="mobile" />
        <MobileProjectGrid items={items} mode={mode} listRef={listRef} onOpen={open} />
        <MobileModeToggle mode={mode} onChange={switchMode} />
      </div>
      {overlayVisible && <MobileProjectOverlay item={selected} onClose={close} onExited={exited} returnFocusRef={triggerRef} />}
    </>
  );
}
