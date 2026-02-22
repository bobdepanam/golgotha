"use client";

import styles from "@/styles/components/BackToTopOverlay.module.scss";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function BackToTopOverlay() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const scrollToTop = () => {
    console.log("back-to-top click");
    const lenis = (
      window as Window & {
        lenis?: { scrollTo: (target: number, options?: { duration?: number }) => void };
      }
    ).lenis;
    if (lenis?.scrollTo) {
      lenis.scrollTo(0, { duration: 1.0 });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setMounted(true);

    const mql = window.matchMedia("(max-width: 1024px)");

    const checkViewport = () => setIsMobile(mql.matches);

    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    checkViewport();
    handleScroll();

    // mql listener (plus fiable que resize pour les breakpoints)
    const onMqlChange = () => checkViewport();

    mql.addEventListener?.("change", onMqlChange);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      mql.removeEventListener?.("change", onMqlChange);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!mounted || !isMobile || !visible) return null;

  return createPortal(
    <button
      className={styles.backToTop}
      aria-label="Revenir en haut"
      onClick={scrollToTop}
    >
      ↑
    </button>,
    document.body
  );
}
