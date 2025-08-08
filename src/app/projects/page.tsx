import ProjectsPageClientWrapper from "@/components/projects/ProjectsPageClientWrapper";
import { fetchGraphQL } from "@/lib/api";
import { getAllProjectsQuery } from "@/lib/graphql/queries";
import type { Project } from "@/types/project";

export const revalidate = 60;

async function getProjects(): Promise<Project[]> {
  try {
    const data = await fetchGraphQL(getAllProjectsQuery);
    return data?.projects?.nodes ?? [];
  } catch (error) {
    console.error("Erreur lors de la récupération des projets :", error);
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <ProjectsPageClientWrapper projects={projects} />
  );
}
