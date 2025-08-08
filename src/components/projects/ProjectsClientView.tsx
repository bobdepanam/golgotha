"use client";
import type { Project } from "@/types/project";
import { useState } from "react";
import ProjectGrid from "./ProjectGrid";
import ProjectList from "./ProjectList";
import ProjectViewSwitcher from "./ProjectViewSwitcher";

export default function ProjectsClientView({ projects }: { projects: Project[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  return (
    <>
      <ProjectViewSwitcher defaultView={view} onChange={setView} />
      {view === "grid" ? (
        <ProjectGrid projects={projects} />
      ) : (
        <ProjectList projects={projects} />
      )}
    </>
  );
}
