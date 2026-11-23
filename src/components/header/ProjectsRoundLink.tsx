'use client';

// Rond central du header : lien permanent vers /projects (remplace l'ancien
// changement de thème). Même visuel que l'ancien DarkToggle (styles et icônes
// réutilisés) ; absent sur la homepage immersive.

import { useTheme } from '@/context/ThemeContext';
import SwitchDark from '@/icons/Switch_dark.svg';
import SwitchWhite from '@/icons/Switch_white.svg';
import styles from '@/styles/components/DarkToggle.module.scss';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MotionLink = motion.create(Link);

export default function ProjectsRoundLink() {
  const pathname = usePathname() || '/';
  const { theme } = useTheme();
  const prefersReduced = useReducedMotion();

  if (pathname === '/') return null;

  const current = pathname === '/projects';

  return (
    <MotionLink
      href="/projects"
      className={styles.toggle}
      aria-label="Projets — Γολγοθᾶ[ς]"
      aria-current={current ? 'page' : undefined}
      title="Γολγοθᾶ[ς]"
      data-cursor="hover"
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
