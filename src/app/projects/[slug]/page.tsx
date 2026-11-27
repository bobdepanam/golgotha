// app/projects/[slug]/page.tsx
import ProjectPageClientWrapper from "@/components/projects/ProjectPageSlugWrapper";
import { getAllProjectSlugs, getAllProjects, getProjectBySlug } from "@/lib/content/projects";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: { slug: string };
};

/** Seuls les projets locaux existent : tout autre slug → 404 (au lieu d'un rendu à la demande). */
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProjectBySlug(params.slug);

  // 404 / not found
  if (!p) {
    return {
      title: "Projet introuvable — Golgotha",
      description: "Ce projet n'existe pas ou a été supprimé.",
      robots: { index: false, follow: false },
    };
  }

  // Métadonnées du projet (sinon : replis ci-dessous)
  const seo = p.seo ?? null;

  // Fallback image → opengraph → featuredImage → défaut
  const ogImg =
    seo?.opengraphImage?.mediaItemUrl ||
    p?.featuredImage?.node?.mediaItemUrl ||
    "/images/og/cover.jpg";

  // Nettoie un éventuel excerpt HTML
  const cleanExcerpt =
    typeof p.excerpt === "string" ? p.excerpt.replace(/<[^>]+>/g, "").trim() : "";

  // Titre / description avec fallback
  const title =
    seo?.title ||
    seo?.opengraphTitle ||
    p.title ||
    "Golgotha";

  const description =
    seo?.metaDesc ||
    seo?.opengraphDescription ||
    (p.projectFields?.subtitle ?? cleanExcerpt) ||
    "Projet — Golgotha";

  // Canonical relatif (résolu via metadataBase dans layout.tsx)
  const canonical = seo?.canonical || `/projects/${p.slug}`;

  return {
    // Non officiel (brouillon, aperçu 7.0.1) : jamais indexé
    ...(p.draft ? { robots: { index: false, follow: false } } : {}),
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      images: ogImg ? [{ url: ogImg }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImg ? [ogImg] : [],
    },
  };
}

export function generateStaticParams() {
  return getAllProjectSlugs().map((slug) => ({ slug }));
}

export default function ProjectPage({ params }: Props) {
  const project = getProjectBySlug(params.slug);

  if (!project) return notFound();

  // Ordre général du catalogue (celui de la grille : aperçus exclus) — repli du bouton Next
  const catalog = getAllProjects()
    .filter((p) => p.status !== "preview")
    .map((p) => p.slug);
  return <ProjectPageClientWrapper project={project} catalog={catalog} />;
}
