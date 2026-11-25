'use client';

// Panneau produit mobile plein écran (Simple : mobile-grid/MobileProjectOverlay.tsx) :
// une entrée d'historique par ouverture (le Retour du téléphone ferme, robuste au StrictMode),
// verrouillage du défilement compatible iOS, focus déplacé puis rendu, Échap, animation
// Framer Motion (fondu simple sous reduced-motion). Contenu : médias + informations produit.
import styles from '@/styles/simple/SimpleMobile.module.scss';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { type RefObject, useCallback, useEffect, useId, useLayoutEffect, useRef } from 'react';
import { BodyPortal } from '../BodyPortal';
import { ProductInfo } from '../product/ProductInfo';
import type { SimpleItem } from '../types';
import { MobileMediaCarousel } from './MobileMediaCarousel';

type Props = {
  item: SimpleItem | null;
  onClose: () => void;
  onExited: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

export function MobileProjectOverlay({ item, onClose, onExited, returnFocusRef }: Props) {
  return (
    <BodyPortal>
      <AnimatePresence onExitComplete={onExited}>
        {item && <OverlayPanel key={item.slug} item={item} onClose={onClose} returnFocusRef={returnFocusRef} />}
      </AnimatePresence>
    </BodyPortal>
  );
}

function OverlayPanel({ item, onClose, returnFocusRef }: { item: SimpleItem; onClose: () => void; returnFocusRef: RefObject<HTMLElement | null> }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const overlayId = useId();
  const pendingPopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Historique : une entrée par ouverture (même chemin : Interlude ne joue aucune transition)
  useEffect(() => {
    if (pendingPopRef.current !== null) {
      clearTimeout(pendingPopRef.current);
      pendingPopRef.current = null;
    }
    const current = window.history.state as { overlayId?: string } | null;
    if (current?.overlayId !== overlayId) window.history.pushState({ ...(window.history.state ?? {}), simpleOverlay: true, overlayId }, '');
    const handlePopState = () => onClose();
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      pendingPopRef.current = setTimeout(() => {
        pendingPopRef.current = null;
        if ((window.history.state as { overlayId?: string } | null)?.overlayId === overlayId) window.history.back();
      }, 0);
    };
  }, [onClose, overlayId]);

  // Verrouillage du défilement (iOS) : le corps est figé à sa position, rétablie à la fermeture
  useLayoutEffect(() => {
    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = { position: style.position, top: style.top, left: style.left, right: style.right };
    style.position = 'fixed';
    style.top = `-${scrollY}px`;
    style.left = '0';
    style.right = '0';
    return () => {
      style.position = prev.position;
      style.top = prev.top;
      style.left = prev.left;
      style.right = prev.right;
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' as ScrollBehavior });
    };
  }, []);

  useEffect(() => {
    closeBtnRef.current?.focus();
    const trigger = returnFocusRef.current;
    return () => trigger?.focus();
  }, [returnFocusRef]);

  const requestClose = useCallback(() => window.history.back(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose]);

  const media = item.media;
  const first = media[0];
  const reduced = useReducedMotion();
  const hidden = reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.99 };
  const shown = reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 };

  return (
    <motion.div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} — project details`}
      initial={hidden}
      animate={shown}
      exit={hidden}
      transition={{ duration: reduced ? 0.15 : 0.26, ease: [0.25, 0, 0, 1] }}
    >
      <button ref={closeBtnRef} type="button" className={styles.closeBtn} onClick={requestClose} aria-label="Close project">
        <svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <div className={styles.scroll} data-lenis-prevent="">
        <div className={styles.mediaWrap}>
          {media.length > 1 ? (
            <MobileMediaCarousel media={media} title={item.title} />
          ) : first?.type === 'video' ? (
            <video src={first.url} poster={first.poster ?? item.thumb} autoPlay muted loop playsInline preload="metadata" aria-label={item.title} className={styles.videoMedia} />
          ) : first?.type === 'image' ? (
            <Image
              src={first.url}
              alt={item.title}
              fill
              sizes="100vw"
              style={{ objectFit: 'cover' }}
              className={styles.fadeImg}
              placeholder={item.blurDataURL ? 'blur' : 'empty'}
              blurDataURL={item.blurDataURL ?? undefined}
              priority
            />
          ) : null}
        </div>

        <div className={styles.overlayInfo}>
          <ProductInfo info={item.info} />
          <Link href={`/simple/${item.slug}`} className={styles.openLink}>
            Open <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
