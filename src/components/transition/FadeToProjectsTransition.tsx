"use client";

// « Enter the void » : entrée de la homepage vers /projects.
// La transition de navigation est assurée par le moteur Interlude (Frame) ;
// l'ancien fondu GSAP + overlay plein écran a été retiré (doublon).

import { useInterlude } from "@/components/interlude/InterludeProvider";
import styles from "@/styles/components/FadeTransition.module.scss";

export default function FadeToProjectsTransition() {
  const { navigate } = useInterlude();

  return (
    <button
      type="button"
      className={styles.gridItemLink}
      data-cursor="hover"
      onClick={(e) => navigate("/projects", { trigger: e.currentTarget })}
    >
      Enter the void
    </button>
  );
}
