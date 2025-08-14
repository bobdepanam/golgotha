'use client';

import ProjectsClientView from "@/components/projects/ProjectsClientView";
import TextTransition from "@/components/transition/TextTransition";
import styles from "@/styles/projects/ProjectsList.module.scss";
import type { Project } from "@/types/project";
import { useState } from "react";

type Props = {
  projects: Project[];
};

export default function ProjectsPageClientWrapper({ projects }: Props) {
  const [reveal, setReveal] = useState(true); // ou false si tu veux jouer uniquement à l’entrée

  return (
    <>
      <TextTransition
        text="{ Canem }"
        trigger={reveal}
        destination="/projects" // <- optionnel, car tu es déjà dessus
        onComplete={() => setReveal(false)}
      />

      {!reveal && (
        <main className={styles.container}>
          {projects.length === 0 ? (
            <p className={styles.empty}>Aucun projet disponible pour le moment.</p>
          ) : (
            <ProjectsClientView projects={projects} />
          )}
        </main>
      )}
    </>
  );
}
