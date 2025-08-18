'use client';

import styles from '@/styles/components/ParallaxText.module.scss';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ReactNode, useRef } from 'react';

type ParallaxSection = {
    imageSrc?: string;
    videoSrc?: string;
    subheading?: string;
    heading?: string;

    /** Option 1 : ReactNode direct (custom JSX) */
    content?: ReactNode;

    /** Option 2 : contenu généré auto */
    contentHeading?: string;
    contentText?: string;
};

type Props = { sections: ParallaxSection[] };

const IMG_PADDING = 12;

export default function ParallaxText({ sections }: Props) {
    return (
        <div className={styles.wrapper}>
            {sections.map((s, idx) => (
                <TextParallaxContent key={idx} section={s} />
            ))}
        </div>
    );
}

function TextParallaxContent({ section }: { section: ParallaxSection }) {
    return (
        <div
            className={styles.section}
            style={{ paddingLeft: IMG_PADDING, paddingRight: IMG_PADDING }}
        >
            {/* --- Colonne gauche : image/vidéo sticky avec overlay --- */}
            <StickyMedia imageSrc={section.imageSrc} videoSrc={section.videoSrc}>
                {section.heading && <OverlayCopy heading={section.heading} />}
            </StickyMedia>

            {/* --- Colonne droite : contenu texte --- */}
            {(section.content || section.contentHeading || section.contentText) && (
                <div className={styles.contentBlock}>
                    <div className={styles.contentGrid}>
                        <aside className={styles.contentAside}>
                            {section.subheading && <h5>{section.subheading}</h5>}
                        </aside>

                        <div className={styles.contentMain}>
                            {section.content ? (
                                section.content
                            ) : (
                                <>
                                    {section.contentHeading && <h3>{section.contentHeading}</h3>}
                                    {section.contentText && <p>{section.contentText}</p>}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StickyMedia({
    imageSrc,
    videoSrc,
    children,
}: {
    imageSrc?: string;
    videoSrc?: string;
    children?: ReactNode;
}) {
    const targetRef = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ['end end', 'end start'],
    });

    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

    return (
        <motion.div
            ref={targetRef}
            className={styles.media}
            style={{
                top: IMG_PADDING,
                height: `calc(100vh - ${IMG_PADDING * 2}px)`,
                scale,
            }}
        >
            {/* Image */}
            {imageSrc && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${imageSrc})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            )}

            {/* Vidéo */}
            {videoSrc && (
                <video
                    src={videoSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
            )}

            {/* Overlay texte (heading) */}
            {children && <div className={styles.overlay}>{children}</div>}

            {/* Fade-out au scroll */}
            <motion.div style={{ opacity }} className="absolute inset-0 bg-black/10" />
        </motion.div>
    );
}

function OverlayCopy({ heading }: { heading?: string }) {
    const targetRef = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ['start end', 'end start'],
    });

    const y = useTransform(scrollYProgress, [0, 1], [200, -200]);
    const opacity = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 1, 0]);

    return (
        <motion.div
            ref={targetRef}
            className={styles.overlayCopy}
            style={{ y, opacity }}
        >
            {heading && <h1>{heading}</h1>}
        </motion.div>
    );
}
