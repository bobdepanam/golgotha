// src/app/archive/page.tsx
import { fetchGraphQL } from "@/lib/api";
import {
    getAllProjectsQuery,
    getArchiveProjectsQuery,
} from "@/lib/graphql/queries";
import styles from "@/styles/pages/Archive.module.scss";
import type { Metadata } from "next";
import Link from "next/link";

/** ===== Types util ===== */
type Maybe<T> = T | null | undefined;
type ImgNode = { mediaItemUrl?: string | null; sourceUrl?: string | null };

type FlexibleVideoBlock = {
    __typename: "ProjectFieldsFlexibleContentBlocksVideoBlockLayout";
    poster?: { node?: ImgNode | null } | null;
};

type FlexibleImageBlock = {
    __typename: "ProjectFieldsFlexibleContentBlocksImageBlockLayout";
    image?: { node?: ImgNode | null } | null;
};

type FlexibleOtherBlock = { __typename: string }; // catch-all

type Project = {
    title: string;
    slug: string;
    date?: string;
    /** WordPress native featured image */
    featuredImage?: { node?: ImgNode | null } | null;
    /** ACF classique */
    projectFields?: {
        category?: string | null;
        videoFullscreen?: string | null;
        mainImage?: { node?: ImgNode | null } | null;
    } | null;
    /** ACF flexible */
    projectFieldsFlexible?: {
        category?: string | null;
        contentBlocks?: Array<
            FlexibleVideoBlock | FlexibleImageBlock | FlexibleOtherBlock
        > | null;
    } | null;
};

/** ===== Type Guards ===== */
function isFlexVideoBlock(
    b: FlexibleVideoBlock | FlexibleImageBlock | FlexibleOtherBlock
): b is FlexibleVideoBlock {
    return (
        (b as FlexibleVideoBlock).__typename ===
        "ProjectFieldsFlexibleContentBlocksVideoBlockLayout"
    );
}

function isFlexImageBlock(
    b: FlexibleVideoBlock | FlexibleImageBlock | FlexibleOtherBlock
): b is FlexibleImageBlock {
    return (
        (b as FlexibleImageBlock).__typename ===
        "ProjectFieldsFlexibleContentBlocksImageBlockLayout"
    );
}

/** ===== Helpers ===== */
function getYearFromDate(date?: string): string {
    if (!date) return "";
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? "" : String(d.getFullYear());
}

/** Choisit une image de couverture priorisée :
 * 1) featuredImage (WP natif)
 * 2) ACF Flexible : poster (video) puis image
 * 3) ACF Classique : mainImage
 */
function pickCover(project: Project): string | undefined {
    // 1) featured
    const fi =
        project.featuredImage?.node?.mediaItemUrl ??
        project.featuredImage?.node?.sourceUrl;
    if (fi) return fi;

    // 2) flexible (poster d’abord)
    const blocks = project.projectFieldsFlexible?.contentBlocks ?? [];
    for (const b of blocks) {
        if (isFlexVideoBlock(b)) {
            const u = b.poster?.node?.mediaItemUrl;
            if (u) return u;
        }
    }
    for (const b of blocks) {
        if (isFlexImageBlock(b)) {
            const u = b.image?.node?.mediaItemUrl;
            if (u) return u;
        }
    }

    // 3) classique
    const legacy = project.projectFields?.mainImage?.node?.mediaItemUrl;
    if (legacy) return legacy;

    return undefined;
}

/** Catégorie : Flexible > Classique > "—" */
function pickCategory(project: Project): string {
    return (
        project.projectFieldsFlexible?.category ??
        project.projectFields?.category ??
        "—"
    );
}

/** ===== Fetch ===== */
async function getArchiveProjects(): Promise<Project[]> {
    // On tente la requête archive (si offsetPagination est dispo côté WPGraphQL)
    const data = await fetchGraphQL(getArchiveProjectsQuery).catch(() => null);

    if (data?.projects?.nodes) {
        return data.projects.nodes as Project[];
    }

    // Fallback : on récupère tout puis on saute les 4 plus récents côté JS
    const all = await fetchGraphQL(getAllProjectsQuery);
    const nodes: Project[] = all?.projects?.nodes ?? [];
    return nodes.slice(4);
}

/** ===== SEO ===== */
export const metadata: Metadata = {
    title: "White | Book",
    description:
        "Il biblioteca de projetti",
};

/** ===== Page ===== */
export default async function ArchivePage() {
    const projects = await getArchiveProjects();

    return (
        <main className={styles.archive}>
            <div className={styles.list}>
                {projects.map((p) => {
                    const year = getYearFromDate(p.date);
                    const category = pickCategory(p);
                    const cover = pickCover(p);

                    return (
                        <div key={p.slug} className={styles.item}>
                            {/* background plein écran au hover */}
                            {cover && (
                                <div
                                    className={styles.preview}
                                    style={{ backgroundImage: `url(${cover})` }}
                                    aria-hidden
                                />
                            )}

                            <Link href={`/projects/${p.slug}`} className={styles.row}>
                                <span className={styles.year}>{year}</span>
                                <span className={styles.title}>{p.title}</span>
                                <span className={styles.category}>{category}</span>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </main>
    );
}
