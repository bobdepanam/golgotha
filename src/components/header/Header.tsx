'use client';

import Breadcrumb from '@/components/beadcrumb/Breadcrumb';
import DarkToggle from '@/components/darkToggle/DarkToggle';
import Nav from '@/components/nav/Nav';
import styles from '@/styles/components/Header.module.scss';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 🔍 Vérifie si on est sur mobile (ex: < 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile(); // initial
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

          {/* Right - Actions de page + bouton menu */}
          <div className={styles.right}>
            <div id="header-actions" className={styles.actions} />

            <button
              className={styles.menuButton}
              aria-label="Open menu"
              onClick={() => isMobile && setIsMenuOpen(true)}       // ✅ CLIC sur mobile
              onMouseEnter={() => !isMobile && setIsMenuOpen(true)} // ✅ HOVER sur desktop
            >
              ☟
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {isMenuOpen && <Nav onClose={() => setIsMenuOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
