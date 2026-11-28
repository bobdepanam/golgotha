// src/app/archive/page.tsx — Bibliothéca, bibliothèque SONORE de BSTRDZ (V8).
// Même source que Projects (index transversal généré) : aucune seconde base de contenu.
// Sélection (serveur, déterministe) : projets ayant une vraie source audio utilisable et non
// exclus (`bibliotheca: false`) ; une piste publiée sous plusieurs URLs ne compte qu'une fois ;
// les 40 plus récents (publishedAt). Le mélange se fait côté client, après le montage
// (ArchiveList) : aucun écart d'hydratation. Statuts respectés (brouillons : dev uniquement).
import ArchiveList, { type ArchiveEntry } from "@/components/archive/ArchiveList";
import { audioIdentity, isUsableAudio } from "@/lib/content/audio";
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

/** Nombre maximal d'entrées de la bibliothèque sonore */
const MAX_ENTRIES = 40;

/** Projets sonores éligibles, du plus récent au plus ancien, sans doublon de piste, 40 au plus. */
function soundIndex() {
    const seen = new Set<string>();
    return getCatalogIndex()
        .filter((e) => e.collection === "projects" && e.bibliotheca !== false && isUsableAudio(e.audio))
        .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || a.slug.localeCompare(b.slug, "en", { numeric: true }))
        .filter((e) => {
            const key = audioIdentity(e.audio as string);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, MAX_ENTRIES);
}

/** Entrées de Bibliothéca (ordre chronologique ; mélangé à l'affichage). */
function archiveEntries(): ArchiveEntry[] {
    const projects = new Map(getAllProjects().map((p) => [p.slug, p]));
    const products = new Map(getAllProducts().map((p) => [p.slug, p]));
    return soundIndex().flatMap((e): ArchiveEntry[] => {
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
                    thumb: e.thumb ?? e.cover,
                    preview: previewSrc(e.background ?? e.cover),
                    audio: e.audio,
                    kind: e.kind ?? null,
                    video: e.video ?? null,
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
                kind: null,
                video: null,
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
