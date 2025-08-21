'use client';

import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';
import styles from '@/styles/pages/Archive.module.scss';
import { useMemo, useState } from 'react';

export type ArchiveItem = {
    id: string;
    year?: string | number;
    title: string;
    services?: string;
    media?: { type: 'image' | 'video'; src: string; poster?: string };
    href?: string;
};

export default function ArchiveClient({ items }: { items: ArchiveItem[] }) {
    const firstWithMedia = useMemo(() => items.find((i) => i.media), [items]);
    const [active, setActive] = useState<ArchiveItem | null>(firstWithMedia ?? null);

    const headerRef = useFadeInOnScroll<HTMLDivElement>();
    const listRef = useFadeInOnScroll<HTMLUListElement>();

    return (
        <div className={styles.layout}>
            {/* BACKGROUND MEDIA */}
            <div className={styles.bg} aria-hidden="true">
                {active?.media?.type === 'video' ? (
                    <video
                        key={active.media.src}
                        className={styles.bgVideo}
                        src={active.media.src}
                        poster={active.media.poster}
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                ) : active?.media?.type === 'image' ? (
                    <img
                        key={active.media.src}
                        className={styles.bgImage}
                        src={active.media.src}
                        alt=""
                    />
                ) : null}

                <div className={styles.bgVignette} />
            </div>

            {/* LEFT LIST */}
            <aside className={styles.listWrap}>
                <header ref={headerRef} className={`${styles.header} fadeInHover`}>
                    <span className={styles.colYear}>YEAR</span>
                    <span className={styles.colTitle}>PROJECT</span>
                    <span className={styles.colServices}>SERVICES</span>
                </header>

                <ul ref={listRef} className={`${styles.list} fadeInHover`}>
                    {items.map((item) => {
                        const onEnter = () => setActive(item.media ? item : active);
                        const Content = (
                            <>
                                <span className={styles.colYear}>{item.year ?? ''}</span>
                                <span className={styles.colTitle}>{item.title}</span>
                                <span className={styles.colServices}>{item.services ?? ''}</span>
                            </>
                        );

                        return (
                            <li
                                key={item.id}
                                className={styles.row}
                                onMouseEnter={onEnter}
                                onFocus={onEnter}
                            >
                                {item.href ? (
                                    <a href={item.href} className={styles.rowLink}>
                                        {Content}
                                    </a>
                                ) : (
                                    <div className={styles.rowInner}>{Content}</div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </aside>
        </div>
    );
}
