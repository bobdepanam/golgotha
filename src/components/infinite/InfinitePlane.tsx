"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type InfinitePlaneProps = {
    tileWidth: number;
    tileHeight: number;
    renderTile: (tileKey: string, originX: number, originY: number) => React.ReactNode;
    padding?: number;
    wheelScale?: number;
    className?: string;
    style?: React.CSSProperties;
};

export default function InfinitePlane({
    tileWidth,
    tileHeight,
    renderTile,
    padding = 0,
    wheelScale = 1,
    className,
    style,
}: InfinitePlaneProps) {
    const vpRef = useRef<HTMLDivElement | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const offRef = useRef(offset);
    offRef.current = offset;

    const wrap = (x: number, size: number) => {
        let r = x % size;
        if (r > size) r -= size;
        if (r < -size) r += size;
        return r;
    };

    const wrapped = useMemo(
        () => ({ x: wrap(offset.x, tileWidth), y: wrap(offset.y, tileHeight) }),
        [offset.x, offset.y, tileWidth, tileHeight]
    );

    useEffect(() => {
        const el = vpRef.current;
        if (!el) return;

        let dragging = false;
        let sx = 0, sy = 0, ox = 0, oy = 0;

        const startsInNoPan = (target: EventTarget | null) => {
            const t = target as HTMLElement | null;
            return !!t && !!t.closest?.("[data-nopan='true']");
        };

        const onDown = (e: PointerEvent) => {
            // ❌ ne pas démarrer le pan si on est sur un bouton/zone no-pan
            if (startsInNoPan(e.target)) return;
            if (e.button !== 0) return;
            dragging = true;
            sx = e.clientX; sy = e.clientY;
            ox = offRef.current.x; oy = offRef.current.y;
            el.setPointerCapture(e.pointerId);
            (el as HTMLElement).style.cursor = "grabbing";
        };

        const onMove = (e: PointerEvent) => {
            if (!dragging) return;
            const dx = e.clientX - sx;
            const dy = e.clientY - sy;
            setOffset({ x: ox + dx, y: oy + dy });
        };

        const onUp = (e: PointerEvent) => {
            if (!dragging) return;
            dragging = false;
            try { el.releasePointerCapture(e.pointerId); } catch { }
            (el as HTMLElement).style.cursor = "grab";
        };

        // Empêche qu’un click “no-pan” se transforme en pan si on bouge 1px
        const onMouseDownCapture = (e: MouseEvent) => {
            if (startsInNoPan(e.target)) {
                // on évite que le plane prenne la main accidentellement
                // (pas de preventDefault pour laisser le click fonctionner)
                return;
            }
        };

        el.addEventListener("pointerdown", onDown);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        el.addEventListener("mousedown", onMouseDownCapture, { capture: true });

        (el as HTMLElement).style.cursor = "grab";
        (el as HTMLElement).style.touchAction = "none";

        return () => {
            el.removeEventListener("pointerdown", onDown);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            el.removeEventListener("mousedown", onMouseDownCapture, { capture: true } as any);
        };
    }, []);

    // wheel → pan
    useEffect(() => {
        const el = vpRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            setOffset((p) => ({ x: p.x - e.deltaX * wheelScale, y: p.y - e.deltaY * wheelScale }));
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel as any);
    }, [wheelScale]);

    // 3×3 tiles
    const tiles = useMemo(() => {
        const origins: Array<[number, number, string]> = [];
        for (let ty = -1; ty <= 1; ty++) {
            for (let tx = -1; tx <= 1; tx++) {
                const ox = tx * tileWidth + wrapped.x;
                const oy = ty * tileHeight + wrapped.y;
                origins.push([ox, oy, `${tx},${ty}`]);
            }
        }
        return origins;
    }, [wrapped, tileWidth, tileHeight]);

    return (
        <div
            ref={vpRef}
            className={className}
            style={{
                position: "fixed",
                inset: 0,
                overflow: "hidden",
                background: "var(--background-color, #0a0a0a)",
                cursor: "grab",
                touchAction: "none",
                ...style,
            }}
            aria-label="Infinite plane"
        >
            {tiles.map(([ox, oy, key]) => (
                <div
                    key={key}
                    style={{
                        position: "absolute",
                        left: 0, top: 0,
                        width: tileWidth + padding * 2,
                        height: tileHeight + padding * 2,
                        transform: `translate3d(${ox - padding}px, ${oy - padding}px, 0)`,
                        willChange: "transform",
                    }}
                >
                    {renderTile(key, ox, oy)}
                </div>
            ))}
        </div>
    );
}
