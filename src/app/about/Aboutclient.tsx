'use client';

import SectionWithImage from '@/components/image/SectionWithImage';
import styles from '@/styles/pages/About.module.scss';
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';

const sections = [
  {
    title: 'FORGE',
    poem: `Beneath the banner of Bastardz, a monkey waits to rise,
Stars in his eyes, a dream stripped of disguise,
He sails the universe in a capsule of gold,
Seeking new worlds, galaxies yet untold.`,
    imageUrl: '/images/img/jump.png',
  },
  {
    title: 'IDEAL',
    poem: `Through burning veils and shadowed flame,
His heart beats wild at the peril’s name,
Where gravity falters, no chain can bind,
He dances with suns, leaves fate behind.`,
    imageUrl: '/images/img/look.png',
  },
  {
    title: 'PULSE',
    poem: `Each pulsar, each comet, a song without end,
In the cosmic sea, his path will bend,
Bastardz — blacksmith of stellar dreams,
Sends forth his hero where starlight streams.`,
    imageUrl: '/images/img/think.png',
  },
  {
    title: 'SPACE',
    poem: `And we, on Earth, behold his quest,
A monkey, a dream, a fearless chest,
Through endless space, his tale takes fire,
Bastardz paints the heavens in glory’s attire.`,
    imageUrl: '/images/intro/intro_3.webp',
  },
];

export default function AboutClient() {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    sectionRefs.current.forEach((el, i) => {
      if (!el || !imageRefs.current[i]) return;

      gsap.fromTo(
        imageRefs.current[i],
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          scrollTrigger: {
            trigger: el,
            start: 'top center',
            end: 'bottom center',
            toggleActions: 'play reverse play reverse',
          },
          duration: 1,
        }
      );
    });
  }, []);

  return (
    <main className={styles.about}>
      {/* <section className={styles.intro}>
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="heading-1"
        >
          Golgotha
        </motion.h1>
        <p className={styles.subtext}>
          Un manifeste poétique. Une épopée cosmique. Un rêve visuel et sonore
        </p>
      </section> */}

      {sections.map((section, i) => (
        <SectionWithImage
          key={i}
          title={section.title}
          poem={section.poem}
          imageUrl={section.imageUrl}
          innerRef={(el) => {
            sectionRefs.current[i] = el;
          }}
          imageRef={(el) => {
            imageRefs.current[i] = el;
          }}
        />
      ))}
    </main>
  );
}
