"use client";

import styles from "@/styles/components/FadeTransition.module.scss";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FadeToProjectsTransition() {
  const [clicked, setClicked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (clicked) {
      const overlay = document.getElementById("fade-overlay");

      gsap.to(overlay, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          router.push("/projects");
        },
      });
    }
  }, [clicked, router]);

  return (
    <>
      <button
        className={styles.gridItemLink}
        data-cursor="hover"
        onClick={() => setClicked(true)}
      >
        Enter
      </button>
      {clicked && <div id="fade-overlay" className={styles.fadeOverlay}></div>}
    </>
  );
}
