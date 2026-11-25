// Accès aux données de la collection Simple (générées avant dev / build par
// scripts/content.mjs). Aucune lecture du système de fichiers à l'exécution.
// Non branché sur l'interface à ce stade (BSTRDZ 7.0.2).
import data from '@/generated/simple.json';
import indexData from '@/generated/index.json';
import type { CatalogIndexEntry, Product } from '@/types/product';

const PRODUCTS = data.products as Product[];

/** Produits retenus (publiés ; + brouillons en prévisualisation SHOW_DRAFTS=1), triés. */
export function getAllProducts(): Product[] {
  return PRODUCTS;
}

export function getProductBySlug(slug: string): Product | null {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export function getAllProductSlugs(): string[] {
  return PRODUCTS.map((p) => p.slug);
}

/** Index transversal projects + simple (future Bibliothéca globale), trié par date. */
export function getCatalogIndex(): CatalogIndexEntry[] {
  return indexData.entries as CatalogIndexEntry[];
}
