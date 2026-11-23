'use client';

/**
 * Moteur de transitions de pages (adaptation Next.js App Router de
 * codrops/interlude, MIT — voir src/lib/interlude/LICENSE).
 *
 * - Intercepte, en phase de capture, les clics sur les liens internes
 *   (next/link compris : il ignore un clic déjà `defaultPrevented`).
 * - Couvre la page (`leave`), navigue avec `router.push` (une seule entrée
 *   d'historique), attend la nouvelle route et les images du haut de page,
 *   puis révèle (`enter`).
 * - Précédent / suivant du navigateur : la transition est rejouée à l'envers ;
 *   l'ancienne page est copiée de façon synchrone, avant le rendu de Next.
 * - Mouvement réduit, routes protégées (/experiment), erreurs : navigation
 *   simple, jamais de page laissée couverte.
 */

import { DEV_STORAGE_KEY, interludeConfig, isBypassed } from '@/lib/interlude/config';
import { prefersReducedMotion } from '@/lib/interlude/helpers';
import { mediaReady } from '@/lib/interlude/media';
import { loadedTransition, loadTransition, TRANSITIONS } from '@/lib/interlude/registry';
import type { Direction, Transition, TransitionContext } from '@/lib/interlude/types';
import styles from '@/styles/components/Interlude.module.scss';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';

type State = 'idle' | 'leaving' | 'covered' | 'entering';
type NavigateOptions = { trigger?: Element; transition?: string };
type Nav = {
  kind: 'push' | 'pop';
  href: string;
  from: URL;
  to: URL;
  name: string;
  direction: Direction;
  trigger?: Element;
};

const DEV = process.env.NODE_ENV === 'development';

/** Comparateur de transitions : chargé uniquement en développement (absent du build de production). */
const DevPanel = DEV ? dynamic(() => import('./InterludeDevPanel'), { ssr: false }) : () => null;

const InterludeContext = createContext<{ navigate: (href: string, options?: NavigateOptions) => void } | null>(null);

