// Repris tel quel de Simple (scroll-gallery/editorialLayout.ts).
// Deterministic per-index visual variation for the editorial scroll — no
// Math.random (must be stable between renders and between server/client).
// A small cycling pattern, not 126 hand-authored configs.
export interface LayoutPreset {
  align:    'left' | 'center' | 'right';
  widthPct: number; // of the gallery's content column
  ratio:    number; // width / height for the image box (object-fit: cover)
  parallax: number; // relative intensity, roughly 0.3–1.2
}

const PRESETS: LayoutPreset[] = [
  { align: 'left',   widthPct: 34, ratio: 0.75, parallax: 0.5 },
  { align: 'right',  widthPct: 42, ratio: 0.9,  parallax: 1.0 },
  { align: 'center', widthPct: 28, ratio: 1.0,  parallax: 0.3 },
  { align: 'left',   widthPct: 46, ratio: 0.7,  parallax: 1.2 },
  { align: 'right',  widthPct: 26, ratio: 0.8,  parallax: 0.6 },
  { align: 'center', widthPct: 36, ratio: 0.75, parallax: 0.9 },
  { align: 'left',   widthPct: 24, ratio: 1.1,  parallax: 0.4 },
];

// index is the item's position within a single cycle (0..124), not its
// position in the flattened/repeated render list — so the pattern always
// starts the same way at the top of each appended cycle.
export function getEditorialLayout(index: number): LayoutPreset {
  return PRESETS[index % PRESETS.length];
}
