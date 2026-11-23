'use client';

// Point blanc central du header : retour au catalogue (/projects).
// Même visuel que l'ancien DarkToggle (styles et icônes réutilisés) ; absent sur
// la homepage immersive et sur /experiment.
// Sur /projects : aucune navigation inutile ; avec un filtre `?cat=`, le clic le
// réinitialise sur place (replaceState, comme le filtre All : pas d'entrée d'historique).

import { isOpenWorldRoute } from '@/config/navigation';
import { useTheme } from '@/context/ThemeContext';
import SwitchDark from '@/icons/Switch_dark.svg';
import SwitchWhite from '@/icons/Switch_white.svg';
import styles from '@/styles/components/DarkToggle.module.scss';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';

const MotionLink = motion.create(Link);

export default function ProjectsRoundLink() {
  const pathname = usePathname() || '/';
  const { theme } = useTheme();
  const prefersReduced = useReducedMotion();

  // Absent sur la homepage immersive et sur OPEN WORLD (navigation propre : bouton Back).
  if (pathname === '/' || isOpenWorldRoute(pathname)) return null;

  const current = pathname === '/projects';

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!current || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (window.location.search || window.location.hash) {
      window.history.replaceState(null, '', '/projects');
    }
  };

  return (
    <MotionLink
      href="/projects"
      className={styles.toggle}
      aria-label="Retour aux projets"
      aria-current={current ? 'page' : undefined}
      data-cursor="hover"
      onClick={onClick}
      whileHover={prefersReduced ? undefined : { scale: 1.04 }}
      whileTap={prefersReduced ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.12 }}
    >
      <span className={styles.iconSlot} aria-hidden>
        <span className={styles.icon}>{theme === 'dark' ? <SwitchDark /> : <SwitchWhite />}</span>
      </span>
    </MotionLink>
  );
}
