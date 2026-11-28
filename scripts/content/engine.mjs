// scripts/content/engine.mjs
// Moteur de contenu GOLGOTHA — source unique : content/projects/<slug>/project.md
//
// Rôle : découvrir les dossiers projets, lire le frontmatter (gray-matter), valider,
// rendre le Markdown (marked, au build uniquement), adapter au type `Project` utilisé
// par les composants, trier, et planifier les médias à publier.
// Utilisé par scripts/content.mjs (préparation) et scripts/content/compare-legacy.mjs.
// Ses fonctions de validation des médias, de Markdown et de rapport sont partagées avec
// la collection Simple (scripts/content/simple.mjs).
// Le site lit uniquement le résultat généré (src/generated/<dev|prod>/projects.json).

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { imageSize } from './image-size.mjs';
import { GENERATED_DIR, PUBLIC_ROOT, URL_ROOT } from './target.mjs';

export const ROOT = process.cwd();
export const CONTENT_DIR = path.join(ROOT, 'content', 'projects');
// Sorties isolées par mode (développement / production) : voir target.mjs
export const PUBLIC_MEDIA_DIR = path.join(PUBLIC_ROOT, 'projects');
export const GENERATED_FILE = path.join(GENERATED_DIR, 'projects.json');
export const PUBLIC_PREFIX = `${URL_ROOT}/projects`;
export const GENERATED_MARKER = '.generated-by-content-sync';
/** Image de partage par défaut du site (`seo.image: false`). */
export const SITE_OG_IMAGE = '/images/og/cover.jpg';
/** Pochette neutre d'une composition audio sans pochette (7.1) : logo BASTARDZ existant sur
 *  fond sombre (lisible en thème clair comme sombre) — public/images/bstrdz/audio-cover.webp */
export const AUDIO_FALLBACK_COVER = { url: '/images/bstrdz/audio-cover.webp', width: 1200, height: 1200, mime: 'image/webp' };
export const KINDS = ['graphic', 'video', 'audio'];

/** Formats acceptés (publiés tels quels, sans conversion) */
export const FORMATS = {
  image: ['.webp', '.avif', '.jpg', '.jpeg', '.png', '.gif'],
  audio: ['.mp3'],
  video: ['.mp4', '.webm'],
};
/** Au-delà : avertissement (le fichier reste publié) */
const WARN_MB = { image: 3, audio: 15, video: 30 };
const MIME = {
  '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm',
};

const KNOWN_KEYS = new Set([
  'title', 'published', 'publishedAt', 'legacyOrder', 'legacyText', 'year', 'category',
  'subtitle', 'excerpt', 'cover', 'thumbnail', 'background', 'audio', 'media', 'links', 'seo',
  // Provenance (7.1, ex. « ALTAR — library/projects/altar-001 ») : information de gestion, non affichée
  'source',
  // Nature de la création (7.1) : graphic | video | audio — complète la catégorie (univers)
  'kind',
  // Bibliothéca (V8) : true = inclure, false = exclure ; absent = selon la présence d'un audio
  'bibliotheca',
]);

/* Médias distants (7.1) : URLs https publiques d'hôtes autorisés (src/config/media.json) ;
   métadonnées (poids, type, dimensions) lues dans le cache content/remote-media.json, produit
   par `npm run content:remote` — le build n'accède jamais au réseau. */
export const MEDIA_CONFIG_FILE = path.join(process.cwd(), 'src/config/media.json');
export const REMOTE_CACHE_FILE = path.join(process.cwd(), 'content/remote-media.json');
const REMOTE_HOSTS = (() => {
  try {
    return new Set(JSON.parse(fs.readFileSync(MEDIA_CONFIG_FILE, 'utf8')).remoteHosts ?? []);
  } catch {
    return new Set();
  }
})();
let remoteCache = null;
function remoteMeta(url) {
  if (!remoteCache) {
    try {
      remoteCache = JSON.parse(fs.readFileSync(REMOTE_CACHE_FILE, 'utf8'));
    } catch {
      remoteCache = {};
    }
  }
  return remoteCache[url] ?? null;
}
export const isRemote = (v) => typeof v === 'string' && /^https:\/\//i.test(v.trim());
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* ------------------------------------------------------------------ */
/* Messages                                                           */
/* ------------------------------------------------------------------ */

