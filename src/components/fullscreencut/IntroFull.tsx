'use client';

import styles from '@/styles/components/IntroFull.module.scss';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import React, { useRef } from 'react';
// Optionnel : décommente si tu utilises le SCSS module ci-dessous

type VideoSource = {
    src: string;
    type?: string;   // e.g. "video/mp4"
    poster?: string; // éventuel poster de la vidéo
};

type IntroAProps = {
    children: React.ReactNode;
    /** Image de fond (utilise Next/Image). Ignorée si `video` est fourni. */
    backgroundImage?: string;
    /** Vidéo de fond (prioritaire sur l'image si défini). */
    video?: VideoSource;
    /** Intensité du parallax en %, par défaut 10 */
    parallax?: number;
    /** ClipPath CSS facultatif */
    clipPath?: string;
    /** Classes additionnelles sur le conteneur */
    className?: string;
    /** Pass-through pour Next/Image */
    priority?: boolean;
};

export default function IntroFull({
    children,
    backgroundImage = '/images/archive/Reverso.jpg',
    video,
    parallax = 10,
    clipPath = 'polygon(0% 0, 100% 0%, 100% 100%, 0 100%)',
    className = '',
    priority = false,
}: IntroAProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start'],
    });

    const y = useTransform(
        scrollYProgress,
        [0, 1],
        [`-${parallax}%`, `${parallax}%`]
    );

    return (
        <div
            ref={containerRef}
            className={`${styles.container} ${className}`}
            style={{ clipPath }}
        >
            {/* Layer contenu */}
            <div className="relative z-10 p-20 mix-blend-difference text-white w-full h-full flex flex-col justify-between">
                {children}
            </div>

            {/* Layer background */}
            <div className={styles.backdrop} aria-hidden>
                <motion.div style={{ y }} className="relative w-full h-full">
                    {video ? (
                        <motion.video
                            className={styles.media}
                            src={video.src}
                            poster={video.poster}
                            muted
                            loop
                            autoPlay
                            playsInline
                            preload="metadata"
                        >
                            {video.type && <source src={video.src} type={video.type} />}
                        </motion.video>
                    ) : (
                        <Image
                            className={styles.media}
                            src={backgroundImage}
                            alt="background image"
                            fill
                            priority={priority}
                            sizes="100vw"
                            style={{ objectFit: 'cover' }}
                        />
                    )}
                </motion.div>
            </div>
        </div>
    );

}
