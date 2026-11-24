// src/app/sitemap.ts — sitemap généré depuis la source de contenu unique.
// Brouillons exclus : getAllProjects() ne contient que les projets publiés en production.

import { getAllProjects } from "@/lib/content/projects";
import type { MetadataRoute } from "next";

const BASE = "https://www.bastardz.fr";
const PAGES = ["/", "/projects", "/archive", "/about", "/contact", "/experiment"];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = PAGES.map((path) => ({ url: `${BASE}${path === "/" ? "" : path}` }));
  const projects: MetadataRoute.Sitemap = getAllProjects()
    .filter((p) => !p.draft)
    .map((p) => ({
      url: `${BASE}/projects/${p.slug}`,
      ...(p.publishedAt ? { lastModified: p.publishedAt } : {}),
    }));
  return [...pages, ...projects];
}
