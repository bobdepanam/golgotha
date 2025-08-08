'use client';

import SectionWithImage from '@/components/image/SectionWithImage';
import styles from '@/styles/pages/About.module.scss';
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';

const sections = [
  {
    title: 'FORGERON',
    poem: `On forge des heures pour des instants volés,
Tissant des semaines pour un jour envolé,
On sculpte des jours pour des repas hâtifs,
Et brode des nuits pour des rêves furtifs.

On bâtit l'année pour des pauses éparses,
Et trace sa vie pour une fin en farce,
Au bout du chemin, on compte ses souffles,
Vie, jeu de soi, dans l'ombre qui souffle.

Captifs d'un or fantôme et de liens sociaux,
La vie est une flamme, vivons-la en héros !`,
    imageUrl: '/images/img/jump.png',
  },
  {
    title: 'L’IDÉALISTE',
    poem: `Sous les cieux clairs de l'enfance dorée,
Des courses joyeuses dans les champs enchantés,
L'innocence pour cape, les rêves éveillés,
Le monde, un conte de douceur enivrée.

Un souffle du temps et la magie s'envole,
Un instant suffit, les rêves s'étiolent,
L'idéal fragile en doux souvenir reste,
L'enfance s'efface, mais l'espoir nous berce.`,
    imageUrl: '/images/img/look.png',
  },
  {
    title: 'ABOUT',
    poem: `Sous l'égide du studio Bastardz, un singe prêt à être lancé dans l'espace,
Les étoiles dans ses yeux, un rêve sans carapace,
Il traverse l'univers, dans une capsule dorée,
Cherchant des mondes nouveaux, des galaxies à explorer.

Il brave les ténèbres, les nébuleuses en feu,
Son cœur bat au rythme de l'inconnu périlleux,
Là où la gravité ne peut plus le retenir,
Il danse avec les astres, défiant l'avenir.

Chaque pulsar, chaque comète, une aventure sans fin,
Dans l'immensité cosmique, il trace son chemin,
Le studio Bastardz, forgeron de rêves stellaires,
Lance son héros singe, pionnier de l'univers.

Et nous, sur Terre, observons son voyage fabuleux,
Un singe, un rêve, un souffle audacieux,
Dans l'espace infini, il écrit son histoire,
Bastardz, créatif, peint les cieux de gloire.`,
    imageUrl: '/images/img/think.png',
  },
  {
    title: 'CATCH',
    poem: `Un singe dans l'espace, rêveur des étoiles.
Bastardz forge des héros pour l'univers.
Danser avec les astres, défiant l'infini.
Vers de nouveaux mondes, au-delà des galaxies.
Lancez le singe, pionnier des rêves stellaires.
Un voyage fabuleux, au cœur des nébuleuses.
Rêves sans limites, Bastardz peint le cosmos.
Chaque pulsar, une aventure sans fin.
Bastardz studio, créateur de légendes spatiales.
Un souffle audacieux, dans l'espace infini.`,
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
