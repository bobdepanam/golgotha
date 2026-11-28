// Médias d'un projet, normalisés (V8.0.3) — UNE liste ordonnée et typée, quelle que soit
// l'origine des données (champs historiques mainImage / gallery / videoFullscreen, blocs
// `media:` du Markdown : image, vidéo, galerie, intégration YouTube / Vimeo). Les composants ne
// consomment que cette liste : 1 élément = page plein écran inchangée, plusieurs = navigation
// horizontale. Une galerie devient une suite d'images (une par écran). L'audio global du
// projet n'en fait pas partie : il reste indépendant du média affiché.
import type { FlexibleContentBlock, FlexibleGalleryBlock, FlexibleImageBlock, FlexibleVideoBlock, MediaItem, Project } from '@/types/project';

export type MediaFit = 'cover' | 'contain' | null;

export type ProjectMedia =
  | { kind: 'image'; key: string; src: string; alt: string; caption: string | null; fit: MediaFit }
  | {
      kind: 'video';
      key: string;
      src: string;
      poster: string | null;
      autoplay: boolean;
      loop: boolean;
      controls: boolean;
      fit: MediaFit;
    }
  /** Vidéo indisponible (fichier manquant) : son poster seul, jamais un lecteur vide */
  | { kind: 'poster'; key: string; src: string; alt: string; fit: MediaFit }
  /** YouTube / Vimeo (bloc `embed`) */
  | { kind: 'embed'; key: string; url: string; youtubeId: string | null; autoplay: boolean; loop: boolean; controls: boolean }
  /** Champ historique `videoFullscreen` (YouTube en tête de page, lecture au clic) */
  | { kind: 'legacy-youtube'; key: string; youtubeId: string }
  | { kind: 'legacy-video'; key: string; src: string }
  | { kind: 'legacy-embed'; key: string; url: string };

/* ---------- Aides vidéo (partagées) ---------- */
export function getYouTubeId(raw?: string | null): string | null {
  if (!raw) return null;
  const url = raw.trim();
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split(/[?&]/)[0] ?? null;
  if (url.includes('youtube.com/watch')) return url.match(/[?&]v=([^&]+)/)?.[1] ?? null;
  if (url.startsWith('https://www.youtube.com/embed/')) return url.split('/embed/')[1]?.split(/[?&]/)[0] ?? null;
  return null;
}

export function toEmbedUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const url = raw.trim();
  if (url.includes('vimeo.com/')) {
    const id = url.split('vimeo.com/')[1]?.split(/[?&]/)[0];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (url.startsWith('https://www.youtube.com/embed/') || url.startsWith('https://player.vimeo.com/video/')) return url;
  return null;
}

export function getDirectVideoUrl(raw?: string | null): string | null {
  if (!raw) return null;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(raw) ? raw.trim() : null;
}

const isVideo = (b: FlexibleContentBlock): b is FlexibleVideoBlock =>
  b.__typename === 'ProjectFieldsFlexibleContentBlocksVideoBlockLayout';
const isImage = (b: FlexibleContentBlock): b is FlexibleImageBlock =>
  b.__typename === 'ProjectFieldsFlexibleContentBlocksImageBlockLayout';
const isGallery = (b: FlexibleContentBlock): b is FlexibleGalleryBlock =>
  b.__typename === 'ProjectFieldsFlexibleContentBlocksGalleryBlockLayout';

const fitOf = (b: { fit?: 'cover' | 'contain' | null }): MediaFit => (b.fit === 'contain' ? 'contain' : null);

/** Liste ordonnée des médias affichables d'un projet (les entrées invalides sont ignorées). */
export function normalizeProjectMedia(project: Project): ProjectMedia[] {
  const out: ProjectMedia[] = [];
  const pf = project.projectFields ?? {};

  // 1. Champ historique videoFullscreen (en tête, comme auparavant)
  const vf = (pf as { videoFullscreen?: string | null }).videoFullscreen ?? null;
  const ytId = getYouTubeId(vf);
  if (ytId) out.push({ kind: 'legacy-youtube', key: 'legacy-yt', youtubeId: ytId });
  else if (getDirectVideoUrl(vf)) out.push({ kind: 'legacy-video', key: 'legacy-video', src: getDirectVideoUrl(vf) as string });
  else if (toEmbedUrl(vf)) out.push({ kind: 'legacy-embed', key: 'legacy-embed', url: toEmbedUrl(vf) as string });

  // 2. Images historiques (mainImage puis galerie)
  const legacy: MediaItem[] = [];
  if (pf.mainImage?.node?.mediaItemUrl) legacy.push(pf.mainImage.node as MediaItem);
  if (pf.gallery?.nodes?.length) legacy.push(...(pf.gallery.nodes as MediaItem[]));
  legacy.forEach((img, i) => {
    if (img?.mediaItemUrl)
      out.push({ kind: 'image', key: `legacy-${img.id ?? i}`, src: img.mediaItemUrl, alt: img.title ?? 'Visuel projet', caption: null, fit: null });
  });

  // 3. Blocs `media:` du Markdown, dans leur ordre
  (project.projectFieldsFlexible?.contentBlocks ?? []).forEach((b, i) => {
    if (isVideo(b)) {
      const file = getDirectVideoUrl(b.providerUrl);
      const poster = b.poster?.node?.mediaItemUrl ?? null;
      if (b.providerUrl && file) {
        out.push({ kind: 'video', key: `v-${i}`, src: file, poster, autoplay: !!b.autoplay, loop: !!b.loop, controls: !!b.controls, fit: fitOf(b) });
      } else if (b.providerUrl) {
        out.push({ kind: 'embed', key: `e-${i}`, url: b.providerUrl, youtubeId: getYouTubeId(b.providerUrl), autoplay: !!b.autoplay, loop: !!b.loop, controls: !!b.controls });
      } else if (poster) {
        out.push({ kind: 'poster', key: `p-${i}`, src: poster, alt: b.poster?.node?.title ?? project.title, fit: fitOf(b) });
      }
    } else if (isImage(b) && b.image?.node?.mediaItemUrl) {
      out.push({ kind: 'image', key: `i-${i}`, src: b.image.node.mediaItemUrl, alt: b.image.node.title ?? '', caption: b.caption ?? null, fit: fitOf(b) });
    } else if (isGallery(b)) {
      (b.images?.nodes ?? []).forEach((img, k) => {
        if (img?.mediaItemUrl) out.push({ kind: 'image', key: `g-${i}-${k}`, src: img.mediaItemUrl, alt: img.title ?? '', caption: null, fit: null });
      });
    }
  });
  return out;
}
