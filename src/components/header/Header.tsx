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
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path
                  d="M6.28 5.22a.75.75 0 0 0-1.06 1.06l7.22 7.22H6.75a.75.75 0 0 0 0 1.5h7.5a.747.747 0 0 0 .75-.75v-7.5a.75.75 0 0 0-1.5 0v5.69L6.28 5.22Z"
                  fill="currentColor"
                />
              </svg>
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
