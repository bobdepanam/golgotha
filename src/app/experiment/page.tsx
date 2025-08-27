"use client";

import InfiniteCollage, { type CollageItem } from "@/components/infinite/InfiniteCollage";
import InfinitePlane from "@/components/infinite/InfinitePlane";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ---------- Types & parsing frontmatter ---------- */

type MdItem = {
    id: string;
    title: string;
    type: "image" | "video";
    src?: string;          // images
    poster?: string;       // vidéos
    full?: string;         // vidéos
    categories?: string[];
    description?: string;
};
type MdData = { items: MdItem[] };

function parseFrontmatter(md: string): MdData {
    const start = md.indexOf("---");
    if (start !== 0) return { items: [] };
    const end = md.indexOf("---", 3);
    if (end === -1) return { items: [] };
    const yaml = md.slice(3, end).trim();
    const items: MdItem[] = [];
    const itemsBlockMatch = yaml.match(/items:\s*([\s\S]*)$/);
    if (!itemsBlockMatch) return { items: [] };
    const block = itemsBlockMatch[1];

    const rawEntries = block.split("\n").reduce<string[]>((acc, line) => {
        if (line.startsWith("  - ")) acc.push(line.replace("  - ", ""));
        else if (acc.length) acc[acc.length - 1] += "\n" + line.replace(/^ {4}/, "");
        return acc;
    }, []);

    for (const entry of rawEntries) {
        const o: any = {};
        entry.split("\n").forEach((l) => {
            const m = l.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
            if (!m) return;
            const k = m[1];
            let v = l.slice(m[0].length - m[2].length);
            v = v.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
            if (k === "categories") {
                const inner = v.replace(/^\[|\]$/g, "");
                o[k] = inner
                    .split(",")
                    .map((s) => s.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1"))
                    .filter(Boolean);
            } else if (["id", "title", "type", "src", "poster", "full", "description"].includes(k)) {
                o[k] = v;
            }
        });
        if (o.id && o.title && o.type && (o.src || o.poster || o.full)) {
            if (o.type !== "image" && o.type !== "video") o.type = "image";
            items.push(o as MdItem);
        }
    }
    return { items };
}

function hashStr(s: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
}

/* ---------- Page ---------- */

export default function Page() {
    const [collageItems, setCollageItems] = useState<CollageItem[]>([]);
    const [lightbox, setLightbox] = useState<{
        id: string;
        title?: string;
        type?: "image" | "video";
        fullSrc: string;
        description?: string;
    } | null>(null);

    // charge & mappe le MD (encodeURI pour espaces)
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/data/infinite-grid.md?ts=${Date.now()}`, { cache: "no-store" });
                const md = await res.text();
                const data = parseFrontmatter(md);

                const mapped: CollageItem[] = (data.items || []).map((it) => {
                    const label = it.categories?.length ? `${it.title} · ${it.categories.join(", ")}` : it.title;

                    if (it.type === "video") {
                        const poster = it.poster ? encodeURI(it.poster) : "/images/video/fallback.jpg";
                        const fullSrc = it.full ? encodeURI(it.full) : "";
                        return {
                            id: it.id,
                            title: label,
                            type: "video",
                            preview: poster,
                            fullSrc,
                            description: it.description,
                        };
                    }

                    const src = it.src ? encodeURI(it.src) : "/images/video/fallback.jpg";
                    return {
                        id: it.id,
                        title: label,
                        type: "image",
                        preview: src,
                        fullSrc: src,
                        description: it.description,
                    };
                });

                setCollageItems(mapped);
            } catch (e) {
                console.error("[experiment] failed to load md:", e);
            }
        })();
    }, []);

    // ESC pour fermer
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // dimension des tuiles (un peu compact)
    const tile = useMemo(() => {
        const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
        const vh = typeof window !== "undefined" ? window.innerHeight : 900;
        return { w: Math.round(vw * 1.4), h: Math.round(vh * 1.4) };
    }, []);

    const handleItemClick = useCallback((id: string) => {
        const item = collageItems.find((it) => it.id === id);
        if (item) {
            setLightbox({
                id: item.id,
                title: item.title,
                type: item.type,
                fullSrc: item.fullSrc,
                description: item.description,
            });
        }
    }, [collageItems]);

    return (
        <>
            <InfinitePlane
                tileWidth={tile.w}
                tileHeight={tile.h}
                wheelScale={1}
                padding={0}
                renderTile={(key) => (
                    <div style={{ position: "relative", width: tile.w, height: tile.h }}>
                        <InfiniteCollage
                            items={collageItems}
                            tileWidth={tile.w}
                            tileHeight={tile.h}
                            maxPerTile={18}
                            margin={24}
                            seed={hashStr(key)}
                            onItemClick={handleItemClick}
                        />
                    </div>
                )}
            />

            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        key="lb"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.9)",
                            backdropFilter: "blur(4px)",
                            zIndex: 9999,
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            style={{ position: "absolute", inset: 0 }}
                        >
                            {lightbox.type === "video" ? (
                                <LightboxVideo src={lightbox.fullSrc} autoFullscreenOnTap />
                            ) : (
                                <img
                                    src={lightbox.fullSrc}
                                    alt={lightbox.title}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        zIndex: 0,
                                    }}
                                />
                            )}

                            {/* Bandeau gradient + description */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0, right: 0, bottom: 0,
                                    padding: "28px 24px 24px",
                                    zIndex: 2,
                                    display: "flex",
                                    justifyContent: "center",
                                    pointerEvents: "none",
                                    background:
                                        "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0) 100%)",
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: "80ch",
                                        textAlign: "center",
                                        color: "rgba(255,255,255,0.9)",
                                        fontSize: "0.95rem",
                                        lineHeight: 1.5,
                                        fontStyle: "italic",
                                        pointerEvents: "none",
                                    }}
                                >
                                    {lightbox.description && lightbox.description.trim().length > 0
                                        ? lightbox.description
                                        : (lightbox.title ?? "")}
                                </div>
                            </div>

                            {/* Bouton fermer (centre) */}
                            <button
                                type="button"
                                data-nopan="true"
                                onClick={() => setLightbox(null)}
                                aria-label="Fermer"
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "2rem",
                                    transform: "translate(-50%, -50%)",
                                    width: 19,
                                    height: 19,
                                    borderRadius: "0%",
                                    border: "none",
                                    // background: "var(background-color)",
                                    color: "var(--text-color)",
                                    cursor: "pointer",
                                    zIndex: 3,
                                    display: "grid",
                                    placeItems: "center",
                                    opacity: 0.9,
                                    transition: "opacity 0.25s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                                    fill="currentColor" width="28" height="28" aria-hidden="true">
                                    <path fillRule="evenodd"
                                        d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                                        clipRule="evenodd" />
                                </svg>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- LightboxVideo : autoplay mobile + tap fullscreen ---------- */

function LightboxVideo({
    src,
    poster,
    autoFullscreenOnTap = true,
}: {
    src: string;
    poster?: string;
    autoFullscreenOnTap?: boolean;
}) {
    const ref = useRef<HTMLVideoElement | null>(null);
    const [needsUserPlay, setNeedsUserPlay] = useState(false);

    useEffect(() => {
        const v = ref.current;
        if (!v) return;
        const onCanPlay = async () => {
            try {
                v.muted = true; // requis pour autoplay iOS
                const p = v.play();
                if (p && typeof p.then === "function") await p;
                setNeedsUserPlay(false);
            } catch {
                setNeedsUserPlay(true);
            }
        };
        if (v.readyState >= 2) onCanPlay();
        else v.addEventListener("canplay", onCanPlay, { once: true });
        return () => v.removeEventListener("canplay", onCanPlay);
    }, [src]);

    const handleUserPlay = async () => {
        const v = ref.current;
        if (!v) return;
        try {
            v.muted = false; // son après geste user si voulu
            await v.play();
            setNeedsUserPlay(false);
        } catch { }
    };

    const handleTap = async () => {
        const v = ref.current;
        if (!v) return;
        if (autoFullscreenOnTap) {
            // @ts-ignore iOS
            if (v.webkitEnterFullscreen) { v.webkitEnterFullscreen(); return; }
            if (v.requestFullscreen) { await v.requestFullscreen().catch(() => { }); }
        }
        if (v.paused) await v.play().catch(() => setNeedsUserPlay(true));
        else v.pause();
    };

    return (
        <>
            <video
                ref={ref}
                src={src}
                poster={poster}
                autoPlay
                loop
                muted
                playsInline
                // @ts-ignore
                webkit-playsinline="true"
                preload="metadata"
                controls
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: 0,
                    background: "#000",
                }}
                disablePictureInPicture
                controlsList="nodownload noplaybackrate"
                onClick={handleTap}
            />
            {needsUserPlay && (
                <button
                    type="button"
                    onClick={handleUserPlay}
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
                        zIndex: 1,
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                    }}
                >
                    ▶
                </button>
            )}
        </>
    );
}
