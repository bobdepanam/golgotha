'use client';

import { projectsViewState } from '@/components/projects/projectsViewState';
import BackControl from '@/components/ui/BackControl';
import NextProjectButton from '@/components/projects/NextProjectButton';
import { openOnArrival, useContextWidget } from '@/context/ContextWidgetContext';
import { projectContextContent } from '@/lib/content/projectContext';
import styles from '@/styles/projects/Slugpage.module.scss';
import ProjectMediaCarousel from '@/components/projects/ProjectMediaCarousel';
import { useAudioEngine } from '@/context/AudioEngineContext';
import { normalizeProjectMedia, toEmbedUrl, type ProjectMedia } from '@/lib/content/projectMedia';
import type { Project } from '@/types/project';
import Image from 'next/image';
import { type SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';

/* ---------- Hook mobile ---------- */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(ua));
  }, []);
  return isMobile;
}

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

/** Cadrage d'un média plein écran : `cover` (défaut) ou `contain` (desktop ; mobile toujours en cover). */
const fitClass = (b: { fit?: 'cover' | 'contain' | null }) => (b.fit === 'contain' ? styles.fitContain : '');

type Props = {
  project: Project;
  /** Ordre général du catalogue (repli de la navigation Next, 7.1) */
  catalog?: string[];
};

const NO_CATALOG: string[] = [];

export default function ProjectPageClientWrapper({ project, catalog = NO_CATALOG }: Props) {
  const isMobile = useIsMobile();
  const { publish, retract } = useContextWidget();
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Médias de la page, normalisés (V8.0.3) ; les informations (catégorie, texte, audio, liens)
  // sont dans le widget. 1 média : plein écran inchangé ; plusieurs : navigation horizontale.
  const media = useMemo(() => normalizeProjectMedia(project), [project]);
  const engine = useAudioEngine();
  const ytItem = media.find((m) => m.kind === 'legacy-youtube');
  const ytId = ytItem && ytItem.kind === 'legacy-youtube' ? ytItem.youtubeId : null;
  const ytSrc = ytId
    ? `https://www.youtube.com/embed/${ytId}?enablejsapi=1&playsinline=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&disablekb=1`
    : null;

  // Règle son (V8.0.5) : les vidéos sont muettes par défaut ; si le visiteur réactive le son
  // d'une vidéo, la bande-son globale se met en pause (jamais de superposition involontaire)
  const onVideoVolume = (e: SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (!v.muted && v.volume > 0 && !v.paused) engine.pause();
  };

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
    const iframe = iframeRef.current;
    return () => {
      if (!ytId) return;
      iframe?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
        '*'
      );
    };
  }, [ytId]);

  // Contextual Widget : informations du projet (ex-vue INFO du SiteDock), ouvertes à chaque arrivée.
  useEffect(() => {
    const content = projectContextContent(project);
    publish(content, { open: openOnArrival() }); // ouvert à l'arrivée (desktop), replié sur mobile
    return () => retract(content.key);
  }, [project, publish, retract]);

  /** Rendu d'un média (JSX d'origine, inchangé par type) ; `active` : média affiché. */
  function renderMedia(m: ProjectMedia, active: boolean) {
    switch (m.kind) {
      case 'legacy-youtube':
        return (
          <MediaReveal key={m.key} className={`${styles.ytwrap} ${playing ? styles.isPlaying : ''} ${styles.fullBleed} ${styles.screen}`}>
            <iframe
              ref={iframeRef}
              src={ytSrc ?? undefined}
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
        );
      case 'legacy-video':
        return (
          <MediaReveal key={m.key} className={`${styles.videoAspect} ${styles.fullBleed} ${styles.screen}`}>
            <video src={m.src} controls autoPlay={!isMobile && active} muted playsInline preload="metadata" onVolumeChange={onVideoVolume} />
          </MediaReveal>
        );
      case 'legacy-embed':
        return (
          <MediaReveal key={m.key} className={`${styles.videoAspect} ${styles.fullBleed} ${styles.screen}`}>
            <iframe
              src={m.url}
              title={`${project.title} — video`}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              loading="lazy"
            />
          </MediaReveal>
        );
      // Repli : vidéo indisponible (fichier manquant) → poster seul, sans lecteur vide
      case 'poster':
        return (
          <MediaReveal key={m.key} className={`${styles.imageWrapper} ${styles.fullBleed} ${styles.screen} ${fitClass(m)}`}>
            <Image src={m.src} alt={m.alt} fill sizes="100vw" className={styles.image} priority={active} />
          </MediaReveal>
        );
      case 'video':
        return (
          <MediaReveal key={m.key} className={`${styles.videoAspect} ${styles.fullBleed} ${styles.screen} ${fitClass(m)}`}>
            <video
              src={m.src}
              poster={m.poster ?? undefined}
              autoPlay={!isMobile && m.autoplay && active}
              muted
              loop={m.loop}
              controls={isMobile || m.controls}
              playsInline
              preload="metadata"
              onVolumeChange={onVideoVolume}
            />
          </MediaReveal>
        );
      case 'embed': {
        const autoplay = !isMobile && m.autoplay && active;
        const src = m.youtubeId
          ? `https://www.youtube.com/embed/${m.youtubeId}${autoplay
            ? `?autoplay=1&mute=1&playsinline=1&controls=${m.controls ? 1 : 0}&loop=${m.loop ? 1 : 0}&playlist=${m.youtubeId}`
            : `?playsinline=1&controls=${m.controls ? 1 : 0}`
          }`
          : toEmbedUrl(m.url) ?? m.url;
        return (
          <MediaReveal key={m.key} className={`${styles.videoAspect} ${styles.fullBleed} ${styles.screen}`}>
            <iframe src={src} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" loading="lazy" />
          </MediaReveal>
        );
      }
      case 'image':
        return (
          <MediaReveal key={m.key} className={`${styles.imageWrapper} ${styles.fullBleed} ${styles.screen} ${fitClass(m)}`}>
            <Image src={m.src} alt={m.alt} fill sizes="100vw" className={styles.image} priority={active} />
            {m.caption ? <p className={styles.caption}>{m.caption}</p> : null}
          </MediaReveal>
        );
    }
  }

  return (
    <>
      {/* Back mutualisé (7.0.10) : retour à la grille, filtre / mode / position conservés */}
      <BackControl href={projectsViewState.lastHref} onNavigate={() => (projectsViewState.restoreGrid = true)} />
      {/* Création suivante (7.1) : séquence d'origine, sinon ordre général */}
      <NextProjectButton slug={project.slug} catalog={catalog} />
      <div className={[styles.projectWrapper, styles.dockMode].join(' ')}>
          <div className={styles.grid}>
            {/* === Colonne médias === */}
            <div className={styles.mediaColumn}>
              {media.length > 1 ? (
                <ProjectMediaCarousel
                  count={media.length}
                  label={project.title}
                  renderSlide={(i, active) => renderMedia(media[i], active)}
                />
              ) : (
                media.map((m) => renderMedia(m, true))
              )}
            </div>

          </div>
        </div>
    </>
  );
}
