// /simple — collection SIMPLE (BSTRDZ 7.0.3a : galerie spatiale infinie).
// Données : src/generated/simple.json (content/simple/). Seuls les champs utiles à la
// galerie sont transmis au client. Sans produit publié (production actuelle) : 404.
import SimpleSpatialLoader from "@/components/simple/spatial/SimpleSpatialLoader";
import type { SpatialItem } from "@/components/simple/spatial/types";
import { getAllProducts } from "@/lib/content/simple";
import { toProductDisplay } from "@/lib/content/simple-display";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Simple",
  description: "Simple — collection BSTRDZ.",
  alternates: { canonical: "/simple" },
};

export default function SimplePage() {
  const items: SpatialItem[] = getAllProducts()
    .filter((p) => p.thumb?.url)
    .map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- texte long réservé à la page produit
      const { bodyHtml, bodyText, ...info } = toProductDisplay(p);
      return {
        slug: p.slug,
        title: p.title,
        category: p.category ?? null,
        thumb: p.thumb!.url,
        width: p.thumb!.width ?? p.cover?.width ?? 600,
        height: p.thumb!.height ?? p.cover?.height ?? 800,
        info,
      };
    });
  if (!items.length) notFound();
  return <SimpleSpatialLoader items={items} />;
}
