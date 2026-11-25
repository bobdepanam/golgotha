// src/app/contact/page.tsx
// ✅ pas de "use client" ici
import TalkContext from '@/components/contact/TalkContext';
import IntroFull from '@/components/fullscreencut/IntroFull';
import { CONTACT } from '@/config/contact';
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
            email: CONTACT.email,
            url: base,
        },
    };

    return (
        <main>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <IntroFull
                video={{
                    src: '/images/img/blacklight.mp4',
                    type: 'video/mp4',
                    // 7.0.9 : poster .webp existant (l'ancien .png n'existait plus)
                    poster: '/images/img/blacklight.webp',
                }}
                parallax={15}
            >
                {/* 7.0.9 : plus d'adresse flottante ; le contact est dans le Contextual Widget */}
                <h1 className="sr-only">Talk</h1>
            </IntroFull>
            <TalkContext />
        </main>
    );
}
