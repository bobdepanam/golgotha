'use client';

// Filtres compacts (7.0.9, ancrage haut gauche en 7.0.10) — composant unique, partagé par
// Projects (Grid / List, mobile) et Simple (Grid / List, mobile), dans l'esprit d'un fil
// d'Ariane qui se déploie : fermé, un petit déclencheur (icône) et la catégorie active en
// pastille contrastée ; ouvert, les autres catégories apparaissent vers la droite sur une
// seule ligne si elles tiennent avant le sélecteur Grid / List (haut centre), sinon — écrans
// intermédiaires, petit écran, tactile — dans un petit panneau vertical sous le déclencheur.
// La pastille active ne bouge jamais ; aucun déplacement du layout (options en absolu).
//
// Interactions : survol (périphériques compatibles), clic, clavier (Entrée / Espace / Échap,
// flèches gauche-droite ou haut-bas entre les options). Fermeture après sélection, à la
// sortie du survol (délai court : aucun clignotement entre deux catégories), au clic
// extérieur, à Échap (focus rendu au déclencheur) ou quand le focus quitte le composant.
//
// Focus d'un produit Simple (le Contextual Widget porte un contenu) : les filtres s'effacent
// pour garder un écran de focus épuré ; ils reviennent à la fermeture, catégorie conservée.
// Catégories issues des données (aucune liste figée) ; « All » toujours présent.

import { useContextWidgetState } from '@/context/ContextWidgetContext';
import styles from '@/styles/components/CategoryFilter.module.scss';
import { type CSSProperties, type KeyboardEvent, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { BodyPortal } from '../BodyPortal';
import type { CategoryFilter } from '../viewState';

/** Délai avant fermeture à la sortie du survol (traversée des espaces entre options). */
const LEAVE_DELAY = 220;
const HOVER_QUERY = '(hover: hover) and (pointer: fine)';
/** Demi-largeur réservée au sélecteur Grid / List (haut centre) + marge de respiration */
const CENTER_RESERVE = 64;

type Props = {
  /** `label` : libellé affiché si différent de l'identifiant (ex. slug d'URL pour Projects) */
  categories: { id: string; count: number; label?: string }[];
  active: CategoryFilter;
  onChange: (c: CategoryFilter) => void;
  /** Conservé pour compatibilité des appels : la mise en page s'adapte seule (CSS). */
  variant?: 'desktop' | 'mobile';
};

export function CategoryDock({ categories, active, onChange }: Props) {
  const { content } = useContextWidgetState();
  const [open, setOpen] = useState(false);
  // Ligne (desktop, si la place suffit) ou panneau vertical compact
  const [column, setColumn] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const leaveTimer = useRef<number | null>(null);
  const hoverCapable = useRef(false);
  const listId = useId();

  const options = [{ id: 'all', label: 'All' }, ...categories.map((c) => ({ id: c.id, label: c.label ?? c.id }))];
  const current = options.find((o) => o.id === active) ?? options[0];
  const others = options.filter((o) => o.id !== current.id);
  // Le Contextual Widget occupe le coin : filtres masqués (jamais de chevauchement)
  const hidden = !!content;

  const cancelLeave = () => {
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = null;
  };

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    hoverCapable.current = window.matchMedia(HOVER_QUERY).matches;
    return cancelLeave;
  }, []);

  // Masqué par le widget : toujours refermé
  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  // Disposition : une seule ligne seulement si toutes les catégories tiennent avant le centre
  useLayoutEffect(() => {
    const measure = () => {
      const root = rootRef.current;
      const opts = optionsRef.current;
      if (!root || !opts) return;
      // Largeur naturelle de la ligne, indépendante de la disposition courante (les options
      // gardent leur largeur propre dans les deux cas) : options + écarts + marges internes
      const items = Array.from(opts.children) as HTMLElement[];
      const rowWidth = items.reduce((w, el) => w + el.offsetWidth, 0) + Math.max(0, items.length - 1) * 2 + 8 + 6;
      const available = window.innerWidth / 2 - CENTER_RESERVE - root.getBoundingClientRect().right;
      setColumn(rowWidth > available);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // `open` : mesure à l'ouverture (le calque est monté par le portail après le 1er rendu)
  }, [categories, active, open]);

  // Clic / tap extérieur
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  if (!categories.length) return null; // aucune catégorie connue : pas de filtre à proposer

  const select = (id: string) => {
    onChange(id);
    close(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      close(true);
      return;
    }
    if (!open || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-filter-option]') ?? []);
    if (!items.length) return;
    e.preventDefault();
    const idx = items.indexOf(document.activeElement as HTMLElement);
    // Ordre visuel : options de gauche à droite (ligne) / de haut en bas (panneau)
    const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
    const next = idx < 0 ? (back ? items.length - 1 : 0) : (idx + (back ? -1 : 1) + items.length) % items.length;
    items[next].focus();
  };

  return (
    <BodyPortal>
      <div
        ref={rootRef}
        className={styles.root}
        data-open={open || undefined}
        data-layout={column ? 'column' : 'row'}
        data-hidden={hidden || undefined}
        aria-hidden={hidden || undefined}
        {...(hidden ? ({ inert: '' } as Record<string, string>) : {})}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'mouse' || !hoverCapable.current) return;
          cancelLeave();
          setOpen(true);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== 'mouse' || !hoverCapable.current) return;
          cancelLeave();
          leaveTimer.current = window.setTimeout(() => setOpen(false), LEAVE_DELAY);
        }}
        onBlur={(e) => {
          if (rootRef.current && !rootRef.current.contains(e.relatedTarget as Node | null)) setOpen(false);
        }}
        onKeyDown={onKeyDown}
      >
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={`Filtrer par catégorie — actuel : ${current.label}`}
          data-cursor="hover"
          onClick={() => {
            cancelLeave();
            setOpen((v) => !v);
          }}
        >
          <svg className={styles.icon} width="12" height="10" viewBox="0 0 12 10" aria-hidden="true">
            <rect x="0" y="0.5" width="12" height="1.2" rx="0.6" fill="currentColor" />
            <rect x="2" y="4.4" width="8" height="1.2" rx="0.6" fill="currentColor" />
            <rect x="4" y="8.3" width="4" height="1.2" rx="0.6" fill="currentColor" />
          </svg>
          <span className={styles.active}>{current.label}</span>
        </button>

        <div ref={optionsRef} id={listId} className={styles.options} role="group" aria-label="Catégories">
          {others.map((o, i) => (
            <button
              key={o.id}
              type="button"
              className={styles.option}
              style={{ '--i': i } as CSSProperties}
              data-filter-option=""
              data-cursor="hover"
              tabIndex={open ? 0 : -1}
              onClick={() => select(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </BodyPortal>
  );
}
