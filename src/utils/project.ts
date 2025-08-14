import type {
    FlexibleContentBlock,
    FlexibleGalleryBlock,
    FlexibleImageBlock,
    MediaItem,
    Project,
} from "@/types/project";

/** Type guards pour affiner le union type */
function isImageBlock(b: FlexibleContentBlock): b is FlexibleImageBlock {
    return b.__typename === "ProjectFieldsFlexibleContentBlocksImageBlockLayout";
}

function isGalleryBlock(b: FlexibleContentBlock): b is FlexibleGalleryBlock {
    return b.__typename === "ProjectFieldsFlexibleContentBlocksGalleryBlockLayout";
}

/** Helper: premier MediaItem non-null d'une liste possiblement trouée */
function firstMediaItemUrl(nodes?: (MediaItem | null)[] | null): string | null {
    if (!nodes || nodes.length === 0) return null;
    for (const n of nodes) {
        const url = n?.mediaItemUrl;
        if (url) return url;
    }
    return null;
}

/** Choisit la meilleure vignette disponible pour un projet (legacy + flexible) */
export function getProjectThumb(p: Project): string | null {
    // 1) Legacy: mainImage
    const main = p.projectFields?.mainImage?.node?.mediaItemUrl;
    if (main) return main;

    // 2) Legacy: première de la gallery
    const legacyG0 = firstMediaItemUrl(p.projectFields?.gallery?.nodes ?? null);
    if (legacyG0) return legacyG0;

    // 3) Flexible: première image d’un bloc image
    const blocks = p.projectFieldsFlexible?.contentBlocks ?? [];
    const firstImageBlock = blocks.find(isImageBlock);
    const flexImg = firstImageBlock?.image?.node?.mediaItemUrl ?? null;
    if (flexImg) return flexImg;

    // 4) Flexible: première image trouvée parmi les galeries
    for (const b of blocks) {
        if (isGalleryBlock(b)) {
            const url = firstMediaItemUrl(b.images?.nodes ?? null);
            if (url) return url;
        }
    }

    // 5) Fallback legacy "image" direct (si présent)
    if (p.image) return p.image;

    return null;
}
