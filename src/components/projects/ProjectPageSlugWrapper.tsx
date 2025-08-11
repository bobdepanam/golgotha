'use client';

import ProjectPlayer from '@/components/projects/ProjectPlayer';
import TextTransition from '@/components/transition/TextTransition';
import styles from '@/styles/projects/Slugpage.module.scss';
import type { Project } from '@/types/project';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

type Props = { project: Project };

/** YouTube ID depuis une URL (youtu.be / watch?v= / embed) */
function getYouTubeId(raw?: string | null): string | null {
  if (!raw) return null;
  const url = raw.trim();
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split(/[?&]/)[0] ?? null;
  if (url.includes('youtube.com/watch')) {
    const m = url.match(/[?&]v=([^&]+)/);
    return m ? m[1] : null;
  }
  if (url.startsWith('https://www.youtube.com/embed/')) {
    return url.split('/embed/')[1]?.split(/[?&]/)[0] ?? null;
  }
  return null;
}

/** Fallback embed (ex: Vimeo) */
function toEmbedUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const url = raw.trim();
  if (url.includes('vimeo.com/')) {
    const id = url.split('vimeo.com/')[1]?.split(/[?&]/)[0];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (
    url.startsWith('https://www.youtube.com/embed/') ||
    url.startsWith('https://player.vimeo.com/video/')
  ) return url;
  return null;
}

/** Détection d’un fichier vidéo direct (self-hosted) */
function getDirectVideoUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const url = raw.trim();
  // Extensions les plus courantes
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return url;
  // (Optionnel) .m3u8 -> HLS (nécessiterait hls.js sur Chrome/Firefox)
  // if (/\.m3u8(\?.*)?$/i.test(url)) return url;
  return null;
}

export default function ProjectPageClientWrapper({ project }: Props) {
  const [reveal, setReveal] = useState(true);
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const {
    subtitle,
    category,
    description,
    external_link,
    mainImage,
    gallery,
    playerAudio,
    videoFullscreen,
  } = project.projectFields ?? {};

  const media = [
    ...(mainImage?.node?.mediaItemUrl ? [{ ...mainImage.node, type: 'main' as const }] : []),
    ...(gallery?.nodes?.length ? gallery.nodes.map((img) => ({ ...img, type: 'gallery' as const })) : []),
  ];

  const ytId = useMemo(() => getYouTubeId(videoFullscreen), [videoFullscreen]);
  const directVideoUrl = useMemo(() => (!ytId ? getDirectVideoUrl(videoFullscreen) : null), [videoFullscreen, ytId]);
  const fallbackEmbed = useMemo(() => (!ytId && !directVideoUrl ? toEmbedUrl(videoFullscreen) : null), [videoFullscreen, ytId, directVideoUrl]);

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
          <header className={styles.header}>
            <h2 className={styles.title}>{project.title}</h2>
          </header>

          {/* --- PRIORITÉ D’AFFICHAGE --- */}
          {/* 1) YouTube déchromé + bouton Play custom */}
          {ytSrc && (
            <section className={styles.videoSection}>
              <div className={`${styles.ytwrap} ${playing ? styles.isPlaying : ''}`}>
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
              </div>
            </section>
          )}

          {/* 2) Vidéo self-hosted (WordPress Media) */}
          {!ytSrc && directVideoUrl && (
            <section className={styles.videoSection}>
              <div className={styles.videoAspect}>
                <video
                  src={directVideoUrl}
                  controls
                  playsInline
                  preload="metadata"
                // uncomment si tu veux autoplay silencieux :
                // muted
                // autoPlay
                // loop
                />
              </div>
            </section>
          )}

          {/* 3) Fallback autres embeds (ex: Vimeo) */}
          {!ytSrc && !directVideoUrl && fallbackEmbed && (
            <section className={styles.videoSection}>
              <div className={styles.videoAspect}>
                <iframe
                  src={fallbackEmbed}
                  title={`${project.title} — video`}
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </section>
          )}

          <section className={styles.projectSection}>
            <div className={styles.grid}>
              <div className={styles.imagesColumn}>
                {media.map((img, idx) => (
                  <div key={img.id ?? idx} className={styles.imageWrapper}>
                    <Image
                      src={img.mediaItemUrl}
                      alt={img.title ?? 'Visuel projet'}
                      width={1200}
                      height={819}
                      style={{ width: '100%', height: 'auto' }}
                      className={styles.image}
                    />
                  </div>
                ))}
              </div>

              <aside className={styles.detailsColumn}>
                <div className={styles.detailsSticky}>
                  {category && (
                    <div className={styles.detailLine}>
                      <span>Category</span>
                      <span>{category}</span>
                    </div>
                  )}
                  {subtitle && (
                    <div className={styles.detailLine}>
                      <span>Index</span>
                      <span>{subtitle}</span>
                    </div>
                  )}
                  {description && (
                    <div className={styles.description}>
                      <span>_</span>
                      <div dangerouslySetInnerHTML={{ __html: description }} />
                    </div>
                  )}
                  {playerAudio && (
                    <div className={styles.audioPlayers}>
                      <ProjectPlayer tracks={[playerAudio]} />
                    </div>
                  )}
                  {external_link && (
                    <a
                      href={external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.externalLink}
                      data-cursor="hover"
                    >
                      Back ↗
                    </a>
                  )}
                </div>
              </aside>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
