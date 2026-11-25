'use client';

// Contextual Widget (BSTRDZ 7.0.7b) — présentation du contenu actif, commune à tous les
// univers : projet Golgotha, produit Simple (focus de la grille), entrée de Bibliothéca.
// Structure unique, blocs conditionnels (aucun champ vide, aucun contrôle inutile) :
// image · univers / méta · titre · accroche · texte · caractéristiques · liens · lecteur audio
// (instance unique, AudioPlayer partagé) · mention provisoire (développement) · CTA Open.
// États : replié (capsule « Info ») ou ouvert ; fermeture par le bouton ou Échap.
// Position : jetons --context-x / --context-y (globals.scss), indépendants du SiteDock.

import AudioPlayer from '@/components/audio/AudioPlayer';
import { useContextWidget, useContextWidgetState } from '@/context/ContextWidgetContext';
import styles from '@/styles/components/ContextWidget.module.scss';
import Image from 'next/image';
import Link from 'next/link';
import { type KeyboardEvent, useEffect, useRef } from 'react';

export const CONTEXT_WIDGET_ID = 'context-widget';

export default function ContextWidget() {
  const { content, isOpen, focusRequest } = useContextWidgetState();
  const { open, close } = useContextWidget();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const capsuleRef = useRef<HTMLButtonElement | null>(null);

  // Ouverture demandée par une action de l'utilisateur (ex. sélection) : focus dans le panneau
  useEffect(() => {
    if (focusRequest && isOpen) requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
  }, [focusRequest, isOpen]);

  if (!content) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      close();
      requestAnimationFrame(() => capsuleRef.current?.focus({ preventScroll: true }));
    }
  };

  const c = content;
  const label = [c.heroTag ? 'Collection piece' : null, c.universe].filter(Boolean).join(' · ');

  return (
    <aside className={styles.widget} data-open={isOpen || undefined} aria-label={`Informations — ${c.title}`} onKeyDown={onKeyDown}>
      {!isOpen && (
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
        hidden={!isOpen}
        data-lenis-prevent=""
      >
        {c.image && (
          <div className={styles.image}>
            <Image key={c.key} src={c.image.src} alt={c.image.alt ?? ''} fill sizes="300px" className={styles.imageInner} />
          </div>
        )}

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
            {c.links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        {c.audio && (
          <div className={styles.audio}>
            <AudioPlayer
              src={c.audio.src}
              title={c.audio.title}
              active={isOpen}
              resumeOnLoad={c.audio.resumeOnLoad}
              onPrev={c.audio.onPrev}
              onNext={c.audio.onNext}
              onPlayingChange={c.audio.onPlayingChange}
            />
          </div>
        )}

        {c.provisional && <p className={styles.provisional}>Données provisoires — prévisualisation locale</p>}

        {c.href && (
          <Link href={c.href} className={styles.cta}>
            {c.ctaLabel ?? 'Open'} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
