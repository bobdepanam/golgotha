// app/projects/page.tsx
import ProjectsPageClientWrapper from "@/components/projects/ProjectsPageClientWrapper";
import { fetchGraphQL } from "@/lib/api";
import { getAllProjectsQuery } from "@/lib/graphql/queries";
import type { Project } from "@/types/project";

export const revalidate = 60;

/** util: retourne une URL d'image fiable entre mediaItemUrl et sourceUrl */
function mediaUrl(n?: { mediaItemUrl?: string | null; sourceUrl?: string | null } | null) {
  return n?.mediaItemUrl || n?.sourceUrl || null;
}

/** choisi la meilleure vignette disponible pour un projet */
function getProjectThumb(p: any): string | null {
  // 1) Featured image (WP natif)
  const fi = mediaUrl(p?.featuredImage?.node);
  if (fi) return fi;

  // 2) Ancien ACF: mainImage
  const main = mediaUrl(p?.projectFields?.mainImage?.node);
  if (main) return main;

  // 3) Ancien ACF: première image de la gallery
  const g0 = p?.projectFields?.gallery?.nodes?.[0] ?? null;
  const g0url = mediaUrl(g0);
  if (g0url) return g0url;

  // 4/5/6) Flexible: poster vidéo / image simple / 1re image de galerie
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
      default:
        break;
    }
  }

  return null;
}

async function getProjects(): Promise<Project[]> {
  try {
    const data = await fetchGraphQL(getAllProjectsQuery);

    const nodes: Project[] = data?.projects?.nodes ?? [];

    // On peuple project.image avec la meilleure vignette calculée,
    // sans casser le type existant.
    const augmented = nodes.map((p: any) => {
      const thumb = getProjectThumb(p);
      return {
        ...p,
        image: thumb ?? p.image ?? null, // p.image reste un fallback si jamais il existait
        // (optionnel) on peut aussi assainir la catégorie ici si besoin :
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

    return augmented;
  } catch (error) {
    console.error("Erreur lors de la récupération des projets :", error);
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectsPageClientWrapper projects={projects} />;
}
