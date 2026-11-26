// src/app/experiment/page.tsx
import type { Metadata } from "next";
import { getAllProjects } from "@/lib/content/projects";
import ExperimentClient, { type WorldEntry } from "./ExperimentClient";

/**
 * OPEN WORLD (7.1) — galerie transversale : les créations du catalogue (publiées en ligne ;
 * brouillons inclus en développement, aperçus exclus) rejoignent les visuels d'OPEN WORLD.
 * Une seule source de vérité : content/projects (aucune liste parallèle).
 */
function worldCatalog(): WorldEntry[] {
  return getAllProjects()
    // Aperçus exclus ; compositions audio exclues (pas de contenu visuel propre)
    .filter((p) => p.status !== "preview" && p.kind !== "audio")
    .flatMap((p) => {
      const node = p.featuredImage?.node;
      const w = node?.mediaDetails?.width;
      const h = node?.mediaDetails?.height;
      if (!node?.mediaItemUrl || !w || !h) return [];
      const cat = p.projectFields?.category?.trim() || null;
      const blocks = p.projectFieldsFlexible?.contentBlocks ?? [];
      const vblock = blocks.find(
        (b) => b.__typename === "ProjectFieldsFlexibleContentBlocksVideoBlockLayout" && "providerUrl" in b && !!b.providerUrl
      ) as { providerUrl?: string | null } | undefined;
      const video = vblock?.providerUrl && !/youtube|youtu\.be|vimeo/.test(vblock.providerUrl) ? vblock.providerUrl : null;
      const audio =
        p.projectFields?.playerAudio ??
        (blocks.find((b) => "fileUrl" in b && b.fileUrl) as { fileUrl?: string } | undefined)?.fileUrl ??
        null;
      return [
        {
          slug: p.slug,
          title: p.title,
          meta: [cat, p.year].filter(Boolean).join(" · ") || null,
          cover: p.thumbnail ?? node.mediaItemUrl,
          width: p.thumbnailSize?.width ?? w,
          height: p.thumbnailSize?.height ?? h,
          audio,
          video,
          href: `/projects/${p.slug}`,
        },
      ];
    });
}

export const metadata: Metadata = {
    title: "Black | Lab", // rendu comme "Black | Lab — Golgotha" via ton layout
    description: "Explorations visuelles et sonores en terrain infini.",
    alternates: { canonical: "/experiment" },
    openGraph: {
        type: "website",
        url: "/experiment",
        siteName: "Golgotha",
        title: "Black | Lab",
        description: "Explorations visuelles et sonores en terrain infini.",
        images: [{ url: "/images/og/cover.jpg", width: 1200, height: 630, alt: "Golgotha — Experiment" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Black | Lab",
        description: "Explorations visuelles et sonores en terrain infini.",
        images: ["/images/og/cover.jpg"],
    },
    robots: { index: true, follow: true },
};

export default function ExperimentPage() {
    const base = "https://www.bastardz.fr";
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Black | Lab",
        description: "Explorations visuelles et sonores en terrain infini.",
        url: `${base}/experiment`,
    };

    return (
        <>
            <script
                type="application/ld+json"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ExperimentClient catalog={worldCatalog()} />
        </>
    );
}
