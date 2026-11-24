'use client';

// Titres réels des projets (slug → titre) pour le repère de localisation du header.
// Fournis par le layout serveur à partir des données (content/projects) : seule cette
// petite table est transmise au client, pas les fichiers de projet.

import { createContext, type PropsWithChildren, useContext } from 'react';

const ProjectTitlesContext = createContext<Record<string, string>>({});

export function ProjectTitlesProvider({ titles, children }: PropsWithChildren<{ titles: Record<string, string> }>) {
  return <ProjectTitlesContext.Provider value={titles}>{children}</ProjectTitlesContext.Provider>;
}

export const useProjectTitles = () => useContext(ProjectTitlesContext);
