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
  if (!data?.project) {
    return {
      title: "Projet introuvable | Golgotha",
      description: "Ce projet n'existe pas ou a été supprimé.",
    };
  }
  return {
    title: `${data.project.title} | Golgotha`,
    description: data.project.projectFields?.subtitle ?? "Projet Golgotha",
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
