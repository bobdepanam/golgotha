// src/app/robots.ts — robots.txt
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/projects-test"] },
    sitemap: "https://www.bastardz.fr/sitemap.xml",
  };
}
