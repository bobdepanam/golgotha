export type MediaItem = {
  id: string;
  title?: string;
  mediaItemUrl: string;
  mimeType?: string;
};

export type ProjectFields = {
  subtitle?: string;
  category?: string;
  description?: string;
  external_link?: string;
  playerAudio?: string | null;         // ✅ nouveau champ
  videoFullscreen?: string | null;     // ✅ nouveau champ
  mainImage?: {
    node: MediaItem;
  };
  gallery?: {
    nodes: MediaItem[];
  };
};

export type Project = {
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  image?: string | null;
  projectFields?: ProjectFields;
};
