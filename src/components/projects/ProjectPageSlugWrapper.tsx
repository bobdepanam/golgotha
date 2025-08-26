'use client';

import ProjectPlayer from '@/components/projects/ProjectPlayer';
import TextTransition from '@/components/transition/TextTransition';
import styles from '@/styles/projects/Slugpage.module.scss';
import type {
  FlexibleAudioBlock,
  FlexibleContentBlock,
  FlexibleExternalLinkBlock,
  FlexibleGalleryBlock,
  FlexibleImageBlock,
  FlexibleTextBlock,
  FlexibleVideoBlock,
  MediaItem,
  Project,
} from '@/types/project';
import { useEffect, useMemo, useRef, useState } from 'react';

/* ---------- Helpers vidéo ---------- */
function getYouTubeId(raw?: string | null): string | null {
  if (!raw) return null;
  const url = raw.trim();
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split(/[?&]/)[0] ?? null;
  if (url.includes('youtube.com/watch')) return url.match(/[?&]v=([^&]+)/)?.[1] ?? null;
  if (url.startsWith('https://www.youtube.com/embed/')) return url.split('/embed/')[1]?.split(/[?&]/)[0] ?? null;
  return null;
}
function toEmbedUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const url = raw.trim();
  if (url.includes('vimeo.com/')) {
    const id = url.split('vimeo.com/')[1]?.split(/[?&]/)[0];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (url.startsWith('https://www.youtube.com/embed/') || url.startsWith('https://player.vimeo.com/video/')) return url;
  return null;
}
function getDirectVideoUrl(raw?: string | null): string | null {
  if (!raw) return null;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(raw) ? raw.trim() : null;
}

/* ---------- Type guards blocs ---------- */
const isVideo = (b: FlexibleContentBlock): b is FlexibleVideoBlock =>
  b.__typename === 'ProjectFieldsFlexibleContentBlocksVideoBlockLayout';
const isText = (b: FlexibleContentBlock): b is FlexibleTextBlock =>
  b.__typename === 'ProjectFieldsFlexibleContentBlocksTextBlockLayout';
const isImage = (b: FlexibleContentBlock): b is FlexibleImageBlock =>
  b.__typename === 'ProjectFieldsFlexibleContentBlocksImageBlockLayout';
const isAudio = (b: FlexibleContentBlock): b is FlexibleAudioBlock =>
  b.__typename === 'ProjectFieldsFlexibleContentBlocksAudioBlockLayout';
const isExtLink = (b: FlexibleContentBlock): b is FlexibleExternalLinkBlock =>
  b.__typename === 'ProjectFieldsFlexibleContentBlocksExternalLinkBlockLayout';
const isGallery = (b: FlexibleContentBlock): b is FlexibleGalleryBlock =>
  b.__typename === 'ProjectFieldsFlexibleContentBlocksGalleryBlockLayout';

/* ---------- Apparition au viewport ---------- */
function MediaReveal({
  className,
  children,
  rootMargin = '0px 0px -10% 0px',
  threshold = 0.1,
}: {
  className?: string;
  children: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(entry.target);
        }
      },
      { root: null, rootMargin, threshold }
    );

    obs.observe(node);
    return () => obs.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div
      ref={ref}
      className={[className, styles.mediaAppear, visible ? styles.isVisible : ''].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}

type Props = { project: Project };

