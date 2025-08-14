// types/project.ts

export type MediaItem = {
  id: string;
  title?: string | null;
  mediaItemUrl: string;
  mimeType?: string | null;
};

/** ----- Legacy fields (fallback) ----- */
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

/** ----- Flexible blocks (ACF Flexible Content) ----- */
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

export type FlexibleContentBlock =
  | FlexibleVideoBlock
  | FlexibleTextBlock
  | FlexibleImageBlock
  | FlexibleAudioBlock
  | FlexibleExternalLinkBlock
  | FlexibleGalleryBlock;

export type ProjectFieldsFlexible = {
  contentBlocks?: FlexibleContentBlock[] | null;
};

export type Project = {
  title: string;
  slug: string;
  excerpt: string;
  content?: string | null;
  image?: string | null;
  projectFields?: ProjectFields | null;                 // legacy
  projectFieldsFlexible?: ProjectFieldsFlexible | null; // flexible
};
