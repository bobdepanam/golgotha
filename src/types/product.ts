// types/product.ts — produit de la collection Simple (src/generated/simple.json,
// produit par scripts/content/simple.mjs à partir de content/simple/<slug>/product.md).

export type SizedMedia = { url: string; width: number | null; height: number | null };

export type ProductMedia =
  | ({ type: 'image'; alt: string; caption: string | null; fit: 'cover' | 'contain' | null } & SizedMedia)
  | {
      type: 'video';
      url: string | null;
      poster: SizedMedia | null;
      autoplay: boolean;
      loop: boolean;
      muted: boolean;
      controls: boolean;
      fit: 'cover' | 'contain' | null;
    }
  | { type: 'embed'; url: string }
  | { type: 'gallery'; images: (SizedMedia & { alt: string })[] };

export type Product = {
  collection: 'simple';
  /** Identifiant stable (nom du dossier) */
  slug: string;
  title: string;
  /** Date de mise en ligne (AAAA-MM-JJ) ; null pour un brouillon non daté */
  publishedAt: string | null;
  year: number | null;
  category: string | null;
  tagline: string | null;
  /** Coupe */
  cut: string | null;
  material: string | null;
  edition: string | null;
  excerpt: string;
  /** Texte de présentation (HTML rendu au build depuis le Markdown) */
  description: string | null;
  /** Visuel principal, pleine résolution (pages produit) */
  cover: SizedMedia | null;
  /** Miniature WebP 600 px (galerie spatiale) */
  thumb: SizedMedia | null;
  /** Placeholder de flou (JPEG 8 px, base64) */
  blurDataURL: string | null;
  media: ProductMedia[];
  audio: string | null;
  links: { label: string | null; url: string }[];
  seo: { title: string | null; description: string | null; image: string | null };
  /** Brouillon (visible uniquement en prévisualisation locale) */
  /** Non officiel (brouillon ou aperçu) : noindex, hors sitemap */
  draft: boolean;
  /** Statut détaillé (7.0.1) */
  status?: 'draft' | 'preview' | 'published';
  /** Valeurs de démonstration NON validées — prévisualisation locale uniquement, jamais publiées */
  provisional?: Record<string, string>;
};

/** Entrée de l'index transversal (projects + simple), pour la future Bibliothéca globale. */
export type CatalogIndexEntry = {
  id: string;
  collection: 'projects' | 'simple';
  slug: string;
  href: string;
  title: string;
  publishedAt: string | null;
  order: number | null;
  year: number | null;
  category: string | null;
  cover: string | null;
  thumb: string | null;
  background: string | null;
  audio: string | null;
  draft: boolean;
};
