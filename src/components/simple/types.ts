// Données d'un produit transmises à l'expérience /simple (grille, liste, mobile).
// Construites côté serveur (src/app/simple/page.tsx) depuis content/simple/.
import type { ProductDisplay } from '@/lib/content/simple-display';
import type { StageMedia } from './product/types';

export type SimpleItem = {
  slug: string;
  title: string;
  /** Catégorie filtrable (null : visible uniquement dans « All ») */
  category: string | null;
  /** Miniature WebP 600 px (textures, listes) et ses dimensions */
  thumb: string;
  width: number;
  height: number;
  blurDataURL: string | null;
  /** Informations produit (panneaux, overlay mobile) */
  info: ProductDisplay;
  /** Médias de la fiche : cover pleine résolution puis médias de product.md */
  media: StageMedia[];
};
