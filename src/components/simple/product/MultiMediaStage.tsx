// Pile de médias plein écran (Simple : MultiMediaStage + secondaires de photo/[slug]/page.tsx) :
// chaque média occupe une hauteur d'écran, défilement interne avec accroche légère.
import styles from '@/styles/simple/SimpleProduct.module.scss';
import type { StageMedia } from './types';

export function MultiMediaStage({ media, title }: { media: StageMedia[]; title: string }) {
  return (
    <>
      {media.map((m, i) => {
        const label = `${title} — view ${i + 1} of ${media.length}`;
        if (m.type === 'video') {
          return (
            <video
              key={m.url}
              src={m.url}
              poster={m.poster ?? undefined}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={label}
              className={styles.multiMedia}
            />
          );
        }
        if (m.type === 'embed') {
          return (
            <iframe
              key={m.url}
              src={m.url}
              title={label}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              loading="lazy"
              className={styles.multiMedia}
            />
          );
        }
        return (
          // eslint-disable-next-line @next/next/no-img-element -- ratio naturel inconnu à l'avance (Simple, MultiMediaStage)
          <img key={m.url} src={m.url} alt={m.alt || label} loading={i === 0 ? 'eager' : 'lazy'} className={styles.multiMedia} />
        );
      })}
    </>
  );
}
