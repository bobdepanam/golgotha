"use client";
import styles from "@/styles/components/CustomCursor.module.scss";
import { lerp } from "@/utils";
import { useEffect, useRef, useState } from "react";

/** Récupère une variable CSS en JS, avec fallback */
function getCssVar(name: string, fallback = "#fff") {
  if (typeof window !== "undefined") {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name);
    return value ? value.trim() : fallback;
  }
  return fallback;
}

// === CONSTANTES CURSEUR ===
const CURSOR_RADIUS = 20;
const CURSOR_RADIUS_HOVER = 40;
const CURSOR_OPACITY = 1;
const CURSOR_OPACITY_HOVER = 0.7;
const LERP_AMOUNT = 0.8;
const LERP_RADIUS = 0.22;

export default function Cursor() {
  const svgRef = useRef<SVGSVGElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const feTurbulenceRef = useRef<SVGFETurbulenceElement>(null);

  const [isHover, setIsHover] = useState(false);
  const [strokeColor, setStrokeColor] = useState(getCssVar("--cursor-stroke", "#fff"));
  const [strokeColorHover, setStrokeColorHover] = useState(getCssVar("--cursor-stroke-hover", "#fff"));

  // Position de la souris (target)
  const mouse = useRef({ x: 0, y: 0 });
  // Position curseur affichée
  const pos = useRef({ x: 0, y: 0 });
  const radius = useRef(CURSOR_RADIUS);

  // --- Actualise la couleur du contour dynamiquement ---
  useEffect(() => {
    function updateCursorColors() {
      setStrokeColor(getCssVar("--cursor-stroke", "#fff"));
      setStrokeColorHover(getCssVar("--cursor-stroke-hover", "#fff"));
    }

    // Mise à jour initiale
    updateCursorColors();

    // Observer le changement de classe sur <html> (ex: ajout/suppression de 'dark')
    const observer = new MutationObserver(updateCursorColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // --- Animation position/scale + wavy ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [data-cursor], .cursor-hover")) {
        setIsHover(true);
      }
    };
    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [data-cursor], .cursor-hover")) {
        setIsHover(false);
      }
    };

    pos.current.x = window.innerWidth / 2;
    pos.current.y = window.innerHeight / 2;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mouseout", handleMouseOut);

    let raf: number;
    const animate = () => {
      pos.current.x = lerp(pos.current.x, mouse.current.x, LERP_AMOUNT);
      pos.current.y = lerp(pos.current.y, mouse.current.y, LERP_AMOUNT);
      radius.current = lerp(
        radius.current,
        isHover ? CURSOR_RADIUS_HOVER : CURSOR_RADIUS,
        LERP_RADIUS
      );

      if (svgRef.current) {
        svgRef.current.style.transform = `translate3d(${pos.current.x - 60}px, ${pos.current.y - 60}px, 0)`;
      }
      if (circleRef.current) {
        circleRef.current.setAttribute("r", `${radius.current}`);
      }
      raf = requestAnimationFrame(animate);
    };
    animate();

    // Animation wavy (turbulence SVG)
    let turbulenceAnimRaf: number;
    const animateTurbulence = () => {
      if (feTurbulenceRef.current) {
        let bf = 0;
        if (isHover) {
          const t = performance.now() * 0.002;
          bf = 0.08 + Math.abs(Math.sin(t)) * 0.08;
        }
        feTurbulenceRef.current.setAttribute("baseFrequency", `${bf}`);
      }
      turbulenceAnimRaf = requestAnimationFrame(animateTurbulence);
    };
    animateTurbulence();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(turbulenceAnimRaf);
    };
  }, [isHover]);

  return (
    <svg
      ref={svgRef}
      className={styles.cursor}
      width={120}
      height={120}
      viewBox="0 0 120 120"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        pointerEvents: "none",
        zIndex: 10000,
        display: "block",
        willChange: "transform",
      }}
    >
      <defs>
        <filter id="cursor-filter" x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox">
          <feTurbulence
            ref={feTurbulenceRef}
            type="fractalNoise"
            baseFrequency="0"
            numOctaves="1"
            result="warp"
          />
          <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="30" in="SourceGraphic" />
        </filter>
      </defs>
      <circle
        ref={circleRef}
        className={styles.cursorInner}
        cx="60"
        cy="60"
        r={CURSOR_RADIUS}
        filter="url(#cursor-filter)"
        fill="none"
        stroke={isHover ? strokeColorHover : strokeColor}
        strokeWidth="2"
        opacity={isHover ? CURSOR_OPACITY_HOVER : CURSOR_OPACITY}
      />
    </svg>
  );
}
