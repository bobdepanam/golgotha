'use client';

import Breadcrumb from '@/components/beadcrumb/Breadcrumb';
import ThemeToggle from '@/components/header/ThemeToggle';
import { isOpenWorldRoute, showsGlobalUI } from '@/config/navigation';
import styles from '@/styles/components/Header.module.scss';
import { usePathname } from 'next/navigation';

// Header (7.0.7a) : le centre et le haut gauche restent aux contenus (futur module INFO en
// haut à gauche, 7.0.7b). Haut droite : bascule Clair / Obscur. Le retour à /projects et
// l'univers actif sont portés par la capsule du SiteDock (bas gauche).
// OPEN WORLD garde son bouton Back (navigation propre, sans SiteDock).
export default function Header() {
  const pathname = usePathname() || '/';

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>{isOpenWorldRoute(pathname) && <Breadcrumb />}</div>
        <div className={styles.right}>{showsGlobalUI(pathname) && <ThemeToggle />}</div>
      </div>
    </header>
  );
}
