'use client';

// SiteDock — navigation globale BSTRDZ (7.0.7a), référence du Design System.
//
// Fermé : capsule minimale en bas à gauche — [● déclencheur du menu] [univers actif].
// Le rond devient carré au survol, puis croix à l'ouverture, au même emplacement : la pastille
// ne bouge jamais (7.0.8). Le libellé « Menu » n'apparaît que sur petit écran.
// Ouvert : le panneau se déploie verticalement depuis la capsule, qui persiste en bas.
// Une seule surface (verre) dont la taille suit exactement son contenu : le panneau s'ouvre
// par une transition de largeur (0 → largeur mesurée du panneau, en px : Chrome, Safari,
// Firefox) et de hauteur (grille 0fr → 1fr). Aucun découpage ; replié, le panneau ne mesure
// rien (padding porté par un conteneur intérieur) ; morphing réversible en clics rapides.
// Contenu du panneau : MENU (destinations) et, séparé, le CTA Open World (7.0.7b).
// Navigation exclusivement : le contenu contextuel est porté par le Contextual Widget.
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
import { type CSSProperties, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';


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
  const { visible, isOpen, toggle, close } = useDockUI();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [panelW, setPanelW] = useState(0);
  const wasOpen = useRef(false);
  const compact = useCompact();
  const titles = useProjectTitles();
  const destinations = useMemo(() => availableDockDestinations(titles), [titles]);
  const active = destinations.find((d) => isActiveDestination(pathname, d.href)) ?? null;
  // Petit écran, widget ouvert : se comporte comme une boîte de dialogue modale
  const modal = visible && isOpen && compact;

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
        style={{ '--panel-w': panelW ? `${panelW}px` : undefined } as CSSProperties}
        onKeyDown={onKeyDown}
      >
        {/* Enveloppe animée du panneau : largeur 0 → contenu, hauteur 0fr → 1fr */}
        <div className={styles.panelWrap}>
        <div
          ref={panelRef}
          id={PANEL_ID}
          role="region"
          aria-label="Navigation"
          aria-hidden={!isOpen}
          tabIndex={-1}
          data-lenis-prevent=""
          className={styles.panel}
          {...closedAttrs}
        >
          <div className={styles.panelInner}>
          <div className={styles.body} data-lenis-prevent="">
            <nav aria-label="Navigation principale">
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

          {/* Open World : séparé des destinations principales (CTA contrasté) */}
          <div className={styles.footer}>
            <Link href="/experiment" className={styles.openWorld} onClick={close}>
              <span>Open World</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
          </div>
        </div>
        </div>

        {/* Capsule : persistante, ouverte comme fermée */}
        <div className={styles.capsule}>
          <button
            ref={buttonRef}
            type="button"
            className={styles.trigger}
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isOpen}
            aria-controls={PANEL_ID}
            onClick={toggle}
          >
            {/* Rond → carré (survol) → croix (ouvert), même emplacement */}
            <span className={styles.mark} aria-hidden>
              <i />
              <i />
            </span>
            <span className={styles.triggerLabel}>Menu</span>
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
