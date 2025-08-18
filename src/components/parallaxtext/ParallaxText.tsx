'use client';

import styles from '@/styles/components/ParallaxText.module.scss';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ReactNode, useRef } from 'react';

type ParallaxSection = {
    imageSrc?: string;
    videoSrc?: string;
    subheading?: string;
    heading?: string;

    /** Option 1 : tu donnes un ReactNode (ex: <><h3/> <p/></>) */
    content?: ReactNode;

    /** Option 2 : tu donnes du texte simple, et on génère le h3 + p */
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
        <div className={styles.section} style={{ paddingLeft: IMG_PADDING, paddingRight: IMG_PADDING }}>
            <StickyMedia imageSrc={section.imageSrc} videoSrc={section.videoSrc} />
            {/* <OverlayCopy subheading={section.subheading} heading={section.heading} /> */}
            <OverlayCopy heading={section.heading} />

            {/* --- Bloc contenu 2 colonnes sous la section --- */}
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

function StickyMedia({ imageSrc, videoSrc }: { imageSrc?: string; videoSrc?: string }) {
    const targetRef = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ['end end', 'end start'],
    });

    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
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
            {/* image de fond via CSS si imageSrc */}
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

            {/* vidéo de fond si videoSrc */}
            {videoSrc && (
                <video
                    src={videoSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
            )}

            <motion.div style={{ opacity }} className="absolute inset-0" />
        </motion.div>
    );
}

function OverlayCopy({
    // subheading,
    heading,
}: {
    // subheading?: string;
    heading?: string;
}) {
    const targetRef = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ['start end', 'end start'],
    });

    const y = useTransform(scrollYProgress, [0, 1], [250, -250]);
    const opacity = useTransform(scrollYProgress, [0.25, 0.5, 0.75], [0, 1, 0]);

    return (
        <motion.div ref={targetRef} className={styles.overlay} style={{ y, opacity }}>
            {/* {subheading && <h5>{subheading}</h5>} */}
            {heading && <h1>{heading}</h1>}
        </motion.div>
    );
}
