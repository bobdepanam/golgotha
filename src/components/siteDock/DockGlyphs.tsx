// Pictogrammes du SiteDock (7.0.1) — remplacent les index 01, 02… à droite des destinations.
// Propositions PROVISOIRES, abstraites et monochromes : remplacer librement le contenu d'une
// entrée par son propre SVG (viewBox 14 × 14 conseillé, `currentColor`, trait fin).
// Décoratifs (aria-hidden) : le libellé du lien suffit à sa compréhension.
import type { ReactNode } from 'react';

const GLYPHS: Record<string, ReactNode> = {
  // GOLGOTHA : intersection verticale, traverse décalée vers le haut
  projects: (
    <>
      <path d="M7 1.5v11" />
      <path d="M3.5 5h7" />
      <circle cx="7" cy="5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  // SIMPLE : carré ouvert
  simple: <path d="M10.5 3.5h-7v7h7V7" />,
  // CANEM : cercle traversé (orbite)
  about: (
    <>
      <circle cx="7" cy="7" r="4" />
      <path d="M1.5 9.5 12.5 4.5" />
    </>
  ),
  // BIBLIOTHÉCA : constellation de points reliés
  archive: (
    <>
      <path d="M3 10.5 6 4l3.5 3.5L11.5 3" />
      <circle cx="3" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="6" cy="4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="3" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  // TALK : onde de transmission
  contact: (
    <>
      <path d="M2 7c1.2-2.4 2.4-2.4 3.6 0s2.4 2.4 3.6 0 2.4-2.4 3.3-.6" />
      <circle cx="2" cy="7" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
};

export function DockGlyph({ id, className }: { id: string; className?: string }) {
  const glyph = GLYPHS[id];
  if (!glyph) return null;
  return (
    <svg
      className={className}
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {glyph}
    </svg>
  );
}
