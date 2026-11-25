// État de navigation de /simple pour la session (onglet), comme les singletons de Simple
// (homeViewState, mobileViewState, filterState) : survit aux changements de route
// (page produit → retour), réinitialisé au rechargement. Aucun stockage, aucune URL.
export type DesktopMode = 'spatial' | 'list';
export type MobileMode = 'list' | 'grid';
export type CategoryFilter = 'all' | string;

export const simpleViewState: {
  mode: DesktopMode;
  /** Position de défilement du mode liste */
  scrollY: number;
  /** Filtre partagé par la grille, la liste et le mobile */
  category: CategoryFilter;
  mobileMode: MobileMode;
  mobileAnchorIndex: number;
} = {
  mode: 'spatial',
  scrollY: 0,
  category: 'all',
  mobileMode: 'list',
  mobileAnchorIndex: 0,
};

/** Catégories présentes dans les données (aucune liste figée), des plus fournies aux moins fournies. */
export function categoriesOf(items: { category: string | null }[]): { id: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const it of items) if (it.category) counts.set(it.category, (counts.get(it.category) ?? 0) + 1);
  return [...counts]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id, 'fr'));
}

export const matchesCategory = (item: { category: string | null }, cat: CategoryFilter) =>
  cat === 'all' || item.category === cat;
