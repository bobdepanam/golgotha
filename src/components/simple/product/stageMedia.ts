// Médias de la fiche d'un produit : cover (pleine résolution) puis médias de product.md
// (galeries aplaties), dans l'ordre déclaré. Partagé par la page produit et le mobile.
import type { Product } from '@/types/product';
import type { StageMedia } from './types';

export function stageMedia(p: Product): StageMedia[] {
  const list: StageMedia[] = [];
  if (p.cover) list.push({ type: 'image', url: p.cover.url, alt: p.title, width: p.cover.width, height: p.cover.height });
  for (const m of p.media) {
    if (m.type === 'image') list.push({ type: 'image', url: m.url, alt: m.alt, width: m.width, height: m.height });
    else if (m.type === 'gallery') for (const g of m.images) list.push({ type: 'image', url: g.url, alt: g.alt, width: g.width, height: g.height });
    else if (m.type === 'video' && m.url) list.push({ type: 'video', url: m.url, poster: m.poster?.url ?? null });
    else if (m.type === 'embed') list.push({ type: 'embed', url: m.url });
  }
  return list;
}
