'use client';

// Contenu audio de Bibliothéca, rendu dans la vue INFO du widget SiteDock (portail) :
// cover + lecteur commun (AudioPlayer). L'enveloppe (panneau, ouverture / fermeture, Échap,
// focus, responsive) est celle du widget. Aucun autoplay à la sélection.
// La cover et les commandes correspondent toujours au même projet (`entry`).
// Entrée sans audio : cover seule.

import AudioPlayer from '@/components/audio/AudioPlayer';
import styles from '@/styles/components/ArchiveAudio.module.scss';
import Image from 'next/image';
import type { ArchiveEntry } from './ArchiveList';

type Props = {
  entry: ArchiveEntry;
  /** Widget ouvert : à la fermeture, la lecture s'arrête (pas de reprise automatique). */
  active: boolean;
  /** Piste précédente / suivante (absentes s'il n'y en a pas) ; `resume` : la lecture était en cours */
  onPrev?: (resume: boolean) => void;
  onNext?: (resume: boolean) => void;
  /** Source en cours de lecture (null à l'arrêt) : repère dans la liste */
  onPlayingChange: (src: string | null) => void;
  /** Reprendre la lecture au chargement de la nouvelle entrée (précédent / suivant pendant la lecture) */
  resumeOnLoad: boolean;
};

export default function ArchiveAudio({ entry, active, onPrev, onNext, onPlayingChange, resumeOnLoad }: Props) {
  return (
    <div className={styles.audio} role="group" aria-label={entry.title}>
      <div className={styles.cover}>
        {entry.cover && (
          <Image key={entry.slug} src={entry.cover} alt="" fill sizes="280px" className={styles.coverImage} />
        )}
      </div>

      <AudioPlayer
        src={entry.audio}
        title={entry.title}
        active={active}
        resumeOnLoad={resumeOnLoad}
        onPrev={onPrev}
        onNext={onNext}
        onPlayingChange={onPlayingChange}
      />
    </div>
  );
}
