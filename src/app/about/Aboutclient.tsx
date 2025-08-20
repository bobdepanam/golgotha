'use client';

import SectionWithImage from '@/components/image/SectionWithImage';
import ParallaxText from '@/components/parallaxtext/ParallaxText';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const DATA = [
  {
    title: 'FORGE',
    poem:
      `Beneath the banner of Bastardz, a monkey waits to rise, Stars in his eyes, a dream stripped of disguise, He sails the universe in a capsule of gold, Seeking new worlds, galaxies yet untold.`,
    imageUrl: '/images/img/jump.png',
  },
  {
    title: 'IDEAL',
    poem:
      `Through burning veils and shadowed flame, His heart beats wild at the peril’s name, Where gravity falters, no chain can bind, He dances with suns, leaves fate behind.`,
    imageUrl: '/images/img/look.png',
  },
  {
    title: 'PULSE',
    poem:
      `Each pulsar, each comet, a song without end, In the cosmic sea, his path will bend, Bastardz — blacksmith of stellar dreams, Sends forth his hero where starlight streams.`,
    imageUrl: '/images/img/think.png',
  },
  {
    title: 'SPACE',
    poem:
      `And we, on Earth, behold his quest, A monkey, a dream, a fearless chest, Through endless space, his tale takes fire, Bastardz paints the heavens in glory’s attire.`,
    imageUrl: '/images/intro/intro_3.webp',
  },
];

export default function AboutClient() {
  // sections pour le “soft snap” + conteneurs image pour l’anim GSAP
  const snapSectionsRef = useRef<(HTMLElement | null)[]>([]);
  const imgRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const lenis = (window as any)?.lenis;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic

    const ctx = gsap.context(() => {
      // Effets fade/scale sur images
      snapSectionsRef.current.forEach((sectionEl, i) => {
        const imgEl = imgRefs.current[i - 1]; // i=0 = ParallaxText (pas d'imageRef), images commencent à 0 pour DATA
        if (!sectionEl || !imgEl) return;

        gsap.set(imgEl, { autoAlpha: 0, scale: 1.06, yPercent: 6, willChange: 'transform, opacity' });

        gsap.to(imgEl, {
          autoAlpha: 1,
          scale: 1,
          yPercent: 0,
          ease: 'power2.out',
          duration: 1.2,
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top 70%',
            end: 'bottom 60%',
            toggleActions: 'play reverse play reverse',
          },
        });
      });

      // Soft snap entre sections (piloté par Lenis si dispo)
      const secs = snapSectionsRef.current.filter(Boolean) as HTMLElement[];
      secs.forEach((sec, i) => {
        ScrollTrigger.create({
          trigger: sec,
          start: 'top 65%',
          end: 'bottom 35%',
          onLeave: () => {
            const next = secs[i + 1];
            if (next && lenis?.scrollTo) lenis.scrollTo(next, { duration: 0.8, easing: ease });
          },
          onLeaveBack: () => {
            const prev = secs[i - 1];
            if (prev && lenis?.scrollTo) lenis.scrollTo(prev, { duration: 0.8, easing: ease });
          },
        });
      });

      if (lenis) {
        lenis.on?.('scroll', () => ScrollTrigger.update());
        ScrollTrigger.addEventListener('refresh', () => lenis.update?.());
      }

      ScrollTrigger.refresh();
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* SECTION 0 : Parallax video/text (100vh) */}
      <section
        style={{ minHeight: '100vh' }}
        ref={(el) => { snapSectionsRef.current[0] = el; }} // ✅ ne retourne rien
      >
        <ParallaxText
          sections={[
            {
              videoSrc: '/images/video/Falling_HD.mp4',
              subheading: 'watch over your skin',
              heading: 'It braves the darkness',
            },
          ]}
        />
      </section>

      {/* SECTIONS 1..4 : images/poèmes (100vh) */}
      {DATA.map((item, idx) => (
        <section
          key={item.title}
          style={{ minHeight: '100vh' }}
          ref={(el) => { snapSectionsRef.current[idx + 1] = el; }} // ✅ ne retourne rien
        >
          <SectionWithImage
            title={item.title}
            poem={item.poem}
            imageUrl={item.imageUrl}
            // innerRef inutile ici (on hook le <section> parent pour le snap)
            imageRef={(el) => { imgRefs.current[idx] = el; }} // ✅ ne retourne rien
          />
        </section>
      ))}
    </>
  );
}
