// /simple — collection SIMPLE (BSTRDZ 7.0.3) : galerie spatiale, liste List FX, mobile DOM.
// Données : src/generated/simple.json (content/simple/). Sans produit servi : 404.
// Univers en aperçu (7.0.1) : produits « preview » servis par URL directe, noindex.
import SimpleExperience from '@/components/simple/SimpleExperience';
import { stageMedia } from '@/components/simple/product/stageMedia';
import type { SimpleItem } from '@/components/simple/types';
import { SIMPLE_UNIVERSE } from '@/config/navigation';
import { getAllProducts } from '@/lib/content/simple';
import { toProductDisplay } from '@/lib/content/simple-display';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Simple',
  description: 'Simple — collection BSTRDZ.',
  alternates: { canonical: '/simple' },
  // Univers en aperçu (7.0.1, src/config/universes.json) : accessible, jamais indexé
  ...(SIMPLE_UNIVERSE !== 'published' ? { robots: { index: false, follow: false } } : {}),
};

export default function SimplePage() {
  const items: SimpleItem[] = getAllProducts()
    .filter((p) => p.thumb?.url)
    .map((p) => {
      const info = toProductDisplay(p);
      return {
        slug: p.slug,
        title: p.title,
        category: info.category,
        thumb: p.thumb!.url,
        width: p.thumb!.width ?? p.cover?.width ?? 600,
        height: p.thumb!.height ?? p.cover?.height ?? 800,
        blurDataURL: p.blurDataURL,
        info,
        media: stageMedia(p),
      };
    });
  if (!items.length) notFound();
  return <SimpleExperience items={items} />;
}
