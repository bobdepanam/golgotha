// types/project.ts

/** =======================================
 *  MEDIA ITEM (WordPress images/videos)
 *  — Rétro-compatible + tailles dérivées
 * ======================================= */

export type WPSize = {
  name: string;          // ex: 'thumbnail', 'medium', 'large', '1536x1536', '2048x2048'
  sourceUrl: string;     // URL de la taille dérivée (souvent .webp après EWWW)
  width: number;
  height: number;
};

export type MediaDetails = {
  width?: number | null;
  height?: number | null;
  sizes?: WPSize[] | null;
};

export type MediaItem = {
  id: string;
  title?: string | null;

  /** Historique (toujours présent dans tes requêtes) */
  mediaItemUrl: string;         // original brut (legacy)
  mimeType?: string | null;

  /** Nouveaux champs utiles pour l’optimisation */
  sourceUrl?: string | null;    // URL "par défaut" côté WP (peut être .webp)
  mediaDetails?: MediaDetails | null;

  /** Accès direct à certaines tailles WP (si demandées dans la query) */
  large?: string | null;        // sourceUrl(size: LARGE)
  x1536?: string | null;        // sourceUrl(size: _1536X1536)
  x2048?: string | null;        // sourceUrl(size: _2048X2048)
};

/** =======================================
 *  LEGACY FIELDS (ancien groupe ACF)
 * ======================================= */
export type ProjectFields = {
  subtitle?: string | null;
  category?: string | null;
  description?: string | null;
  external_link?: string | null;
  playerAudio?: string | null;
  videoFullscreen?: string | null;
  mainImage?: { node?: MediaItem | null } | null;
  gallery?: { nodes?: (MediaItem | null)[] | null } | null;
};

/** =======================================
 *  FLEXIBLE CONTENT BLOCKS
 * ======================================= */
export type FlexibleVideoBlock = {
  __typename: "ProjectFieldsFlexibleContentBlocksVideoBlockLayout";
  providerUrl?: string | null;
  autoplay?: boolean | null;
  loop?: boolean | null;
  muted?: boolean | null;
  controls?: boolean | null;
  poster?: { node?: MediaItem | null } | null;
  /** Cadrage plein écran (défaut : cover) */
  fit?: "cover" | "contain" | null;
};

export type FlexibleTextBlock = {
  __typename: "ProjectFieldsFlexibleContentBlocksTextBlockLayout";
  content?: string | null;
};

export type FlexibleImageBlock = {
  __typename: "ProjectFieldsFlexibleContentBlocksImageBlockLayout";
  image?: { node?: MediaItem | null } | null;
  caption?: string | null;
  /** Cadrage plein écran (défaut : cover) */
  fit?: "cover" | "contain" | null;
};

export type FlexibleAudioBlock = {
  __typename: "ProjectFieldsFlexibleContentBlocksAudioBlockLayout";
  title?: string | null;
  fileUrl?: string | null;
};

export type FlexibleExternalLinkBlock = {
  __typename: "ProjectFieldsFlexibleContentBlocksExternalLinkBlockLayout";
  label?: string | null;
  url?: string | null;
};

export type FlexibleGalleryBlock = {
  __typename: "ProjectFieldsFlexibleContentBlocksGalleryBlockLayout";
  images?: { nodes?: (MediaItem | null)[] | null } | null;
};

/** Union type de tous les blocs flexibles */
export type FlexibleContentBlock =
  | FlexibleVideoBlock
  | FlexibleTextBlock
  | FlexibleImageBlock
  | FlexibleAudioBlock
  | FlexibleExternalLinkBlock
  | FlexibleGalleryBlock;

/** =======================================
 *  FLEXIBLE FIELDS (nouveau groupe ACF)
 * ======================================= */
export type ProjectFieldsFlexible = {
  category?: string | null;
  contentBlocks?: FlexibleContentBlock[] | null;
};

/** =======================================
 *  SEO (forme historique Yoast, produite par le moteur de contenu)
 * ======================================= */
export type ProjectSeo = {
  title?: string | null;
  metaDesc?: string | null;
  canonical?: string | null;
  opengraphTitle?: string | null;
  opengraphDescription?: string | null;
  opengraphImage?: { mediaItemUrl?: string | null } | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: { mediaItemUrl?: string | null } | null;
};

/** =======================================
 *  PROJECT (forme historique, produite par scripts/content/engine.mjs)
 * ======================================= */
export type Project = {
  title: string;
  slug: string;
  excerpt: string;
  content?: string | null;
  image?: string | null;

  /** Optionnel : l’image mise en avant WP natif */
  featuredImage?: { node?: MediaItem | null } | null;

  /** Année de création artistique */
  year?: number | null;
  /** Ordre historique (projets migrés, sans date de publication connue) */
  order?: number;
  /** Date de publication sur le site (AAAA-MM-JJ) ; null pour les projets historiques */
  publishedAt?: string | null;
  /** Vignette de la grille (repli : cover) */
  thumbnail?: string | null;
  /** Dimensions réelles de la vignette (si une vignette propre est déclarée) */
  thumbnailSize?: { width: number; height: number } | null;
  /** Visuel plein écran de Bibliothéca (repli : cover) */
  background?: string | null;
  /** Brouillon (visible uniquement en prévisualisation locale) */
  draft?: boolean;

  /** Groupes ACF */
  projectFields?: ProjectFields | null;                 // legacy ACF
  projectFieldsFlexible?: ProjectFieldsFlexible | null; // nouveau ACF flexible

  /** Métadonnées de partage / moteurs de recherche */
  seo?: ProjectSeo | null;
};