export default function ProjectPageClientWrapper({ project }: Props) {
  const [reveal, setReveal] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const {
    subtitle,
    category,
    description,
    mainImage,
    gallery,
    playerAudio,
    videoFullscreen,
  } = project.projectFields ?? {};

  const blocks = project.projectFieldsFlexible?.contentBlocks ?? [];
  const flexMediaBlocks = blocks.filter((b) => isVideo(b) || isImage(b) || isGallery(b));
  const flexInfoBlocks = blocks.filter((b) => isText(b) || isAudio(b) || isExtLink(b));

  const legacyMedia: (MediaItem & { type: 'main' | 'gallery' })[] = useMemo(() => {
    const items: (MediaItem & { type: 'main' | 'gallery' })[] = [];
    if (mainImage?.node?.mediaItemUrl) items.push({ ...(mainImage.node as MediaItem), type: 'main' as const });
    if (gallery?.nodes?.length) {
      items.push(...(gallery.nodes as MediaItem[]).map((img) => ({ ...img, type: 'gallery' as const })));
    }
    return items;
  }, [mainImage, gallery]);

  const ytId = useMemo(() => getYouTubeId(videoFullscreen), [videoFullscreen]);
  const directVideoUrl = useMemo(() => (!ytId ? getDirectVideoUrl(videoFullscreen) : null), [ytId, videoFullscreen]);
  const fallbackEmbed = useMemo(
    () => (!ytId && !directVideoUrl ? toEmbedUrl(videoFullscreen) : null),
    [ytId, directVideoUrl, videoFullscreen]
  );
  const ytSrc = ytId
    ? `https://www.youtube.com/embed/${ytId}?enablejsapi=1&playsinline=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&disablekb=1`
    : null;

  const playYouTube = () => {
    if (!ytId) return;
    setPlaying(true);
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
      '*'
    );
  };

  useEffect(() => {
    return () => {
      if (!ytId) return;
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
        '*'
      );
    };
  }, [ytId]);

  return (
    <>
      <TextTransition
        text={project.title}
        trigger={reveal}
        destination={`/projects/${project.slug}`}
        onComplete={() => setReveal(false)}
      />

      {!reveal && (
        <div className={styles.projectWrapper}>
          <div className={styles.grid}>
            {/* === Colonne médias === */}
            <div className={`${styles.mediaColumn} ${panelOpen ? styles.withRightGutter : ''}`}>
              {/* vidéos / images etc. */}
              {/* … contenu identique (yt, direct video, legacy images, blocs flexibles) … */}
            </div>

            {/* === Colonne infos === */}
            <aside className={styles.detailsColumn}>
              <button
                type="button"
                className={styles.toggleBtn}
                aria-label={panelOpen ? 'Fermer panneau infos' : 'Ouvrir panneau infos'}
                aria-expanded={panelOpen}
                onClick={() => setPanelOpen((v) => !v)}
              >
                {panelOpen ? (
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" fill="currentColor" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M4 7h16M4 12h16M4 17h16" fill="currentColor" />
                  </svg>
                )}
              </button>

              <div
                className={[
                  styles.detailsSticky,
                  panelOpen ? styles.isOpen : styles.isClosed,
                ].join(' ')}
              >
                {category && (
                  <div className={styles.detailLine}>
                    <span>Catégorie_</span>
                    <span>{category}</span>
                  </div>
                )}

                {subtitle && (
                  <div className={styles.detailLine}>
                    <span>Index_</span>
                    <span>{subtitle}</span>
                  </div>
                )}

                {description && (
                  <div className={styles.description}>
                    <div dangerouslySetInnerHTML={{ __html: description }} />
                  </div>
                )}

                {playerAudio && (
                  <div className={styles.audioPlayers}>
                    <ProjectPlayer tracks={[playerAudio]} />
                  </div>
                )}

                {flexInfoBlocks.map((b, i) => {
                  if (isText(b) && b.content) {
                    return (
                      <div
                        key={`tx-${i}`}
                        className={styles.flexibleText}
                        dangerouslySetInnerHTML={{ __html: b.content }}
                      />
                    );
                  }
                  if (isAudio(b) && b.fileUrl) {
                    return (
                      <div key={`au-${i}`} className={styles.audioPlayers}>
                        <ProjectPlayer tracks={[b.fileUrl]} />
                      </div>
                    );
                  }
                  if (isExtLink(b) && b.url) {
                    return (
                      <div key={`lk-${i}`} className={styles.blockLink}>
                        <a href={b.url} target="_blank" rel="noopener noreferrer">
                          {b.label || b.url}
                        </a>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}
