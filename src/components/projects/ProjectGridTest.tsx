"use client";

import styles from "@/styles/projects/ProjectGrid.module.scss";
import type { FlexibleContentBlock, Project } from "@/types/project";
import Image from "next/image";
import { useState } from "react";
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
            const n0 = b.images?.nodes?.find(n => n?.mediaItemUrl)?.mediaItemUrl;
            if (n0) return n0;
        }
    }
    return null;
}

type Props = { projects: Project[] };

export default function ProjectGridTest({ projects }: Props) {
    const [preview, setPreview] = useState<string | null>(null);

    return (
        <>
            <section className={styles.grid}>
                {projects.map((p) => {
                    const cover =
                        p.image ||
                        p.projectFields?.mainImage?.node?.mediaItemUrl ||
                        getFirstFlexibleCover(p.projectFieldsFlexible?.contentBlocks) ||
                        "/images/placeholder.jpg";

                    const category = p.projectFields?.category?.trim() || "";

                    return (
                        <div key={p.slug} className={styles.gridItem}>
                            <ProjectCard
                                title={p.title}
                                slug={p.slug}
                                coverUrl={cover}
                                category={category}
                                // 👇 Fullscreen preview déclenché SEULEMENT via le caption
                                onCaptionHover={(hover) => setPreview(hover ? cover : null)}
                            />
                        </div>
                    );
                })}
            </section>

            {/* Overlay plein écran (reprend le style existant) */}
            {preview && (
                <div className={styles.preview}>
                    <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className={styles.previewImage}
                        priority={false}
                    />
                </div>
            )}
        </>
    );
}
