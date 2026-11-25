'use client';

// Carrousel des médias (Simple : mobile-grid/MobileMediaCarousel.tsx) : scroll-snap natif,
// pagination « n / total » lue sur la position de défilement.
import styles from '@/styles/simple/SimpleMobile.module.scss';
import Image from 'next/image';
import { type UIEvent, useCallback, useState } from 'react';
import type { StageMedia } from '../product/types';

export function MobileMediaCarousel({ media, title }: { media: StageMedia[]; title: string }) {
  const [active, setActive] = useState(0);
  const onScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive((p) => (p === i ? p : i));
  }, []);
  return (
    <>
      <div className={styles.carousel} onScroll={onScroll} tabIndex={0} aria-label="Project media" data-lenis-prevent="">
        {media.map((m, i) => {
          const label = i === 0 ? title : `${title} — view ${i + 1} of ${media.length}`;
          return (
            <div key={m.url} className={styles.slide}>
              {m.type === 'video' ? (
                <video src={m.url} poster={m.poster ?? undefined} autoPlay muted loop playsInline preload="metadata" aria-label={label} className={styles.videoMedia} />
              ) : m.type === 'embed' ? (
                <iframe src={m.url} title={label} loading="lazy" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" className={styles.videoMedia} />
              ) : (
                <Image src={m.url} alt={m.alt || label} fill sizes="100vw" style={{ objectFit: 'cover' }} className={styles.fadeImg} priority={i === 0} />
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.pagination} aria-hidden="true">
        {active + 1} / {media.length}
      </div>
    </>
  );
}
