'use client';

// Écoute les navigations internes de SIMPLE (grille ↔ fiche) et les confie à la transition
// interne (simpleMorph.ts) : liens (dont « Open » du Contextual Widget et le Back
// mutualisé), précédent / suivant du navigateur. Monté par app/simple/layout.tsx : persiste
// entre /simple et /simple/[slug]. Écoute en phase de capture sur document, après Interlude
// (window) qui ignore ces paires (interludeConfig.internalPairs) : aucune double animation.

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { isSimpleInternal, runSimpleMorph } from './simpleMorph';

export default function SimpleTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  // Chemin rendu : au moment de popstate, Next n'a pas encore rendu la nouvelle page
  const lastPath = useRef(pathname);
  useEffect(() => {
    lastPath.current = pathname;
  }, [pathname]);

  useEffect(() => {

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const to = new URL(a.href, window.location.href);
      if (to.origin !== window.location.origin) return;
      const from = window.location.pathname;
      if (!isSimpleInternal(from, to.pathname)) return;
      const href = to.pathname + to.search + to.hash;
      const direction = to.pathname === '/simple' ? 'back' : 'forward';
      if (runSimpleMorph({ to: to.pathname, direction, navigate: () => router.push(href) })) e.preventDefault();
    };

    // Précédent / suivant : le navigateur a déjà changé l'URL, Next rend la page ensuite
    const onPop = () => {
      const to = window.location.pathname;
      const from = lastPath.current;
      if (!isSimpleInternal(from, to)) return;
      runSimpleMorph({ to, direction: to === '/simple' ? 'back' : 'forward' });
    };

    document.addEventListener('click', onClick, { capture: true });
    window.addEventListener('popstate', onPop);
    return () => {
      document.removeEventListener('click', onClick, { capture: true });
      window.removeEventListener('popstate', onPop);
    };
  }, [router]);

  return null;
}
