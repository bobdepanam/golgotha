// src/config/navigation.ts
// Destinations de navigation du site : source unique pour le widget (MENU) et
// pour le repère de localisation du header (`/canem`, `/talk`…).
//
// Rôles (un contrôle = une fonction) :
// - point du header (haut gauche, devant le repère) → /projects (BSTRDZ 7.0.5) ;
// - bascule de thème (haut droite) ;
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
  /** Collection requise : l'entrée n'apparaît que si la collection a du contenu disponible */
  requires?: "simple";
};

export const NAV_DESTINATIONS: readonly NavDestination[] = [
  { id: "projects", label: "ΓΟΛΓΟΘΑ[Σ]", href: "/projects", location: "projects", inDock: true },
  // BSTRDZ 7.0.5 : collection Simple raccordée (libellé provisoire, refonte en 7.0.8)
  { id: "simple", label: "SIMPLE", href: "/simple", location: "simple", inDock: true, requires: "simple" },
  { id: "about", label: "CANEM", href: "/about", location: "canem", inDock: true },
  { id: "contact", label: "TALK", href: "/contact", location: "talk", inDock: true },
  { id: "archive", label: "BIBLIOTHECA", href: "/archive", location: "bibliotheca", inDock: true },
  // Accès exclusif par le cube du footer : hors du MENU.
  { id: "experiment", label: "OPEN WORLD", href: "/experiment", location: "open world", inDock: false },
];

export const DOCK_DESTINATIONS = NAV_DESTINATIONS.filter((d) => d.inDock);

/**
 * Destinations du MENU réellement disponibles. `titles` : table des titres transmise par le
 * layout (produits Simple sous la clé `simple/<slug>`, présents seulement s'ils existent :
 * publiés en production, brouillons en prévisualisation locale, npm run dev). Évite un lien vers
 * /simple tant qu'aucun produit n'y est publié (404).
 */
export function availableDockDestinations(titles: Record<string, string>): readonly NavDestination[] {
  const hasSimple = Object.keys(titles).some((k) => k.startsWith("simple/"));
  return DOCK_DESTINATIONS.filter((d) => d.requires !== "simple" || hasSimple);
}

/**
 * Repère de localisation (sans slash) pour une route : page projet → titre réel
 * du projet ; page produit Simple → titre réel du produit (clé `simple/<slug>`) ;
 * autres pages → `location` de la configuration. `null` : aucun repère (landing,
 * /experiment, route inconnue). `titles` : titres issus des données (layout).
 */
export function locationLabel(pathname: string, titles: Record<string, string>): string | null {
  if (isProjectDetailRoute(pathname)) {
    const slug = decodeURIComponent(pathname.split("/")[2] ?? "");
    return titles[slug] ?? null;
  }
  if (isSimpleProductRoute(pathname)) {
    const slug = decodeURIComponent(pathname.split("/")[2] ?? "");
    return titles[`simple/${slug}`] ?? null;
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
  // BSTRDZ 7.0.3 : widget global (MENU) aussi sur la collection Simple ; son entrée dans
  // le MENU et le repère du header relèvent de l'harmonisation de la navigation (7.0.5).
  if (pathname === "/simple" || pathname.startsWith("/simple/")) return true;
  return pathname === "/about" || pathname === "/contact" || pathname === "/archive";
}

/** Pages produit de la collection Simple. */
export function isSimpleProductRoute(pathname: string): boolean {
  return pathname.startsWith("/simple/") && pathname.split("/").filter(Boolean).length === 2;
}

/** Pages projet : INFO + MENU. */
export function isProjectDetailRoute(pathname: string): boolean {
  return pathname.startsWith("/projects/") && pathname.split("/").filter(Boolean).length === 2;
}

/**
 * OPEN WORLD (/experiment) a sa propre navigation (bouton Back) : les raccourcis
 * globaux (point et thème du header, cube du footer) n'y sont pas rendus.
 */
export function isOpenWorldRoute(pathname: string): boolean {
  return pathname === "/experiment" || pathname.startsWith("/experiment/");
}

/**
 * Interface globale des pages intérieures (point Home, bascule de thème, cube) :
 * absente de la landing `/` (immersive) et d'OPEN WORLD (navigation propre).
 */
export function showsGlobalUI(pathname: string): boolean {
  return pathname !== "/" && !isOpenWorldRoute(pathname);
}

/** Cube Open World (footer) : mêmes pages que l'interface globale. */
export function showsOpenWorldCube(pathname: string): boolean {
  return showsGlobalUI(pathname);
}
