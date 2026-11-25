// scripts/content/simple.mjs
// Collection SIMPLE — source unique : content/simple/<slug>/product.md
//
// Même principe que la collection Projects (engine.mjs, dont les fonctions de validation
// des médias, de Markdown et de rapport sont réutilisées) : découverte des dossiers, lecture
// du frontmatter, validation, normalisation, tri, planification des médias à publier.
// Le slug est le nom du dossier ; aucun nombre de produits, aucune catégorie, aucune
// numérotation de fichiers n'est supposé.
//
// Données provisoires : le bloc `provisional:` (valeurs de démonstration héritées de Simple,
// non validées) n'est JAMAIS publié. Il n'est transmis qu'en prévisualisation locale
// (brouillons inclus) pour les tests d'intégration.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  DATE_RE,
  ROOT,
  SLUG_RE,
  firstParagraph,
  isStr,
  renderMarkdown,
  resolveMedia,
} from './engine.mjs';
import { imageSize } from './image-size.mjs';

export const SIMPLE_DIR = path.join(ROOT, 'content', 'simple');
export const SIMPLE_PUBLIC_DIR = path.join(ROOT, 'public', 'media', 'simple');
export const SIMPLE_PREFIX = '/media/simple';
export const SIMPLE_GENERATED_FILE = path.join(ROOT, 'src', 'generated', 'simple.json');
/** Sous-dossier réservé des miniatures générées (jamais un média source) */
export const THUMBS_SUBDIR = '_thumbs';

const KNOWN_KEYS = new Set([
  'title', 'published', 'publishedAt', 'year', 'category', 'tagline', 'cut', 'material', 'edition',
  'excerpt', 'cover', 'thumbnail', 'audio', 'media', 'links', 'seo', 'provisional',
]);

const str = (v) => (isStr(v) ? v.trim() : null);

/** Médias : jamais depuis un dossier réservé (`_sources/`, `_thumbs/`…) */
function checkReserved(ctx, field, value) {
  if (typeof value === 'string' && value.split('/').some((seg) => seg.startsWith('_'))) {
    ctx.report.error(ctx.slug, field, 'les dossiers commençant par « _ » (ex. _sources/) ne sont jamais publiés', value);
    return false;
  }
  return true;
}

function withSize(m) {
  if (!m) return null;
  const size = m.mime?.startsWith('image/') ? imageSize(m.abs) : null;
  return { url: m.url, width: size?.width ?? null, height: size?.height ?? null };
}

/**
 * Lit, valide et normalise un dossier produit.
 * Retourne { slug, published, product, files, thumbSource } ; files = médias à publier.
 */
