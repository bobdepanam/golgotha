// src/lib/content/projects.ts
// Couche de données des projets. Source unique : content/projects/<slug>/project.md,
// préparée par scripts/content.mjs (lancé automatiquement avant `npm run dev` et
// `npm run build`) dans src/generated/projects.json — déjà validée, adaptée au type
// `Project` et triée (date de publication décroissante, puis ordre historique).
// Ajouter un projet = ajouter un dossier : aucun code à modifier ici.

import content from "@/generated/projects.json";
import type { Project } from "@/types/project";

const PROJECTS: readonly Project[] = (content as unknown as { projects: Project[] }).projects;

/** Tous les projets publiés (+ brouillons en prévisualisation locale), dans l'ordre d'affichage. */
export function getAllProjects(): Project[] {
  return [...PROJECTS];
}

/** Un projet par son slug, ou `null` s'il n'existe pas. */
export function getProjectBySlug(slug: string): Project | null {
  return PROJECTS.find((p) => p.slug === slug) ?? null;
}

/** Slugs de tous les projets (génération statique des pages). */
export function getAllProjectSlugs(): string[] {
  return PROJECTS.map((p) => p.slug);
}

