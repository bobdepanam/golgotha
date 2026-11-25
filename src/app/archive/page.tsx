// src/app/archive/page.tsx — Bibliothéca : index global des créations BSTRDZ (7.0.6).
// Réunit les projets Golgotha (content/projects/) et les produits Simple (content/simple/)
// sans fusionner leurs bibliothèques : l'ordre vient de l'index transversal généré
// (src/generated/index.json : date décroissante, ordre stable à date égale), les champs de
// chaque source. Aucune limite d'entrées, aucune répétition. Statuts respectés : brouillons
// uniquement en prévisualisation locale (SHOW_DRAFTS=1), jamais en production.
import ArchiveList, { type ArchiveEntry } from "@/components/archive/ArchiveList";
import { getAllProjects } from "@/lib/content/projects";
import { getAllProducts, getCatalogIndex } from "@/lib/content/simple";
import { toProductDisplay } from "@/lib/content/simple-display";
import styles from "@/styles/pages/Archive.module.scss";
import type { Metadata } from "next";
import { getImageProps } from "next/image";

/** Visuel plein écran du survol : passe par l'optimiseur d'images (production). */
function previewSrc(src: string | null): string | null {
    if (!src) return null;
    return getImageProps({ src, alt: "", width: 1920, height: 1080, quality: 75 }).props.src;
}

/** Entrées de Bibliothéca, dans l'ordre de l'index transversal. */
function archiveEntries(): ArchiveEntry[] {
    const projects = new Map(getAllProjects().map((p) => [p.slug, p]));
    const products = new Map(getAllProducts().map((p) => [p.slug, p]));
    return getCatalogIndex().flatMap((e): ArchiveEntry[] => {
        if (e.collection === "projects") {
            const p = projects.get(e.slug);
            if (!p) return [];
            const category =
                p.projectFieldsFlexible?.category ?? p.projectFields?.category ?? e.category ?? "—";
            return [
                {
                    id: e.id,
                    slug: e.slug,
                    collection: "projects",
                    universe: "Golgotha",
                    href: e.href,
                    title: e.title,
                    year: e.year ? String(e.year) : "",
                    category,
                    cover: e.cover,
                    preview: previewSrc(e.background ?? e.cover),
                    audio: e.audio,
                    tagline: null,
                    provisional: false,
                },
            ];
        }
        const p = products.get(e.slug);
        if (!p) return [];
        const info = toProductDisplay(p);
        return [
            {
                id: e.id,
                slug: e.slug,
                collection: "simple",
                universe: "Simple",
                href: e.href,
                title: e.title,
                year: info.year ?? "",
                category: info.category ?? "—",
                cover: p.cover?.url ?? e.cover,
                preview: previewSrc(p.cover?.url ?? e.background),
                audio: p.audio,
                tagline: info.tagline,
                provisional: info.provisional,
            },
        ];
    });
}

/** ===== SEO ===== */
export const metadata: Metadata = {
    title: "White | Book", // rendu en "White | Book — Golgotha" via le template du layout
    description: "Il biblioteca de projetti",
    alternates: { canonical: "/archive" },
    openGraph: {
        type: "website",
        url: "/archive",
        siteName: "Golgotha",
        title: "White | Book",
        description: "Il biblioteca de projetti",
        images: [{ url: "/images/og/cover.jpg", width: 1200, height: 630, alt: "Golgotha — Archive" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "White | Book",
        description: "Il biblioteca de projetti",
        images: ["/images/og/cover.jpg"],
    },
    robots: { index: true, follow: true },
};

/** ===== Page ===== */
export default function ArchivePage() {
    const entries = archiveEntries();

    // JSON-LD CollectionPage (limité à 20 items pour rester léger)
    const base = "https://www.bastardz.fr";
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "White | Book",
        description: "Il biblioteca de projetti",
        url: `${base}/archive`,
        mainEntity: {
            "@type": "ItemList",
            itemListElement: entries.slice(0, 20).map((e, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${base}${e.href}`,
                name: e.title,
            })),
        },
    };

    return (
        <main className={styles.archive}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <ArchiveList entries={entries} />
        </main>
    );
}
