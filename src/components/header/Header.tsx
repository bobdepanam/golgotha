'use client';

import Breadcrumb from '@/components/beadcrumb/Breadcrumb';
import DarkToggle from '@/components/darkToggle/DarkToggle';
import Nav from '@/components/nav/Nav';
import styles from '@/styles/components/Header.module.scss';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          {/* Left - Fil d’Ariane */}
          <div className={styles.left}>
            <Breadcrumb />
          </div>

          {/* Center - Toggle Dark/Light */}
          <div className={styles.center}>
            <div className={styles.toggleWrapper}>
              <DarkToggle />
            </div>
          </div>

          {/* Right - Bouton menu */}
          <div className={styles.right}>
            <button
  onClick={() => setIsMenuOpen(true)}
  className={styles.menuButton}
  aria-label="Open menu"
>
  ---
</button>

          </div>
        </div>
      </header>

      {/* Menu overlay animé */}
      <AnimatePresence mode="wait">
        {/* Après */}
{isMenuOpen && <Nav onClose={() => setIsMenuOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
