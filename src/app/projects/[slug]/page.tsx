// app/projects/[slug]/page.tsx
import ProjectPageClientWrapper from "@/components/projects/ProjectPageSlugWrapper";
import { fetchGraphQL } from "@/lib/api";
import { getAllProjectSlugsQuery, getProjectBySlugQuery } from "@/lib/graphql/queries";
import type { Project } from "@/types/project";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await fetchGraphQL(getProjectBySlugQuery, { slug: params.slug });
  const p = data?.project;

  // 404 / not found
  if (!p) {
    return {
      title: "Projet introuvable — Golgotha",
      description: "Ce projet n'existe pas ou a été supprimé.",
      robots: { index: false, follow: false },
    };
  }

  // Yoast structuré si dispo (sinon ce sera undefined)
  const seo = (p as any).seo ?? null;

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

export async function generateStaticParams() {
  const data = await fetchGraphQL(getAllProjectSlugsQuery);
  return data?.projects?.nodes?.map((p: { slug: string }) => ({ slug: p.slug })) ?? [];
}

export default async function ProjectPage({ params }: Props) {
  const data: { project: Project | null } = await fetchGraphQL(getProjectBySlugQuery, {
    slug: params.slug,
  });

  if (!data?.project) return notFound();

  return <ProjectPageClientWrapper project={data.project} />;
}
