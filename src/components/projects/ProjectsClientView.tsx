"use client";

import HeaderActionsPortal from "@/components/header/HeaderActionsPortal";
import styles from "@/styles/projects/ProjectsClientView.module.scss";
import type { Project } from "@/types/project";
import { useEffect, useState } from "react";
import ProjectGrid from "./ProjectGrid";
import ProjectGridTest from "./ProjectGridTest"; // ⬅️ grille avec effet
import ProjectList from "./ProjectList";
import ProjectViewSwitcher from "./ProjectViewSwitcher";

type Props = {
  projects: Project[];
  /** si true, la vue "grid" utilisera ProjectGridTest (effets shader) */
  useEffectGrid?: boolean;
};

export default function ProjectsClientView({ projects, useEffectGrid = false }: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("project:view") as "grid" | "list" | null;
      if (saved === "grid" || saved === "list") setView(saved);
    } catch { }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("project:view", view);
    } catch { }
  }, [view]);

  return (
    <>
      <HeaderActionsPortal>
        <ProjectViewSwitcher
          defaultView={view}
          onChange={setView}
          labels={{ list: "List", grid: "Cards" }}
        />
      </HeaderActionsPortal>

      <section className={styles.wrap}>
        {view === "grid"
          ? (useEffectGrid ? (
            <ProjectGridTest projects={projects} />
          ) : (
            <ProjectGrid projects={projects} />
          ))
          : (
            <ProjectList projects={projects} />
          )}
      </section>
    </>
  );
}
