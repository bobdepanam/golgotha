'use client';

// SiteDock — navigation globale BSTRDZ (7.0.7a), référence du Design System.
//
// Fermé : capsule compacte en bas à gauche — [● accueil /projects] [Menu] [univers actif].
// Ouvert : le panneau se déploie verticalement depuis la capsule, qui persiste en bas ;
// une croix apparaît après « Menu » (emplacement réservé : la pastille ne bouge pas).
// Une seule surface (verre) dont la taille suit exactement son contenu : le panneau s'ouvre
// par une transition de largeur (0 → largeur mesurée du panneau, en px : Chrome, Safari,
// Firefox) et de hauteur (grille 0fr → 1fr). Aucun découpage ; replié, le panneau ne mesure
// rien (padding porté par un conteneur intérieur) ; morphing réversible en clics rapides.
// Contenu du panneau : MENU (destinations) ou INFO (portail des pages projet / Bibliothéca,
// inchangé jusqu'à sa migration en 7.0.7b), bascule Info / Menu si INFO existe.
// Derrière le panneau ouvert : voile léger (clic extérieur = fermeture).
// Clavier : Échap ferme, le focus revient au déclencheur ; petit écran : défilement de la page
// bloqué et tabulation maintenue dans le widget tant qu'il est ouvert.
// État : DockUIContext (inchangé). Styles : SiteDock.module.scss ; jetons : globals.scss (--ds-*).

import { availableDockDestinations, isActiveDestination } from '@/config/navigation';
import { useDockUI } from '@/context/DockUIContext';
import { useProjectTitles } from '@/context/ProjectTitlesContext';
import styles from '@/styles/components/SiteDock.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type CSSProperties, type KeyboardEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';


