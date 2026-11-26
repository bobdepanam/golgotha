'use client';

// Média du Contextual Widget (7.1) — un seul emplacement, adapté à la nature de la création :
// - image : visuel réel, ratio d'origine (lu au chargement) ;
// - vidéo : la vraie vidéo, muette, inline, en boucle, poster pendant le chargement, ratio
//   d'origine ; lecture seulement widget ouvert (pause à la fermeture), libérée au
//   changement de sélection (remontage par `key`). Autoplay refusé : bouton Lecture ;
//   erreur : message explicite (jamais un poster figé qui masquerait l'échec).
// Muette par défaut : n'interfère jamais avec le moteur audio global.

import styles from '@/styles/components/ContextWidget.module.scss';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type Props = {
  image?: { src: string; alt?: string } | null;
  video?: { src: string; poster?: string | null } | null;
  /** Widget ouvert (panneau visible) */
  active: boolean;
};

const DEFAULT_RATIO = 4 / 3;

export default function WidgetMedia({ image, video, active }: Props) {
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  if (video) return <WidgetVideo key={video.src} src={video.src} poster={video.poster ?? image?.src ?? null} active={active} />;
  if (!image) return null;
  return (
    <div className={styles.image} style={{ aspectRatio: String(ratio) }}>
      <Image
        key={image.src}
        src={image.src}
        alt={image.alt ?? ''}
        fill
        sizes="300px"
        className={styles.imageInner}
        style={{ objectFit: 'contain' }}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) setRatio(Math.max(0.5, Math.min(2.4, img.naturalWidth / img.naturalHeight)));
        }}
      />
    </div>
  );
}

function WidgetVideo({ src, poster, active }: { src: string; poster: string | null; active: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [ratio, setRatio] = useState(16 / 9);
  const [state, setState] = useState<'loading' | 'playing' | 'blocked' | 'error'>('loading');

  // Ouvert : lecture (muette) ; fermé : pause
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!active) {
      v.pause();
      return;
    }
    v.play().then(
      () => setState('playing'),
      // Autoplay refusé : bouton Lecture (une erreur de chargement reste signalée comme telle)
      () => setState((s) => (s === 'error' ? s : 'blocked'))
    );
  }, [active]);

  // Démontage (changement de sélection, fermeture définitive) : arrêt et libération
  useEffect(() => {
    const v = ref.current;
    return () => {
      if (!v) return;
      v.pause();
      v.removeAttribute('src');
      v.load();
    };
  }, []);

  const playManually = () => {
    const v = ref.current;
    if (!v) return;
    v.play().then(() => setState('playing'), () => setState('blocked'));
  };

  return (
    <div className={styles.image} style={{ aspectRatio: String(ratio) }} data-state={state}>
      <video
        ref={ref}
        className={styles.video}
        src={src}
        poster={poster ?? undefined}
        muted
        loop
        playsInline
        autoPlay={active}
        preload="metadata"
        aria-label="Aperçu vidéo"
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          if (v.videoWidth && v.videoHeight) setRatio(Math.max(0.5, Math.min(2.4, v.videoWidth / v.videoHeight)));
        }}
        onPlaying={() => setState('playing')}
        onError={() => setState('error')}
      />
      {state === 'blocked' && (
        <button type="button" className={styles.videoPlay} onClick={playManually} aria-label="Lire l'aperçu vidéo">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </button>
      )}
      {state === 'error' && <p className={styles.videoError}>Vidéo indisponible</p>}
    </div>
  );
}
