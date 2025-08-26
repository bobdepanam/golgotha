// types/project.ts

/** =======================================
 *  MEDIA ITEM (WordPress images/videos)
 * ======================================= */
export type MediaItem = {
  id: string;
  title?: string | null;
  mediaItemUrl: string;
  mimeType?: string | null;
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
  category?: string | null;                 // 👈 ajouté (présent dans tes queries GraphQL)
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

  projectFields?: ProjectFields | null;                 // legacy ACF
  projectFieldsFlexible?: ProjectFieldsFlexible | null; // nouveau ACF flexible
};
