// src/app/about/page.tsx
// pas de "use client" ici
import IntroFull from '@/components/fullscreencut/IntroFull';
import type { Metadata } from 'next';
import AboutClient from './Aboutclient';

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
      <AboutClient />

      {/* tu peux laisser IntroFull après, il prendra tout l’écran aussi */}
      <section style={{ minHeight: '100vh' }}>
        <IntroFull
          backgroundImage="/images/video/particules.png"
          parallax={12}
          priority
        >
          <h1 className="uppercase mix-blend-difference">Chaque silence révèle</h1>
          <h1 className="self-end uppercase mix-blend-difference">un désir enfoui</h1>
        </IntroFull>
      </section>
    </>
  );
}
