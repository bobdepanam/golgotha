"use client";

import styles from "@/styles/experiment/InfiniteLayersGrid.module.scss";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

/**
 * CollageItem
 * - preview: image toujours (thumb/poster)
 * - fullSrc: source du fullscreen (image ou vidéo)
 * - description: optionnel (affiché dans l’overlay fullscreen par la page)
 */
export type CollageItem = {
    id: string;
    title?: string;
    type?: "image" | "video";
    preview: string;
    fullSrc: string;
    description?: string; // 👈 ajouté
};

export type InfiniteCollageProps = {
    items: CollageItem[];
    tileWidth: number;
    tileHeight: number;
    maxPerTile?: number;
    margin?: number; // px entre panneaux
    onItemClick?: (id: string) => void; // bouton → fullscreen
};

// --- utils placement ---
function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
type Rect = { x: number; y: number; w: number; h: number };
function intersects(a: Rect, b: Rect, pad = 0) {
    return !(a.x + a.w + pad <= b.x || b.x + b.w + pad <= a.x || a.y + a.h + pad <= b.y || b.y + b.h + pad <= a.y);
}

export default function InfiniteCollage({
    items,
    tileWidth,
    tileHeight,
    maxPerTile = 16,
    margin = 28,
    onItemClick,
}: InfiniteCollageProps) {
    useReducedMotion(); // on ne l’utilise pas ici mais garde la compat

    const frames = useMemo(() => {
        const r = mulberry32(1337);
        const base = items.length ? items : [];
        const out: Array<{
            id: string;
            x: number; y: number; w: number; h: number;
            title?: string;
            type?: "image" | "video";
            preview: string;
            fullSrc: string;
            description?: string;
        }> = [];
        if (!base.length) return out;

        const count = Math.min(maxPerTile, Math.max(8, Math.floor((tileWidth * tileHeight) / 260000)));
        const placed: Rect[] = [];

        for (let i = 0; i < count; i++) {
            const it = base[i % base.length];
            const s = r();
            const w =
                s < 0.33 ? Math.round(tileWidth * (0.14 + r() * 0.04))
                    : s < 0.66 ? Math.round(tileWidth * (0.18 + r() * 0.05))
                        : Math.round(tileWidth * (0.24 + r() * 0.06));
            const h = Math.round(w * (0.62 + r() * 0.44));

            let placedRect: Rect | null = null;
            for (let tries = 0; tries < 40; tries++) {
                const x = Math.round(r() * (tileWidth - w - margin * 2) + margin);
                const y = Math.round(r() * (tileHeight - h - margin * 2) + margin);
                const candidate = { x, y, w, h };
                const collides = placed.some((p) => intersects(p, candidate, margin));
                if (!collides) { placedRect = candidate; placed.push(candidate); break; }
            }
            if (!placedRect) continue;

            out.push({
                id: it.id,
                x: placedRect.x, y: placedRect.y, w: placedRect.w, h: placedRect.h,
                title: it.title,
                type: it.type,
                preview: it.preview,
                fullSrc: it.fullSrc,
                description: it.description,
            });
        }
        return out;
    }, [items, tileWidth, tileHeight, maxPerTile, margin]);

    return (
        <>
            {frames.map((f, idx) => (
                <div
                    key={`${f.id}-${idx}`}
                    style={{
                        position: "absolute",
                        left: f.x, top: f.y,
                        width: f.w, height: f.h + 42,
                        display: "grid",
                        gridTemplateRows: "1fr auto",
                        cursor: "inherit",
                        background: "transparent",
                        padding: 0,
                        userSelect: "none",
                    }}
                    aria-label={f.title ?? f.id}
                >
                    <motion.div
                        className={styles.stage}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            width: "100%", height: f.h,
                            borderRadius: "14px", overflow: "hidden",
                            boxShadow: "0 10px 30px rgba(0,0,0,.22)",
                        }}
                    >
                        <img
                            className={styles.layer}
                            src={f.preview}
                            alt={f.title ?? ""}
                            style={{ ["--lz" as any]: f.type === "video" ? "0.3" : "0.35", ["--lop" as any]: "1" }}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            aria-hidden={!f.title}
                        />
                    </motion.div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            paddingTop: 6,
                        }}
                    >
                        <div className={styles.caption} style={{ flex: "1 1 auto", minWidth: 0 }}>
                            {f.title ?? f.id}
                        </div>

                        <button
                            type="button"
                            data-nopan="true"
                            onPointerDown={(e) => { e.stopPropagation(); }}
                            onMouseDown={(e) => { e.stopPropagation(); }}
                            onClick={(e) => { e.stopPropagation(); onItemClick?.(f.id); }}
                            aria-label="Ouvrir en plein écran"
                            style={{
                                flex: "0 0 auto",
                                display: "grid",
                                placeItems: "center",
                                width: 28, height: 28,
                                borderRadius: 8,
                                border: "none",
                                background: "color-mix(in oklab, var(--background-color, #0a0a0a), #fff 6%)",
                                color: "var(--text-color, #eaeaea)",
                                cursor: "pointer",
                            }}
                        >
                            {/* icône “ouvrir” */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                                fill="currentColor" width="18" height="18" aria-hidden="true">
                                <path fillRule="evenodd"
                                    d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
                                    clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </>
    );
}
