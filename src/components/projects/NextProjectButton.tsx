'use client';

// Création suivante (7.1) — bas centre, sur la rangée du SiteDock et de la bascule de thème.
// Au repos : un chevron vers le bas ; survol / focus : la capsule s'étend et « Next » apparaît
// (même grammaire que le Back). Vrai lien (clic molette, clavier, lecteurs d'écran) vers la
// création suivante de la séquence d'origine (Projects filtré, Bibliothéca, Open World), sinon
// de l'ordre général ; boucle en fin de séquence ; masqué s'il n'y a qu'une création.
// Transition `rise` (Interlude) : seul le contenu glisse, les contrôles restent immobiles. Les
// clics répétés sont absorbés (Interlude bloque pendant la transition, bouton désactivé ici).
// Le moteur audio global n'est jamais touché : la lecture en cours continue.

import { BodyPortal } from '@/components/simple/BodyPortal';
import { nextInSequence } from '@/lib/navigation/projectSequence';
import styles from '@/styles/components/NextProjectButton.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NextProjectButton({ slug, catalog }: { slug: string; catalog: string[] }) {
  const pathname = usePathname();
  const [next, setNext] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Séquence lue côté client (session) ; recalculée à chaque création affichée
  useEffect(() => {
    setNext(nextInSequence(slug, catalog));
    setBusy(false);
  }, [slug, catalog, pathname]);

  // Présence signalée sur <html> : réserve de place pour la capsule du SiteDock (pas de
  // chevauchement au centre)
  useEffect(() => {
    if (!next) return;
    const root = document.documentElement;
    root.setAttribute('data-next-project', '');
    return () => root.removeAttribute('data-next-project');
  }, [next]);

  if (!next) return null;

  return (
    <BodyPortal>
      <Link
        href={`/projects/${next}`}
        className={styles.next}
        data-transition="rise"
        data-busy={busy || undefined}
        aria-label="Création suivante"
        aria-disabled={busy || undefined}
        data-cursor="hover"
        onClick={(e) => {
          if (busy) {
            e.preventDefault();
            return;
          }
          setBusy(true);
        }}
      >
        <svg className={styles.chevron} width="12" height="7" viewBox="0 0 12 7" aria-hidden="true">
          <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={styles.label} aria-hidden="true">
          Next
        </span>
      </Link>
    </BodyPortal>
  );
}
