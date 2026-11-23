'use client';

// Widget global : bouton rond ≡ / × (bas centre) + panneau INFO / MENU.
// Réutilise les classes et animations du dock des pages projet (Slugpage.module.scss)
// et le style du bouton existant (DockToggleOverlay.module.scss).

import { DOCK_DESTINATIONS, isActiveDestination } from '@/config/navigation';
import { useDockUI } from '@/context/DockUIContext';
import styles from '@/styles/components/SiteDock.module.scss';
import toggleStyles from '@/styles/components/DockToggleOverlay.module.scss';
import slug from '@/styles/projects/Slugpage.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type KeyboardEvent, useEffect, useRef } from 'react';

const PANEL_ID = 'site-dock-panel';

export default function SiteDock() {
  const pathname = usePathname() || '/';
  const { visible, isOpen, view, infoAvailable, toggle, close, setView, setInfoSlot } = useDockUI();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const wasOpen = useRef(false);

  // Focus : à l'ouverture → panneau ; à la fermeture, si le focus était dedans → bouton.
  useEffect(() => {
    const panel = panelRef.current;
    if (isOpen && !wasOpen.current) {
      requestAnimationFrame(() => panel?.focus({ preventScroll: true }));
    } else if (!isOpen && wasOpen.current && panel?.contains(document.activeElement)) {
      buttonRef.current?.focus({ preventScroll: true });
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  if (!visible) return null;

  // Échap : uniquement quand le focus est dans le widget (aucun raccourci global).
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      close();
      buttonRef.current?.focus({ preventScroll: true });
    }
  };

  const target = view === 'info' ? 'les informations du projet' : 'le menu';
  const label = isOpen ? `Fermer ${target}` : `Ouvrir ${target}`;

  // Panneau fermé : hors de l'ordre de tabulation et de l'arbre d'accessibilité.
  const closedAttrs = isOpen ? {} : ({ inert: '' } as Record<string, string>);

  return (
    <>
      <div
        ref={panelRef}
        id={PANEL_ID}
        role="region"
        aria-label={view === 'info' ? 'Informations du projet' : 'Navigation'}
        aria-hidden={!isOpen}
        tabIndex={-1}
        data-lenis-prevent=""
        className={[styles.panelVars, slug.detailsSticky, isOpen ? slug.isOpen : slug.isClosed].join(' ')}
        onKeyDown={onKeyDown}
        {...closedAttrs}
      >
        {infoAvailable && (
          <div className={styles.switch}>
            <button
              type="button"
              className={[styles.switchBtn, view === 'info' ? styles.switchActive : ''].join(' ')}
              aria-pressed={view === 'info'}
              onClick={() => setView('info')}
            >
              Info
            </button>
            <span className={styles.switchSep} aria-hidden>
              /
            </span>
            <button
              type="button"
              className={[styles.switchBtn, view === 'menu' ? styles.switchActive : ''].join(' ')}
              aria-pressed={view === 'menu'}
              onClick={() => setView('menu')}
            >
              Menu
            </button>
          </div>
        )}

        {/* INFO : la page projet y rend ses informations (portail). Reste monté pour ne pas couper l'audio. */}
        <div ref={setInfoSlot} className={styles.view} hidden={view !== 'info'} />

        {/* MENU */}
        <nav className={styles.view} hidden={view !== 'menu'} aria-label="Navigation principale">
          <ul className={styles.navList}>
            {DOCK_DESTINATIONS.map((d, i) => {
              const active = isActiveDestination(pathname, d.href);
              return (
                <li key={d.id} className={active ? styles.navActive : undefined}>
                  <Link
                    href={d.href}
                    className={[slug.detailLine, styles.navLink].join(' ')}
                    aria-current={pathname === d.href ? 'page' : active ? 'true' : undefined}
                    onClick={close}
                  >
                    <span className={styles.navLabel}>{d.label}</span>
                    <span className={styles.navIndex} aria-hidden>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <button
        ref={buttonRef}
        type="button"
        className={toggleStyles.toggleBtn}
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={PANEL_ID}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span aria-hidden>{isOpen ? '×' : '≡'}</span>
      </button>
    </>
  );
}