export function createReport() {
  const issues = [];
  return {
    issues,
    error: (slug, field, message, file) => issues.push({ level: 'error', slug, field, message, file }),
    warn: (slug, field, message, file) => issues.push({ level: 'warning', slug, field, message, file }),
    get errors() { return issues.filter((i) => i.level === 'error'); },
    get warnings() { return issues.filter((i) => i.level === 'warning'); },
  };
}

export function formatIssue(i) {
  const where = [i.slug, i.field].filter(Boolean).join(' › ');
  const file = i.file ? ` (« ${i.file} »)` : '';
  return `${i.level === 'error' ? '✗' : '⚠'} ${where} : ${i.message}${file}`;
}

/* ------------------------------------------------------------------ */
/* Markdown (build uniquement) — HTML brut et liens dangereux neutralisés */
/* ------------------------------------------------------------------ */

export const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SAFE_URL = /^(https?:|mailto:|\/|#)/i;

const markdown = new Marked({ gfm: true, breaks: false });
markdown.use({
  renderer: {
    // HTML brut dans le Markdown : affiché comme texte, jamais interprété
    html(html) {
      return escapeHtml(html);
    },
    // Liens : protocoles sûrs uniquement (sinon le texte seul) ; liens externes dans un nouvel onglet
    link(href, title, text) {
      if (!href || !SAFE_URL.test(href)) return text;
      const t = title ? ` title="${escapeHtml(title)}"` : '';
      const ext = /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${escapeHtml(href)}"${t}${ext}>${text}</a>`;
    },
    // Images dans le corps : non prises en charge (utiliser `media`), retirées
    image() {
      return '';
    },
  },
});

export const renderMarkdown = (src) => markdown.parse(src, { async: false });

/* ------------------------------------------------------------------ */
/* Vérification des fichiers médias                                   */
/* ------------------------------------------------------------------ */

function readHead(file, n = 16) {
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(n);
    fs.readSync(fd, buf, 0, n, 0);
    return buf;
  } finally {
    fs.closeSync(fd);
  }
}

/** Signature réelle du fichier, cohérente avec son extension ? */
function signatureMatches(file, ext) {
  const b = readHead(file);
  switch (ext) {
    case '.png': return b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG';
    case '.jpg':
    case '.jpeg': return b[0] === 0xff && b[1] === 0xd8;
    case '.webp': return b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';
    case '.gif': return b.toString('ascii', 0, 3) === 'GIF';
    case '.avif': return b.toString('ascii', 4, 8) === 'ftyp' && /avi[fs]/.test(b.toString('ascii', 8, 12));
    case '.mp4': return b.toString('ascii', 4, 8) === 'ftyp';
    case '.webm': return b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
    case '.mp3': return b.toString('ascii', 0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
    default: return false;
  }
}

/**
 * Résout un média déclaré dans project.md.
 * - Chemin relatif au dossier du projet, sans sortie possible (`..`, absolu).
 * - Format autorisé + signature réelle.
 * - Absent : erreur si `required`, sinon avertissement et `null` (aucun lecteur / image cassée).
 * - URL publique : `ctx.prefix` (collection), `/media/projects` par défaut.
 */
export function resolveMedia(ctx, field, value, kind, { required = false, allowReserved = false } = {}) {
  const { slug, dir, report } = ctx;
  if (value === undefined || value === null || value === '') {
    if (required) report.error(slug, field, 'champ obligatoire manquant');
    return null;
  }
  if (typeof value !== 'string') {
    report.error(slug, field, 'doit être un nom de fichier');
    return null;
  }
  if (isRemote(value)) return resolveRemote(ctx, field, value.trim(), kind, { required });
  const rel = value.trim();
  if (path.isAbsolute(rel) || rel.includes('\\') || rel.split('/').some((seg) => seg === '..' || seg === '')) {
    report.error(slug, field, 'chemin invalide : un fichier du dossier du projet est attendu', rel);
    return null;
  }
  // Dossiers « _ » (_sources/…) : jamais publiés, quelle que soit la collection (7.0.9).
  // Seule exception : le test audio explicite du développement (DEV_TEST_AUDIO, jamais en build).
  if (!allowReserved && rel.split('/').some((seg) => seg.startsWith('_'))) {
    report.error(slug, field, 'les dossiers commençant par « _ » (ex. _sources/) ne sont jamais publiés', rel);
    return null;
  }
  const abs = path.resolve(dir, rel);
  if (!abs.startsWith(dir + path.sep)) {
    report.error(slug, field, 'chemin hors du dossier du projet', rel);
    return null;
  }
  const ext = path.extname(rel).toLowerCase();
  if (!FORMATS[kind].includes(ext)) {
    report.error(slug, field, `format non pris en charge (${FORMATS[kind].join(', ')})`, rel);
    return null;
  }
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    if (required) report.error(slug, field, 'fichier introuvable', rel);
    else report.warn(slug, field, 'fichier introuvable — ignoré en attendant son ajout', rel);
    return null;
  }
  if (!signatureMatches(abs, ext)) {
    report.error(slug, field, `le contenu du fichier ne correspond pas à son extension ${ext}`, rel);
    return null;
  }
  const bytes = fs.statSync(abs).size;
  if (bytes > WARN_MB[kind] * 1024 * 1024) {
    report.warn(slug, field, `fichier lourd (${(bytes / 1048576).toFixed(1)} Mo > ${WARN_MB[kind]} Mo conseillés)`, rel);
  }
  return {
    rel,
    abs,
    bytes,
    url: `${ctx.prefix ?? PUBLIC_PREFIX}/${slug}/${rel.split('/').map(encodeURIComponent).join('/')}`,
    mime: MIME[ext],
  };
}

