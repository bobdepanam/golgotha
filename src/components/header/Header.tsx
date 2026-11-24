'use client';

import Breadcrumb from '@/components/beadcrumb/Breadcrumb';
import HomeLink from '@/components/header/HomeLink';
import ThemeToggle from '@/components/header/ThemeToggle';
import { showsGlobalUI } from '@/config/navigation';
import styles from '@/styles/components/Header.module.scss';
import { usePathname } from 'next/navigation';

// Header : deux ancrages seulement, le centre reste aux créations.
// - Haut gauche : point (retour à l'accueil) + repère de localisation ;
// - Haut droite : bascule de thème.
// Navigation principale : widget SiteDock (bas gauche) ; cube Open World : bas droite.
export default function Header() {
  const pathname = usePathname() || '/';
  const globalUI = showsGlobalUI(pathname);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          {globalUI && <HomeLink />}
          <Breadcrumb />
        </div>

        <div className={styles.right}>{globalUI && <ThemeToggle />}</div>
      </div>
    </header>
  );
}
