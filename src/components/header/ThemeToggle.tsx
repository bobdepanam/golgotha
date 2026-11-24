'use client';

// Bascule de thème (haut droite) : pictogramme géométrique minimal (cercle à moitié
// plein, pivoté selon le thème — rendu piloté par la classe de <html>, sans écart
// d'hydratation). Réutilise ThemeProvider (persistance du choix explicite).

import { useTheme } from '@/context/ThemeContext';
import styles from '@/styles/components/Header.module.scss';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const label = !mounted ? 'Changer de thème' : theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre';

  return (
    <button type="button" className={styles.theme} onClick={toggleTheme} aria-label={label} data-cursor="hover">
      <span className={styles.themeMark} aria-hidden />
    </button>
  );
}
