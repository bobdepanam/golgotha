// src/app/about/page.tsx — CANEM, page éditoriale commune BSTRDZ (7.0.8 ; manifeste 7.1).
// Composition de la page About de Simple (CanemExperience). Les anciens visuels de cette
// page sont conservés en brouillons dans content/projects/ (voir le rapport 7.0.8).
// pas de "use client" ici
import CanemExperience from '@/components/canem/CanemExperience';
import type { Metadata } from 'next';

// Identité éditoriale BSTRDZ (7.1, docs/bstrdz-editorial-identity.md). Le layout global ajoute
// « — Golgotha » aux titres : surcharge locale par `title.absolute` (layout inchangé).
const DESCRIPTION =
  'An ongoing exploration of matter, image, sound and movement. From the physical to the digital, through craft, experimentation and experience.';
const OG_TITLE = 'BSTRDZ — Cave | Canem';
const OG_DESCRIPTION = 'From cotton to code. From ink to sound. Different mediums. One instinct.';
const OG_ALT = 'BSTRDZ — Matter / Signal / Experience';

export const metadata: Metadata = {
  title: { absolute: 'Cave | Canem — BSTRDZ' },
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    url: '/about',
    siteName: 'BSTRDZ',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [{ url: '/images/og/cover.jpg', width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
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
    description: DESCRIPTION,
    url: 'https://www.bastardz.fr/about',
    image: ['https://www.bastardz.fr/images/og/cover.jpg'],
    about: { '@type': 'Organization', name: 'BSTRDZ', slogan: 'Matter / Signal / Experience', url: 'https://www.bastardz.fr' },
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