const PANEL_ID = 'site-dock-panel';
/** Même requête que $dock-compact (_dock-geometry.scss). */
const COMPACT_QUERY = '(max-width: 767px), (max-height: 500px)';
const FOCUSABLE = 'a[href], button:not([disabled]), audio[controls], input, [tabindex]:not([tabindex="-1"])';

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
  const dockRef = useRef<HTMLDivElement | null>(null);
  const capsuleRef = useRef<HTMLDivElement | null>(null);
  const [panelW, setPanelW] = useState(0);
  const wasOpen = useRef(false);
  const compact = useCompact();
  const titles = useProjectTitles();
  const destinations = useMemo(() => availableDockDestinations(titles), [titles]);
  const active = destinations.find((d) => isActiveDestination(pathname, d.href)) ?? null;
  // Petit écran, widget ouvert : se comporte comme une boîte de dialogue modale
  const modal = visible && isOpen && compact;

  // Largeur réelle de la capsule, réservée aux filtres flottants (bas centre) pour éviter
  // toute collision (--dock-capsule-w sur la racine). N'intervient pas dans la forme du dock.
  useEffect(() => {
    const el = capsuleRef.current;
    const root = document.documentElement;
    if (!el) {
      root.style.removeProperty('--dock-capsule-w');
      return;
    }
    const ro = new ResizeObserver(() => {
      root.style.setProperty('--dock-capsule-w', `${Math.ceil(el.getBoundingClientRect().width)}px`);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty('--dock-capsule-w');
    };
  }, [visible]);

  // Largeur naturelle du panneau (MENU, INFO, Bibliothéca) : cible de la transition de largeur
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPanelW(Math.ceil(el.getBoundingClientRect().width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible]);

  // Focus : à l'ouverture → panneau ; à la fermeture, si le focus était dedans → déclencheur.
  useEffect(() => {
    const panel = panelRef.current;
    if (isOpen && !wasOpen.current) {
      requestAnimationFrame(() => panel?.focus({ preventScroll: true }));
    } else if (!isOpen && wasOpen.current && panel?.contains(document.activeElement)) {
      buttonRef.current?.focus({ preventScroll: true });
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  // Petit écran ouvert : la page derrière ne défile plus ; restauration à la fermeture.
  useEffect(() => {
    if (!modal) return;
    const html = document.documentElement;
    const body = document.body;
    const prev = [html.style.overflow, body.style.overflow];
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prev[0];
      body.style.overflow = prev[1];
    };
  }, [modal]);

  if (!visible) return null;

  const closeAndReturn = () => {
    close();
    requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      closeAndReturn();
      return;
    }
    // Petit écran ouvert : Tab reste dans le widget (panneau + capsule)
    if (e.key === 'Tab' && modal && dockRef.current) {
      const items = Array.from(dockRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === first || current === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  // Accueil : /projects (sans relancer l'intro) ; sur /projects filtré, réinitialise le filtre.
  const onHome = (e: MouseEvent<HTMLAnchorElement>) => {
    if (isOpen) close();
    if (pathname !== '/projects' || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (window.location.search || window.location.hash) window.history.replaceState(null, '', '/projects');
  };

  const toggleLabel = view === 'info' ? 'Info' : 'Menu';
  const target = view === 'info' ? 'les informations' : 'le menu';
  // Panneau fermé : hors de l'ordre de tabulation et de l'arbre d'accessibilité.
  const closedAttrs = isOpen ? {} : ({ inert: '' } as Record<string, string>);

  return (
    <>
      {/* Atténuation légère du contenu derrière le menu ouvert ; clic extérieur = fermeture */}
      <div className={styles.scrim} data-open={isOpen || undefined} onClick={closeAndReturn} aria-hidden />

      <div
        ref={dockRef}
        className={styles.dock}
        data-open={isOpen || undefined}
        data-view={view}
        style={{ '--panel-w': panelW ? `${panelW}px` : undefined } as CSSProperties}
        onKeyDown={onKeyDown}
      >
        {/* Enveloppe animée du panneau : largeur 0 → contenu, hauteur 0fr → 1fr */}
        <div className={styles.panelWrap}>
        <div
          ref={panelRef}
          id={PANEL_ID}
          role="region"
          aria-label={view === 'info' ? 'Informations' : 'Navigation'}
          aria-hidden={!isOpen}
          tabIndex={-1}
          data-lenis-prevent=""
          data-view={view}
          className={styles.panel}
          {...closedAttrs}
        >
          <div className={styles.panelInner}>
          {infoAvailable && (
            <div className={styles.switch}>
              <button
                type="button"
                className={styles.switchBtn}
                aria-pressed={view === 'info'}
                data-active={view === 'info' || undefined}
                onClick={() => setView('info')}
              >
                Info
              </button>
              <button
                type="button"
                className={styles.switchBtn}
                aria-pressed={view === 'menu'}
                data-active={view === 'menu' || undefined}
                onClick={() => setView('menu')}
              >
                Menu
              </button>
            </div>
          )}

          <div className={styles.body} data-lenis-prevent="">
            {/* INFO : la page projet / Bibliothéca y rend ses informations (portail). Reste monté
                pour ne pas couper l'audio. */}
            <div ref={setInfoSlot} className={styles.view} hidden={view !== 'info'} />

            {/* MENU */}
            <nav className={styles.view} hidden={view !== 'menu'} aria-label="Navigation principale">
              <ul className={styles.navList}>
                {destinations.map((d, i) => {
                  const isActive = isActiveDestination(pathname, d.href);
                  return (
                    <li key={d.id} style={{ '--i': i } as CSSProperties}>
                      <Link
                        href={d.href}
                        className={styles.navLink}
                        data-active={isActive || undefined}
                        aria-current={pathname === d.href ? 'page' : isActive ? 'true' : undefined}
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
          </div>
        </div>
        </div>

        {/* Capsule : persistante, ouverte comme fermée */}
        <div ref={capsuleRef} className={styles.capsule}>
          <Link href="/projects" className={styles.home} aria-label="Retour aux projets" onClick={onHome}>
            <span className={styles.dot} aria-hidden />
          </Link>
          <button
            ref={buttonRef}
            type="button"
            className={styles.toggle}
            aria-label={isOpen ? `Fermer ${target}` : `Ouvrir ${target}`}
            aria-expanded={isOpen}
            aria-controls={PANEL_ID}
            onClick={toggle}
          >
            <span className={styles.toggleLabel}>{toggleLabel}</span>
            {/* Croix de fermeture : emplacement toujours réservé (la pastille ne bouge pas) */}
            <span className={styles.closeIcon} aria-hidden>
              <i />
              <i />
            </span>
          </button>
          {active && (
            <Link
              href={active.href}
              className={styles.activePill}
              aria-label={`Univers actif : ${active.label}`}
              aria-current={pathname === active.href ? 'page' : undefined}
              onClick={() => isOpen && close()}
            >
              {active.label}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
