// src/app/contact/page.tsx
// ✅ pas de "use client" ici
import IntroFull from '@/components/fullscreencut/IntroFull';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Talk | Talk', // rendu comme "Talk | Talk — Golgotha" via le template du layout
    description: 'Finding',
    alternates: { canonical: '/contact' },
    openGraph: {
        type: 'website',
        url: '/contact',
        siteName: 'Golgotha',
        title: 'Talk | Talk',
        description: 'Finding',
        images: [{ url: '/images/og/cover.jpg', width: 1200, height: 630, alt: 'Golgotha — Contact' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Talk | Talk',
        description: 'Finding',
        images: ['/images/og/cover.jpg'],
    },
    robots: { index: true, follow: true },
};

export default function ContactPage() {
    const base = 'https://www.bastardz.fr';
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Talk | Talk',
        description: 'Finding',
        url: `${base}/contact`,
        mainEntity: {
            '@type': 'Organization',
            name: 'Golgotha',
            email: 'hello@bastardz.fr',
            url: base,
        },
    };

    return (
        <main>
            <script
                type="application/ld+json"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <IntroFull
                video={{
                    src: '/images/img/blacklight.mp4',
                    type: 'video/mp4',
                    poster: '/images/img/blacklight.png',
                }}
                parallax={15}
            >
                <h1 className="uppercase mix-blend-difference">GLGTH</h1>
                <h1 className="self-end uppercase mix-blend-difference">hello@bastardz.fr</h1>
            </IntroFull>
        </main>
    );
}
