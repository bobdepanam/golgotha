/** Élément de la galerie (sous-ensemble d'un produit de la collection Simple). */
export type SpatialItem = {
  slug: string;
  title: string;
  category: string | null;
  /** Miniature WebP 600 px (texture) et ses dimensions réelles */
  thumb: string;
  width: number;
  height: number;
};
