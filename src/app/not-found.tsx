// src/app/not-found.tsx
import styles from "@/styles/pages/ErrorPage.module.scss";
import Link from "next/link";

/**
 * Choisir le fond :
 *  - kind: "image" | "video" | "none"
 *  - src: chemin public (ex: /images/intro/intro_8.webp ou /images/video/current.mp4)
 */
const BG = {
    kind: "image" as "image" | "video" | "none",
    src: "/images/img/jump.png",
    poster: "/images/img/jump.png", // utile si vidéo
    loop: true,
    muted: true,
};

export default function NotFound() {
    return (
        <main className={styles.wrap}>
            {/* Background layer */}
            {BG.kind !== "none" && (
                <div className={styles.bg} aria-hidden="true">
                    {BG.kind === "image" ? (
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
                <h1 className={styles.title}>404 — SORRY</h1>
                <p className={styles.text}>
                    Le lien a changé ou n’existe plus. Retournez à l’accueil ou explorez nos projets.
                </p>

                <div className={styles.actions}>
                    <Link href="/" className={styles.link}>
                        Accueil
                    </Link>
                    <Link href="/projects" className={styles.link}>
                        Projets
                    </Link>
                </div>
            </div>
        </main>
    );
}
