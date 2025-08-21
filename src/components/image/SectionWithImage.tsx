'use client';

import ShaderHoverImage from '@/components/shaders/ShaderHoverImage'; // WebGL shader (hover effect)
import styles from '@/styles/components/SectionWithImage.module.scss';
import {
    motion,
    useAnimation,
    useInView,
    type Easing,
    type Variants,
} from 'framer-motion';
import { useEffect, useRef, type RefCallback } from 'react';

type SectionProps = {
    title: string;
    poem: string;
    imageUrl: string;
    innerRef?: RefCallback<HTMLElement>;    // Pour déclencher GSAP etc.
    imageRef?: RefCallback<HTMLDivElement>; // Pour des effets spécifiques sur l’image
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

    useEffect(() => {
        if (isInView) controls.start('visible');
    }, [isInView, controls]);

    const variants: Variants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as Easing },
        },
    };

    return (
        <div className={styles.section} ref={setRef}>
            {/* IMAGE DE FOND + SHADER HOVER */}
            <div className={styles.imageWrapper} ref={imageRef} aria-hidden>
                <ShaderHoverImage
                    src={imageUrl}
                    className={styles.shaderImage}
                    enableOnTouch={false}   // pas de survol sur mobile
                    maxDpr={1.5}            // GPU usage raisonnable
                    strength={0.6}          // intensité de l’effet
                />
            </div>

            {/* CONTENU TEXTE (titre + poème) */}
            <motion.h2
                className={styles.blockTitle}
                variants={variants}
                initial="hidden"
                animate={controls}
            >
                {title}
            </motion.h2>

            <motion.p
                className={styles.poem}
                variants={variants}
                initial="hidden"
                animate={controls}
            >
                {poem}
            </motion.p>
        </div>
    );
}
