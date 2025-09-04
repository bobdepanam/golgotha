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
};

export type FlexibleTextBlock = {
  __typename: "ProjectFieldsFlexibleContentBlocksTextBlockLayout";
  content?: string | null;
};

export type FlexibleImageBlock = {
  __typename: "ProjectFieldsFlexibleContentBlocksImageBlockLayout";
  image?: { node?: MediaItem | null } | null;
  caption?: string | null;
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
 *  PROJECT (noeud principal WPGraphQL)
 * ======================================= */
export type Project = {
  title: string;
  slug: string;
  excerpt: string;
  content?: string | null;
  image?: string | null;

  /** Optionnel : l’image mise en avant WP natif */
  featuredImage?: { node?: MediaItem | null } | null;

  /** Groupes ACF */
  projectFields?: ProjectFields | null;                 // legacy ACF
  projectFieldsFlexible?: ProjectFieldsFlexible | null; // nouveau ACF flexible
};
