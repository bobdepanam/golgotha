"use client";

import HeaderActionsPortal from "@/components/header/HeaderActionsPortal";
import styles from "@/styles/projects/ProjectsClientView.module.scss";
import type { Project } from "@/types/project";
import { useEffect, useState } from "react";
import ProjectGrid from "./ProjectGrid";
import ProjectList from "./ProjectList";
import ProjectViewSwitcher from "./ProjectViewSwitcher";

export default function ProjectsClientView({ projects }: { projects: Project[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");

  // Charger une préférence éventuelle
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("project:view") as "grid" | "list" | null;
      if (saved === "grid" || saved === "list") setView(saved);
    } catch { }
  }, []);

  // Persister la préférence
  useEffect(() => {
    try {
      window.localStorage.setItem("project:view", view);
    } catch { }
  }, [view]);

  return (
    <>
      {/* Monte "Index / Cards" dans le header (slot #header-actions) */}
      <HeaderActionsPortal>
        <ProjectViewSwitcher
          defaultView={view}
          onChange={setView}
          // @ts-ignore — si la prop n’existe pas chez toi, retire cette ligne
          labels={{ list: "Index", grid: "Cards" }}
        />
      </HeaderActionsPortal>

      {/* Rendu principal avec marge/padding global */}
      <section className={styles.wrap}>
        {view === "grid" ? (
          <ProjectGrid projects={projects} />
        ) : (
          <ProjectList projects={projects} />
        )}
      </section>
    </>
  );
}
