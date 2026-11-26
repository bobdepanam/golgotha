'use client';

// Contextual Widget (BSTRDZ 7.0.7b) — présentation du contenu actif, commune à tous les
// univers : projet Golgotha, produit Simple (focus de la grille), entrée de Bibliothéca.
// Structure unique, blocs conditionnels (aucun champ vide, aucun contrôle inutile) :
// image · univers / méta · titre · accroche · texte · caractéristiques · liens · lecteur audio
// (instance unique, AudioPlayer partagé) · CTA Open (Simple). Aucune mention « provisoire » affichée (7.0.10).
// États : replié (capsule « Info ») ou ouvert ; fermeture par le bouton ou Échap.
// Morphing (7.0.1, grammaire du SiteDock) : une seule surface, ancrée en haut à droite, dont
// la largeur et la hauteur passent de la capsule au panneau (GSAP) ; le contenu apparaît
// après le début de l'expansion (séquencé, CSS) et s'efface avant la contraction. Contenus
// jamais déformés (seulement découpés) ; le panneau — et le lecteur audio — restent montés.
// Position : jetons --context-x / --context-y (globals.scss), indépendants du SiteDock.

import AudioPlayer from '@/components/audio/AudioPlayer';
import WidgetMedia from '@/components/contextWidget/WidgetMedia';
import { useContextWidget, useContextWidgetState } from '@/context/ContextWidgetContext';
import { MOTION } from '@/lib/motion/tokens';
import styles from '@/styles/components/ContextWidget.module.scss';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { type KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';

const MORPH = MOTION.morph; // morphing de surface (≈ SiteDock)
const FADE_OUT = MOTION.instant; // retrait du contenu avant contraction

export const CONTEXT_WIDGET_ID = 'context-widget';

export default function ContextWidget() {
  const { content, isOpen, focusRequest } = useContextWidgetState();
  const { open, close } = useContextWidget();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const capsuleRef = useRef<HTMLButtonElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  // État affiché (suit isOpen, avec un temps de retrait du contenu à la fermeture)
  const [shown, setShown] = useState(isOpen);
  const from = useRef<{ w: number; h: number } | null>(null);
  const focusCapsule = useRef(false);

  const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ouverture : surface mesurée, puis panneau affiché ; fermeture : contenu effacé d'abord
  useEffect(() => {
    if (isOpen === shown) {
      // Réouverture pendant le retrait du contenu : retrait annulé, contenu rétabli
      const items = panelRef.current ? Array.from(panelRef.current.children) : [];
      if (items.length && gsap.isTweening(items[0])) {
        gsap.killTweensOf(items);
        gsap.set(items, { clearProps: 'opacity' });
      }
      return;
    }
    const el = surfaceRef.current;
    const capture = () => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      from.current = { w: r.width, h: r.height };
    };
    if (!el || reduced()) {
      setShown(isOpen);
      return;
    }
    gsap.killTweensOf(el);
    if (isOpen) {
      capture();
      setShown(true);
      return;
    }
    const items = panelRef.current ? Array.from(panelRef.current.children) : [];
    gsap.to(items, {
      opacity: 0,
      duration: FADE_OUT,
      ease: 'power1.in',
      overwrite: true,
      onComplete: () => {
        capture();
        gsap.set(items, { clearProps: 'opacity' });
        setShown(false);
      },
    });
  }, [isOpen, shown]);

  // Nouvel état rendu : taille animée depuis la précédente vers la taille naturelle
  useLayoutEffect(() => {
    const el = surfaceRef.current;
    const prev = from.current;
    from.current = null;
    if (!shown && focusCapsule.current) {
      focusCapsule.current = false;
      capsuleRef.current?.focus({ preventScroll: true });
    }
    if (!el || !prev) return;
    gsap.set(el, { clearProps: 'width,height' });
    const r = el.getBoundingClientRect();
    if (Math.abs(r.width - prev.w) < 1 && Math.abs(r.height - prev.h) < 1) return;
    gsap.fromTo(
      el,
      { width: prev.w, height: prev.h },
      { width: r.width, height: r.height, duration: MORPH, ease: MOTION.ease.surface, overwrite: true, clearProps: 'width,height' }
    );
  }, [shown]);

  useEffect(() => () => void (surfaceRef.current && gsap.killTweensOf(surfaceRef.current)), []);

  // Ouverture demandée par une action de l'utilisateur (ex. sélection) : focus dans le panneau
  useEffect(() => {
    if (focusRequest && isOpen && shown) requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
  }, [focusRequest, isOpen, shown]);

  if (!content) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      focusCapsule.current = true; // focus rendu à la capsule une fois la contraction lancée
      close();
    }
  };

  const c = content;
  const label = [c.heroTag ? 'Collection piece' : null, c.universe].filter(Boolean).join(' · ');

  return (
    <aside className={styles.widget} data-open={isOpen || undefined} aria-label={`Informations — ${c.title}`} onKeyDown={onKeyDown}>
      <div ref={surfaceRef} className={styles.surface} data-shown={shown || undefined}>
      {!shown && (
        <button ref={capsuleRef} type="button" className={styles.capsule} onClick={open} aria-expanded={false} aria-controls={CONTEXT_WIDGET_ID}>
          <span className={styles.capsuleLabel}>Info</span>
          <span className={styles.capsuleTitle}>{c.title}</span>
        </button>
      )}

      <div
        ref={panelRef}
        id={CONTEXT_WIDGET_ID}
        className={styles.panel}
        tabIndex={-1}
        hidden={!shown}
        data-lenis-prevent=""
      >
        <WidgetMedia image={c.image} video={c.video} active={isOpen && shown} />

        <header className={styles.header}>
          <div className={styles.headerText}>
            {label && <p className={styles.label}>{label}</p>}
            {c.meta && <p className={styles.meta}>{c.meta}</p>}
            <h2 className={styles.title}>{c.title}</h2>
            {c.tagline && <p className={styles.tagline}>{c.tagline}</p>}
          </div>
          <button type="button" className={styles.close} onClick={close} aria-label="Fermer les informations">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {c.summary && <p className={styles.summary}>{c.summary}</p>}
        {c.bodyHtml && <div className={styles.body} dangerouslySetInnerHTML={{ __html: c.bodyHtml }} />}

        {c.specs && c.specs.length > 0 && (
          <dl className={styles.specs}>
            {c.specs.map((s) => (
              <div key={s.label} className={styles.specRow}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {c.links && c.links.length > 0 && (
          <ul className={styles.links}>
            {c.links.map((l) => {
              const external = !/^(mailto|tel):/i.test(l.url);
              return (
                <li key={l.url}>
                  <a
                    href={l.url}
                    className={l.thumb ? styles.linkWithThumb : undefined}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {l.thumb && (
                      <span className={styles.linkThumb} aria-hidden>
                        <Image src={l.thumb} alt="" fill sizes="40px" />
                      </span>
                    )}
                    <span className={styles.linkLabel}>{l.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}

        {c.audio && (
          <div className={styles.audio}>
            <AudioPlayer
              src={c.audio.src}
              title={c.audio.title}
              origin={c.audio.origin ?? null}
              active={isOpen}
              resumeOnLoad={c.audio.resumeOnLoad}
              onPrev={c.audio.onPrev}
              onNext={c.audio.onNext}
              onPlayingChange={c.audio.onPlayingChange}
            />
          </div>
        )}

        {c.href && (
          <Link href={c.href} className={styles.cta}>
            {c.ctaLabel ?? 'Open'} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
      </div>
    </aside>
  );
}
