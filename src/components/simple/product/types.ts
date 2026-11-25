/** Média de la page produit (cover en premier, puis médias de product.md). */
export type StageMedia =
  | { type: 'image'; url: string; alt: string; width: number | null; height: number | null }
  | { type: 'video'; url: string; poster: string | null }
  | { type: 'embed'; url: string };
