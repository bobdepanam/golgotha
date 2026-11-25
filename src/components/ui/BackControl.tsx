'use client';

// Back mutualisé (7.0.10) — pages projet Golgotha et fiches produit Simple.
// Haut gauche, sur les marges du Design System. Desktop : un chevron « < » ; au survol ou
// au focus clavier, « Back » apparaît à droite (largeur, opacité, translation légères).
// Tactile : chevron + « Back » toujours visibles, zone de 44 px.
//
// C'est un vrai lien vers la collection (fonctionne aussi après une ouverture directe par
// URL, sans dépendre de history.back()) :
// - Golgotha → dernière URL de /projects (filtre ?cat= compris) ; le mode Grid / List et la
//   position sont restaurés par la page (projectsViewState) ;
// - Simple → /simple ; mode, filtre, position et focus sont restaurés par la galerie
//   (simpleViewState, memory) ; la navigation passe par la transition interne de Simple.
// Échap (option `escape`) : même retour, sauf si le focus clavier est dans un widget.

import { BodyPortal } from '@/components/simple/BodyPortal';
import styles from '@/styles/components/BackControl.module.scss';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

type Props = {
  href: string;
  /** Appelé juste avant la navigation (ex. demande de restauration de position) */
  onNavigate?: () => void;
  escape?: boolean;
  label?: string;
};

export default function BackControl({ href, onNavigate, escape = false, label = 'Back' }: Props) {
  const ref = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!escape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if ((document.activeElement as HTMLElement | null)?.closest?.('#site-dock-panel, #context-widget')) return;
      ref.current?.click(); // même chemin que le clic (transition comprise)
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [escape]);

  return (
    <BodyPortal>
      <Link ref={ref} href={href} className={styles.back} aria-label={label} data-cursor="hover" onClick={onNavigate}>
        <svg className={styles.chevron} width="7" height="12" viewBox="0 0 7 12" aria-hidden="true">
          <path d="M6 1 1 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={styles.label} aria-hidden="true">
          {label}
        </span>
      </Link>
    </BodyPortal>
  );
}
