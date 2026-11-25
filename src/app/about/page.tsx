// src/app/about/page.tsx — CANEM, page éditoriale commune BSTRDZ (7.0.8).
// Composition de la page About de Simple (CanemExperience). Les anciens visuels de cette
// page sont conservés en brouillons dans content/projects/ (voir le rapport 7.0.8).
// pas de "use client" ici
import CanemExperience from '@/components/canem/CanemExperience';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cave | Canem', // sera rendu comme "Cave | Canem — Golgotha" via le template du layout
  description: 'Golgotha Verse',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    url: '/about',
    siteName: 'Golgotha',
    title: 'Cave | Canem',
    description: 'Golgotha Verse',
    images: [{ url: '/images/og/cover.jpg', width: 1200, height: 630, alt: 'Golgotha — About' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cave | Canem',
    description: 'Golgotha Verse',
    images: ['/images/og/cover.jpg'],
  },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  // JSON-LD minimal (CreativeWork/About page)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Cave | Canem',
    description: 'Golgotha Verse',
    url: 'https://www.bastardz.fr/about',
    image: ['https://www.bastardz.fr/images/og/cover.jpg'],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CanemExperience />
    </>
  );
}
