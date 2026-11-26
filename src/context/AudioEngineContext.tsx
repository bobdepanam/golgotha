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
  /** Fin NATURELLE de la piste (jamais une pause manuelle) : « Keep listening » (7.1) */
  ended: boolean;
  time: number;
  duration: number;
  /** Échec de chargement de la piste chargée */
  failed: boolean;
};

/** Piste du catalogue éligible à la découverte (publiée ; brouillons en développement) */
export type CatalogTrack = { src: string; title: string; origin: string | null };

type Actions = {
  /** Charge (si besoin) et lit `src` ; même piste déjà chargée : reprise sans redémarrage */
  play: (src: string, title: string, origin?: string | null) => void;
  pause: () => void;
  /** Lecture / pause de la piste chargée */
  toggle: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  /**
   * Découverte (7.1) : lance une autre piste du catalogue, au hasard, jamais la précédente ni
   * une piste déjà entendue dans la session (cycle recommencé une fois tout écouté). Sans autre
   * piste disponible : rejoue la piste terminée. Aucune navigation.
   */
  next: () => void;
  /** Une autre piste que la piste chargée est disponible (« Keep listening » / « Listen again ») */
  hasOther: boolean;
};

const CatalogCtx = createContext<CatalogTrack[]>([]);

/** Pistes éligibles, fournies par le layout serveur (petite table, pas les données de projet). */
export function AudioCatalogProvider({ tracks, children }: PropsWithChildren<{ tracks: CatalogTrack[] }>) {
  return <CatalogCtx.Provider value={tracks}>{children}</CatalogCtx.Provider>;
}

const INITIAL: AudioState = { src: null, title: null, origin: null, playing: false, ended: false, time: 0, duration: 0, failed: false };
const StateCtx = createContext<AudioState>(INITIAL);
const ActionsCtx = createContext<Actions | null>(null);

export function AudioEngineProvider({ children }: PropsWithChildren) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>(INITIAL);
  const tracks = useContext(CatalogCtx);
  // Pistes entendues pendant la session (aucune répétition avant d'avoir tout parcouru)
  const heard = useRef<Set<string>>(new Set());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const set = (p: Partial<AudioState>) => setState((s) => ({ ...s, ...p }));
    const onPlay = () => {
      set({ playing: true, ended: false });
      const src = a.getAttribute('src');
      if (src) heard.current.add(src);
    };
    const onPause = () => set({ playing: false });
    const onTime = () => set({ time: a.currentTime });
    const onMeta = () => set({ duration: Number.isFinite(a.duration) ? a.duration : 0 });
    // Fin NATURELLE de piste : retour au début, à l'arrêt, état « ended » (aucun enchaînement
    // automatique : la suite se propose dans le SiteDock). Une pause manuelle ne passe jamais ici.
    const onEnded = () => {
      a.currentTime = 0;
      set({ playing: false, ended: true, time: 0 });
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
          setState({ src, title, origin, playing: false, ended: false, time: 0, duration: 0, failed: false });
        } else {
          setState((s) => ({ ...s, title, origin: origin ?? s.origin, ended: false, failed: false }));
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
      next: () => {},
      hasOther: false,
    }),
    []
  );

  // Découverte : dépend du catalogue et de la piste courante (lus au moment du clic)
  const hasOther = tracks.some((t) => t.src !== state.src);
  const next = useMemo(
    () => () => {
      const current = stateRef.current;
      const others = tracks.filter((t) => t.src !== current.src);
      if (!others.length) {
        if (current.src && current.title) actions.play(current.src, current.title, current.origin);
        return;
      }
      let pool = others.filter((t) => !heard.current.has(t.src));
      if (!pool.length) {
        // Tout a été entendu : nouveau cycle (sans la piste qui vient de se terminer)
        heard.current = new Set(current.src ? [current.src] : []);
        pool = others;
      }
      const pick = pool[Math.floor(Math.random() * pool.length)];
      actions.play(pick.src, pick.title, pick.origin);
    },
    [tracks, actions]
  );
  const value = useMemo(() => ({ ...actions, next, hasOther }), [actions, next, hasOther]);

  return (
    <ActionsCtx.Provider value={value}>
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

