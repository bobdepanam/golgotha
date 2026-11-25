'use client';

import Breadcrumb from '@/components/beadcrumb/Breadcrumb';
import { isOpenWorldRoute } from '@/config/navigation';
import styles from '@/styles/components/Header.module.scss';
import { usePathname } from 'next/navigation';

// Header (7.0.8) : ne porte plus que le bouton Back d'OPEN WORLD (navigation propre, sans
// SiteDock). Haut droite : Contextual Widget ; bas droite : bascule Clair / Obscur ;
// bas gauche : SiteDock ; haut centre : sélecteurs Grille / Liste ; bas centre : filtres.
export default function Header() {
  const pathname = usePathname() || '/';

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>{isOpenWorldRoute(pathname) && <Breadcrumb />}</div>
      </div>
    </header>
  );
}
