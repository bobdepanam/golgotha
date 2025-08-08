'use client';

import styles from '@/styles/projects/ProjectPlayer.module.scss';

type Props = {
  tracks?: string[]; // tableau d’URLs mp3
};

export default function ProjectPlayer({ tracks }: Props) {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;

  return (
    <section className={styles.player}>
      <h2 className={styles.title}>Écouter</h2>
      <div className={styles.trackList}>
        {tracks.map((src, i) => (
          <div key={i} className={styles.track}>
            <audio controls preload="none">
              <source src={src} type="audio/mpeg" />
              Votre navigateur ne supporte pas l’élément audio.
            </audio>
          </div>
        ))}
      </div>
    </section>
  );
}
