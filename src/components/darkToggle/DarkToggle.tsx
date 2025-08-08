'use client'

import { useTheme } from '@/context/ThemeContext'
import SwitchDark from '@/icons/Switch_dark.svg'
import SwitchWhite from '@/icons/Switch_white.svg'
import styles from '@/styles/components/DarkToggle.module.scss'
import { AnimatePresence, motion } from 'framer-motion'
import type { FC } from 'react'

const DarkToggle: FC = () => {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <button
            onClick={toggleTheme}
            className={styles.toggle}
            aria-label="Toggle dark mode"
            type="button"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={isDark ? 'dark' : 'light'}
                    initial={{ opacity: 0, rotate: 0, scale: 0.9 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 0, scale: 0.9 }}
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                >
                    {isDark ? <SwitchDark /> : <SwitchWhite />}
                </motion.div>
            </AnimatePresence>
        </button>
    )
}

export default DarkToggle
