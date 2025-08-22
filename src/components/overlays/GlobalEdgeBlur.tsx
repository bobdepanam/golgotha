"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
    blur?: number;
    topHeight?: string;     // ex: "12vh"
    bottomHeight?: string;  // ex: "12vh"
    desktopOnly?: boolean;
    zIndex?: number;        // doit rester < au z-index header/footer
    headerSelector?: string;
    footerSelector?: string;
};

export default function GlobalEdgeBlur({
    blur = 10,
    topHeight = "12vh",
    bottomHeight = "12vh",
    desktopOnly = true,
    zIndex = 20,
    headerSelector = 'header[data-site-header], header[role="banner"], header',
    footerSelector = 'footer[data-site-footer], footer[role="contentinfo"], footer',
}: Props) {
    const [enabled, setEnabled] = useState(true);
    const [offsets, setOffsets] = useState({ top: 0, bottom: 0 });
    const rafRef = useRef<number | null>(null);

    // Activer seulement sur pointer fin (desktop)
    useEffect(() => {
        if (!desktopOnly) return;
        const mq = window.matchMedia("(pointer: fine)");
        const onChange = () => setEnabled(mq.matches);
        onChange();
        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, [desktopOnly]);

    // Mesurer header/footer (avec fallback si ResizeObserver absent)
    useEffect(() => {
        const header = document.querySelector<HTMLElement>(headerSelector);
        const footer = document.querySelector<HTMLElement>(footerSelector);

        const read = () => {
            const top = header?.getBoundingClientRect().height ?? 0;
            const bottom = footer?.getBoundingClientRect().height ?? 0;
            setOffsets({ top, bottom });
        };

        read();

        // ✅ Corrigé : pas d'optional chaining après `new`
        const RO = (typeof window !== "undefined" && (window as any).ResizeObserver) as
            | (new (cb: ResizeObserverCallback) => ResizeObserver)
            | undefined;

        let ro: ResizeObserver | null = null;

        if (RO) {
            ro = new RO(() => {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                rafRef.current = requestAnimationFrame(read);
            });
            header && ro.observe(header);
            footer && ro.observe(footer);
        }

        const onResize = () => read();
        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
            ro?.disconnect();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [headerSelector, footerSelector]);

    if (!enabled) return null;

    const base: React.CSSProperties = useMemo(
        () => ({
            position: "fixed",
            left: 0,
            right: 0,
            pointerEvents: "none",
            zIndex,
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
        }),
        [blur, zIndex]
    );

    return (
        <>
            {/* Bande du haut : commence sous le header */}
            <div
                aria-hidden
                style={{
                    ...base,
                    top: offsets.top,
                    height: topHeight,
                    maskImage:
                        "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                }}
            />
            {/* Bande du bas : s'arrête au-dessus du footer */}
            <div
                aria-hidden
                style={{
                    ...base,
                    bottom: offsets.bottom,
                    height: bottomHeight,
                    maskImage:
                        "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                    WebkitMaskImage:
                        "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                }}
            />
        </>
    );
}