/** Média distant : hôte autorisé, format, présence vérifiée (cache) ; jamais copié. */
function resolveRemote(ctx, field, url, kind, { required }) {
  const { slug, report } = ctx;
  let u;
  try {
    u = new URL(url);
  } catch {
    report.error(slug, field, 'URL invalide', url);
    return null;
  }
  if (!REMOTE_HOSTS.has(u.host)) {
    report.error(slug, field, `hôte distant non autorisé (src/config/media.json) : ${u.host}`, url);
    return null;
  }
  if (u.search) {
    report.error(slug, field, 'URL avec paramètres refusée (URL signée ou temporaire ?)', url);
    return null;
  }
  const ext = path.extname(decodeURIComponent(u.pathname)).toLowerCase();
  if (!FORMATS[kind].includes(ext)) {
    report.error(slug, field, `format non pris en charge (${FORMATS[kind].join(', ')})`, url);
    return null;
  }
  const meta = remoteMeta(url);
  if (!meta) {
    report.warn(slug, field, 'métadonnées distantes absentes — lancer npm run content:remote', url);
  } else if (meta.status !== 200) {
    if (required) report.error(slug, field, `fichier distant introuvable (HTTP ${meta.status})`, url);
    else report.warn(slug, field, `fichier distant introuvable (HTTP ${meta.status}) — ignoré`, url);
    return null;
  }
  if (meta?.bytes > WARN_MB[kind] * 1024 * 1024) {
    report.warn(slug, field, `fichier lourd (${(meta.bytes / 1048576).toFixed(1)} Mo > ${WARN_MB[kind]} Mo conseillés)`, url);
  }
  return {
    rel: url,
    abs: null,
    remote: true,
    bytes: meta?.bytes ?? null,
    size: meta?.width && meta?.height ? { width: meta.width, height: meta.height } : null,
    url,
    mime: MIME[ext],
  };
}

/** Dimensions d'une image locale (en-tête) ou distante (cache). */
const sizeOf = (m) => (m.remote || m.fallback ? m.size : imageSize(m.abs));

/* ------------------------------------------------------------------ */
/* Lecture d'un projet                                                */
/* ------------------------------------------------------------------ */

export const isStr = (v) => typeof v === 'string' && v.trim() !== '';
const baseTitle = (rel) => path.basename(rel, path.extname(rel));

