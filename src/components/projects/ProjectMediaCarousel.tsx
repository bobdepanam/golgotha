'use client';

// Navigation horizontale entre les médias d'un même projet (V8.0.4) — activée seulement quand
// le projet en compte plusieurs (un seul média : page plein écran inchangée, ce composant n'est
// pas utilisé). Chaque média garde l'espace plein écran et son cadrage habituels ; aucune carte,
// aucune marge, aucune boucle ni défilement automatique.
//
// Commandes : flèches (gauche / droite, visibles seulement s'il y a un média de ce côté),
// touches ← →, glisser à la souris, balayage tactile horizontal (le défilement vertical reste
// natif : touch-action pan-y), trackpad horizontal (la molette verticale n'est jamais détournée).
// Jamais déclenché depuis un lecteur, un champ ou un contrôle (audio, vidéo avec commandes,
// widget, SiteDock). Aucun compteur ni pagination : les chevrons suffisent (V8.0).
//
// Ressources : seuls le média courant et ses voisins sont montés (chargement prioritaire du
// courant, préchargement des voisins, rien au-delà) ; les vidéos hors écran sont en pause.
// Le moteur audio global n'est jamais touché : la bande-son continue d'un média à l'autre.
// GSAP pour le déplacement ; mouvement réduit : changement immédiat. Tout est nettoyé au démontage.

import styles from '@/styles/projects/ProjectMediaCarousel.module.scss';
import { gsap } from 'gsap';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  count: number;
  /** Contenu d'un média ; `active` : média affiché (lecture vidéo autorisée) */
  renderSlide: (index: number, active: boolean) => ReactNode;
  label: string;
};

const DRAG_LOCK = 8; // px avant de décider de l'axe d'un geste
const SWIPE_RATIO = 0.18; // part de la largeur à parcourir pour changer de média
const WHEEL_STEP = 40; // cumul horizontal (trackpad) pour changer de média
const WHEEL_COOLDOWN = 550; // ms entre deux changements au trackpad

/** Éléments sur lesquels un geste ne doit jamais changer de média */
const IGNORE = 'input, textarea, select, button, a, [contenteditable], video[controls], iframe, [data-no-swipe]';

export default function ProjectMediaCarousel({ count, renderSlide, label }: Props) {
  const [index, setIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const indexRef = useRef(0);
  indexRef.current = index;

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const go = useCallback(
    (next: number) => {
      const target = Math.max(0, Math.min(count - 1, next));
      if (target !== indexRef.current) setIndex(target);
      else settle(target); // retour en place après un geste insuffisant
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count]
  );

  // Position de la piste (en % de sa largeur) : GSAP, immédiate en mouvement réduit
  const settle = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    gsap.killTweensOf(track);
    const vars = { xPercent: (-i * 100) / count, x: 0 };
    if (reduced()) gsap.set(track, vars);
    else gsap.to(track, { ...vars, duration: 0.6, ease: 'power3.out' });
  };

  useEffect(() => {
    settle(index);
    // Vidéos hors écran : en pause (les voisines montées ne jouent jamais)
    rootRef.current?.querySelectorAll<HTMLElement>('[data-slide]').forEach((slide) => {
      const active = Number(slide.dataset.slide) === index;
      slide.querySelectorAll('video').forEach((v) => {
        if (!active) v.pause();
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Clavier : ← → (hors champs, lecteurs et widgets)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('input, textarea, select, [contenteditable], #context-widget, #site-dock-panel')) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(indexRef.current + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(indexRef.current - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  // Glisser / balayer (souris, tactile, stylet) et trackpad horizontal
  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;
    let start: { x: number; y: number; id: number } | null = null;
    let axis: 'x' | 'y' | null = null;
    let dx = 0;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest(IGNORE)) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      axis = null;
      dx = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const mx = e.clientX - start.x;
      const my = e.clientY - start.y;
      if (!axis) {
        if (Math.abs(mx) < DRAG_LOCK && Math.abs(my) < DRAG_LOCK) return;
        axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
        if (axis === 'x') {
          root.setPointerCapture(e.pointerId);
          gsap.killTweensOf(track);
        }
      }
      if (axis !== 'x') return;
      // Résistance aux extrémités (pas de boucle)
      const atEdge = (indexRef.current === 0 && mx > 0) || (indexRef.current === count - 1 && mx < 0);
      dx = atEdge ? mx * 0.3 : mx;
      gsap.set(track, { x: dx });
    };
    const onUp = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      if (axis === 'x') {
        const w = root.clientWidth || 1;
        if (dx < -w * SWIPE_RATIO) go(indexRef.current + 1);
        else if (dx > w * SWIPE_RATIO) go(indexRef.current - 1);
        else settle(indexRef.current);
      }
      start = null;
      axis = null;
      dx = 0;
    };
    // Un geste horizontal suivi d'un clic ne doit pas ouvrir / activer quoi que ce soit
    const onClickCapture = (e: MouseEvent) => {
      if (Math.abs(dx) > DRAG_LOCK) e.stopPropagation();
    };

    let wheelAcc = 0;
    let wheelLock = 0;
    const onWheel = (e: WheelEvent) => {
      // Seuls les gestes nettement horizontaux (trackpad) ; la molette verticale reste au document
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = performance.now();
      if (now < wheelLock) return;
      wheelAcc += e.deltaX;
      if (Math.abs(wheelAcc) >= WHEEL_STEP) {
        go(indexRef.current + (wheelAcc > 0 ? 1 : -1));
        wheelAcc = 0;
        wheelLock = now + WHEEL_COOLDOWN;
      }
    };

    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    root.addEventListener('click', onClickCapture, true);
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      root.removeEventListener('click', onClickCapture, true);
      root.removeEventListener('wheel', onWheel);
      gsap.killTweensOf(track);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, go]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      ref={rootRef}
      className={styles.carousel}
      role="region"
      aria-roledescription="carrousel"
      aria-label={`${label} — ${count} médias`}
      data-lenis-prevent-horizontal=""
    >
      <div ref={trackRef} className={styles.track} style={{ width: `${count * 100}%` }}>
        {Array.from({ length: count }, (_, i) => {
          const near = Math.abs(i - index) <= 1; // courant + voisins montés, rien au-delà
          return (
            <div
              key={i}
              className={styles.slide}
              style={{ width: `${100 / count}%` }}
              data-slide={i}
              aria-hidden={i !== index || undefined}
              aria-roledescription="média"
              aria-label={`${pad(i + 1)} / ${pad(count)}`}
              {...(i !== index ? ({ inert: '' } as Record<string, string>) : {})}
            >
              {near ? renderSlide(i, i === index) : null}
            </div>
          );
        })}
      </div>

      {index > 0 && (
        <button type="button" className={`${styles.arrow} ${styles.prev}`} onClick={() => go(index - 1)} aria-label="Média précédent" data-cursor="hover">
          <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
            <path d="M7 1 1 7l6 6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {index < count - 1 && (
        <button type="button" className={`${styles.arrow} ${styles.next}`} onClick={() => go(index + 1)} aria-label="Média suivant" data-cursor="hover">
          <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
            <path d="m1 1 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

    </div>
  );
}
