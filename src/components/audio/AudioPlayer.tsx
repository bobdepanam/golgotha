'use client';

// Lecteur audio commun (Contextual Widget, fiche Simple) — 7.1 : VUE du moteur audio global
// (AudioEngineContext, un seul <audio> pour tout le site). Mêmes commandes qu'avant.
// - La lecture continue entre les pages et à la fermeture du widget ; aucun autoplay (sauf
//   reprise explicite : précédent / suivant pendant une lecture).
// - Ce lecteur montre l'état réel de SA piste : si une autre piste joue, il reste à l'arrêt
//   jusqu'à ce qu'on le lance (la piste en cours s'arrête alors : une seule lecture à la fois).
// - Erreur de chargement : les commandes disparaissent (jamais de lecteur cassé).

import { canSetVolume, useAudioEngine, useAudioState } from '@/context/AudioEngineContext';
import styles from '@/styles/components/AudioPlayer.module.scss';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';

type Props = {
  /** Source MP3 ; rien n'est rendu si elle est absente */
  src: string | null | undefined;
  /** Titre de la piste (accessibilité, commande du SiteDock) */
  title: string;
  /** Page d'origine de la piste (lien du titre dans le SiteDock) */
  origin?: string | null;
  /** Conservé pour compatibilité : la fermeture du widget n'interrompt plus la lecture (7.1) */
  active?: boolean;
  /** Reprendre la lecture au changement de source (précédent / suivant pendant la lecture) */
  resumeOnLoad?: boolean;
  /** Piste précédente / suivante ; `resume` : la lecture était en cours */
  onPrev?: (resume: boolean) => void;
  onNext?: (resume: boolean) => void;
  /** Source en cours de lecture (null à l'arrêt) */
  onPlayingChange?: (src: string | null) => void;
  className?: string;
};

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

export default function AudioPlayer({ src, title, origin = null, resumeOnLoad = false, onPrev, onNext, onPlayingChange, className }: Props) {
  const engine = useAudioEngine();
  const audio = useAudioState();
  const [volume, setVolume] = useState(1);
  const [volumeControl, setVolumeControl] = useState(false);
  useEffect(() => setVolumeControl(canSetVolume()), []);

  // État de CETTE piste (vue) : progression réelle si elle est chargée, sinon à l'arrêt
  const mine = !!src && audio.src === src;
  const playing = mine && audio.playing;
  const time = mine ? audio.time : 0;
  const duration = mine ? audio.duration : 0;
  const failed = mine && audio.failed;
  const hasAudio = !!src && !failed;

  // Précédent / suivant pendant une lecture : la nouvelle piste prend le relais
  const prevSrc = useRef(src);
  useEffect(() => {
    if (prevSrc.current === src) return;
    prevSrc.current = src;
    if (src && resumeOnLoad) engine.play(src, title, origin);
    // `resumeOnLoad` n'est lu qu'au changement de source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Piste en cours de lecture signalée au parent (ex. repère de Bibliothéca)
  const notify = useRef(onPlayingChange);
  notify.current = onPlayingChange;
  useEffect(() => {
    notify.current?.(audio.playing ? audio.src : null);
  }, [audio.playing, audio.src]);

  const toggle = () => {
    if (!src || failed) return;
    if (playing) engine.pause();
    else engine.play(src, title, origin);
  };

  const seek = (e: ChangeEvent<HTMLInputElement>) => {
    if (mine) engine.seek(Number(e.target.value));
  };

  const changeVolume = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    engine.setVolume(v);
  };

  return (
    <>
      {hasAudio && (
        <div className={[styles.controls, className].filter(Boolean).join(' ')} role="group" aria-label={`Lecteur — ${title}`}>
          <input
            type="range"
            className={styles.timeline}
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(time, duration || 0)}
            onChange={seek}
            disabled={!duration}
            aria-label="Position de lecture"
            aria-valuetext={`${fmt(time)} sur ${fmt(duration)}`}
            style={{ ['--progress' as string]: duration ? `${(time / duration) * 100}%` : '0%' }}
          />
          <div className={styles.times} aria-hidden>
            <span>{fmt(time)}</span>
            <span>{fmt(duration)}</span>
          </div>

          <div className={styles.buttons}>
            {onPrev && (
              <button type="button" className={styles.btn} aria-label="Piste précédente" data-cursor="hover" onClick={() => onPrev(playing)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6h2v12H7zM20 6v12l-9-6z" fill="currentColor" /></svg>
              </button>
            )}
            <button
              type="button"
              className={`${styles.btn} ${styles.play}`}
              aria-label={playing ? 'Pause' : 'Lecture'}
              data-cursor="hover"
              onClick={toggle}
            >
              {playing ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
              )}
            </button>
            {onNext && (
              <button type="button" className={styles.btn} aria-label="Piste suivante" data-cursor="hover" onClick={() => onNext(playing)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6h2v12h-2zM4 6v12l9-6z" fill="currentColor" /></svg>
              </button>
            )}
            {volumeControl && (
              <input
                type="range"
                className={styles.volume}
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={changeVolume}
                aria-label="Volume"
                style={{ ['--progress' as string]: `${volume * 100}%` }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
