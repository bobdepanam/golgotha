// src/app/error.tsx
'use client';

import styles from '@/styles/pages/ErrorPage.module.scss';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Choisir le fond :
 *  - kind: "image" | "video" | "none"
 *  - src: chemin public (ex: /images/intro/intro_8.webp ou /images/video/current.mp4)
 */
const BG = {
    kind: 'image' as 'image' | 'video' | 'none',
    src: '/images/intro/intro_8.webp',
    poster: '/images/intro/intro_8.webp', // utile si vidéo
    loop: true,
    muted: true,
};

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log côté client (remplaçable par Sentry, LogRocket, etc.)
        console.error('Erreur capturée:', error);
    }, [error]);

    return (
        <main className={styles.wrap}>
            {/* Background layer */}
            {BG.kind !== 'none' && (
                <div className={styles.bg} aria-hidden="true">
                    {BG.kind === 'image' ? (
                        <img className={styles.media} src={BG.src} alt="" />
                    ) : (
                        <video
                            className={styles.video}
                            src={BG.src}
                            poster={BG.poster}
                            autoPlay
                            loop={BG.loop}
                            muted={BG.muted}
                            playsInline
                        />
                    )}
                </div>
            )}

            {/* Card */}
            <div className={styles.card}>
                <h1 className={styles.title}>Oups — erreur interne</h1>
                <p className={styles.text}>
                    Quelque chose a mal tourné. Tu peux tenter de recharger la page ou revenir à l’accueil.
                </p>

                <div className={styles.actions}>
                    <button className={styles.btn} onClick={() => reset()}>
                        Recharger
                    </button>
                    <Link href="/" className={styles.link}>
                        Accueil
                    </Link>
                </div>
            </div>
        </main>
    );
}
