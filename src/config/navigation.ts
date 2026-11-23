// src/config/navigation.ts
// Destinations de navigation du site (source unique pour le widget global SiteDock).

export type NavDestination = {
  id: string;
  /** Nom artistique affiché */
  label: string;
  href: string;
  /** Affiché dans le widget. `false` = conservé en configuration, intégration en attente. */
  inDock: boolean;
};

export const NAV_DESTINATIONS: readonly NavDestination[] = [
  { id: "projects", label: "ΓΟΛΓΟΘΑ[Σ]", href: "/projects", inDock: true },
  { id: "about", label: "CANEM", href: "/about", inDock: true },
  { id: "contact", label: "TALK", href: "/contact", inDock: true },
  { id: "experiment", label: "OPEN WORLD", href: "/experiment", inDock: true },
  // Intégration définitive dans la navigation en attente de décision.
  { id: "archive", label: "BIBLIOTHECA", href: "/archive", inDock: false },
];

export const DOCK_DESTINATIONS = NAV_DESTINATIONS.filter((d) => d.inDock);

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
