'use client';

// Piste d'images de CANEM — portage React 18 de Simple (AboutImages.tsx, f975918) :
// « contrepoint calme », même duplication + boucle translateY que les colonnes, sans
// distorsion ; se déplace en bloc, en sens inverse et plus lentement que le texte
// (CANEM_MOTION.imageSpeedFactor), en niveaux de gris. Mode `simple` : une copie statique.

import styles from '@/styles/canem/CanemImages.module.scss';
import Image from 'next/image';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { CANEM_MOTION, wrap } from './canemMotion';

export interface CanemImagesHandle {
  update: (offset: number) => void;
}

export interface CanemImageItem {
  src: string;
  alt: string;
}

interface CanemImagesProps {
  images: CanemImageItem[];
  simple?: boolean;
}

// Même `sizes` dans les deux modes : mêmes URL candidates, aucun double téléchargement
const TRACK_SIZES = '(max-width: 767px) 90vw, 20vw';

export const CanemImages = forwardRef<CanemImagesHandle, CanemImagesProps>(function CanemImages(
  { images, simple = false },
  ref
) {
  const repeats = CANEM_MOTION.imageRepeats;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const firstBlockRef = useRef<HTMLDivElement>(null);
  const blockHeightRef = useRef(0);

  const measure = useCallback(() => {
    if (simple) return;
    const block = firstBlockRef.current;
    if (block) blockHeightRef.current = block.getBoundingClientRect().height;
  }, [simple]);

  useLayoutEffect(() => {
    measure();
  }, [measure, images]);

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.cancelAnimationFrame(frame);
    };
  }, [measure]);

  useImperativeHandle(
    ref,
    () => ({
      update: (offset) => {
        if (simple) return;
        const blockHeight = blockHeightRef.current;
        if (blockHeight <= 0 || !wrapperRef.current) return;
        const wrapped = wrap(offset * CANEM_MOTION.imageSpeedFactor, blockHeight);
        wrapperRef.current.style.transform = `translateY(${-wrapped}px)`;
      },
    }),
    [simple]
  );

  if (simple) {
    return (
      <div className={styles.simpleBlock}>
        {images.map((img, idx) => (
          <div key={idx} className={styles.item}>
            <Image src={img.src} alt={img.alt} fill sizes={TRACK_SIZES} className={styles.image} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {Array.from({ length: repeats }, (_, copyIndex) => (
        <div
          key={copyIndex}
          className={styles.block}
          ref={copyIndex === 0 ? firstBlockRef : undefined}
          aria-hidden={copyIndex === 0 ? undefined : true}
        >
          {images.map((img, idx) => (
            <div key={idx} className={styles.item}>
              <Image
                src={img.src}
                alt={copyIndex === 0 ? img.alt : ''}
                fill
                sizes={TRACK_SIZES}
                className={styles.image}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});
