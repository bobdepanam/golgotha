import type { ProductDisplay } from '@/lib/content/simple-display';

/** Élément de la galerie (sous-ensemble d'un produit de la collection Simple). */
export type SpatialItem = {
  slug: string;
  title: string;
  category: string | null;
  /** Miniature WebP 600 px (texture) et ses dimensions réelles */
  thumb: string;
  width: number;
  height: number;
  /** Informations du panneau de focus (sans le texte long de la page produit) */
  info: Omit<ProductDisplay, 'bodyHtml' | 'bodyText'>;
};
