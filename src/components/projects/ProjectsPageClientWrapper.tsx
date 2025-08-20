'use client';

import ProjectsClientView from "@/components/projects/ProjectsClientView";
import TextTransition from "@/components/transition/TextTransition";
import styles from "@/styles/projects/ProjectsList.module.scss";
import type { Project } from "@/types/project";
import { useState } from "react";

type Props = {
  projects: Project[];
  /** quand true, le “grid” du switcher utilisera ProjectGridTest (effet) */
  testMode?: boolean;
};

export default function ProjectsPageClientWrapper({ projects, testMode = false }: Props) {
  const [reveal, setReveal] = useState(true);

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
          {projects.length === 0 ? (
            <p className={styles.empty}>Aucun projet disponible pour le moment.</p>
          ) : (
            <ProjectsClientView
              projects={projects}
              useEffectGrid={testMode}  // 👈 active ou non le grid à effet
            />
          )}
        </main>
      )}
    </>
  );
}
