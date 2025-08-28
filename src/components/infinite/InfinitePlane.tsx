"use client";

import { useEffect, useMemo, useRef } from "react";

type InfinitePlaneProps = {
    tileWidth: number;
    tileHeight: number;
    renderTile: (tileKey: string, originX: number, originY: number) => React.ReactNode;
    padding?: number;
    wheelScale?: number;
    className?: string;
    style?: React.CSSProperties;
    edgeFade?: boolean;
    safeTop?: number;
    safeBottom?: number;
};

export default function InfinitePlane({
    tileWidth,
    tileHeight,
    renderTile,
    padding = 0,
    wheelScale = 1,
    className,
    style,
    edgeFade = true,
    safeTop = 0,
    safeBottom = 0,
}: InfinitePlaneProps) {
    const vpRef = useRef<HTMLDivElement | null>(null);
    const tilesRef = useRef<Map<string, HTMLDivElement>>(new Map());

    // offset + target (utilisé seulement en refs)
    const offsetRef = useRef({ x: 0, y: 0 });
    const target = useRef({ x: 0, y: 0 });

    // drag + momentum
    const draggingRef = useRef(false);
    const vxRef = useRef(0);
    const vyRef = useRef(0);
    const prevXRef = useRef(0);
    const prevYRef = useRef(0);
    const momentumRaf = useRef<number | null>(null);

    /* ---------- Animation loop : global (smooth) + normalisation discrète ---------- */
    useEffect(() => {
        let raf = 0;

        const loop = () => {
            // lissage vers la cible
            const prev = offsetRef.current;
            let nx = prev.x + (target.current.x - prev.x) * 0.14;
            let ny = prev.y + (target.current.y - prev.y) * 0.14;

            // normalisation silencieuse quand ça devient trop grand
            const limitX = tileWidth * 3;
            const limitY = tileHeight * 3;

            if (nx > limitX || nx < -limitX) {
                const m = Math.round(nx / tileWidth) * tileWidth;
                nx -= m;
                target.current.x -= m; // même delta → aucune saccade visuelle
            }
            if (ny > limitY || ny < -limitY) {
                const m = Math.round(ny / tileHeight) * tileHeight;
                ny -= m;
                target.current.y -= m;
            }

            offsetRef.current = { x: nx, y: ny };

            // update transform des tiles (référence globale = ultra fluide)
            tilesRef.current.forEach((el, key) => {
                if (!el) return;
                const [i, j] = key.split(",").map(Number);
                const x = i * tileWidth - nx - padding;
                const y = j * tileHeight - ny - padding;
                el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            });

            raf = requestAnimationFrame(loop);
        };

        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [tileWidth, tileHeight, padding]);

    /* ---------- Drag + momentum ---------- */
    useEffect(() => {
        const el = vpRef.current;
        if (!el) return;

        let sx = 0, sy = 0, ox = 0, oy = 0;

        const startsInNoPan = (targetEl: EventTarget | null) => {
            const t = targetEl as HTMLElement | null;
            return !!t && !!t.closest?.("a, button, [role='button'], [data-nopan='true']");
        };

        const cancelMomentum = () => {
            if (momentumRaf.current !== null) {
                cancelAnimationFrame(momentumRaf.current);
                momentumRaf.current = null;
            }
        };

        const onDown = (e: PointerEvent) => {
            if (startsInNoPan(e.target)) return;
            if (e.button !== 0) return;
            draggingRef.current = true;
            cancelMomentum();
            sx = e.clientX; sy = e.clientY;
            ox = target.current.x; oy = target.current.y;
            prevXRef.current = e.clientX;
            prevYRef.current = e.clientY;
            vxRef.current = 0;
            vyRef.current = 0;
            el.setPointerCapture(e.pointerId);
            el.style.cursor = "grabbing";
        };

        const onMove = (e: PointerEvent) => {
            if (!draggingRef.current) return;
            const dx = e.clientX - sx;
            const dy = e.clientY - sy;
            target.current.x = ox + dx;
            target.current.y = oy + dy;

            vxRef.current = e.clientX - prevXRef.current;
            vyRef.current = e.clientY - prevYRef.current;
            prevXRef.current = e.clientX;
            prevYRef.current = e.clientY;
        };

        const onUp = (e: PointerEvent) => {
            if (!draggingRef.current) return;
            draggingRef.current = false;
            try { el.releasePointerCapture(e.pointerId); } catch { }
            el.style.cursor = "grab";

            // momentum
            const friction = 0.92;
            const threshold = 0.45;
            const decay = () => {
                target.current.x += vxRef.current;
                target.current.y += vyRef.current;
                vxRef.current *= friction;
                vyRef.current *= friction;
                if (Math.abs(vxRef.current) > threshold || Math.abs(vyRef.current) > threshold) {
                    momentumRaf.current = requestAnimationFrame(decay);
                } else {
                    momentumRaf.current = null;
                }
            };
            momentumRaf.current = requestAnimationFrame(decay);
        };

        el.addEventListener("pointerdown", onDown);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);

        el.style.cursor = "grab";
        el.style.touchAction = "none";

        return () => {
            el.removeEventListener("pointerdown", onDown);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
    }, []);

    /* ---------- wheel → pan ---------- */
    useEffect(() => {
        const el = vpRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            target.current.x -= e.deltaX * wheelScale;
            target.current.y -= e.deltaY * wheelScale;
            vxRef.current = -e.deltaX * wheelScale * 0.2;
            vyRef.current = -e.deltaY * wheelScale * 0.2;
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel as any);
    }, [wheelScale]);

    /* ---------- Tiles 5×5 fixes ---------- */
    const tiles = useMemo(() => {
        const arr: Array<{ i: number; j: number; key: string }> = [];
        for (let j = -2; j <= 2; j++) {
            for (let i = -2; i <= 2; i++) {
                arr.push({ i, j, key: `${i},${j}` });
            }
        }
        return arr;
    }, []);

    /* ---------- render ---------- */
    return (
        <div
            ref={vpRef}
            className={className}
            style={{
                position: "fixed",
                inset: 0,
                overflow: "hidden",
                background: "var(--background-color, #0a0a0a)",
                zIndex: 0,
                ...style,
            }}
            aria-label="Infinite plane"
        >
            {tiles.map((t) => (
                <div
                    key={t.key}
                    ref={(el) => {
                        if (el) tilesRef.current.set(t.key, el);
                        else tilesRef.current.delete(t.key);
                    }}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: tileWidth + padding * 2,
                        height: tileHeight + padding * 2,
                        willChange: "transform",
                    }}
                >
                    {renderTile(t.key, t.i * tileWidth, t.j * tileHeight)}
                </div>
            ))}

            {edgeFade && (
                <>
                    <div style={{
                        position: "absolute", left: 0, top: 0, right: 0, height: 64,
                        pointerEvents: "none", background: "linear-gradient(to bottom, rgba(0,0,0,0.22), transparent)"
                    }} />
                    <div style={{
                        position: "absolute", left: 0, bottom: 0, right: 0, height: 64,
                        pointerEvents: "none", background: "linear-gradient(to top, rgba(0,0,0,0.22), transparent)"
                    }} />
                    <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0, width: 64,
                        pointerEvents: "none", background: "linear-gradient(to right, rgba(0,0,0,0.22), transparent)"
                    }} />
                    <div style={{
                        position: "absolute", right: 0, top: 0, bottom: 0, width: 64,
                        pointerEvents: "none", background: "linear-gradient(to left, rgba(0,0,0,0.22), transparent)"
                    }} />
                </>
            )}
        </div>
    );
}
