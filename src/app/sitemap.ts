// src/app/sitemap.ts — sitemap généré depuis la source de contenu unique.
// Brouillons exclus : getAllProjects() / getAllProducts() ne contiennent que les entrées
// publiées en production. /simple n'est listé que s'il a au moins un produit publié (sinon 404).

import { getAllProjects } from "@/lib/content/projects";
import { getAllProducts } from "@/lib/content/simple";
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
  const products = getAllProducts().filter((p) => !p.draft);
  const simple: MetadataRoute.Sitemap = products.length
    ? [
        { url: `${BASE}/simple` },
        ...products.map((p) => ({
          url: `${BASE}/simple/${p.slug}`,
          ...(p.publishedAt ? { lastModified: p.publishedAt } : {}),
        })),
      ]
    : [];
  return [...pages, ...projects, ...simple];
}
