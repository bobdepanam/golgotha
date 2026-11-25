'use client';

// Point du header : signature graphique placée juste avant le repère de localisation,
// et retour au catalogue /projects (BSTRDZ 7.0.5 : l'intro `/` n'est plus relancée).
// Navigation et transitions existantes (lien Next intercepté par Interlude). Sur /projects
// filtré (?cat=), le clic réinitialise le filtre sur place (comme le filtre All).
// Hover desktop : le cercle devient un carré (CSS). Absent sur la landing et OPEN WORLD.

import styles from '@/styles/components/Header.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';

export default function HomeLink() {
  const pathname = usePathname() || '/';
  const current = pathname === '/projects';

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!current || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (window.location.search || window.location.hash) window.history.replaceState(null, '', '/projects');
  };

  return (
    <Link
      href="/projects"
      className={styles.home}
      aria-label="Retour aux projets"
      aria-current={current ? 'page' : undefined}
      data-cursor="hover"
      onClick={onClick}
    >
      <span className={styles.dot} aria-hidden />
    </Link>
  );
}
