"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
    src: string;                     // mp4/webm/ogg (H.264 + AAC conseillé)
    poster?: string;
    className?: string;
    autoFullscreenOnTap?: boolean;   // iOS plein écran au tap
    controls?: boolean;              // défaut true (facile à débug)
    loop?: boolean;                  // défaut true
    muted?: boolean;                 // défaut true (requis pour autoplay)
    playsInline?: boolean;           // défaut true (requis iOS inline)
    preload?: "none" | "metadata" | "auto"; // défaut "metadata"
    crossOrigin?: "anonymous" | "use-credentials"; // si autre domaine + CORS
    style?: React.CSSProperties;
};

export default function SafeAutoplayVideo({
    src,
    poster,
    className,
    autoFullscreenOnTap = false,
    controls = true,
    loop = true,
    muted = true,
    playsInline = true,
    preload = "metadata",
    crossOrigin,
    style,
}: Props) {
    const ref = useRef<HTMLVideoElement | null>(null);
    const [needsGesture, setNeedsGesture] = useState(false);

    useEffect(() => {
        const v = ref.current;
        if (!v) return;

        // iOS hints
        // @ts-ignore
        v.setAttribute("webkit-playsinline", "true");
        // @ts-ignore
        v.setAttribute("x5-playsinline", "true");

        v.muted = muted; // important avant play

        const tryPlay = async () => {
            try {
                const p = v.play();
                if (p && typeof p.then === "function") await p;
                setNeedsGesture(false);
            } catch {
                setNeedsGesture(true); // bloqué → bouton overlay
            }
        };

        if (v.readyState >= 2) tryPlay();
        else v.addEventListener("canplay", tryPlay, { once: true });

        return () => v.removeEventListener("canplay", tryPlay);
    }, [src, muted]);

    // pause hors viewport
    useEffect(() => {
        const v = ref.current;
        if (!v || typeof IntersectionObserver === "undefined") return;
        const io = new IntersectionObserver(
            (entries) => {
                const e = entries[0];
                if (!e) return;
                if (e.isIntersecting) {
                    v.play().catch(() => setNeedsGesture(true));
                } else {
                    v.pause();
                }
            },
            { threshold: 0.25 }
        );
        io.observe(v);
        return () => io.disconnect();
    }, []);

    const onTap = async () => {
        const v = ref.current;
        if (!v) return;
        if (autoFullscreenOnTap) {
            // @ts-ignore
            if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
            else if (v.requestFullscreen) await v.requestFullscreen().catch(() => { });
        }
        try {
            v.muted = false;
            await v.play();
            setNeedsGesture(false);
        } catch { }
    };

    return (
        <div style={{ position: "relative" }}>
            <video
                ref={ref}
                src={src}
                poster={poster}
                loop={loop}
                muted={muted}
                playsInline={playsInline}
                // @ts-ignore
                webkit-playsinline="true"
                preload={preload}
                controls={controls}
                crossOrigin={crossOrigin}
                disablePictureInPicture
                controlsList="nodownload noplaybackrate"
                className={className}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", background: "#000", ...style }}
            />

            {needsGesture && (
                <button
                    type="button"
                    onClick={onTap}
                    aria-label="Lire la vidéo"
                    style={{
                        position: "absolute",
                        inset: 0,
                        margin: "auto",
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                    }}
                >
                    ▶
                </button>
            )}
        </div>
    );
}
