'use client';

import ProjectPlayer from '@/components/projects/ProjectPlayer';
import TextTransition from '@/components/transition/TextTransition';
import { useDockUI } from '@/context/DockUIContext';
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
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

/* ---------- Hook mobile ---------- */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(ua));
  }, []);
  return isMobile;
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
  const isMobile = useIsMobile();
  const { hide, show } = useDockUI();
  const [reveal, setReveal] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const dockId = `project-dock-${project.slug}`;
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
    if (!isMobile) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
        '*'
      );
    }
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

  const toggleDock = useCallback(() => {
    setPanelOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (reveal) {
      hide();
      return;
    }

    show({
      onToggle: toggleDock,
      isOpen: panelOpen,
      labelOpen: 'Fermer le dock infos',
      labelClosed: 'Ouvrir le dock infos',
    });
    return () => hide();
  }, [hide, panelOpen, reveal, show, toggleDock]);

  return (
    <>
      <TextTransition
        text={project.title}
        trigger={reveal}
        destination={`/projects/${project.slug}`}
        onComplete={() => setReveal(false)}
      />

      {!reveal && (
        <div className={[styles.projectWrapper, styles.dockMode].join(' ')}>
          <div className={styles.grid}>
            {/* === Colonne médias === */}
            <div className={styles.mediaColumn}>
              {/* Legacy vidéo (header vidéo) */}
              {ytSrc && (
                <MediaReveal className={`${styles.ytwrap} ${playing ? styles.isPlaying : ''} ${styles.fullBleed}`}>
                  <iframe
                    ref={iframeRef}
                    src={ytSrc}
                    title={`${project.title} — video`}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                  {!playing && (
                    <button className={styles.ytplay} onClick={playYouTube} aria-label="Lire la vidéo">
                      <span className={styles.triangle} />
                    </button>
                  )}
                </MediaReveal>
              )}

              {!ytSrc && directVideoUrl && (
                <MediaReveal className={`${styles.videoAspect} ${styles.fullBleed}`}>
                  <video
                    src={directVideoUrl}
                    controls
                    autoPlay={!isMobile}
                    muted
                    playsInline
                    preload="metadata"
                  />
                </MediaReveal>
              )}

              {!ytSrc && !directVideoUrl && fallbackEmbed && (
                <MediaReveal className={`${styles.videoAspect} ${styles.fullBleed}`}>
                  <iframe
                    src={fallbackEmbed}
                    title={`${project.title} — video`}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    allowFullScreen
                    loading="lazy"
                  />
                </MediaReveal>
              )}

              {/* Legacy images */}
              {legacyMedia.map((img, idx) => (
                <MediaReveal key={img.id ?? idx} className={`${styles.imageWrapper} ${styles.fullBleed}`}>
                  <Image
                    src={img.mediaItemUrl}
                    alt={img.title ?? 'Visuel projet'}
                    width={1400}
                    height={900}
                    className={styles.image}
                  />
                </MediaReveal>
              ))}

              {/* Blocs flexibles médias */}
              {flexMediaBlocks.map((b, i) => {
                if (isVideo(b) && b.providerUrl) {
                  const file = getDirectVideoUrl(b.providerUrl);
                  if (file) {
                    return (
                      <MediaReveal key={`vm-${i}`} className={`${styles.videoAspect} ${styles.fullBleed}`}>
                        <video
                          src={file}
                          poster={b.poster?.node?.mediaItemUrl ?? undefined}
                          autoPlay={!isMobile && !!b.autoplay}
                          muted
                          loop={!!b.loop}
                          controls={isMobile || !!b.controls}
                          playsInline
                          preload="metadata"
                        />
                      </MediaReveal>
                    );
                  }
                  const autoplay = !isMobile && !!b.autoplay;
                  const id = getYouTubeId(b.providerUrl);
                  const src = id
                    ? `https://www.youtube.com/embed/${id}${autoplay
                      ? `?autoplay=1&mute=1&playsinline=1&controls=${b.controls ? 1 : 0}&loop=${b.loop ? 1 : 0}&playlist=${id}`
                      : `?playsinline=1&controls=${b.controls ? 1 : 0}`
                    }`
                    : toEmbedUrl(b.providerUrl) ?? b.providerUrl;

                  return (
                    <MediaReveal key={`vm-${i}`} className={`${styles.videoAspect} ${styles.fullBleed}`}>
                      <iframe src={src} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" loading="lazy" />
                    </MediaReveal>
                  );
                }

                if (isImage(b) && b.image?.node?.mediaItemUrl) {
                  const n = b.image.node;
                  return (
                    <MediaReveal key={`im-${i}`} className={`${styles.imageWrapper} ${styles.fullBleed}`}>
                      <Image src={n.mediaItemUrl} alt={n.title ?? ''} width={1400} height={900} className={styles.image} />
                      {'caption' in b && b.caption ? <figcaption>{b.caption}</figcaption> : null}
                    </MediaReveal>
                  );
                }

                if (isGallery(b) && b.images?.nodes?.length) {
                  return (
                    <MediaReveal key={`ga-${i}`} className={`${styles.blockGallery} ${styles.fullBleed}`}>
                      {b.images.nodes.map((img, k) =>
                        img?.mediaItemUrl ? (
                          <Image key={img.id ?? k} src={img.mediaItemUrl} alt={img.title ?? ''} width={800} height={600} />
                        ) : null
                      )}
                    </MediaReveal>
                  );
                }
                return null;
              })}
            </div>

            {/* === Colonne infos === */}
            <aside className={styles.detailsColumn}>
              <div className={styles.dockScrim} aria-hidden />
              <div
                className={[
                  styles.detailsSticky,
                  panelOpen ? styles.isOpen : styles.isClosed,
                ].join(' ')}
                id={dockId}
                aria-hidden={!panelOpen}
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
