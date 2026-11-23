'use client';

import Breadcrumb from '@/components/beadcrumb/Breadcrumb';
import ProjectsRoundLink from '@/components/header/ProjectsRoundLink';
import styles from '@/styles/components/Header.module.scss';

// Navigation principale : widget SiteDock (INFO / MENU).
// Le header ne garde qu'une indication de localisation (Breadcrumb) et le rond
// central, lien permanent vers /projects.
export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Gauche : localisation */}
        <div className={styles.left}>
          <Breadcrumb />
        </div>

        {/* Centre : rond → /projects */}
        <div className={styles.center}>
          <div className={styles.toggleWrapper}>
            <ProjectsRoundLink />
          </div>
        </div>

        {/* Droite : vide (garde le rond centré) */}
        <div className={styles.right} />
      </div>
    </header>
  );
}
