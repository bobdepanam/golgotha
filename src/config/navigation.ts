// src/config/navigation.ts
// Destinations de navigation du site : source unique pour le widget (MENU) et
// pour le repère de localisation du header (`/canem`, `/talk`…).
//
// Rôles (un contrôle = une fonction) :
// - point blanc du header → /projects ;
// - cube du footer → /experiment (seul accès permanent à OPEN WORLD) ;
// - widget INFO / MENU → navigation principale ci-dessous (`inDock`).

export type NavDestination = {
  id: string;
  /** Nom artistique affiché dans le MENU */
  label: string;
  href: string;
  /** Repère affiché en haut à gauche, sans le slash initial (ex. "canem" → `/canem`) */
  location: string;
  /** Affiché dans le MENU du widget. */
  inDock: boolean;
};

export const NAV_DESTINATIONS: readonly NavDestination[] = [
  { id: "projects", label: "ΓΟΛΓΟΘΑ[Σ]", href: "/projects", location: "projects", inDock: true },
  { id: "about", label: "CANEM", href: "/about", location: "canem", inDock: true },
  { id: "contact", label: "TALK", href: "/contact", location: "talk", inDock: true },
  { id: "archive", label: "BIBLIOTHECA", href: "/archive", location: "bibliotheca", inDock: true },
  // Accès exclusif par le cube du footer : hors du MENU.
  { id: "experiment", label: "OPEN WORLD", href: "/experiment", location: "open world", inDock: false },
];

export const DOCK_DESTINATIONS = NAV_DESTINATIONS.filter((d) => d.inDock);

/**
 * Repère de localisation (sans slash) pour une route : page projet → titre réel
 * du projet (`projectTitles`, issus des données) ; autres pages → `location` de la
 * configuration. `null` : aucun repère (landing, /experiment, route inconnue).
 */
export function locationLabel(pathname: string, projectTitles: Record<string, string>): string | null {
  if (isProjectDetailRoute(pathname)) {
    const slug = decodeURIComponent(pathname.split("/")[2] ?? "");
    return projectTitles[slug] ?? null;
  }
  if (pathname === "/experiment") return null; // comportement particulier conservé (bouton Back)
  return NAV_DESTINATIONS.find((d) => d.href === pathname)?.location ?? null;
}

/** Destination active : page exacte ou sous-page (ex. /projects/<slug> → /projects). */
export function isActiveDestination(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Routes où le widget global est affiché (phase 1).
 * Exclues volontairement : "/" (homepage inchangée) et "/experiment" (exception stricte).
 */
export function isDockRoute(pathname: string): boolean {
  if (pathname === "/projects" || pathname.startsWith("/projects/")) return true;
  return pathname === "/about" || pathname === "/contact" || pathname === "/archive";
}

/** Pages projet : INFO + MENU. */
export function isProjectDetailRoute(pathname: string): boolean {
  return pathname.startsWith("/projects/") && pathname.split("/").filter(Boolean).length === 2;
}

/**
 * OPEN WORLD (/experiment) a sa propre navigation (bouton Back) : les raccourcis
 * globaux (point blanc du header, cube du footer) n'y sont pas rendus.
 */
export function isOpenWorldRoute(pathname: string): boolean {
  return pathname === "/experiment" || pathname.startsWith("/experiment/");
}

/**
 * Cube Open World (footer) : visible à partir de /projects et sur les pages
 * intérieures ; absent de la landing `/` et d'OPEN WORLD lui-même.
 */
export function showsOpenWorldCube(pathname: string): boolean {
  return pathname !== "/" && !isOpenWorldRoute(pathname);
}
