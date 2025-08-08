'use client'

import { translate } from '@/scripts/anim'
import styles from '@/styles/components/IntroReveal.module.scss'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const images = [
    '/images/intro/intro_1.webp',
    '/images/intro/intro_2.webp',
    '/images/intro/intro_3.webp',
    '/images/intro/intro_4.webp',
    '/images/intro/intro_5.webp',
    '/images/intro/intro_6.webp',
    '/images/intro/intro_7.webp',
    '/images/intro/intro_8.webp',
    '/images/intro/intro_9.webp',
    '/images/intro/intro_10.webp',
    '/images/intro/intro_11.webp',
    '/images/intro/intro_12.webp',
]

type IntroRevealProps = {
    onComplete: () => void
}

export default function IntroReveal({ onComplete }: IntroRevealProps) {
    const [index, setIndex] = useState(0)
    const [phase, setPhase] = useState<'images' | 'text' | 'slide'>('images')

    useEffect(() => {
        if (phase === 'images') {
            if (index < images.length - 1) {
                const timer = setTimeout(() => setIndex(i => i + 1), 300)
                return () => clearTimeout(timer)
            } else {
                const showText = setTimeout(() => setPhase('text'), 500)
                return () => clearTimeout(showText)
            }
        }

        if (phase === 'text') {
            const startSlide = setTimeout(() => setPhase('slide'), 1200)
            return () => clearTimeout(startSlide)
        }

        if (phase === 'slide') {
            const revealHome = setTimeout(() => onComplete(), 1200)
            return () => clearTimeout(revealHome)
        }
    }, [index, phase, onComplete])

    return (
        <AnimatePresence>
            {phase !== 'slide' && (
                <motion.div
                    className={styles.introWrapper}
                    variants={translate}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                    custom={[0, 0]} // slide-up à la fin
                >
                    {phase === 'images' && (
                        <motion.img
                            key={index}
                            src={images[index]}
                            alt="Intro"
                            className={styles.introImage}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        />
                    )}

                    {phase === 'text' && (
                        <motion.h1
                            key="text"
                            className={styles.introText}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                        >
                            {'{ Cave }'}
                        </motion.h1>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
