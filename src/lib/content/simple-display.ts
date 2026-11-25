// Modèle d'affichage d'un produit SIMPLE (panneau de focus et page produit), calculé côté
// serveur. Seules les données confirmées de product.md sont utilisées ; en prévisualisation
// locale (SHOW_DRAFTS=1), les valeurs provisoires (`provisional`, absentes de toute donnée
// de production) servent de repli et sont signalées (`provisional: true`).
// Aucune valeur n'est inventée : une information absente n'est pas affichée.
import type { Product } from '@/types/product';

export type ProductSpec = { label: string; value: string };

export type ProductDisplay = {
  slug: string;
  title: string;
  /** Catégorie affichée et filtrable (confirmée ; provisoire en développement) */
  category: string | null;
  /** Année affichée (confirmée ; provisoire en développement) */
  year: string | null;
  /** « Catégorie · Année » (Simple) ; null si aucune des deux n'est connue */
  meta: string | null;
  /** Pièce de collection (Simple : tier « hero ») */
  heroTag: boolean;
  tagline: string | null;
  /** Texte court du panneau de focus */
  summary: string | null;
  /** Texte long de la page produit : HTML rendu au build (product.md) … */
  bodyHtml: string | null;
  /** … ou paragraphes de texte brut (données provisoires) */
  bodyText: string[];
  specs: ProductSpec[];
  /** Au moins une valeur affichée provient des données provisoires (développement) */
  provisional: boolean;
};

export function toProductDisplay(p: Product): ProductDisplay {
  const prov = p.provisional ?? {};
  let usedProvisional = false;
  const pick = (confirmed: string | number | null | undefined, key: string): string | null => {
    if (confirmed !== null && confirmed !== undefined && String(confirmed).trim() !== '') return String(confirmed);
    const v = prov[key];
    if (v && v.trim()) {
      usedProvisional = true;
      return v.trim();
    }
    return null;
  };

  const category = pick(p.category, 'category');
  const year = pick(p.year, 'year');
  const tagline = pick(p.tagline, 'tagline');
  const summary = pick(p.excerpt, 'summary');
  const heroTag = prov.tier === 'hero';
  if (heroTag) usedProvisional = true;

  let bodyHtml: string | null = null;
  let bodyText: string[] = [];
  if (p.description) bodyHtml = p.description;
  else {
    const raw = prov.body ?? prov.summary;
    if (raw) {
      usedProvisional = true;
      bodyText = raw.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    }
  }

  const specs: ProductSpec[] = [];
  const spec = (label: string, confirmed: string | null, key: string) => {
    const v = pick(confirmed, key);
    if (v) specs.push({ label, value: v });
  };
  // Libellés de Simple (Fit = coupe)
  spec('Fit', p.cut, 'cut');
  spec('Material', p.material, 'material');
  spec('Edition', p.edition, 'edition');
  spec('Client', null, 'client');
  spec('Role', null, 'role');
  spec('Credits', null, 'credits');

  return {
    slug: p.slug,
    title: p.title,
    category,
    year,
    meta: [category, year].filter(Boolean).join(' · ') || null,
    heroTag,
    tagline,
    summary,
    bodyHtml,
    bodyText,
    specs,
    provisional: usedProvisional,
  };
}
