'use client';

import styles from '@/styles/components/SectionWithImage.module.scss';
import {
    motion,
    useAnimation,
    useInView,
    type Easing,
    type Variants,
} from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, type RefCallback } from 'react';

type SectionProps = {
    title: string;
    poem: string;
    imageUrl: string;
    innerRef?: RefCallback<HTMLElement>;    // non utilisé ici (on snappe sur le wrapper <section>)
    imageRef?: RefCallback<HTMLDivElement>; // pour GSAP fade/scale
};

export default function SectionWithImage({
    title,
    poem,
    imageUrl,
    innerRef,
    imageRef,
}: SectionProps) {
    const localRef = useRef<HTMLElement | null>(null);
    const setRef: RefCallback<HTMLElement> = (el) => {
        localRef.current = el;
        innerRef?.(el);
    };

    const isInView = useInView(localRef, { once: true, amount: 0.4 });
    const controls = useAnimation();

    useEffect(() => { if (isInView) controls.start('visible'); }, [isInView, controls]);

    const variants: Variants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1, y: 0,
            transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as Easing },
        },
    };

    return (
        <div className={styles.section} ref={setRef}>
            <div className={styles.imageWrapper} ref={imageRef} aria-hidden>
                <Image src={imageUrl} alt={title} fill className={styles.image} sizes="100vw" priority />
            </div>

            <motion.h2 className={styles.blockTitle} variants={variants} initial="hidden" animate={controls}>
                {title}
            </motion.h2>

            <motion.p className={styles.poem} variants={variants} initial="hidden" animate={controls}>
                {poem}
            </motion.p>
        </div>
    );
}
