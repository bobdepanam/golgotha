"use client";
import FadeToProjectsTransition from "@/components/transition/FadeToProjectsTransition";
import styles from "@/styles/components/HomeGridLoop.module.scss";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useRef } from "react";
import GridItemBg from "./GridItemBg";

gsap.registerPlugin(ScrollTrigger);

const gridMedia = [
  {
    type: "image" as const,
    src: "/images/intro/intro_8.webp",
    poster: "/images/intro/intro_8.webp",
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
    content: (
      <div className={styles.gridItemContent}>
        <svg className={styles.logo} viewBox="0 0 779.34 247.52" preserveAspectRatio="xMidYMid meet">
          <path d="M0,19.54L19.54,0h51.13l19.54,19.54v52.43h-31.27v-38.76l-6.51-6.51h-14.66l-6.51,6.51v181.08l6.51,6.51h14.66l6.51-6.51v-67.74h-15.63v-28.01h46.9v109.43l-19.54,19.54H19.54L0,227.98V19.54Z" fill="currentColor" />
          <path d="M193.78,227.98l-19.54,19.54h-54.39l-19.54-19.54V19.54L119.85,0h54.39l19.54,19.54v208.44ZM138.09,26.71l-6.51,6.51v181.08l6.51,6.51h17.91l6.51-6.51V33.22l-6.51-6.51h-17.91Z" fill="currentColor" />
          <path d="M205.5,247.52V0h31.27v220.81h41.36v26.71h-72.63Z" fill="currentColor" />
          <path d="M282.36,19.54L301.9,0h51.13l19.54,19.54v52.43h-31.27v-38.76l-6.51-6.51h-14.66l-6.51,6.51v181.08l6.51,6.51h14.66l6.51-6.51v-67.74h-15.63v-28.01h46.9v109.43l-19.54,19.54h-51.13l-19.54-19.54V19.54Z" fill="currentColor" />
          <path d="M476.14,227.98l-19.54,19.54h-54.39l-19.54-19.54V19.54L402.21,0h54.39l19.54,19.54v208.44ZM420.45,26.71l-6.51,6.51v181.08l6.51,6.51h17.91l6.51-6.51V33.22l-6.51-6.51h-17.91Z" fill="currentColor" />
          <path d="M539.64,26.05v221.46h-31.27V26.05h-29.64V0h90.54v26.05h-29.64Z" fill="currentColor" />
          <path d="M605.43,109.75h32.89V0h31.27v247.52h-31.27v-110.41h-32.89v110.41h-31.27V0h31.27v109.75Z" fill="currentColor" />
          <path d="M711.93,183.69l-6.19,63.83h-31.27L704.11,0h44.94l30.29,247.52h-32.57l-6.19-63.83h-28.66ZM726.26,32.24l-12.05,124.74h24.1l-12.05-124.74Z" fill="currentColor" />        </svg>
      </div>
    ),
  },
  {
    type: "image" as const,
    src: "/images/img/think.png",
    alt: "Section 4",
    content: (
      <div className={styles.gridItemContent}>
        <FadeToProjectsTransition />
      </div>
    ),
  },
];

export default function HomeGridLoop() {
  const gridRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null); // Ajout

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const grid = gridRef.current;
    if (!wrapper || !grid) return;

    // ✅ FADE-IN D’ENTRÉE
    gsap.fromTo(
      wrapper,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1.2,
        ease: "power2.out",
        delay: 0.2,
      }
    );

    // ✅ SCROLL FLUIDE LENIS
    const lenis = new Lenis({ lerp: 0.09 });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    lenis.on("scroll", () => {
      ScrollTrigger.update();
    });

    // ✅ ANIMATIONS GRID (logo + autres)
    const items = grid.querySelectorAll(".grid__item");
    items.forEach((item, idx) => {
      if (idx === 0) {
        gsap.set(item, { transformOrigin: "50% 100%" });
        gsap.to(item, {
          ease: "none",
          startAt: { scaleY: 1 },
          scaleY: 0,
          scrollTrigger: {
            trigger: item,
            start: "center center",
            end: "bottom top",
            scrub: true,
            fastScrollEnd: true,
            onLeave: () => gsap.set(item, { scaleY: 1 }),
          },
        });
      } else {
        gsap.set(item, { transformOrigin: "50% 0%", scaleY: 0 });
        gsap.to(item, {
          ease: "none",
          startAt: { scaleY: 0 },
          scaleY: 1,
          scrollTrigger: {
            trigger: item,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            fastScrollEnd: true,
            onLeaveBack: () => gsap.set(item, { scaleY: 1 }),
          },
        });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      gsap.killTweensOf(items);
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={wrapperRef}>
      <div className={styles.grid} ref={gridRef}>
        {gridMedia.map((media, i) => (
          <div
            key={i}
            className={`${styles.gridItem} grid__item`}
            style={{ position: "relative", overflow: "hidden" }}
          >
            <GridItemBg media={media} />
            {media.content}
          </div>
        ))}
      </div>
    </div>
  );
}
