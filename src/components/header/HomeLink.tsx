'use client';

// Point du header : signature graphique placée juste avant le repère de localisation,
// et retour à l'accueil (navigation et transitions existantes : lien Next intercepté
// par Interlude). Hover desktop : le cercle devient un carré (CSS, sans changement de
// dimensions du layout). Absent là où l'interface globale ne l'est pas (landing, OPEN WORLD).

import styles from '@/styles/components/Header.module.scss';
import Link from 'next/link';

export default function HomeLink() {
  return (
    <Link href="/" className={styles.home} aria-label="Retour à l'accueil" data-cursor="hover">
      <span className={styles.dot} aria-hidden />
    </Link>
  );
}
