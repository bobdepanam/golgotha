// Route de développement (BSTRDZ 7.0.1) : prototype technique de la galerie spatiale.
// Fichier `page.dev.tsx` : reconnu seulement en `next dev` (pageExtensions, next.config.js),
// donc absent du build de production. Garde supplémentaire : 404 si NODE_ENV=production.
// Non référencée, non indexée. Voir
// src/prototypes/spatial/README.md.
import SpatialPrototypeLoader from '@/prototypes/spatial/SpatialPrototypeLoader';
import type { SpatialItem } from '@/prototypes/spatial/types';
import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'DEV · prototype spatial',
  robots: { index: false, follow: false },
};

/** Fixtures locales (miniatures copiées de Simple), jamais versionnées ni publiées. */
function readFixtures(): SpatialItem[] {
  const dir = path.join(process.cwd(), 'public', '_local-test', 'spatial');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(webp|jpe?g|png)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .map((f) => {
      const slug = f.replace(/\.[^.]+$/, '').replace(/_/g, '-');
      return { slug, title: slug, thumb: `/_local-test/spatial/${f}` };
    });
}

export default function DevSpatialPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <SpatialPrototypeLoader items={readFixtures()} />;
}
