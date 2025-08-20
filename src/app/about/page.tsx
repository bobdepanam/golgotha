// pas de "use client" ici
import IntroFull from '@/components/fullscreencut/IntroFull';
import type { Metadata } from 'next';
import AboutClient from './Aboutclient';

export const metadata: Metadata = {
  title: 'Cave | Canem',
  description: 'Golgotha Verse',
};

export default function AboutPage() {
  return (
    <>
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
