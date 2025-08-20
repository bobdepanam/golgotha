// app/projects-test/page.tsx
import ProjectsPageClientWrapper from "@/components/projects/ProjectsPageClientWrapper";
import { fetchGraphQL } from "@/lib/api";
import { getAllProjectsQuery } from "@/lib/graphql/queries";
import type { Project } from "@/types/project";

export const revalidate = 60;

function mediaUrl(n?: { mediaItemUrl?: string | null; sourceUrl?: string | null } | null) {
    return n?.mediaItemUrl || n?.sourceUrl || null;
}

function getProjectThumb(p: any): string | null {
    const fi = mediaUrl(p?.featuredImage?.node);
    if (fi) return fi;
    const main = mediaUrl(p?.projectFields?.mainImage?.node);
    if (main) return main;
    const g0 = p?.projectFields?.gallery?.nodes?.[0] ?? null;
    const g0url = mediaUrl(g0);
    if (g0url) return g0url;
    const blocks = p?.projectFieldsFlexible?.contentBlocks ?? [];
    for (const b of blocks) {
        switch (b?.__typename) {
            case "ProjectFieldsFlexibleContentBlocksVideoBlockLayout": {
                const u = mediaUrl(b?.poster?.node);
                if (u) return u;
                break;
            }
            case "ProjectFieldsFlexibleContentBlocksImageBlockLayout": {
                const u = mediaUrl(b?.image?.node);
                if (u) return u;
                break;
            }
            case "ProjectFieldsFlexibleContentBlocksGalleryBlockLayout": {
                const n0 = b?.images?.nodes?.[0] ?? null;
                const u = mediaUrl(n0);
                if (u) return u;
                break;
            }
        }
    }
    return null;
}

async function getProjects(): Promise<Project[]> {
    const data = await fetchGraphQL(getAllProjectsQuery);
    const nodes: Project[] = data?.projects?.nodes ?? [];
    return nodes.map((p: any) => {
        const thumb = getProjectThumb(p);
        return {
            ...p,
            image: thumb ?? p.image ?? null,
            projectFields: p.projectFields
                ? {
                    ...p.projectFields,
                    category:
                        typeof p.projectFields.category === "string" &&
                            p.projectFields.category.trim().length > 0
                            ? p.projectFields.category.trim()
                            : undefined,
                }
                : undefined,
        } as Project;
    });
}

export default async function ProjectsTestPage() {
    const projects = await getProjects();
    return <ProjectsPageClientWrapper projects={projects} />; // 👈 AVEC effet
}
