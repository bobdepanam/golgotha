'use client';

// Visuel unique de la page produit (Simple : product/MediaStage.tsx) : remplit le panneau
// (object-fit: cover), placeholder de flou, image prioritaire. Vidéo : lecture muette en boucle.
import styles from '@/styles/simple/SimpleProduct.module.scss';
import Image from 'next/image';
import type { StageMedia } from './types';

type Props = { media: StageMedia; title: string; blurDataURL?: string | null; poster?: string | null };

export function MediaStage({ media, title, blurDataURL, poster }: Props) {
  return (
    <div className={styles.stage}>
      {media.type === 'video' ? (
        <video
          src={media.url}
          poster={media.poster ?? poster ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={title}
          className={styles.videoFill}
        />
      ) : media.type === 'image' ? (
        <Image
          src={media.url}
          alt={media.alt || title}
          fill
          priority
          sizes="(max-width: 767px) 100vw, 55vw"
          style={{ objectFit: 'cover' }}
          placeholder={blurDataURL ? 'blur' : 'empty'}
          blurDataURL={blurDataURL ?? undefined}
        />
      ) : null}
    </div>
  );
}
