'use client';

// Sélecteur de grille de Projects (V8.0.1) — même emplacement que le sélecteur partagé (haut
// centre, conteneur .toggle de SimpleControls), un seul bouton. Le pictogramme montre le mode
// VERS LEQUEL on bascule : grille compacte (9 petits carrés) ⇄ grille aérée (4 carrés plus
// grands, plus espacés). Les carrés se déplacent et se redimensionnent (transformations CSS) ;
// mouvement réduit : changement immédiat. Simple garde son propre sélecteur (inchangé).
// Modes internes inchangés : 'spatial' = grille compacte, 'list' = grille aérée (List FX).

import { BodyPortal } from '@/components/simple/BodyPortal';
import type { DesktopMode } from '@/components/simple/viewState';
import controls from '@/styles/simple/SimpleControls.module.scss';
import styles from '@/styles/projects/GridModeToggle.module.scss';
import type { CSSProperties } from 'react';

type Cell = { x: number; y: number; s: number };

// Grille compacte : 3 × 3 carrés de 4 (pas de 6) dans un carré de 16
const COMPACT: Cell[] = Array.from({ length: 9 }, (_, i) => ({ x: (i % 3) * 6, y: Math.floor(i / 3) * 6, s: 4 }));
// Grille aérée : 2 × 2 carrés de 6 (pas de 10) ; les 5 autres se replient vers le centre
const AIRY_SLOT: Record<number, [number, number]> = { 0: [0, 0], 2: [10, 0], 6: [0, 10], 8: [10, 10] };
const AIRY: Cell[] = Array.from({ length: 9 }, (_, i) =>
  AIRY_SLOT[i] ? { x: AIRY_SLOT[i][0], y: AIRY_SLOT[i][1], s: 6 } : { x: 8, y: 8, s: 0 }
);

type Props = { mode: DesktopMode; onChange: (m: DesktopMode) => void };

export function GridModeToggle({ mode, onChange }: Props) {
  // Mode cible (affiché par le pictogramme) : l'inverse du mode courant
  const target: DesktopMode = mode === 'spatial' ? 'list' : 'spatial';
  const cells = target === 'list' ? AIRY : COMPACT;
  const label = target === 'list' ? 'Afficher la grille aérée' : 'Afficher la grille compacte';

  return (
    <BodyPortal>
      <div className={controls.toggle} role="group" aria-label="Affichage des projets">
        <button
          type="button"
          className={`${controls.toggleBtn} ${styles.btn}`}
          data-active="true"
          aria-label={label}
          title={label}
          data-cursor="hover"
          onClick={() => onChange(target)}
        >
          <svg className={styles.glyph} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            {cells.map((c, i) => (
              <rect
                key={i}
                className={styles.cell}
                width="1"
                height="1"
                rx="0.12"
                style={{ '--x': `${c.x}px`, '--y': `${c.y}px`, '--s': c.s, '--i': i } as CSSProperties}
              />
            ))}
          </svg>
        </button>
      </div>
    </BodyPortal>
  );
}
