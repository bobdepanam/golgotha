"use client";

import styles from "@/styles/projects/ProjectGrid.module.scss";
import type { FlexibleContentBlock, Project } from "@/types/project";
import Image from "next/image";
import { memo, useCallback, useState } from "react";
import ProjectCard from "./ProjectCard";

// récupère une image depuis le flexible (poster / image / gallery[0])
function getFirstFlexibleCover(blocks?: FlexibleContentBlock[] | null): string | null {
    if (!blocks) return null;
    for (const b of blocks) {
        if (b.__typename === "ProjectFieldsFlexibleContentBlocksVideoBlockLayout") {
            const u = b.poster?.node?.mediaItemUrl;
            if (u) return u;
        }
    }
    for (const b of blocks) {
        if (b.__typename === "ProjectFieldsFlexibleContentBlocksImageBlockLayout") {
            const u = b.image?.node?.mediaItemUrl;
            if (u) return u;
        }
    }
    for (const b of blocks) {
        if (b.__typename === "ProjectFieldsFlexibleContentBlocksGalleryBlockLayout") {
            const n0 = b.images?.nodes?.find((n) => n?.mediaItemUrl)?.mediaItemUrl;
            if (n0) return n0;
        }
    }
    return null;
}

type Props = { projects: Project[] };

type GridCardsProps = {
    projects: Project[];
    openPreview: (src: string) => void;
    closePreview: () => void;
};

type GridCardItemProps = {
    title: string;
    slug: string;
    cover: string;
    category: string;
    index: number;
    openPreview: (src: string) => void;
    closePreview: () => void;
};

const GridCardItem = memo(function GridCardItem({
    title,
    slug,
    cover,
    category,
    index,
    openPreview,
    closePreview,
}: GridCardItemProps) {
    const handleCaptionHover = useCallback(
        (hover: boolean) => {
            if (hover) openPreview(cover);
            else closePreview();
        },
        [openPreview, closePreview, cover]
    );

    return (
        <div className={styles.gridItem}>
            <ProjectCard
                title={title}
                slug={slug}
                coverUrl={cover}
                category={category}
                index={index}
                onCaptionHover={handleCaptionHover}
            />
        </div>
    );
});

const GridCards = memo(
    function GridCards({ projects, openPreview, closePreview }: GridCardsProps) {
        return (
            <section className={styles.grid}>
                {projects.map((p, i) => {
                    const cover =
                        p.image ||
                        p.projectFields?.mainImage?.node?.mediaItemUrl ||
                        getFirstFlexibleCover(p.projectFieldsFlexible?.contentBlocks) ||
                        "/images/placeholder.jpg";

                    const category =
                        p.projectFieldsFlexible?.category?.trim() ||
                        p.projectFields?.category?.trim() ||
                        "";

                    return (
                        <GridCardItem
                            key={p.slug}
                            title={p.title}
                            slug={p.slug}
                            cover={cover}
                            category={category}
                            index={i}
                            openPreview={openPreview}
                            closePreview={closePreview}
                        />
                    );
                })}
            </section>
        );
    },
    (prev, next) =>
        prev.projects === next.projects &&
        prev.openPreview === next.openPreview &&
        prev.closePreview === next.closePreview
);

type GridPreviewOverlayProps = {
    preview: string | null;
};

const GridPreviewOverlay = memo(function GridPreviewOverlay({
    preview,
}: GridPreviewOverlayProps) {
    if (!preview) return null;

    return (
        <div className={styles.preview}>
            <Image
                src={preview}
                alt="Preview"
                fill
                className={styles.previewImage}
                priority={false}
            />
        </div>
    );
});

export default function ProjectGridTest({ projects }: Props) {
    const [preview, setPreview] = useState<string | null>(null);
    const openPreview = useCallback((src: string) => setPreview(src), []);
    const closePreview = useCallback(() => setPreview(null), []);

    return (
        <>
            <div className={styles.gridShell}>
                <GridCards
                    projects={projects}
                    openPreview={openPreview}
                    closePreview={closePreview}
                />
            </div>

            <GridPreviewOverlay preview={preview} />
        </>
    );
}
