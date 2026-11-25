/**
 * Entrée de la liste éditoriale (mode List), indépendante de la collection :
 * utilisée par Simple (/simple) et par Projects (/projects).
 */
export type ListEntry = {
  key: string;
  href: string;
  title: string;
  ariaLabel: string;
  /** Ligne secondaire (ex. « Catégorie · Année ») */
  meta: string | null;
  /** Image affichée (miniature) */
  image: string;
  /** Ratio réel largeur / hauteur ; absent : ratio du motif éditorial (Simple) */
  ratio?: number | null;
};

/** Mémoire de défilement du mode List (par collection, pour la session). */
export type ListMemory = { scrollY: number };
