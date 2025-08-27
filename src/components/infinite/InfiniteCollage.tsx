"use client";

import styles from "@/styles/experiment/InfiniteLayersGrid.module.scss";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export type CollageItem = {
    id: string;
    title?: string;
    type?: "image" | "video";
    preview: string;   // poster (video) ou src (image)
    fullSrc: string;   // image ou vidéo (lightbox)
    description?: string;
};

export type InfiniteCollageProps = {
    items: CollageItem[];
    tileWidth: number;
    tileHeight: number;
    /** plafond d’items par tuile (le moteur ajuste la densité automatiquement) */
    maxPerTile?: number;
    /** marge visuelle (px) – sera légèrement réduite si la densité augmente */
    margin?: number;
    onItemClick?: (id: string) => void;
    seed?: number; // seed pour variations
};

// RNG
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
    return !(
        a.x + a.w + pad <= b.x ||
        b.x + b.w + pad <= a.x ||
        a.y + a.h + pad <= b.y ||
        b.y + b.h + pad <= a.y
    );
}

function shuffleSeeded<T>(arr: T[], seed: number): T[] {
    const r = mulberry32(seed || 1337);
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

/** Image avec fallback limité (max 3 candidats) */
function SafeImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    const { src = "", onError, ...rest } = props;
    const [idx, setIdx] = useState(0);
    const candidates = useMemo(() => {
        const s = String(src);
        const swapped =
            s.match(/\.jpe?g$/i) ? s.replace(/\.jpe?g$/i, ".png")
                : s.match(/\.png$/i) ? s.replace(/\.png$/i, ".jpg")
                    : null;
        const fallback = "/images/video/fallback.jpg";
        return [s, swapped, fallback].filter(Boolean) as string[];
    }, [src]);

    useEffect(() => setIdx(0), [src]);

    return (
        <img
            {...rest}
            src={candidates[idx]}
            onError={(e) => {
                if (idx < candidates.length - 1) setIdx(idx + 1);
                onError?.(e as any);
            }}
        />
    );
}

export default function InfiniteCollage({
    items,
    tileWidth,
    tileHeight,
    maxPerTile = 18,
    margin = 24,
    onItemClick,
    seed = 1337,
}: InfiniteCollageProps) {
    useReducedMotion();

    // parallaxe souris → CSS vars (desktop only)
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const mx = (e.clientX / window.innerWidth) * 2 - 1;
            const my = (e.clientY / window.innerHeight) * 2 - 1;
            document.documentElement.style.setProperty("--mx", mx.toFixed(3));
            document.documentElement.style.setProperty("--my", my.toFixed(3));
        };
        window.addEventListener("mousemove", onMove, { passive: true });
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    const frames = useMemo(() => {
        const r = mulberry32(seed);
        const base = items.length ? shuffleSeeded(items, Math.floor(seed * 2654435761)) : [];
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

        // --- Densité & échelle dynamiques ---------------------------
        const area = tileWidth * tileHeight;
        const baseCount = Math.max(10, Math.floor(area / 180000)); // densité cible “agréable”
        const count = Math.min(maxPerTile, baseCount);

        // baseline à 14 items → si plus dense, on réduit taille et marge
        const baseline = 14;
        const densityRatio = count / baseline; // >1 = plus dense
        const scaleDynamic = clamp(0.80, 0.95, 0.92 - 0.08 * (densityRatio - 1)); // shrink si dense
        const marginDynamic = Math.max(12, Math.round(margin - Math.max(0, (densityRatio - 1) * 6))); // rétrécit un peu la marge
        // ------------------------------------------------------------

        const placed: Rect[] = [];
        let loopIdx = 0;

        for (let i = 0; i < count; i++) {
            const it = base[loopIdx % base.length];
            loopIdx++;

            const s = r();
            const w =
                s < 0.33
                    ? Math.round(tileWidth * (0.12 + r() * 0.04) * scaleDynamic)
                    : s < 0.66
                        ? Math.round(tileWidth * (0.16 + r() * 0.05) * scaleDynamic)
                        : Math.round(tileWidth * (0.20 + r() * 0.06) * scaleDynamic);

            const ratio = 0.70 + r() * 0.70; // 0.7 → 1.4
            const h = Math.round(w * ratio * scaleDynamic);

            let placedRect: Rect | null = null;
            for (let tries = 0; tries < 120; tries++) { // plus d'essais => collisions rarissimes
                const x = Math.round(r() * (tileWidth - w - marginDynamic * 2) + marginDynamic);
                const y = Math.round(r() * (tileHeight - h - marginDynamic * 2) + marginDynamic);
                const candidate = { x, y, w, h };
                const collides = placed.some((p) => intersects(p, candidate, marginDynamic));
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
    }, [items, tileWidth, tileHeight, maxPerTile, margin, seed]);

    return (
        <>
            {frames.map((f, idx) => (
                <motion.div
                    key={`${f.id}-${idx}`}
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    whileHover={{ scale: 1.05 }}     // zoom léger au hover
                    whileTap={{ scale: 0.98 }}
                    viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
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
                        willChange: "transform, opacity",
                    }}
                >
                    <div
                        className={styles.stage}
                        style={{
                            width: "100%", height: f.h,
                            borderRadius: "14px", overflow: "hidden",
                            boxShadow: "0 10px 30px rgba(0,0,0,.22)",
                        }}
                    >
                        <SafeImage
                            className={styles.layer}
                            src={f.preview}
                            alt={f.title ?? ""}
                            style={{ ["--lz" as any]: f.type === "video" ? "0.3" : "0.35", ["--lop" as any]: "1" }}
                            draggable={false}
                        />
                    </div>

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
                            ⤢
                        </button>
                    </div>
                </motion.div>
            ))}
        </>
    );
}

/* ---------------- utils ---------------- */
function clamp(min: number, max: number, v: number) {
    return Math.max(min, Math.min(max, v));
}
