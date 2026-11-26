'use client';

// Contextual Widget (BSTRDZ 7.0.7b) — source de vérité unique du contenu contextuel affiché
// (projet Golgotha, produit Simple, entrée de Bibliothéca…), indépendante du SiteDock.
//
// Les pages / composants « publient » un contenu, puis le retirent à leur démontage (retract) :
// aucun contenu ne survit à un changement de route, aucune fuite d'un projet à l'autre.
// États : masqué (aucun contenu) · replié (capsule) · ouvert (panneau).
// Fermeture : `collapse` (le contenu reste, en capsule) ou `dismiss` (contenu retiré, onClose).
// Actions et état sont dans deux contextes séparés : publier ne provoque pas de boucle.

import { createContext, type PropsWithChildren, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type ContextAudio = {
  src: string;
  title: string;
  /** Piste précédente / suivante (Bibliothéca) ; `resume` : la lecture était en cours */
  onPrev?: (resume: boolean) => void;
  onNext?: (resume: boolean) => void;
  onPlayingChange?: (src: string | null) => void;
  resumeOnLoad?: boolean;
};

export type ContextContent = {
  /** Identifiant stable (ex. `projects:<slug>`, `simple:<slug>`) */
  key: string;
  title: string;
  /** Univers (Golgotha / Simple) */
  universe?: string | null;
  /** Pièce de collection (Simple) */
  heroTag?: boolean;
  /** Ligne « catégorie · date » */
  meta?: string | null;
  image?: { src: string; alt?: string } | null;
  /** Aperçu vidéo réel (7.1) : remplace l'image dans le widget ; muet, en boucle, poster au chargement */
  video?: { src: string; poster?: string | null } | null;
  tagline?: string | null;
  /** Texte court */
  summary?: string | null;
  /** Texte long : HTML produit au build depuis le Markdown (contenu de confiance) */
  bodyHtml?: string | null;
  specs?: { label: string; value: string }[];
  /** Liens : `thumb` = vignette optionnelle (ex. Instagram sur TALK) ; `mailto:` / `tel:`
   *  s'ouvrent sur place, les autres dans un nouvel onglet. */
  links?: { label: string; url: string; thumb?: string | null }[];
  audio?: ContextAudio | null;
  /** CTA vers la page de détail */
  href?: string | null;
  ctaLabel?: string;
  /** Valeurs provisoires affichées (développement uniquement) */
  provisional?: boolean;
  closeMode?: 'collapse' | 'dismiss';
  onClose?: () => void;
};

type PublishOptions = { open?: boolean; focus?: boolean };

type State = { content: ContextContent | null; isOpen: boolean; focusRequest: number };

type Actions = {
  publish: (content: ContextContent, options?: PublishOptions) => void;
  /** Retire le contenu s'il est encore celui de `key` (démontage, fin de focus…) */
  retract: (key: string) => void;
  open: () => void;
  /** Fermeture selon `closeMode` du contenu */
  close: () => void;
};

const StateContext = createContext<State | null>(null);
const ActionsContext = createContext<Actions | null>(null);

export function ContextWidgetProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<State>({ content: null, isOpen: false, focusRequest: 0 });
  const contentRef = useRef<ContextContent | null>(null);
  contentRef.current = state.content;

  const publish = useCallback((content: ContextContent, options: PublishOptions = {}) => {
    setState((s) => ({
      content,
      isOpen: options.open ?? (s.content?.key === content.key ? s.isOpen : false),
      focusRequest: options.focus ? s.focusRequest + 1 : s.focusRequest,
    }));
  }, []);

  const retract = useCallback((key: string) => {
    setState((s) => (s.content?.key === key ? { ...s, content: null, isOpen: false } : s));
  }, []);

  const open = useCallback(() => setState((s) => (s.content ? { ...s, isOpen: true } : s)), []);

  const close = useCallback(() => {
    const current = contentRef.current;
    if (!current) return;
    if (current.closeMode === 'dismiss') {
      setState((s) => ({ ...s, content: null, isOpen: false }));
      current.onClose?.();
    } else {
      setState((s) => ({ ...s, isOpen: false }));
      current.onClose?.();
    }
  }, []);

  const actions = useMemo(() => ({ publish, retract, open, close }), [publish, retract, open, close]);

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}

export function useContextWidget(): Actions {
  const a = useContext(ActionsContext);
  if (!a) throw new Error('useContextWidget : hors de ContextWidgetProvider');
  return a;
}

export function useContextWidgetState(): State {
  const s = useContext(StateContext);
  if (!s) throw new Error('useContextWidgetState : hors de ContextWidgetProvider');
  return s;
}

/**
 * Ouverture par défaut à l'arrivée sur une page (7.0.1) : ouvert sur desktop, replié sur
 * petit écran pour préserver l'immersion du visuel (le widget reste ouvrable d'un tap).
 * Même seuil que le reste de l'interface mobile (767 px).
 */
export function openOnArrival(): boolean {
  return typeof window === 'undefined' || !window.matchMedia('(max-width: 767px)').matches;
}
