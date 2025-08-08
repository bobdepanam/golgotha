'use client';

import styles from '@/styles/components/SectionWithImage.module.scss';
import type { Easing, Variants } from "framer-motion";
import { motion, useAnimation, useInView } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

type SectionProps = {
    title: string;
    poem: string;
    imageUrl: string;
    innerRef?: React.Ref<HTMLElement>;
    imageRef?: (el: HTMLDivElement | null) => void;
};

const SectionWithImage = ({ title, poem, imageUrl, innerRef, imageRef }: SectionProps) => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.4 });
    const controls = useAnimation();

    useEffect(() => {
        if (isInView) {
            controls.start('visible');
        }
    }, [isInView, controls]);

    const variants: Variants = {
        hidden: {
            opacity: 0,
            y: 40,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.25, 0.1, 0.25, 1] as Easing, // ✅ Cast ici
            },
        },
    };



    return (
        <section className={styles.section} ref={innerRef}>
            <div className={styles.imageWrapper} ref={imageRef}>
                <Image src={imageUrl} alt={title} fill className={styles.image} priority />
            </div>

            <motion.h2
                className={styles.blockTitle}
                variants={variants}
                initial="hidden"
                animate={controls}
                ref={sectionRef}
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
        </section>
    );
};

export default SectionWithImage;
