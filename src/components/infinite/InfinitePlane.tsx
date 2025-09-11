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
  /** bloque le drag/scroll quand un overlay est ouvert */
  isLocked?: boolean;
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
  isLocked = false,
}: InfinitePlaneProps) {
  const vpRef = useRef<HTMLDivElement | null>(null);
  const tilesRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // offsets & cible
  const offsetRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  // drag + momentum
  const draggingRef = useRef(false);
  const vxRef = useRef(0);
  const vyRef = useRef(0);
  const prevXRef = useRef(0);
  const prevYRef = useRef(0);
  const momentumRaf = useRef<number | null>(null);

  // wheel -> buffer vitesse (intégrée en rAF)
  const wheelVXRef = useRef(0);
  const wheelVYRef = useRef(0);

  /* ---------- rAF : smoother + clamp + normalisation ---------- */
  useEffect(() => {
    let raf = 0;
    const MAX_STEP_X = tileWidth * 0.30;
    const MAX_STEP_Y = tileHeight * 0.30;

    const loop = () => {
      const prev = offsetRef.current;

      // (0) intégrer la wheel en rAF (cadence stable)
      if (!isLocked && (wheelVXRef.current || wheelVYRef.current)) {
        targetRef.current.x -= wheelVXRef.current;
        targetRef.current.y -= wheelVYRef.current;
        wheelVXRef.current *= 0.88;
        wheelVYRef.current *= 0.88;
        if (Math.abs(wheelVXRef.current) < 0.05) wheelVXRef.current = 0;
        if (Math.abs(wheelVYRef.current) < 0.05) wheelVYRef.current = 0;
      }

      // (1) delta vers la cible + clamp par frame
      let dx = targetRef.current.x - prev.x;
      let dy = targetRef.current.y - prev.y;
      if (dx >  MAX_STEP_X) dx =  MAX_STEP_X;
      if (dx < -MAX_STEP_X) dx = -MAX_STEP_X;
      if (dy >  MAX_STEP_Y) dy =  MAX_STEP_Y;
      if (dy < -MAX_STEP_Y) dy = -MAX_STEP_Y;

      // (2) lissage (ralenti quand lock pour économiser)
      const SMOOTH = isLocked ? 0.06 : 0.22;
      let nx = prev.x + dx * SMOOTH;
      let ny = prev.y + dy * SMOOTH;

      // (3) normalisation douce par pas de tuile (pas de jump)
      const oneX = tileWidth;
      const oneY = tileHeight;
      while (nx >  oneX) { nx -= oneX; targetRef.current.x -= oneX; }
      while (nx < -oneX) { nx += oneX; targetRef.current.x += oneX; }
      while (ny >  oneY) { ny -= oneY; targetRef.current.y -= oneY; }
      while (ny < -oneY) { ny += oneY; targetRef.current.y += oneY; }

      offsetRef.current = { x: nx, y: ny };

      // (4) rendu : sub-pixel en mouvement, snap si repos
      const speed =
        Math.abs(targetRef.current.x - prev.x) +
        Math.abs(targetRef.current.y - prev.y) +
        Math.abs(wheelVXRef.current) +
        Math.abs(wheelVYRef.current);
      const resting = speed < 0.25;

      tilesRef.current.forEach((el, key) => {
        if (!el) return;
        const [i, j] = key.split(",").map(Number);
        const fx = i * tileWidth  - nx - padding;
        const fy = j * tileHeight - ny - padding;
        const tx = resting ? Math.round(fx) : Number(fx.toFixed(2));
        const ty = resting ? Math.round(fy) : Number(fy.toFixed(2));
        const tr = `translate3d(${tx}px, ${ty}px, 0)`;
        if (el.style.transform !== tr) el.style.transform = tr;
      });

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tileWidth, tileHeight, padding, isLocked]);

  /* ---------- Drag + momentum ---------- */
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;

    let sx = 0, sy = 0, ox = 0, oy = 0;

    const startsInNoPan = (targetEl: EventTarget | null) => {
      const t = targetEl as HTMLElement | null;
      return !!t && !!t.closest?.(
        "a, button, [role='button'], [data-nopan='true'], dialog, [aria-modal='true']"
      );
    };

    const cancelMomentum = () => {
      if (momentumRaf.current !== null) {
        cancelAnimationFrame(momentumRaf.current);
        momentumRaf.current = null;
      }
    };

    const onDown = (e: PointerEvent) => {
      if (isLocked) return;
      if (startsInNoPan(e.target)) return;
      if (e.button !== 0) return;
      draggingRef.current = true;
      cancelMomentum();
      sx = e.clientX; sy = e.clientY;
      ox = targetRef.current.x; oy = targetRef.current.y;
      prevXRef.current = e.clientX;
      prevYRef.current = e.clientY;
      vxRef.current = 0;
      vyRef.current = 0;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };

    const onMove = (e: PointerEvent) => {
      if (isLocked) return;
      if (!draggingRef.current) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      targetRef.current.x = ox + dx;
      targetRef.current.y = oy + dy;

      vxRef.current = e.clientX - prevXRef.current;
      vyRef.current = e.clientY - prevYRef.current;
      prevXRef.current = e.clientX;
      prevYRef.current = e.clientY;
    };

    const onUp = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      try { el.releasePointerCapture(e.pointerId); } catch {}
      el.style.cursor = "grab";
      if (isLocked) return;

      const friction = 0.92;
      const threshold = 0.45;
      const decay = () => {
        targetRef.current.x += vxRef.current;
        targetRef.current.y += vyRef.current;
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
  }, [isLocked]);

  /* ---------- Wheel → buffer vitesse (amorti) ---------- */
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (isLocked) return; // si overlay ouvert, on laisse le scroll normal
      e.preventDefault();
      const K = 0.65;
      wheelVXRef.current += e.deltaX * wheelScale * K;
      wheelVYRef.current += e.deltaY * wheelScale * K;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, [wheelScale, isLocked]);

  /* ---------- Tiles 7×7 (overscan) ---------- */
  const tiles = useMemo(() => {
    const arr: Array<{ i: number; j: number; key: string }> = [];
    for (let j = -3; j <= 3; j++) {
      for (let i = -3; i <= 3; i++) {
        arr.push({ i, j, key: `${i},${j}` });
      }
    }
    return arr;
  }, []);

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
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            contain: "layout paint",
          }}
        >
          {renderTile(t.key, t.i * tileWidth, t.j * tileHeight)}
        </div>
      ))}

      {edgeFade && (
        <>
          <div style={{
            position: "absolute", left: 0, top: 0, right: 0, height: Math.max(1, 48 + safeTop),
            pointerEvents: "none", background: "linear-gradient(to bottom, rgba(0,0,0,0.22), transparent)"
          }} />
          <div style={{
            position: "absolute", left: 0, bottom: 0, right: 0, height: Math.max(1, 48 + safeBottom),
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
