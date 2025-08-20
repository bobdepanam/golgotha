// src/lib/ui/pickProjectCover.ts
import type { FlexibleContentBlock, Project } from '@/types/project';

function getFirstFlexibleCover(blocks?: FlexibleContentBlock[] | null): string | null {
    if (!blocks) return null;
    for (const b of blocks) {
        if (b.__typename === 'ProjectFieldsFlexibleContentBlocksVideoBlockLayout') {
            const url = b.poster?.node?.mediaItemUrl;
            if (url) return url;
        }
        if (b.__typename === 'ProjectFieldsFlexibleContentBlocksImageBlockLayout') {
            const url = b.image?.node?.mediaItemUrl;
            if (url) return url;
        }
        if (b.__typename === 'ProjectFieldsFlexibleContentBlocksGalleryBlockLayout') {
            const node = b.images?.nodes?.find(n => n?.mediaItemUrl);
            if (node?.mediaItemUrl) return node.mediaItemUrl;
        }
    }
    return null;
}

export function pickProjectCover(p: Project): string {
    return (
        p.image ||
        p.projectFields?.mainImage?.node?.mediaItemUrl ||
        getFirstFlexibleCover(p.projectFieldsFlexible?.contentBlocks) ||
        '/images/placeholder.jpg'
    );
}
