'use client';

// Moteur audio global de BSTRDZ (7.1) — UN seul élément <audio> pour tout le site, monté dans
// le layout : la lecture continue entre les pages, à l'ouverture / fermeture des widgets et au
// survol. Les lecteurs visibles (AudioPlayer : Contextual Widget, fiche Simple) et la commande
// du SiteDock n'en sont que des vues synchronisées. Aucun préchargement : une piste n'est
// chargée qu'au moment de sa lecture. Aucune autre source audio concurrente (les aperçus vidéo
// restent muets).
import { type PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type AudioState = {
  /** Piste chargée (null : aucune) */
  src: string | null;
  title: string | null;
  /** Page d'origine de la piste (retour depuis le SiteDock) */
  origin: string | null;
  playing: boolean;
  time: number;
  duration: number;
  /** Échec de chargement de la piste chargée */
  failed: boolean;
};

type Actions = {
  /** Charge (si besoin) et lit `src` ; même piste déjà chargée : reprise sans redémarrage */
  play: (src: string, title: string, origin?: string | null) => void;
  pause: () => void;
  /** Lecture / pause de la piste chargée */
  toggle: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
};

const INITIAL: AudioState = { src: null, title: null, origin: null, playing: false, time: 0, duration: 0, failed: false };
const StateCtx = createContext<AudioState>(INITIAL);
const ActionsCtx = createContext<Actions | null>(null);

export function AudioEngineProvider({ children }: PropsWithChildren) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>(INITIAL);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const set = (p: Partial<AudioState>) => setState((s) => ({ ...s, ...p }));
    const onPlay = () => set({ playing: true });
    const onPause = () => set({ playing: false });
    const onTime = () => set({ time: a.currentTime });
    const onMeta = () => set({ duration: Number.isFinite(a.duration) ? a.duration : 0 });
    // Fin de piste : retour au début, à l'arrêt (aucun enchaînement automatique)
    const onEnded = () => {
      a.currentTime = 0;
      set({ playing: false, time: 0 });
    };
    const onError = () => {
      if (a.getAttribute('src')) set({ failed: true, playing: false });
    };
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('durationchange', onMeta);
    a.addEventListener('ended', onEnded);
    a.addEventListener('error', onError);
    return () => {
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('durationchange', onMeta);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('error', onError);
    };
  }, []);

  const actions = useMemo<Actions>(
    () => ({
      play: (src, title, origin = null) => {
        const a = audioRef.current;
        if (!a) return;
        if (a.getAttribute('src') !== src) {
          a.pause();
          a.src = src;
          a.load();
          setState({ src, title, origin, playing: false, time: 0, duration: 0, failed: false });
        } else {
          setState((s) => ({ ...s, title, origin: origin ?? s.origin, failed: false }));
        }
        void a.play().catch(() => setState((s) => ({ ...s, playing: false })));
      },
      pause: () => audioRef.current?.pause(),
      toggle: () => {
        const a = audioRef.current;
        if (!a || !a.getAttribute('src')) return;
        if (a.paused) void a.play().catch(() => setState((s) => ({ ...s, playing: false })));
        else a.pause();
      },
      seek: (t) => {
        const a = audioRef.current;
        if (!a || !a.getAttribute('src')) return;
        a.currentTime = t;
        setState((s) => ({ ...s, time: t }));
      },
      setVolume: (v) => {
        if (audioRef.current) audioRef.current.volume = v;
      },
    }),
    []
  );

  return (
    <ActionsCtx.Provider value={actions}>
      <StateCtx.Provider value={state}>
        {children}
        {/* Seul élément audio du site ; aucune source tant qu'aucune lecture n'est demandée */}
        <audio ref={audioRef} preload="none" hidden />
      </StateCtx.Provider>
    </ActionsCtx.Provider>
  );
}

export function useAudioEngine(): Actions {
  const ctx = useContext(ActionsCtx);
  if (!ctx) throw new Error('useAudioEngine : hors de AudioEngineProvider');
  return ctx;
}

export function useAudioState(): AudioState {
  return useContext(StateCtx);
}

/** Lit le volume réglable (souris fine et volume réellement modifiable : iOS l'ignore). */
export function canSetVolume() {
  if (typeof window === 'undefined' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return false;
  const probe = document.createElement('audio');
  probe.volume = 0.5;
  return probe.volume === 0.5;
}