/** Nœud média au format attendu par les composants (type MediaItem) ; dimensions réelles des images. */
const mediaNode = (slug, m, title) => {
  const size = m.mime?.startsWith('image/') ? sizeOf(m) : null;
  return {
    id: `${slug}:${m.rel}`,
    title: title ?? (m.fallback ? 'cover' : baseTitle(m.remote ? decodeURIComponent(new URL(m.rel).pathname) : m.rel)),
    mimeType: m.mime,
    mediaItemUrl: m.url,
    sourceUrl: m.url,
    mediaDetails: size ? { width: size.width, height: size.height } : null,
  };
};

/** Premier paragraphe du corps, en texte (repli de l'excerpt). */
/**
 * Statut d'un contenu (7.0.1), commun aux deux collections — champ `published` :
 * - false     → brouillon : développement uniquement ;
 * - preview   → aperçu : servi en production par URL directe, hors navigation officielle,
 *               Bibliothéca et sitemap, pages en noindex ;
 * - true      → publié.
 * @returns {'draft' | 'preview' | 'published'}
 */
export function readStatus(fm, report, slug) {
  if (fm.published === true) return 'published';
  if (fm.published === false) return 'draft';
  if (fm.published === 'preview') return 'preview';
  report.error(slug, 'published', 'true, false ou preview attendu');
  return 'draft';
}

/** Contenu retenu pour une sortie : aperçus et publiés toujours, brouillons en dev seulement. */
export function isRetained(status, includeDrafts) {
  return status !== 'draft' || includeDrafts;
}

export function firstParagraph(body) {
  const para = body.split(/\n\s*\n/).map((s) => s.trim()).find(Boolean);
  return para ? para.replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim() : '';
}

/**
 * Lit, valide et normalise un dossier projet.
 * Retourne { slug, published, project, files } ; `project` = type Project des composants,
 * `files` = médias à publier { rel, abs }.
 */
/**
 * @param {{ devAudio?: { slug: string, rel: string }[] | null }} [opts]
 *   devAudio : piste de test du développement (DEV_TEST_AUDIO), jamais transmise en build.
 */
