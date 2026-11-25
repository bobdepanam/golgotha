'use client';

// /simple — racine de l'expérience (Simple : IntroGate + HomeView, sans intro ni Nav) :
// - ≥ 1024 px : galerie spatiale (Grid) ou liste éditoriale avec effet List FX (List),
//   sélecteur Grid / List, module de filtres ; chaque mode garde son état (mémoire de session) ;
// - < 1024 px : expérience DOM tactile (LIST / GRID), sans WebGL ;
// - non résolu (rendu serveur, premier affichage) : fond neutre, aucun « flash » mobile.
// Le filtre est partagé par tous les modes. Navigation globale : Golgotha (header, SiteDock).
import { useCallback, useMemo, useState } from 'react';
import { CategoryDock } from './controls/CategoryDock';
import { ViewToggle } from './controls/ViewToggle';
import { ScrollGallery } from './list/ScrollGallery';
import type { ListEntry } from './list/types';
import { MobileExperience } from './mobile/MobileExperience';
import SimpleSpatialLoader from './spatial/SimpleSpatialLoader';
import type { SimpleItem } from './types';
import { useIsDesktop } from './useIsDesktop';
import { type CategoryFilter, categoriesOf, type DesktopMode, matchesCategory, simpleViewState } from './viewState';

export default function SimpleExperience({ items }: { items: SimpleItem[] }) {
  const isDesktop = useIsDesktop();
  const [mode, setMode] = useState<DesktopMode>(() => simpleViewState.mode);
  const [category, setCategory] = useState<CategoryFilter>(() => simpleViewState.category);
  const categories = useMemo(() => categoriesOf(items), [items]);
  const filtered = useMemo(() => items.filter((it) => matchesCategory(it, category)), [items, category]);
  // Mode List : entrées de la liste éditoriale (ratios du motif de Simple)
  const listEntries = useMemo<ListEntry[]>(
    () =>
      filtered.map((it) => ({
        key: it.slug,
        href: `/simple/${it.slug}`,
        title: it.title,
        ariaLabel: it.info.category ? `${it.title} — ${it.info.category}` : it.title,
        meta: it.info.meta,
        image: it.thumb,
      })),
    [filtered]
  );

  const changeCategory = useCallback(
    (c: CategoryFilter) => {
      if (c === category) return;
      simpleViewState.category = c;
      setCategory(c);
      // Nouvelle sélection : la liste repart du début (la grille recompose son espace)
      simpleViewState.scrollY = 0;
      if (mode === 'list' || isDesktop === false) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    },
    [category, mode, isDesktop]
  );

  const changeMode = useCallback(
    (next: DesktopMode) => {
      if (next === mode) return;
      simpleViewState.mode = next;
      if (next === 'spatial') window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      setMode(next);
    },
    [mode]
  );

  if (isDesktop === null) return <div style={{ minHeight: '100svh', background: 'var(--background-color)' }} />;

  if (!isDesktop) {
    return <MobileExperience items={filtered} categories={categories} category={category} onCategory={changeCategory} />;
  }

  return (
    <>
      {/* key : chaque mode est démonté à la sortie (le canvas WebGL ne tourne jamais en arrière-plan) */}
      <div key={mode}>
        {mode === 'spatial' ? <SimpleSpatialLoader items={items} category={category} /> : <ScrollGallery entries={listEntries} memory={simpleViewState} />}
      </div>
      <ViewToggle mode={mode} onChange={changeMode} />
      <CategoryDock categories={categories} active={category} onChange={changeCategory} />
    </>
  );
}
