// src/lib/content/projects.ts
// Couche de données locale des projets (remplace WordPress / GraphQL).
// Source : src/content/projects/*.json, générés par scripts/build-project-content.cjs
// à partir des données brutes sauvegardées dans recovery/projects/.

import type { Project } from "@/types/project";

import ashesOnArrival from "@/content/projects/ashes-on-arrival.json";
import bewareOfTheWolf from "@/content/projects/beware-of-the-wolf.json";
import currents from "@/content/projects/currents.json";
import heroesForTheUniverse from "@/content/projects/heroes-for-the-universe.json";
import hollowSunlight from "@/content/projects/hollow-sunlight.json";
import mouthInTheFloor from "@/content/projects/mouth-in-the-floor.json";
import pulseAndGrain from "@/content/projects/pulse-and-grain.json";
import silentPulse from "@/content/projects/silent-pulse.json";
import throughShadows from "@/content/projects/through-shadows.json";
import tstxbstrdz from "@/content/projects/tstxbstrdz.json";

/** Les JSON respectent le schéma GraphQL d'origine (type `Project`). */
const PROJECTS: readonly Project[] = (
  [
    throughShadows,
    heroesForTheUniverse,
    bewareOfTheWolf,
    silentPulse,
    tstxbstrdz,
    hollowSunlight,
    mouthInTheFloor,
    currents,
    pulseAndGrain,
    ashesOnArrival,
  ] as unknown as Project[]
)
  // Ordre explicite (`order`) = ordre de production (date décroissante) ; dates exactes inconnues.
  .slice()
  .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));

/** Tous les projets, dans l'ordre d'affichage. */
export function getAllProjects(): Project[] {
  return [...PROJECTS];
}

/** Un projet par son slug, ou `null` s'il n'existe pas. */
export function getProjectBySlug(slug: string): Project | null {
  return PROJECTS.find((p) => p.slug === slug) ?? null;
}

/** Slugs de tous les projets (génération statique). */
export function getAllProjectSlugs(): string[] {
  return PROJECTS.map((p) => p.slug);
}
