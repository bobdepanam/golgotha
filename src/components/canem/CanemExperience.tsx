'use client';

// CANEM — page éditoriale commune BSTRDZ (7.0.8), composition de la page About de Simple
// (AboutExperience.tsx, f975918) adaptée au Design System de Golgotha :
// - deux colonnes de texte et une piste d'images centrale, défilement infini local
//   (molette / tactile → cible / courant / vitesse, un seul RAF) ;
// - mobile (< 768 px) ou mouvement réduit : pile statique, défilement natif ;
// - repère éditorial (marque, rôle, lieu) en haut à gauche, zone libre du layout global.
// Non repris de Simple : son header, sa Nav, le lien « ← Back » et Échap → accueil.
// La navigation reste au SiteDock (bas gauche) ; Lenis ignore la page en mode moteur.

import { CANEM_LEFT, CANEM_META, CANEM_RIGHT } from '@/config/canem';
import styles from '@/styles/canem/CanemExperience.module.scss';
import { useEffect, useRef, useState } from 'react';
import { CanemColumn, type CanemColumnHandle } from './CanemColumn';
import { type CanemImageItem, CanemImages, type CanemImagesHandle } from './CanemImages';
import { CANEM_MOTION } from './canemMotion';

const MOBILE_QUERY = '(max-width: 767px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Les cinq visuels de la piste de Simple (copies locales, public/images/canem/)
const TRACK_IMAGES: CanemImageItem[] = [
  { src: '/images/canem/canem-01.webp', alt: '' },
  { src: '/images/canem/canem-02.webp', alt: '' },
  { src: '/images/canem/canem-03.webp', alt: '' },
  { src: '/images/canem/canem-04.webp', alt: '' },
  { src: '/images/canem/canem-05.webp', alt: '' },
];

/** Serveur + premier rendu : mode simple (lisible) ; valeur réelle résolue au montage. */
function useIsSimpleMode(): boolean {
  const [simple, setSimple] = useState(true);

  useEffect(() => {
    const mqMobile = window.matchMedia(MOBILE_QUERY);
    const mqReduced = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setSimple(mqMobile.matches || mqReduced.matches);
    update();
    mqMobile.addEventListener('change', update);
    mqReduced.addEventListener('change', update);
    return () => {
      mqMobile.removeEventListener('change', update);
      mqReduced.removeEventListener('change', update);
    };
  }, []);

  return simple;
}

export default function CanemExperience() {
  const isSimple = useIsSimpleMode();

  const rootRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<CanemColumnHandle>(null);
  const rightRef = useRef<CanemColumnHandle>(null);
  const imagesRef = useRef<CanemImagesHandle>(null);

  useEffect(() => {
    if (isSimple) return undefined;

    const state = { target: 0, current: 0, velocity: 0 };
    const startedAt = performance.now();
    let touchY: number | null = null;
    let rafId = 0;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      state.target += e.deltaY * CANEM_MOTION.wheelFactor;
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (touchY === null || y === undefined) return;
      state.target += (touchY - y) * CANEM_MOTION.touchFactor;
      touchY = y;
      e.preventDefault();
    };
    const onTouchEnd = () => {
      touchY = null;
    };

    const root = rootRef.current;
    root?.addEventListener('wheel', onWheel, { passive: false });
    root?.addEventListener('touchstart', onTouchStart, { passive: true });
    root?.addEventListener('touchmove', onTouchMove, { passive: false });
    root?.addEventListener('touchend', onTouchEnd, { passive: true });

    const tick = (now: number) => {
      const elapsedMs = now - startedAt;
      state.velocity = (state.target - state.current) * CANEM_MOTION.scrollEase;
      state.current += state.velocity;

      const viewportHeight = window.innerHeight;
      leftRef.current?.update(state.current, state.velocity, elapsedMs, viewportHeight);
      // Colonne droite plus lente : flux asymétrique, pas un miroir synchronisé
      rightRef.current?.update(
        state.current * CANEM_MOTION.rightColumnSpeedFactor,
        state.velocity * CANEM_MOTION.rightColumnSpeedFactor,
        elapsedMs,
        viewportHeight
      );
      imagesRef.current?.update(state.current);

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      root?.removeEventListener('wheel', onWheel);
      root?.removeEventListener('touchstart', onTouchStart);
      root?.removeEventListener('touchmove', onTouchMove);
      root?.removeEventListener('touchend', onTouchEnd);
    };
  }, [isSimple]);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-mode={isSimple ? 'simple' : 'engine'}
      data-lenis-prevent={isSimple ? undefined : ''}
    >
      <div className={styles.meta}>
        <h1 className={styles.brand}>{CANEM_META.brand}</h1>
        <p className={styles.metaLine}>{CANEM_META.role}</p>
        <p className={styles.metaLine}>{CANEM_META.location}</p>
      </div>

      <div className={styles.columns}>
        <div className={styles.textSlot}>
          <CanemColumn paragraphs={CANEM_LEFT} reverse={false} simple={isSimple} ref={leftRef} />
        </div>
        <div className={styles.imageSlot}>
          <CanemImages images={TRACK_IMAGES} simple={isSimple} ref={imagesRef} />
        </div>
        <div className={styles.textSlot}>
          <CanemColumn paragraphs={CANEM_RIGHT} reverse simple={isSimple} ref={rightRef} />
        </div>
      </div>
    </div>
  );
}