export function readProject(slug, report, { devAudio = null } = {}) {
  const dir = path.join(CONTENT_DIR, slug);
  const mdFile = path.join(dir, 'project.md');
  if (!SLUG_RE.test(slug)) {
    report.error(slug, 'dossier', 'nom de dossier invalide : minuscules, chiffres et tirets uniquement (= slug / URL)');
    return null;
  }
  if (!fs.existsSync(mdFile)) {
    report.error(slug, 'project.md', 'fichier project.md manquant');
    return null;
  }

  let parsed;
  try {
    parsed = matter(fs.readFileSync(mdFile, 'utf8'));
  } catch (e) {
    report.error(slug, 'project.md', `frontmatter illisible : ${e.message.split('\n')[0]}`);
    return null;
  }
  const fm = parsed.data ?? {};
  const body = (parsed.content ?? '').replace(/\r\n/g, '\n').trim();
  const ctx = { slug, dir, report };
  const files = new Map(); // rel → abs
  // Seuls les médias locaux sont copiés vers le dossier public généré (les distants : jamais)
  const track = (m) => (m ? (m.abs && files.set(m.rel, m.abs), m) : null);

  for (const key of Object.keys(fm)) {
    if (!KNOWN_KEYS.has(key)) report.warn(slug, key, 'champ inconnu (faute de frappe ?) — ignoré');
  }

  // --- Champs essentiels
  if (!isStr(fm.title)) report.error(slug, 'title', 'champ obligatoire manquant');
  const status = readStatus(fm, report, slug);
  // Année et catégorie : obligatoires pour publier ; un brouillon peut les omettre (7.0.8,
  // même règle que Simple) — aucune date ni catégorie n'est inventée en attendant.
  if (fm.year !== undefined && fm.year !== null && !Number.isInteger(fm.year)) {
    report.error(slug, 'year', 'année de création attendue (ex. 2026)');
  }
  if (fm.published === true) {
    if (!Number.isInteger(fm.year)) report.error(slug, 'year', 'année de création obligatoire pour publier (ex. 2026)');
    if (!isStr(fm.category)) report.error(slug, 'category', 'catégorie obligatoire pour publier');
  }

  let publishedAt = null;
  if (fm.publishedAt !== undefined && fm.publishedAt !== null) {
    const raw = fm.publishedAt instanceof Date ? fm.publishedAt.toISOString().slice(0, 10) : String(fm.publishedAt);
    if (!DATE_RE.test(raw) || Number.isNaN(Date.parse(raw))) {
      report.error(slug, 'publishedAt', 'date invalide (format AAAA-MM-JJ)');
    } else publishedAt = raw;
  }
  const legacyOrder = fm.legacyOrder ?? null;
  if (legacyOrder !== null && !Number.isInteger(legacyOrder)) report.error(slug, 'legacyOrder', 'entier attendu');
  if (fm.published === true && !publishedAt && legacyOrder === null) {
    report.error(slug, 'publishedAt', 'date de publication obligatoire pour un projet publié (AAAA-MM-JJ)');
  }
  const legacyText = fm.legacyText ?? null;
  if (legacyText !== null && legacyText !== 'raw' && legacyText !== 'block') {
    report.error(slug, 'legacyText', 'valeur « raw » ou « block » attendue (projets historiques uniquement)');
  }

  // --- Visuels (repli : thumbnail / background → cover)
  // Nature (7.1) : facultative ; une composition audio peut se passer de pochette
  const kind = fm.kind === undefined || fm.kind === null ? null : String(fm.kind).trim().toLowerCase();
  if (kind !== null && !KINDS.includes(kind)) report.error(slug, 'kind', `valeur attendue : ${KINDS.join(', ')}`);
  if (fm.bibliotheca !== undefined && fm.bibliotheca !== null && typeof fm.bibliotheca !== 'boolean') {
    report.error(slug, 'bibliotheca', 'true ou false attendu');
  }
  if (fm.bibliotheca === true && !fm.audio) {
    report.warn(slug, 'bibliotheca', 'inclus dans Bibliothéca mais sans audio : il n\'y apparaîtra pas');
  }
  const audioOnly = kind === 'audio' && (fm.cover === undefined || fm.cover === null || fm.cover === '');
  const cover = audioOnly
    ? { rel: 'fallback', abs: null, fallback: true, url: AUDIO_FALLBACK_COVER.url, mime: AUDIO_FALLBACK_COVER.mime, size: { width: AUDIO_FALLBACK_COVER.width, height: AUDIO_FALLBACK_COVER.height } }
    : track(resolveMedia(ctx, 'cover', fm.cover, 'image', { required: true }));
  if (audioOnly) report.warn(slug, 'cover', 'composition sans pochette : visuel neutre du site utilisé (à compléter)');
  const thumbnail = track(resolveMedia(ctx, 'thumbnail', fm.thumbnail, 'image'));
  const background = track(resolveMedia(ctx, 'background', fm.background, 'image'));
  let audio = track(resolveMedia(ctx, 'audio', fm.audio, 'audio'));
  const devTrack = devAudio?.find((d) => d.slug === slug);
  if (devTrack) {
    // Test local uniquement : remplace la piste le temps de la session de développement,
    // sans toucher au Markdown ni au statut de publication.
    const test = resolveMedia(ctx, 'audio (test dev)', devTrack.rel, 'audio', { allowReserved: true });
    if (test) {
      audio = track(test);
      report.warn(slug, 'audio', 'piste de TEST du développement (DEV_TEST_AUDIO) — jamais publiée', devTrack.rel);
    }
  }

  // --- Médias de la page projet (ordre conservé)
  const blocks = [];
  const media = fm.media ?? [];
  if (!Array.isArray(media)) report.error(slug, 'media', 'liste attendue');
  (Array.isArray(media) ? media : []).forEach((item, i) => {
    const f = `media[${i + 1}]`;
    if (!item || typeof item !== 'object') return report.error(slug, f, 'élément invalide');
    // Cadrage plein écran (images et vidéos) : cover (défaut) ou contain
    let fit = null;
    if (item.fit !== undefined) {
      if (item.fit === 'cover' || item.fit === 'contain') fit = item.fit;
      else report.error(slug, `${f}.fit`, 'valeur « cover » ou « contain » attendue');
    }
    const fitProp = fit === 'contain' ? { fit } : {};
    if (item.video !== undefined || item.embed !== undefined) {
      let providerUrl = null;
      if (item.embed !== undefined) {
        if (isStr(item.embed) && /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)\//.test(item.embed)) {
          providerUrl = item.embed.trim();
        } else report.error(slug, `${f}.embed`, 'lien YouTube ou Vimeo (https) attendu');
      } else {
        providerUrl = track(resolveMedia(ctx, `${f}.video`, item.video, 'video'))?.url ?? null;
      }
      const poster = track(resolveMedia(ctx, `${f}.poster`, item.poster, 'image'));
      if (!providerUrl && !poster) return; // rien d'affichable : ignoré (avertissement déjà émis)
      blocks.push({
        __typename: 'ProjectFieldsFlexibleContentBlocksVideoBlockLayout',
        providerUrl,
        autoplay: item.autoplay === true,
        loop: item.loop === true,
        muted: item.muted !== false,
        controls: item.controls === true,
        poster: poster ? { node: mediaNode(slug, poster) } : null,

        ...fitProp,
      });
    } else if (item.image !== undefined) {
      const img = track(resolveMedia(ctx, `${f}.image`, item.image, 'image'));
      if (!img) return;
      blocks.push({
        __typename: 'ProjectFieldsFlexibleContentBlocksImageBlockLayout',
        image: { node: mediaNode(slug, img, isStr(item.alt) ? item.alt : undefined) },
        caption: isStr(item.caption) ? item.caption : null,

        ...fitProp,
      });
    } else if (item.gallery !== undefined) {
      if (!Array.isArray(item.gallery)) return report.error(slug, `${f}.gallery`, 'liste de fichiers attendue');
      const nodes = item.gallery
        .map((g, k) => track(resolveMedia(ctx, `${f}.gallery[${k + 1}]`, g, 'image')))
        .filter(Boolean)
        .map((m) => mediaNode(slug, m));
      if (nodes.length) blocks.push({ __typename: 'ProjectFieldsFlexibleContentBlocksGalleryBlockLayout', images: { nodes } });
    } else {
      report.error(slug, f, 'type inconnu : video, embed, image ou gallery attendu');
    }
  });

  // --- Texte : Markdown → description (défaut) ; legacyText conserve le rendu historique
  let description = null;
  if (body) {
    if (legacyText === 'raw') description = escapeHtml(body);
    else if (legacyText === 'block') {
      blocks.push({ __typename: 'ProjectFieldsFlexibleContentBlocksTextBlockLayout', content: renderMarkdown(body) });
    } else description = renderMarkdown(body);
  }

  // --- Composition audio sans média visuel (7.1) : la pochette (ou le visuel neutre) tient
  // lieu de visuel de page, entière (contain) — la page reste cohérente avec les autres créations
  if (kind === 'audio' && cover && !blocks.some((b) => /Video|Image|Gallery/.test(b.__typename))) {
    blocks.unshift({
      __typename: 'ProjectFieldsFlexibleContentBlocksImageBlockLayout',
      image: { node: mediaNode(slug, cover, 'cover') },
      caption: null,
      fit: 'contain',
    });
  }

  // --- Audio : bloc après le texte (projets « block ») ou piste principale
  const playerAudio = audio && legacyText !== 'block' ? audio.url : null;
  if (audio && legacyText === 'block') {
    blocks.push({ __typename: 'ProjectFieldsFlexibleContentBlocksAudioBlockLayout', title: null, fileUrl: audio.url });
  }

  // --- Liens externes
  const links = fm.links ?? [];
  if (!Array.isArray(links)) report.error(slug, 'links', 'liste attendue');
  (Array.isArray(links) ? links : []).forEach((l, i) => {
    if (!l || !isStr(l.url) || !/^https?:\/\//.test(l.url)) return report.error(slug, `links[${i + 1}].url`, 'URL http(s) attendue');
    blocks.push({
      __typename: 'ProjectFieldsFlexibleContentBlocksExternalLinkBlockLayout',
      label: isStr(l.label) ? l.label : null,
      url: l.url.trim(),
    });
  });

  // --- SEO (repli : title / excerpt / cover)
  const seo = fm.seo ?? {};
  if (typeof seo !== 'object') report.error(slug, 'seo', 'objet attendu');
  let ogImage = null;
  if (seo.image === false) ogImage = SITE_OG_IMAGE; // image de partage du site (et non la cover)
  else if (seo.image !== undefined) ogImage = track(resolveMedia(ctx, 'seo.image', seo.image, 'image'))?.url ?? null;
  else ogImage = cover?.url ?? null;

  const excerpt = typeof fm.excerpt === 'string' ? fm.excerpt : firstParagraph(body);

  const project = {
    title: isStr(fm.title) ? fm.title.trim() : slug,
    slug,
    kind: KINDS.includes(kind) ? kind : null,
    /** Bibliothéca (V8) : true / false explicites, null = automatique (audio présent) */
    bibliotheca: typeof fm.bibliotheca === 'boolean' ? fm.bibliotheca : null,
    excerpt,
    year: Number.isInteger(fm.year) ? fm.year : null,
    order: legacyOrder ?? undefined,
    publishedAt,
    thumbnail: thumbnail?.url ?? null,
    thumbnailSize: thumbnail ? sizeOf(thumbnail) : null,
    background: background?.url ?? null,
    featuredImage: cover ? { node: mediaNode(slug, cover) } : null,
    projectFields: {
      subtitle: isStr(fm.subtitle) ? fm.subtitle : null,
      category: isStr(fm.category) ? fm.category.trim() : null,
      description,
      external_link: null,
      playerAudio,
      videoFullscreen: null,
      mainImage: null,
      gallery: null,
    },
    projectFieldsFlexible: {
      category: isStr(fm.category) ? fm.category.trim() : null,
      contentBlocks: blocks,
    },
    seo: {
      title: isStr(seo.title) ? seo.title : null,
      metaDesc: isStr(seo.description) ? seo.description : null,
      canonical: null,
      opengraphTitle: null,
      opengraphDescription: null,
      opengraphImage: ogImage ? { mediaItemUrl: ogImage } : null,
      twitterTitle: null,
      twitterDescription: null,
      twitterImage: null,
    },
  };

  return { slug, status, published: status === 'published', project, files: [...files].map(([rel, abs]) => ({ rel, abs })) };
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                          */
/* ------------------------------------------------------------------ */

/**
 * Tri unique (grille, Bibliothéca, sitemap) :
 * 1. (7.1.0) projets historiques en tête, par legacyOrder (ordre relatif d'origine) ;
 * 2. puis publishedAt décroissant ; 3. égalité → titre puis slug (déterministe).
 * Aucune date fictive : la priorité vient du champ d'ordre existant (legacyOrder).
 */
export function compareProjects(a, b) {
  const la = a.project.order ?? null;
  const lb = b.project.order ?? null;
  if (la !== null || lb !== null) {
    if (la === null) return 1;
    if (lb === null) return -1;
    if (la !== lb) return la - lb;
  }
  const da = a.project.publishedAt;
  const db = b.project.publishedAt;
  if (da && db && da !== db) return da < db ? 1 : -1;
  if (da && !db) return -1;
  if (!da && db) return 1;
  if (!da && !db) {
    const oa = a.project.order ?? Number.MAX_SAFE_INTEGER;
    const ob = b.project.order ?? Number.MAX_SAFE_INTEGER;
    if (oa !== ob) return oa - ob;
  }
  return a.project.title.localeCompare(b.project.title, 'fr') || a.slug.localeCompare(b.slug);
}

/** Dossiers projets (les dossiers commençant par `_` ou `.` sont ignorés : _template…). */
export function listProjectDirs() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort();
}

/**
 * Charge tout le contenu.
 * @param {{ includeDrafts?: boolean, devAudio?: { slug: string, rel: string }[] | null }} opts
 * @returns {{ entries: object[], all: object[], report: object }}
 *   entries = projets retenus (publiés, + brouillons si includeDrafts), triés.
 */
export function loadContent({ includeDrafts = false, devAudio = null } = {}) {
  const report = createReport();
  const all = listProjectDirs()
    .map((slug) => readProject(slug, report, { devAudio }))
    .filter(Boolean);
  const entries = all.filter((e) => isRetained(e.status, includeDrafts)).sort(compareProjects);
  return { entries, all, report };
}
