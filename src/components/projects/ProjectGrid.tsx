"use client";

// Grille éditoriale de /projects : covers + titre + catégorie. Survol en CSS.
// Filtres (7.0.1) : `visibleSlugs` fourni → tous les projets restent rendus, ceux hors
// catégorie sont masqués (display: none) et le changement est animé en FLIP (GSAP Flip,
// déjà installé) : sortants en fondu court, conservés glissant vers leur nouvelle place,
// entrants en fondu + 6 px. Aucun écran vide, aucun rechargement ; clics rapides : l'animation
// en cours est interrompue et la suivante repart de l'état affiché. Mouvement réduit : direct.

import styles from "@/styles/projects/ProjectGrid.module.scss";
import type { FlexibleContentBlock, Project } from "@/types/project";
import { MOTION as M } from "@/lib/motion/tokens";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

gsap.registerPlugin(Flip);


const MOTION = { move: M.grid, enter: M.text, leave: M.fast, shift: M.shift, staggerMax: 0.08 };

// Image de repli depuis le contenu flexible (poster vidéo, image, puis 1re image de galerie)
function getFirstFlexibleCover(blocks?: FlexibleContentBlock[] | null): string | null {
  if (!blocks) return null;
  for (const b of blocks) {
    if (b.__typename === "ProjectFieldsFlexibleContentBlocksVideoBlockLayout") {
      const u = b.poster?.node?.mediaItemUrl;
      if (u) return u;
    }
  }
  for (const b of blocks) {
    if (b.__typename === "ProjectFieldsFlexibleContentBlocksImageBlockLayout") {
      const u = b.image?.node?.mediaItemUrl;
      if (u) return u;
    }
  }
  for (const b of blocks) {
    if (b.__typename === "ProjectFieldsFlexibleContentBlocksGalleryBlockLayout") {
      const n0 = b.images?.nodes?.find((n) => n?.mediaItemUrl)?.mediaItemUrl;
      if (n0) return n0;
    }
  }
  return null;
}

const coverOf = (p: Project) =>
  p.image ||
  p.projectFields?.mainImage?.node?.mediaItemUrl ||
  getFirstFlexibleCover(p.projectFieldsFlexible?.contentBlocks) ||
  null;

const categoryOf = (p: Project) =>
  p.projectFields?.category?.trim() || p.projectFieldsFlexible?.category?.trim() || "";

// Largeur réelle d'une cover selon la grille (voir ProjectGrid.module.scss)
const SIZES = "(max-width: 599px) 50vw, (max-width: 899px) 33vw, (max-width: 1279px) 25vw, 20vw";

type Props = {
  projects: Project[];
  /** Projets visibles (filtre) ; absent : tous visibles, sans animation */
  visibleSlugs?: ReadonlySet<string>;
};

export default function ProjectGrid({ projects, visibleSlugs }: Props) {
  const listRef = useRef<HTMLUListElement | null>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const key = visibleSlugs ? [...visibleSlugs].join("|") : "";
  const lastKey = useRef(key);

  // Rendu d'un nouveau filtre : état affiché capturé AVANT la mise à jour du DOM
  if (key !== lastKey.current && listRef.current && typeof window !== "undefined") {
    flipState.current = Flip.getState(listRef.current.children);
  }

  useLayoutEffect(() => {
    if (key === lastKey.current) return;
    lastKey.current = key;
    const state = flipState.current;
    flipState.current = null;
    // Animation précédente achevée net (styles provisoires retirés) ; repart de l'état capturé
    tl.current?.progress(1).kill();
    if (!state || !listRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (listRef.current) gsap.set(listRef.current.children, { clearProps: "all" });
      return;
    }
    const count = listRef.current.children.length;
    tl.current = Flip.from(state, {
      duration: MOTION.move,
      ease: "power2.inOut",
      absolute: true,
      nested: false,
      prune: true,
      stagger: Math.min(0.015, MOTION.staggerMax / Math.max(1, count)),
      onEnter: (els) =>
        gsap.fromTo(els, { opacity: 0, y: MOTION.shift }, { opacity: 1, y: 0, duration: MOTION.enter, ease: "power2.out", delay: 0.12 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, duration: MOTION.leave, ease: "power1.out" }),
      onComplete: () => {
        if (listRef.current) gsap.set(listRef.current.children, { clearProps: "opacity,transform" });
      },
    });
  }, [key]);

  useLayoutEffect(() => () => void tl.current?.kill(), []);

  return (
    <ul ref={listRef} className={styles.grid}>
      {projects.map((p, i) => {
        const cover = coverOf(p);
        const category = categoryOf(p);
        const hidden = !!visibleSlugs && !visibleSlugs.has(p.slug);
        return (
          <li key={p.slug} className={styles.item} data-flip-id={p.slug} data-filtered={hidden || undefined} aria-hidden={hidden || undefined}>
            <Link href={`/projects/${p.slug}`} className={styles.link} data-cursor="hover">
              <span className={styles.media}>
                {cover && (
                  <Image
                    src={cover}
                    alt=""
                    fill
                    sizes={SIZES}
                    className={styles.image}
                    priority={i < 5}
                  />
                )}
              </span>
              <span className={styles.caption}>
                <span className={styles.title}>{p.title}</span>
                {category && <span className={styles.category}>{category}</span>}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