/** Navigation programmatique avec transition (repli : router.push). */
export function useInterlude() {
  const ctx = useContext(InterludeContext);
  const router = useRouter();
  return ctx ?? { navigate: (href: string) => router.push(href) };
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const isAnimation = (v: unknown): v is gsap.core.Animation =>
  !!v && typeof (v as gsap.core.Animation).kill === 'function' && typeof (v as gsap.core.Animation).then === 'function';
const SCROLL_KEYS = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']);
const pathKey = (url: URL) => url.pathname;

function devTransition(): string | null {
  if (!DEV) return null;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('transition');
    if (fromUrl) window.localStorage.setItem(DEV_STORAGE_KEY, fromUrl);
    return window.localStorage.getItem(DEV_STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function InterludeProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname() || '/';

  const layerRef = useRef<HTMLDivElement | null>(null);
  const state = useRef<State>('idle');
  const run = useRef(0);
  const playing = useRef<gsap.core.Animation | null>(null);
  const pathRef = useRef(pathname);
  const waiters = useRef<Array<{ path: string; resolve: () => void }>>([]);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const locked = useRef<Element[]>([]);
  const savedStyles = useRef<Map<HTMLElement, string | null>>(new Map());
  const scrollGuard = useRef<AbortController | null>(null);
  // Historique (chemins) pour savoir si un popstate va en arrière ou en avant.
  const stack = useRef<string[]>([]);
  const index = useRef(0);
  const popping = useRef(false);
  // Démarrage en attente (chargement du module de transition) : bloque un second clic.
  const pendingStart = useRef(0);
  const startGen = useRef(0);
  const busy = useCallback(() => state.current !== 'idle' || pendingStart.current !== 0, []);

  /* ---------- Route affichée : réveille les attentes, tient l'historique à jour ---------- */
  useEffect(() => {
    pathRef.current = pathname;
    if (stack.current.length === 0) {
      stack.current = [pathname];
      index.current = 0;
    } else if (popping.current) {
      popping.current = false;
    } else if (stack.current[index.current] !== pathname) {
      stack.current = [...stack.current.slice(0, index.current + 1), pathname];
      index.current = stack.current.length - 1;
    }
    const pending = waiters.current;
    waiters.current = pending.filter((w) => {
      if (w.path !== pathname) return true;
      w.resolve();
      return false;
    });
  }, [pathname]);

  const waitForRoute = useCallback((path: string) => {
    return new Promise<void>((resolve) => {
      if (pathRef.current === path) return resolve();
      const waiter = { path, resolve };
      waiters.current.push(waiter);
      // Délai dépassé : on révèle quand même, et l'attente est retirée de la liste.
      setTimeout(() => {
        waiters.current = waiters.current.filter((w) => w !== waiter);
        resolve();
      }, interludeConfig.routeTimeout);
    });
  }, []);

  /* ---------- Choix de la transition ---------- */
  const pick = useCallback((from: string, to: string, trigger?: Element, explicit?: string) => {
    if (prefersReducedMotion()) return 'none';
    if (isBypassed(from) || isBypassed(to)) return 'none';
    const fromLink = trigger?.closest('[data-transition]')?.getAttribute('data-transition');
    const name = explicit || fromLink || devTransition() || interludeConfig.defaultTransition;
    if (name === 'none') return 'none';
    return name in TRANSITIONS ? name : interludeConfig.defaultTransition;
  }, []);

  /* ---------- Verrouillage de la page pendant une transition ---------- */
  const setState = useCallback((next: State, cover?: 'solid' | 'custom') => {
    state.current = next;
    const root = layerRef.current;
    if (!root) return;
    root.dataset.state = next;
    if (cover) root.dataset.cover = cover;
    else delete root.dataset.cover;
    if (next === 'idle') document.documentElement.removeAttribute('data-interlude');
    else document.documentElement.setAttribute('data-interlude', next);
  }, []);

  const lock = useCallback(() => {
    for (const el of [document.querySelector('body > header'), document.getElementById('pageContent')]) {
      if (el && !el.hasAttribute('inert')) {
        el.setAttribute('inert', '');
        locked.current.push(el);
      }
    }
    // Molette, glisser tactile et touches de défilement : retenus (Lenis compris).
    scrollGuard.current?.abort();
    const guard = new AbortController();
    scrollGuard.current = guard;
    const hold = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    const holdKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey && !e.altKey && SCROLL_KEYS.has(e.key)) hold(e);
    };
    const opts = { capture: true, passive: false, signal: guard.signal } as const;
    window.addEventListener('wheel', hold, opts);
    window.addEventListener('touchmove', hold, opts);
    window.addEventListener('keydown', holdKey, opts);
  }, []);

  const unlock = useCallback(() => {
    for (const el of locked.current) el.removeAttribute('inert');
    locked.current = [];
    scrollGuard.current?.abort();
    scrollGuard.current = null;
  }, []);

  /** Styles inline des blocs de page avant la transition (certaines déplacent la page réelle). */
  const saveStyles = useCallback(() => {
    savedStyles.current.clear();
    const content = document.getElementById('pageContent');
    for (const el of [content, ...Array.from(document.body.children)]) {
      if (el instanceof HTMLElement && el !== layerRef.current) savedStyles.current.set(el, el.getAttribute('style'));
    }
  }, []);

  const restoreStyles = useCallback(() => {
    for (const [el, style] of savedStyles.current) {
      if (!el.isConnected || el.getAttribute('style') === style) continue;
      if (style === null) el.removeAttribute('style');
      else el.setAttribute('style', style);
    }
    savedStyles.current.clear();
  }, []);

  /** Retour à l'état normal : couche vidée, page déverrouillée, focus sur le contenu. */
  const finish = useCallback(
    (focus: boolean) => {
      playing.current?.kill();
      playing.current = null;
      const root = layerRef.current;
      if (root) root.replaceChildren();
      restoreStyles();
      unlock();
      setState('idle');
      if (focus) {
        const content = document.getElementById('pageContent');
        if (content) {
          if (!content.hasAttribute('tabindex')) content.setAttribute('tabindex', '-1');
          content.focus({ preventScroll: true });
        }
      }
    },
    [restoreStyles, setState, unlock]
  );

  const makeContext = useCallback(
    (nav: Nav): TransitionContext => {
      const trigger = nav.trigger;
      let origin = pointer.current ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      if (!pointer.current && trigger) {
        const box = trigger.getBoundingClientRect();
        origin = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      }
      pointer.current = null;
      return {
        root: layerRef.current as HTMLElement,
        content: (document.getElementById('pageContent') ?? document.body) as HTMLElement,
        transition: nav.name,
        from: nav.from,
        to: nav.to,
        direction: nav.direction,
        trigger,
        origin,
        reducedMotion: false,
        initial: false,
        entrance: false,
      };
    },
    []
  );

  /**
   * Une navigation complète. `begin` (couverture) s'exécute de façon synchrone
   * jusqu'au premier `await` : indispensable au retour arrière, où Next affiche
   * la nouvelle page juste après l'événement popstate.
   */
  const perform = useCallback(
    async (nav: Nav, transition: Transition) => {
      const id = ++run.current;
      const root = layerRef.current;
      let navigated = nav.kind === 'pop';
      const go = () => {
        if (!navigated) {
          navigated = true;
          router.push(nav.href);
        }
      };
      if (!root) return go();

      const context = makeContext(nav);
      try {
        // --- Couvrir ---
        saveStyles();
        lock();
        setState('leaving');
        root.dataset.transition = transition.name;
        root.dataset.direction = nav.direction;
        const leaving = transition.leave(context);
        if (isAnimation(leaving)) playing.current = leaving;
        await leaving;
        if (id !== run.current) return;
        setState('covered', transition.solidCover === false ? 'custom' : 'solid');

        // --- Naviguer, attendre la nouvelle route ---
        go();
        await waitForRoute(pathKey(nav.to));
        if (id !== run.current) return;
        document.dispatchEvent(new Event('interlude:after-swap'));
        await nextFrame();
        await nextFrame();
        if (id !== run.current) return;

        context.content = (document.getElementById('pageContent') ?? document.body) as HTMLElement;
        transition.prepare?.(context);
        await mediaReady(context.content, { timeout: interludeConfig.mediaTimeout });
        if (id !== run.current) return;

        // --- Révéler ---
        setState('entering');
        const entering = transition.enter(context);
        if (isAnimation(entering)) playing.current = entering;
        await entering;
        if (id !== run.current) return;
        finish(true);
      } catch (error) {
        console.error('[interlude] transition interrompue', error);
        go(); // la navigation a toujours lieu
        if (id === run.current) finish(false);
      }
    },
    [finish, lock, makeContext, router, saveStyles, setState, waitForRoute]
  );

  /** Lance une navigation (clic ou programmatique). Renvoie false si elle doit rester simple. */
  const start = useCallback(
    (href: string, trigger?: Element, explicit?: string) => {
      const to = new URL(href, window.location.href);
      const from = new URL(window.location.href);
      if (to.origin !== from.origin || to.pathname === from.pathname) return false;
      const name = pick(from.pathname, to.pathname, trigger, explicit);
      if (name === 'none') return false;
      const nav: Nav = {
        kind: 'push',
        href: to.pathname + to.search + to.hash,
        from,
        to,
        name,
        direction: 'forward',
        trigger,
      };
      const gen = ++startGen.current;
      pendingStart.current = gen;
      void loadTransition(name)
        .then((t) => t ?? loadTransition(interludeConfig.defaultTransition))
        .then((t) => {
          if (startGen.current !== gen) return; // annulé (retour navigateur entre-temps)
          pendingStart.current = 0;
          if (t) return perform(nav, t);
          router.push(nav.href);
        });
      return true;
    },
    [perform, pick, router]
  );

  const navigate = useCallback(
    (href: string, options?: NavigateOptions) => {
      if (busy()) return; // pas de double transition
      if (!start(href, options?.trigger, options?.transition)) router.push(href);
    },
    [busy, router, start]
  );

  /* ---------- Écouteurs globaux ---------- */
  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;

    // Préchargement de la transition par défaut (et de celle choisie en dev).
    void loadTransition(interludeConfig.defaultTransition);
    const dev = devTransition();
    if (dev) void loadTransition(dev);

    const onPointerDown = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const to = new URL(a.href, window.location.href);
      if (to.origin !== window.location.origin || to.pathname === window.location.pathname) return;
      if (busy()) {
        e.preventDefault(); // une transition est en cours ou démarre : pas de seconde navigation
        return;
      }
      if (start(a.href, a)) e.preventDefault();
    };

    const onPopState = (e: PopStateEvent) => {
      const toPath = window.location.pathname;
      const fromPath = pathRef.current;
      if (toPath === fromPath) return; // ancre ou paramètres : même page
      popping.current = true;

      // Sens : comparé à l'historique connu.
      let direction: Direction = 'back';
      if (stack.current[index.current + 1] === toPath) {
        direction = 'forward';
        index.current += 1;
      } else if (stack.current[index.current - 1] === toPath) {
        index.current -= 1;
      } else {
        stack.current = [toPath];
        index.current = 0;
      }

      // Un démarrage en attente est annulé ; la navigation du navigateur prime.
      if (pendingStart.current) {
        startGen.current += 1;
        pendingStart.current = 0;
      }
      // Une transition en cours est arrêtée net ; la navigation du navigateur prime.
      if (state.current !== 'idle') {
        run.current += 1;
        finish(false);
        return;
      }
      // Balayage « retour » natif (mobile) déjà animé par le navigateur.
      if ((e as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition) return;

      const name = pick(fromPath, toPath);
      const transition = name === 'none' ? null : loadedTransition(name);
      if (!transition) return; // non chargée : pas d'attente, navigation simple
      const from = new URL(window.location.href);
      from.pathname = fromPath;
      void perform(
        { kind: 'pop', href: toPath, from, to: new URL(window.location.href), name, direction },
        transition
      );
    };

    window.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true, signal });
    window.addEventListener('click', onClick, { capture: true, signal });
    window.addEventListener('popstate', onPopState, { capture: true, signal });
    return () => {
      ac.abort();
      run.current += 1;
      finish(false);
    };
  }, [busy, finish, perform, pick, start]);

  const value = useMemo(() => ({ navigate }), [navigate]);

  return (
    <InterludeContext.Provider value={value}>
      {children}
      <div
        ref={layerRef}
        className={styles.layer}
        data-state="idle"
        aria-hidden="true"
        data-lenis-prevent=""
        data-interlude-skip=""
      />
      <DevPanel />
    </InterludeContext.Provider>
  );
}
