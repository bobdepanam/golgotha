import { GRID_CONFIG } from './config';
import type { GridTile, SpatialItem } from './types';

/** Positions monde des tuiles, centrées ; profondeur sinusoïdale déterministe (Simple). */
export function computeGridLayout(items: SpatialItem[]): GridTile[] {
  const { columns, tileWidth, tileHeight, gap, depthAmount } = GRID_CONFIG;
  const spacingX = tileWidth + gap;
  const spacingY = tileHeight + gap;
  const cols = Math.min(columns, Math.max(1, items.length));
  const rows = Math.ceil(items.length / cols);
  const totalW = cols * spacingX - gap;
  const totalH = rows * spacingY - gap;
  return items.map((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      ...item,
      x: col * spacingX - totalW / 2 + tileWidth / 2,
      y: -(row * spacingY) + totalH / 2 - tileHeight / 2,
      z: Math.sin(col * 1.3 + row * 2.1) * depthAmount,
    };
  });
}

/** Demi-étendue de la grille (normalisation de la courbure), depuis le nombre réel d'éléments. */
export function gridHalfExtents(count: number) {
  const cols = Math.min(GRID_CONFIG.columns, Math.max(1, count));
  const rows = Math.max(1, Math.ceil(count / cols));
  return {
    halfW: (cols * (GRID_CONFIG.tileWidth + GRID_CONFIG.gap)) / 2,
    halfH: (rows * (GRID_CONFIG.tileHeight + GRID_CONFIG.gap)) / 2,
  };
}
