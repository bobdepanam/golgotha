'use client';

// Lecteur audio commun (pages projet et Bibliothéca), rendu dans la vue INFO du widget SiteDock.
// Un seul élément <audio> par lecteur, aucun autoplay (sauf reprise explicite : précédent /
// suivant pendant une lecture). Une seule lecture simultanée sur la page.
// - `active` faux (widget fermé) : pause et retour au début ; INFO ↔ MENU ne démonte pas le lecteur.
// - Nouvelle source : la lecture précédente s'arrête.
// - Démontage (sortie de route) : arrêt et libération de la source.
// - Erreur de chargement : les commandes disparaissent (jamais de lecteur cassé).

import styles from '@/styles/components/AudioPlayer.module.scss';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';

type Props = {
  /** Source MP3 ; rien n'est rendu si elle est absente */
  src: string | null | undefined;
  /** Titre de la piste (accessibilité) */
  title: string;
  /** Widget ouvert : à la fermeture, la lecture s'arrête (pas de reprise automatique). */
  active: boolean;
  /** Reprendre la lecture au chargement d'une nouvelle source (précédent / suivant pendant la lecture) */
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

/** Volume réglable : souris fine et volume réellement modifiable (iOS l'ignore). */
function canSetVolume() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return false;
  const probe = document.createElement('audio');
  probe.volume = 0.5;
  return probe.volume === 0.5;
}

export default function AudioPlayer({
  src,
  title,
  active,
  resumeOnLoad = false,
  onPrev,
  onNext,
  onPlayingChange,
  className,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [failed, setFailed] = useState(false);
  const [volumeControl, setVolumeControl] = useState(false);
  const notify = useRef(onPlayingChange);
  notify.current = onPlayingChange;

  const hasAudio = !!src && !failed;

  useEffect(() => setVolumeControl(canSetVolume()), []);

  // Nouvelle source : l'ancienne lecture s'arrête, la nouvelle est préparée sans autoplay.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setTime(0);
    setDuration(0);
    setFailed(false);
    if (src) {
      audio.src = src;
      audio.load();
      if (resumeOnLoad) void audio.play().catch(() => {});
    } else {
      audio.removeAttribute('src');
      audio.load();
    }
    // `resumeOnLoad` n'est lu qu'au changement de source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Fermeture du widget : arrêt de la lecture.
  useEffect(() => {
    if (active) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    if (audio.currentSrc) audio.currentTime = 0;
  }, [active]);

  // Démontage : arrêt et libération de la source (aucun audio résiduel).
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (!audio) return;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, []);

  // Événements de l'élément audio (source de vérité de l'état de lecture).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => {
      // Une seule lecture simultanée : les autres pistes de la page se mettent en pause.
      document.querySelectorAll('audio').forEach((a) => {
        if (a !== audio && !a.paused) a.pause();
      });
      setPlaying(true);
      notify.current?.(audio.getAttribute('src'));
    };
    const onPause = () => {
      setPlaying(false);
      notify.current?.(null);
    };
    const onTime = () => setTime(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => {
      audio.currentTime = 0;
      setTime(0);
    };
    const onError = () => {
      if (!audio.getAttribute('src')) return;
      setFailed(true);
      onPause();
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onMeta);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio || !hasAudio) return;
    if (audio.paused) void audio.play().catch(() => setFailed(true));
    else audio.pause();
  };

  const seek = (e: ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setTime(t);
  };

  const changeVolume = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
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

      {/* Unique élément audio du lecteur (toujours monté : la source survit à INFO ↔ MENU) */}
      <audio ref={audioRef} preload="metadata" />
    </>
  );
}
