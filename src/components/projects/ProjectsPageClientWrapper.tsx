'use client';

import ProjectFilters, { filterHref, selectFilter, type Chip } from "@/components/filters/ProjectFilters";
import ProjectGrid from "@/components/projects/ProjectGrid";
import styles from "@/styles/projects/Catalog.module.scss";
import type { Project } from "@/types/project";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Grille avec shader WebGL (three.js) : uniquement /projects-test, chargée à la demande
// pour ne pas alourdir /projects.
const ProjectGridTest = dynamic(() => import("@/components/projects/ProjectGridTest"));

type Props = {
  projects: Project[];
  /** Catégories réelles (dérivées des données) pour la ligne de filtres */
  chips?: Chip[];
  /** /projects-test : grille avec effet shader (ProjectGridTest) */
  testMode?: boolean;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Un projet appartient à une catégorie via l'un ou l'autre de ses champs (legacy / flexible). */
function projectHasCat(p: Project, slug: string) {
  const is = (label?: string | null) => typeof label === "string" && slugify(label) === slug;
  return is(p.projectFields?.category) || is(p.projectFieldsFlexible?.category);
}

type CatalogProps = Props & { active: string | null };

/** Catalogue (présentation pure, sans hook) : filtres + grille ou état vide. */
export function ProjectsCatalog({ projects, chips = [], testMode = false, active }: CatalogProps) {
  const visible = active ? projects.filter((p) => projectHasCat(p, active)) : projects;

  return (
    <div className={styles.catalog}>
      <ProjectFilters chips={chips} active={active} />

      {visible.length === 0 ? (
        <p className={styles.empty}>
          <span>{active ? "Aucun projet dans cette catégorie." : "Aucun projet pour le moment."}</span>
          {active && (
            <Link href={filterHref(null)} replace scroll={false} className={styles.emptyLink} onClick={selectFilter}>
              Voir tous les projets
            </Link>
          )}
        </p>
      ) : testMode ? (
        <ProjectGridTest projects={visible} />
      ) : (
        <ProjectGrid projects={visible} />
      )}
    </div>
  );
}

/** Lit `?cat=` dans l'URL (précédent / suivant compris) et affiche le catalogue filtré. */
export default function ProjectsPageClientWrapper(props: Props) {
  const params = useSearchParams();
  return <ProjectsCatalog {...props} active={params.get("cat") || null} />;
}
