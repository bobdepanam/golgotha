'use client';

// Mode LIST de Simple (scroll-gallery/ScrollGallery.tsx) avec l'effet List FX :
// - colonne éditoriale, apparition au défilement (un IntersectionObserver partagé) ;
// - parallax par élément (une seule boucle rAF, éléments visibles uniquement ; coupé sous
//   reduced-motion et sur petit écran) ;
// - mémoire de la position de défilement (retour depuis une page produit) ;
// - défilement « infini » de Simple : jusqu'à 3 passages des mêmes produits (mêmes données,
//   masqués aux technologies d'assistance), seulement si le catalogue est assez long.
// Générique : entrées neutres (ListEntry) et mémoire de défilement fournies par l'appelant
// (Simple : simpleViewState ; Projects : projectsViewState).
import styles from '@/styles/simple/SimpleList.module.scss';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getEditorialLayout } from './editorialLayout';
import { ScrollGalleryItem } from './ScrollGalleryItem';
import type { ListEntry, ListMemory } from './types';
import { useListFx } from './useListFx';

const MAX_CYCLES = 3;
/** En dessous, pas de passages répétés : une courte liste reste une liste. */
const MIN_FOR_CYCLES = 12;

type ItemInfo = { parallaxEl: HTMLElement | null; factor: number };

export function ScrollGallery({ entries, memory }: { entries: ListEntry[]; memory: ListMemory }) {
  const [cycles, setCycles] = useState(1);
  const canCycle = entries.length >= MIN_FOR_CYCLES;
  const signature = entries.map((e) => e.key).join('|');
  const rootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<Map<HTMLDivElement, ItemInfo>>(new Map());
  const visibleRef = useRef<Set<HTMLDivElement>>(new Set());
  const revealObserver = useRef<IntersectionObserver | null>(null);

  useListFx(rootRef, styles.fxCanvas);

  // Nouveau filtre : retour à un seul passage
  useEffect(() => setCycles(1), [signature]);

  // Position mémorisée (retour depuis une page produit), avant affichage
  useLayoutEffect(() => {
    if (memory.scrollY > 0) window.scrollTo({ top: memory.scrollY, behavior: 'instant' as ScrollBehavior });
    // Restauration au montage uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    revealObserver.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLDivElement;
          el.dataset.visible = String(entry.isIntersecting);
          if (entry.isIntersecting) visibleRef.current.add(el);
          else visibleRef.current.delete(el);
        }
      },
      { rootMargin: '15% 0px 15% 0px', threshold: 0.05 }
    );
    for (const el of itemsRef.current.keys()) revealObserver.current.observe(el);
    return () => revealObserver.current?.disconnect();
  }, []);

  const registerItem = useCallback((el: HTMLDivElement | null, index: number) => {
    if (!el) return;
    itemsRef.current.set(el, {
      parallaxEl: el.querySelector<HTMLElement>('[data-parallax]'),
      factor: getEditorialLayout(index).parallax,
    });
    revealObserver.current?.observe(el);
  }, []);

  // Éléments démontés (filtre, cycles) : retirés du suivi
  useEffect(() => {
    for (const el of [...itemsRef.current.keys()]) {
      if (!el.isConnected) {
        itemsRef.current.delete(el);
        visibleRef.current.delete(el);
        revealObserver.current?.unobserve(el);
      }
    }
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !canCycle || cycles >= MAX_CYCLES) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setCycles((c) => Math.min(c + 1, MAX_CYCLES));
      },
      { rootMargin: '800px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [cycles, canCycle]);

  useEffect(() => {
    const skipParallax =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(max-width: 767px)').matches;
    let rafId: number;
    const tick = () => {
      memory.scrollY = window.scrollY;
      if (!skipParallax) {
        const center = window.innerHeight / 2;
        visibleRef.current.forEach((el) => {
          const info = itemsRef.current.get(el);
          if (!info?.parallaxEl) return;
          const rect = el.getBoundingClientRect();
          const delta = (rect.top + rect.height / 2 - center) * info.factor * 0.08;
          info.parallaxEl.style.transform = `translateY(${delta.toFixed(1)}px)`;
        });
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [memory]);

  const passes = useMemo(() => Array.from({ length: canCycle ? cycles : 1 }, (_, c) => c), [cycles, canCycle]);

  return (
    <div className={styles.root}>
      <div ref={rootRef} className={styles.column}>
        {passes.map((cycle) =>
          entries.map((entry, i) => (
            <ScrollGalleryItem
              key={`${entry.key}-c${cycle}`}
              entry={entry}
              index={i}
              duplicate={cycle > 0}
              itemRef={(el) => registerItem(el, i)}
            />
          ))
        )}
        <div ref={sentinelRef} aria-hidden="true" className={styles.sentinel} />
      </div>
    </div>
  );
}
