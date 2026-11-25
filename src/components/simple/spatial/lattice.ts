// Plan infini : cellule (i, j) → produit. L'infini est une propriété de l'espace, pas du
// catalogue : chaque cellule affiche l'un des N produits réels (mêmes données, mêmes textures).
//   produit(i, j) = (i + j·K) mod N
// Le pas K est choisi pour éloigner au maximum deux occurrences d'un même produit
// (distance minimale du réseau des répétitions, en unités monde). Calculé depuis N :
// aucun nombre de produits n'est supposé.
import { GRID_CONFIG, SPACING_X, SPACING_Y } from './config';

export const mod = (a: number, n: number) => ((a % n) + n) % n;

export function pickStride(n: number): number {
  if (n <= 2) return 1;
  let best = 1;
  let bestDist = -1;
  for (let k = 1; k < n; k++) {
    // Répétition : (di, dj) ≠ 0 avec di + dj·K ≡ 0 (mod n) ; recherche dans un voisinage borné
    let min = Infinity;
    for (let dj = 0; dj <= 12; dj++) {
      const base = mod(-dj * k, n); // di ≡ -dj·K
      for (const di of [base, base - n]) {
        if (dj === 0 && di === 0) continue;
        const d = Math.hypot(di * SPACING_X, dj * SPACING_Y);
        if (d < min) min = d;
      }
    }
    if (min > bestDist) {
      bestDist = min;
      best = k;
    }
  }
  return best;
}

export const itemIndex = (i: number, j: number, n: number, k: number) => mod(i + j * k, n);

/** Profondeur déterministe (formule de Simple, appliquée aux coordonnées logiques). */
export const baseDepth = (i: number, j: number) => Math.sin(i * 1.3 + j * 2.1) * GRID_CONFIG.depthAmount;