export function readProduct(slug, report) {
  const dir = path.join(SIMPLE_DIR, slug);
  const mdFile = path.join(dir, 'product.md');
  if (!SLUG_RE.test(slug)) {
    report.error(slug, 'dossier', 'nom de dossier invalide : minuscules, chiffres et tirets uniquement (= slug / URL)');
    return null;
  }
  if (!fs.existsSync(mdFile)) {
    report.error(slug, 'product.md', 'fichier product.md manquant');
    return null;
  }
  let parsed;
  try {
    parsed = matter(fs.readFileSync(mdFile, 'utf8'));
  } catch (e) {
    report.error(slug, 'product.md', `frontmatter illisible : ${e.message.split('\n')[0]}`);
    return null;
  }
  const fm = parsed.data ?? {};
  const body = (parsed.content ?? '').replace(/\r\n/g, '\n').trim();
  const ctx = { slug, dir, report, prefix: SIMPLE_PREFIX };
  const files = new Map();
  const track = (m) => (m ? (files.set(m.rel, m.abs), m) : null);
  const media = (field, value, kind, opts) =>
    checkReserved(ctx, field, value) ? resolveMedia(ctx, field, value, kind, opts) : null;

  for (const key of Object.keys(fm)) {
    if (!KNOWN_KEYS.has(key)) report.warn(slug, key, 'champ inconnu (faute de frappe ?) — ignoré');
  }

  // --- Statut et champs essentiels
  if (!isStr(fm.title)) report.error(slug, 'title', 'champ obligatoire manquant');
  if (typeof fm.published !== 'boolean') report.error(slug, 'published', 'true ou false attendu');
  const published = fm.published === true;

  let publishedAt = null;
  if (fm.publishedAt !== undefined && fm.publishedAt !== null) {
    const raw = fm.publishedAt instanceof Date ? fm.publishedAt.toISOString().slice(0, 10) : String(fm.publishedAt);
    if (!DATE_RE.test(raw) || Number.isNaN(Date.parse(raw))) report.error(slug, 'publishedAt', 'date invalide (format AAAA-MM-JJ)');
    else publishedAt = raw;
  }
  if (fm.year !== undefined && fm.year !== null && !Number.isInteger(fm.year)) {
    report.error(slug, 'year', 'année attendue (ex. 2026)');
  }
  // Publier exige des données confirmées (jamais déduites du bloc provisoire)
  if (published) {
    if (!publishedAt) report.error(slug, 'publishedAt', 'date de publication obligatoire pour publier (AAAA-MM-JJ)');
    if (!Number.isInteger(fm.year)) report.error(slug, 'year', 'année obligatoire pour publier');
    if (!isStr(fm.category)) report.error(slug, 'category', 'catégorie obligatoire pour publier');
  }

  let provisional = null;
  if (fm.provisional !== undefined && fm.provisional !== null) {
    if (typeof fm.provisional !== 'object' || Array.isArray(fm.provisional)) {
      report.error(slug, 'provisional', 'bloc de champs attendu');
    } else {
      provisional = fm.provisional;
      if (published) report.warn(slug, 'provisional', 'données provisoires présentes : elles ne seront pas publiées');
    }
  }

  // --- Visuels
  const cover = track(media('cover', fm.cover, 'image', { required: true }));
  const thumbOverride = media('thumbnail', fm.thumbnail, 'image'); // source de miniature, non publiée telle quelle
  const audio = track(media('audio', fm.audio, 'audio'));

  // --- Médias de la page produit (ordre conservé ; ratios d'origine conservés)
  const items = [];
  const list = fm.media ?? [];
  if (!Array.isArray(list)) report.error(slug, 'media', 'liste attendue');
  (Array.isArray(list) ? list : []).forEach((item, i) => {
    const f = `media[${i + 1}]`;
    if (!item || typeof item !== 'object') return report.error(slug, f, 'élément invalide');
    let fit = null;
    if (item.fit !== undefined) {
      if (item.fit === 'cover' || item.fit === 'contain') fit = item.fit;
      else report.error(slug, `${f}.fit`, 'valeur « cover » ou « contain » attendue');
    }
    if (item.embed !== undefined) {
      if (isStr(item.embed) && /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)\//.test(item.embed)) {
        items.push({ type: 'embed', url: item.embed.trim() });
      } else report.error(slug, `${f}.embed`, 'lien YouTube ou Vimeo (https) attendu');
    } else if (item.video !== undefined) {
      const video = track(media(`${f}.video`, item.video, 'video'));
      const poster = track(media(`${f}.poster`, item.poster, 'image'));
      if (!video && !poster) return;
      items.push({
        type: 'video',
        url: video?.url ?? null,
        poster: withSize(poster),
        autoplay: item.autoplay === true,
        loop: item.loop === true,
        muted: item.muted !== false,
        controls: item.controls === true,
        fit,
      });
    } else if (item.image !== undefined) {
      const img = track(media(`${f}.image`, item.image, 'image'));
      if (!img) return;
      items.push({ type: 'image', ...withSize(img), alt: str(item.alt) ?? '', caption: str(item.caption), fit });
    } else if (item.gallery !== undefined) {
      if (!Array.isArray(item.gallery)) return report.error(slug, `${f}.gallery`, 'liste de fichiers attendue');
      const images = item.gallery
        .map((g, k) => track(media(`${f}.gallery[${k + 1}]`, g, 'image')))
        .filter(Boolean)
        .map((m) => ({ ...withSize(m), alt: '' }));
      if (images.length) items.push({ type: 'gallery', images });
    } else {
      report.error(slug, f, 'type inconnu : video, embed, image ou gallery attendu');
    }
  });

  // --- Liens
  const links = [];
  const rawLinks = fm.links ?? [];
  if (!Array.isArray(rawLinks)) report.error(slug, 'links', 'liste attendue');
  (Array.isArray(rawLinks) ? rawLinks : []).forEach((l, i) => {
    if (!l || !isStr(l.url) || !/^https?:\/\//.test(l.url)) return report.error(slug, `links[${i + 1}].url`, 'URL http(s) attendue');
    links.push({ label: str(l.label), url: l.url.trim() });
  });

  // --- SEO (repli : titre, extrait, cover)
  const seo = fm.seo ?? {};
  if (typeof seo !== 'object') report.error(slug, 'seo', 'objet attendu');
  const seoImage = seo.image !== undefined ? track(media('seo.image', seo.image, 'image')) : null;

  const coverSized = withSize(cover);
  const product = {
    collection: 'simple',
    slug,
    title: str(fm.title) ?? slug,
    publishedAt,
    year: Number.isInteger(fm.year) ? fm.year : null,
    category: str(fm.category),
    tagline: str(fm.tagline),
    cut: str(fm.cut),
    material: str(fm.material),
    edition: str(fm.edition),
    excerpt: typeof fm.excerpt === 'string' ? fm.excerpt.trim() : firstParagraph(body),
    description: body ? renderMarkdown(body) : null,
    cover: coverSized,
    media: items,
    audio: audio?.url ?? null,
    links,
    seo: {
      title: str(seo.title),
      description: str(seo.description),
      image: seoImage?.url ?? cover?.url ?? null,
    },
  };

  return {
    slug,
    published,
    product,
    provisional,
    files: [...files].map(([rel, abs]) => ({ rel, abs })),
    /** Source de la miniature : `thumbnail` si fourni, sinon la cover */
    thumbSource: thumbOverride ?? cover,
  };
}

/** Tri : date de publication décroissante, puis slug en ordre naturel (simple-2 avant simple-10). */
export function compareProducts(a, b) {
  const da = a.product.publishedAt;
  const db = b.product.publishedAt;
  if (da && db && da !== db) return da < db ? 1 : -1;
  if (da && !db) return -1;
  if (!da && db) return 1;
  return a.slug.localeCompare(b.slug, 'en', { numeric: true });
}

export function listProductDirs() {
  if (!fs.existsSync(SIMPLE_DIR)) return [];
  return fs
    .readdirSync(SIMPLE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
    .map((d) => d.name);
}

/** Charge la collection : entries = produits retenus (publiés, + brouillons si includeDrafts), triés. */
export function loadSimple({ includeDrafts = false, report }) {
  const all = listProductDirs()
    .map((slug) => readProduct(slug, report))
    .filter(Boolean);
  const entries = all.filter((e) => e.published || includeDrafts).sort(compareProducts);
  return { entries, all };
}

/** Chemin de la miniature générée pour un produit (dans le dossier public généré). */
export function thumbPaths(slug, source) {
  const name = `${path.basename(source.rel, path.extname(source.rel))}.webp`;
  return {
    dest: path.join(SIMPLE_PUBLIC_DIR, slug, THUMBS_SUBDIR, name),
    url: `${SIMPLE_PREFIX}/${slug}/${THUMBS_SUBDIR}/${encodeURIComponent(name)}`,
  };
}

