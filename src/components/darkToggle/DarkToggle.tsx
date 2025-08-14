'use client';

import { useTheme } from '@/context/ThemeContext';
import SwitchDark from '@/icons/Switch_dark.svg';
import SwitchWhite from '@/icons/Switch_white.svg';
import styles from '@/styles/components/DarkToggle.module.scss';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { FC } from 'react';

const DarkToggle: FC = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const prefersReduced = useReducedMotion();

    const initial = { opacity: 0, y: prefersReduced ? 0 : 6, scale: prefersReduced ? 1 : 0.92 };
    const animate = { opacity: 1, y: 0, scale: 1 };
    const exit = { opacity: 0, y: prefersReduced ? 0 : -6, scale: prefersReduced ? 1 : 0.92 };
    const tx = prefersReduced ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' as const };

    return (
        <motion.button
            onClick={toggleTheme}
            className={styles.toggle}
            aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            aria-pressed={isDark}
            title={isDark ? 'Light mode' : 'Dark mode'}
            type="button"
            whileHover={prefersReduced ? undefined : { scale: 1.04 }}
            whileTap={prefersReduced ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.12 }}
        >
            {/* Halo éphémère */}
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={isDark ? 'halo-dark' : 'halo-light'}
                    className={styles.halo}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 0.18, scale: 1.2 }}
                    exit={{ opacity: 0, scale: 1.35 }}
                    transition={prefersReduced ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
                    aria-hidden
                />
            </AnimatePresence>

            {/* Icône */}
            <span className={styles.iconSlot} aria-hidden>
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={isDark ? 'icon-dark' : 'icon-light'}
                        className={styles.icon}
                        initial={initial}
                        animate={animate}
                        exit={exit}
                        transition={tx}
                    >
                        {isDark ? <SwitchDark /> : <SwitchWhite />}
                    </motion.span>
                </AnimatePresence>
            </span>
        </motion.button>
    );
};

export default DarkToggle;
