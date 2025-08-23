"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
    blur?: number;
    topHeight?: string;     // ex: "12vh"
    bottomHeight?: string;  // ex: "12vh"
    desktopOnly?: boolean;
    minWidth?: number;      // largeur mini pour activer (désactive tablette/mobile)
    zIndex?: number;        // doit rester < au z-index header/footer
    headerSelector?: string;
    footerSelector?: string;
};

export default function GlobalEdgeBlur({
    blur = 10,
    topHeight = "12vh",
    bottomHeight = "12vh",
    desktopOnly = true,
    minWidth = 1024,
    zIndex = 20,
    headerSelector = 'header[data-site-header], header[role="banner"], header',
    footerSelector = 'footer[data-site-footer], footer[role="contentinfo"], footer',
}: Props) {
    // ---- State & refs (déclarés en premier, jamais conditionnels)
    const [isDesktopContext, setIsDesktopContext] = useState(false);
    const [offsets, setOffsets] = useState({ top: 0, bottom: 0 });
    const rafRef = useRef<number | null>(null);

    // ---- 1) Détection contexte "desktop" (pointer/hover + minWidth)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const mqFine = window.matchMedia("(pointer: fine)");
        const mqHover = window.matchMedia("(hover: hover)");

        const compute = () => {
            if (!desktopOnly) return true;
            const wideEnough = window.innerWidth >= minWidth;
            return mqFine.matches && mqHover.matches && wideEnough;
        };

        const update = () => setIsDesktopContext(compute());

        update();
        mqFine.addEventListener?.("change", update);
        mqHover.addEventListener?.("change", update);
        window.addEventListener("resize", update);
        window.addEventListener("orientationchange", update);

        return () => {
            mqFine.removeEventListener?.("change", update);
            mqHover.removeEventListener?.("change", update);
            window.removeEventListener("resize", update);
            window.removeEventListener("orientationchange", update);
        };
    }, [desktopOnly, minWidth]);

    // ---- 2) Support CSS du backdrop-filter
    const supportsBlur = useMemo(() => {
        if (
            typeof window === "undefined" ||
            typeof CSS === "undefined" ||
            !("supports" in CSS)
        ) {
            return false;
        }
        return (
            CSS.supports("backdrop-filter: blur(1px)") ||
            CSS.supports("-webkit-backdrop-filter: blur(1px)")
        );
    }, []);

    // ---- 3) Mesures header/footer (hook toujours appelé, garde interne si non-actif)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const header = document.querySelector<HTMLElement>(headerSelector);
        const footer = document.querySelector<HTMLElement>(footerSelector);

        const read = () => {
            const top = header?.getBoundingClientRect().height ?? 0;
            const bottom = footer?.getBoundingClientRect().height ?? 0;
            setOffsets({ top, bottom });
        };

        // On mesure même si pas “actif” pour garder un état cohérent,
        // mais on peut aussi court-circuiter si tu veux limiter le travail :
        read();

        const RO = (window as any).ResizeObserver as
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

    // ---- 4) Styles de base (toujours calculés, hooks non conditionnels)
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

    // ---- 5) Décision d’affichage (aucun early return avant les hooks)
    const shouldRender = isDesktopContext && supportsBlur;

    // ---- 6) Render
    if (!shouldRender) return null;

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
