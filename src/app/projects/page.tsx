// app/projects/page.tsx
import FiltersPanel from "@/components/filters/FiltersPanel";
import FiltersToggle from "@/components/filters/FiltersToggle";
import ProjectsPageClientWrapper from "@/components/projects/ProjectsPageClientWrapper";

import { fetchGraphQL } from "@/lib/api";
import { getAllProjectsQuery } from "@/lib/graphql/queries";
import type { Project } from "@/types/project";

export const revalidate = 60;

/* Utils */
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
        const u = mediaUrl(b?.poster?.node); if (u) return u; break;
      }
      case "ProjectFieldsFlexibleContentBlocksImageBlockLayout": {
        const u = mediaUrl(b?.image?.node); if (u) return u; break;
      }
      case "ProjectFieldsFlexibleContentBlocksGalleryBlockLayout": {
        const n0 = b?.images?.nodes?.[0] ?? null; const u = mediaUrl(n0); if (u) return u; break;
      }
    }
  }
  return null;
}
function slugify(s: string) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* Fetch */
async function getProjects(): Promise<Project[]> {
  const data = await fetchGraphQL(getAllProjectsQuery);
  const nodes: Project[] = (data?.projects?.nodes ?? []) as Project[];
  return nodes.map((p: any) => {
    const thumb = getProjectThumb(p);
    return {
      ...p,
      image: thumb ?? p.image ?? null,
      projectFields: p.projectFields ? {
        ...p.projectFields,
        category:
          typeof p.projectFields.category === "string" && p.projectFields.category.trim()
            ? p.projectFields.category.trim()
            : undefined,
      } : undefined,
    } as Project;
  });
}

/* Catégories ACF */
type Chip = { slug: string; label: string };
function collectAcfCats(projects: Project[]): Chip[] {
  const map = new Map<string, string>();
  const add = (label?: string | null) => {
    if (!label) return;
    const clean = label.trim(); if (!clean) return;
    map.set(slugify(clean), clean);
  };
  for (const p of projects) {
    add(p?.projectFields?.category);
    add(p?.projectFieldsFlexible?.category);
  }
  return Array.from(map, ([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
}

/* Page */
export default async function ProjectsPage() {
  const projects = await getProjects();
  const chips = collectAcfCats(projects);

  return (
    <main id="pageContent" className="container p-4">
      <div className="filtersRow">
        <FiltersToggle onIconSrc="/icons/bloc_on.svg" offIconSrc="/icons/bloc_off.svg" />
        <FiltersPanel chips={chips} inline />
      </div>

      <ProjectsPageClientWrapper projects={projects} />
    </main>
  );
}
