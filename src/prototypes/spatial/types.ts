export type SpatialItem = {
  /** Identifiant stable (slug) : le focus ne dépend jamais de la position dans la liste */
  slug: string;
  /** Miniature (texture) — jamais l'original pleine résolution */
  thumb: string;
  title: string;
};

export type GridTile = SpatialItem & { x: number; y: number; z: number };
