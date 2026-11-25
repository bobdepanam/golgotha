'use client';

// Widget global (bas gauche) : déclencheur « … » qui se déploie en panneau INFO / MENU
// depuis le même ancrage. Fermé, le panneau est découpé (clip-path) à la forme exacte du
// déclencheur ; ouvert, il s'étend vers le haut et la droite. La fermeture « − » occupe la
// place du déclencheur, dans la barre basse du panneau (aucun bouton flottant en plus).
// Styles : SiteDock.module.scss ; déclencheur : DockToggleOverlay.module.scss ;
// géométrie commune : _dock-geometry.scss.
// Compact (petit écran ou faible hauteur) : MENU plein écran (défilement de la page
// bloqué, focus maintenu dans le widget), INFO en feuille pleine largeur.

import { availableDockDestinations, isActiveDestination } from '@/config/navigation';
import { useDockUI } from '@/context/DockUIContext';
import { useProjectTitles } from '@/context/ProjectTitlesContext';
import styles from '@/styles/components/SiteDock.module.scss';
import toggleStyles from '@/styles/components/DockToggleOverlay.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

const PANEL_ID = 'site-dock-panel';
/** Même requête que $dock-compact (_dock-geometry.scss). */
const COMPACT_QUERY = '(max-width: 767px), (max-height: 500px)';
const FOCUSABLE = 'a[href], button:not([disabled]), audio[controls], [tabindex]:not([tabindex="-1"])';

/** Mode compact (client uniquement : utilisé dans les effets, jamais au rendu). */
function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(COMPACT_QUERY);
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return compact;
}

export default function SiteDock() {
  const pathname = usePathname() || '/';
  const { visible, isOpen, view, infoAvailable, toggle, close, setView, setInfoSlot } = useDockUI();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const wasOpen = useRef(false);
  const compact = useCompact();
  const titles = useProjectTitles();
  const destinations = useMemo(() => availableDockDestinations(titles), [titles]);
  // MENU plein écran (compact) : se comporte comme une boîte de dialogue modale.
  const fullscreen = visible && isOpen && view === 'menu' && compact;

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

  // Plein écran : la page derrière ne défile plus ; restauration à la fermeture
  // (fermeture, navigation, passage en INFO ou retour en mode non compact).
  useEffect(() => {
    if (!fullscreen) return;
    const html = document.documentElement;
    const body = document.body;
    const prev = [html.style.overflow, body.style.overflow];
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prev[0];
      body.style.overflow = prev[1];
    };
  }, [fullscreen]);

  if (!visible) return null;

  // Échap : uniquement quand le focus est dans le widget (aucun raccourci global).
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      close();
      requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }));
      return;
    }
    // Plein écran : Tab reste dans le widget (liens visibles + bouton de fermeture du panneau).
    if (e.key === 'Tab' && fullscreen && panelRef.current) {
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const target = view === 'info' ? 'les informations' : 'le menu';

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
        data-view={view}
        className={[styles.panelVars, styles.panel, isOpen ? styles.panelOpen : styles.panelClosed].join(' ')}
        onKeyDown={onKeyDown}
        {...closedAttrs}
      >
        {/* Corps : seul à défiler si le contenu dépasse */}
        <div className={styles.body} data-lenis-prevent="">
          {/* INFO : la page projet y rend ses informations (portail). Reste monté pour ne pas couper l'audio. */}
          <div ref={setInfoSlot} className={styles.view} hidden={view !== 'info'} />

          {/* MENU */}
          <nav className={styles.view} hidden={view !== 'menu'} aria-label="Navigation principale">
            <ul className={styles.navList}>
              {destinations.map((d, i) => {
                const active = isActiveDestination(pathname, d.href);
                return (
                  <li key={d.id} className={active ? styles.navActive : undefined}>
                    <Link
                      href={d.href}
                      className={[styles.navRow, styles.navLink].join(' ')}
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

        {/* Barre basse : fermeture à l'emplacement du déclencheur + bascule INFO / MENU */}
        <div className={styles.bar}>
          <button
            type="button"
            className={styles.close}
            aria-label={`Fermer ${target}`}
            aria-controls={PANEL_ID}
            data-cursor="hover"
            onClick={() => {
              close();
              // Le déclencheur réapparaît au rendu suivant : il reprend alors le focus.
              requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }));
            }}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.5 8h9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
          </button>
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
        </div>
      </div>

      <button
        ref={buttonRef}
        type="button"
        className={[toggleStyles.toggleBtn, isOpen ? toggleStyles.isHidden : ''].join(' ')}
        aria-label={`Ouvrir ${target}`}
        aria-expanded={isOpen}
        aria-controls={PANEL_ID}
        data-cursor="hover"
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="3" cy="8" r="1.25" fill="currentColor" />
          <circle cx="8" cy="8" r="1.25" fill="currentColor" />
          <circle cx="13" cy="8" r="1.25" fill="currentColor" />
        </svg>
      </button>
    </>
  );
}
