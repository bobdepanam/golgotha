'use client';

import ProjectsClientView from "@/components/projects/ProjectsClientView";
import TextTransition from "@/components/transition/TextTransition";
import styles from "@/styles/projects/ProjectsList.module.scss";
import type { Project } from "@/types/project";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type Props = {
  projects: Project[];
  /** quand true, le “grid” du switcher utilisera ProjectGridTest (effet) */
  testMode?: boolean;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function projectHasCat(p: any, slug: string) {
  const is = (label?: string | null) => typeof label === "string" && slugify(label) === slug;
  // ACF legacy
  if (is(p?.projectFields?.category)) return true;
  // ACF flexible
  if (is(p?.projectFieldsFlexible?.category)) return true;
  return false;
}

export default function ProjectsPageClientWrapper({ projects, testMode = false }: Props) {
  const [reveal, setReveal] = useState(true);
  const params = useSearchParams();
  const cat = params.get("cat");

  const visible = useMemo(() => {
    if (!cat) return projects;
    return projects.filter((p) => projectHasCat(p, cat));
  }, [projects, cat]);

  return (
    <>
      <TextTransition
        text="{ Γολγοθᾶ[ς] }"
        trigger={reveal}
        destination="/projects"
        onComplete={() => setReveal(false)}
      />

      {!reveal && (
        <main className={styles.container}>
          {visible.length === 0 ? (
            <p className={styles.empty}>
              {cat ? "Aucun projet dans la catégorie sélectionnée." : "Aucun projet disponible pour le moment."}
            </p>
          ) : (
            <ProjectsClientView
              projects={visible}          // ← on passe la liste filtrée
              useEffectGrid={testMode}
            />
          )}
        </main>
      )}
    </>
  );
}
