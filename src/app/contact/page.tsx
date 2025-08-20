// ✅ pas de "use client" ici
import IntroFull from '@/components/fullscreencut/IntroFull';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Talk | Talk",
    description: "Finding",
};

export default function ContactPage() {
    return (
        <main>
            <IntroFull
                video={{ src: '/images/video/blacklight.mp4', type: 'video/mp4', poster: '/images/video/blacklight.png' }}
                parallax={15}
            >
                <h1 className="uppercase mix-blend-difference">GLGTH</h1>
                <h1 className="self-end uppercase mix-blend-difference">hello@bastardz.fr</h1>
            </IntroFull></main>

    )
}
