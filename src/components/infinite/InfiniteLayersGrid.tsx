"use client";

import cls from "@/styles/experiment/InfiniteLayersGrid.module.scss";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

export type GridLayer = {
    src: string;
    alt?: string;
    depth?: number;
    opacity?: number;
    blendMode?:
    | "normal"
    | "multiply"
    | "screen"
    | "overlay"
    | "darken"
    | "lighten"
    | "color-dodge"
    | "color-burn"
    | "hard-light"
    | "soft-light"
    | "difference"
    | "exclusion";
};

export type GridItem = {
    id: string;
    title?: string;
    href?: string;
    layers: GridLayer[];
    fallback?: { src: string; alt?: string };
};

export type InfiniteLayersGridProps = {
    items: GridItem[];
    columns?: number;
    minColWidth?: number;
    gap?: number;
    perspective?: number;
    maxTranslate?: number;
    scrollParallax?: boolean;
    pointerParallax?: boolean;
    enableTiltOnTouch?: boolean;
    radius?: string;
    aspectRatio?: `${number} / ${number}`;
    className?: string;
    onItemClick?: (item: GridItem) => void; // 🔥 nouveau
};

export default function InfiniteLayersGrid({
    items,
    columns = 3,
    minColWidth = 320,
    gap = 14,
    perspective = 800,
    maxTranslate = 22,
    scrollParallax = true,
    pointerParallax = true,
    enableTiltOnTouch = false,
    radius = "10px",
    aspectRatio = "4 / 3",
    className,
    onItemClick,
}: InfiniteLayersGridProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const prefersReduced = !!useReducedMotion();
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        setIsTouch(matchMedia("(pointer: coarse)").matches);
    }, []);

    const cursor = useRef({ x: 0, y: 0, has: false });
    const tilt = useRef({ beta: 0, gamma: 0, has: false });
    const rafRef = useRef<number | null>(null);

    const startRAF = () => {
        if (rafRef.current !== null) return;
        const tick = () => {
            const el = containerRef.current;
            if (el) {
                const { x, y, has } = cursor.current;
                const { beta, gamma, has: hasTilt } = tilt.current;
                if (has || hasTilt) {
                    el.style.setProperty("--mx", x.toFixed(4));
                    el.style.setProperty("--my", y.toFixed(4));
                    el.style.setProperty("--tb", beta.toFixed(4));
                    el.style.setProperty("--tg", gamma.toFixed(4));
                }
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    };

    const stopRAF = () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
    };

    useEffect(() => {
        const root = containerRef.current;
        if (!root) return;

        if (!prefersReduced && (pointerParallax || (enableTiltOnTouch && isTouch))) {
            startRAF();
        }

        const onPointerMove = (e: PointerEvent) => {
            if (!pointerParallax || prefersReduced) return;
            const rect = root.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / rect.width;
            const ny = (e.clientY - rect.top) / rect.height;
            cursor.current.x = nx * 2 - 1;
            cursor.current.y = ny * 2 - 1;
            cursor.current.has = true;
        };

        const onPointerLeave = () => {
            cursor.current.has = false;
            root.style.setProperty("--mx", "0");
            root.style.setProperty("--my", "0");
        };

        const onDevice = (e: DeviceOrientationEvent) => {
            if (!enableTiltOnTouch || prefersReduced || !isTouch) return;
            const beta = (e.beta ?? 0) / 90;
            const gamma = (e.gamma ?? 0) / 90;
            tilt.current.beta = Math.max(-1, Math.min(1, beta));
            tilt.current.gamma = Math.max(-1, Math.min(1, gamma));
            tilt.current.has = true;
        };

        root.addEventListener("pointermove", onPointerMove);
        root.addEventListener("pointerleave", onPointerLeave);
        window.addEventListener("deviceorientation", onDevice, { passive: true });

        return () => {
            root.removeEventListener("pointermove", onPointerMove);
            root.removeEventListener("pointerleave", onPointerLeave);
            window.removeEventListener("deviceorientation", onDevice as any);
            stopRAF();
        };
    }, [prefersReduced, pointerParallax, enableTiltOnTouch, isTouch]);

    useEffect(() => {
        if (!scrollParallax || prefersReduced) return;
        const root = containerRef.current;
        if (!root) return;

        let scrollId: number | 0 = 0;

        const update = () => {
            const rect = root.getBoundingClientRect();
            const vh = window.innerHeight || 1;
            const ny = (rect.top + rect.height / 2 - vh / 2) / vh;
            root.style.setProperty("--sy", ny.toFixed(4));
            scrollId = requestAnimationFrame(update);
        };

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && scrollId === 0) {
                        scrollId = requestAnimationFrame(update);
                    } else if (!entry.isIntersecting && scrollId) {
                        cancelAnimationFrame(scrollId);
                        scrollId = 0;
                    }
                });
            },
            { threshold: [0, 1] }
        );

        io.observe(root);
        return () => {
            io.disconnect();
            if (scrollId) cancelAnimationFrame(scrollId);
        };
    }, [scrollParallax, prefersReduced]);

    const styleVars = useMemo(
        () =>
            ({
                "--ig-columns": String(columns),
                "--ig-min-col": `${minColWidth}px`,
                "--ig-gap": `${gap}px`,
                "--ig-radius": radius,
                "--ig-aspect": aspectRatio,
                "--ig-perspective": `${perspective}px`,
                "--ig-max-translate": `${maxTranslate}px`,
            }) as React.CSSProperties,
        [columns, minColWidth, gap, radius, aspectRatio, perspective, maxTranslate]
    );

    return (
        <section
            ref={containerRef}
            className={[cls.wrapper, className].filter(Boolean).join(" ")}
            style={styleVars}
            aria-label="Infinite layers grid"
        >
            <div className={cls.grid}>
                {items.map((item) => (
                    <Tile key={item.id} item={item} onClick={onItemClick} />
                ))}
            </div>
        </section>
    );
}

function Tile({ item, onClick }: { item: GridItem; onClick?: (i: GridItem) => void }) {
    const prefersReduced = !!useReducedMotion();

    const Content = (
        <motion.div
            className={cls.tile}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className={cls.stage}>
                {item.fallback && (
                    <img
                        className={cls.fallback}
                        src={item.fallback.src}
                        alt={item.fallback.alt ?? ""}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                    />
                )}
                {item.layers.map((layer, idx) => (
                    <Layer key={idx} layer={layer} index={idx} disabled={prefersReduced} />
                ))}
            </div>
            {item.title && <div className={cls.caption}>{item.title}</div>}
        </motion.div>
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={() => onClick(item)}
                className={cls.buttonLike}
                aria-label={item.title ?? "Open"}
            >
                {Content}
            </button>
        );
    }

    if (item.href) {
        return (
            <a href={item.href} className={cls.link} aria-label={item.title ?? "View"}>
                {Content}
            </a>
        );
    }
    return Content;
}

function Layer({ layer, index }: { layer: GridLayer; index: number; disabled: boolean }) {
    const d = Math.max(-1, Math.min(1, layer.depth ?? (index + 1) * 0.18));
    const style: React.CSSProperties = {
        ["--lz" as any]: String(d),
        ["--lop" as any]: String(layer.opacity ?? 1),
        mixBlendMode: layer.blendMode ?? "normal",
    };
    return (
        <img
            className={cls.layer}
            src={layer.src}
            alt={layer.alt ?? ""}
            style={style}
            loading="lazy"
            decoding="async"
            draggable={false}
            aria-hidden={!layer.alt}
        />
    );
}
