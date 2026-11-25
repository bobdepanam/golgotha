'use client';

// Bascule de thème (7.0.8 : coin bas droite, ancien emplacement du cube Open World) :
// pictogramme géométrique minimal (cercle à moitié plein, pivoté selon le thème — rendu
// piloté par la classe de <html>, sans écart d'hydratation). Réutilise ThemeProvider
// (persistance du choix explicite, sombre par défaut). Mêmes pages que l'interface globale.

import { showsGlobalUI } from '@/config/navigation';
import { useTheme } from '@/context/ThemeContext';
import styles from '@/styles/components/ThemeToggle.module.scss';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const pathname = usePathname() || '/';
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!showsGlobalUI(pathname)) return null;

  const label = !mounted ? 'Changer de thème' : theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre';

  return (
    <div className={styles.corner}>
      <button type="button" className={styles.theme} onClick={toggleTheme} aria-label={label} data-cursor="hover">
        <span className={styles.themeMark} aria-hidden />
      </button>
    </div>
  );
}
