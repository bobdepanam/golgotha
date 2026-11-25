#!/usr/bin/env node
// scripts/content.mjs — préparation du contenu BSTRDZ (deux collections indépendantes)
//
//   node scripts/content.mjs --check   valide tout (brouillons compris), n'écrit rien
//   node scripts/content.mjs --dev     prépare pour `npm run dev` (brouillons si SHOW_DRAFTS=1)
//   node scripts/content.mjs --build   prépare pour le build de production (jamais de brouillons)
//
// Collections :
//   content/projects/<slug>/project.md → src/generated/projects.json + public/media/projects/
//   content/simple/<slug>/product.md   → src/generated/simple.json   + public/media/simple/
//                                         (+ miniatures _thumbs/ et données de flou)
//   index transversal (future Bibliothéca)  → src/generated/index.json
//
// Les dossiers public/media/<collection>/ sont GÉNÉRÉS : copie des médias des entrées
// retenues uniquement ; les fichiers obsolètes y sont supprimés ; content/ n'est jamais modifié.

import fs from 'node:fs';
import path from 'node:path';
import {
  GENERATED_FILE,
  GENERATED_MARKER,
  PUBLIC_MEDIA_DIR,
  ROOT,
  createReport,
  formatIssue,
  loadContent,
} from './content/engine.mjs';
import {
  SIMPLE_GENERATED_FILE,
  SIMPLE_PUBLIC_DIR,
  loadSimple,
  thumbPaths,
} from './content/simple.mjs';
import { generateThumbs } from './content/thumbs.mjs';

const INDEX_FILE = path.join(ROOT, 'src', 'generated', 'index.json');
const THUMBS_CACHE = '.thumbs-cache.json';

const args = new Set(process.argv.slice(2));
const mode = args.has('--check') ? 'check' : args.has('--build') ? 'build' : 'dev';
const wantDrafts = process.env.SHOW_DRAFTS === '1' || process.env.SHOW_DRAFTS === 'true';
const includeDrafts = mode === 'dev' && wantDrafts;

const log = (...a) => console.log('[content]', ...a);

/* ---------- Synchronisation des médias (dossier généré uniquement) ---------- */

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walkFiles(p) : [p];
  });
}

function removeEmptyDirs(dir, root) {
  if (!fs.existsSync(dir)) return;
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (d.isDirectory()) removeEmptyDirs(path.join(dir, d.name), root);
  }
  if (dir !== root && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}

/**
 * Synchronise un dossier public GÉNÉRÉ avec les médias des entrées retenues.
 * `keep` : fichiers générés par ailleurs (miniatures, cache) à ne pas supprimer.
 */
function syncMedia(root, entries, { keep = new Set(), source = 'content/' } = {}) {
  const inside = (p) => p.startsWith(root + path.sep);
  const marker = path.join(root, GENERATED_MARKER);

  // Sécurité : ne jamais nettoyer un dossier qui n'a pas été généré par ce script.
  if (fs.existsSync(root) && !fs.existsSync(marker)) {
    const foreign = walkFiles(root);
    if (foreign.length) {
      throw new Error(
        `${path.relative(process.cwd(), root)} contient des fichiers non générés (${foreign.length}). ` +
          `Ce dossier est produit automatiquement à partir de ${source} : déplacez ces fichiers dans le dossier source concerné.`
      );
    }
  }
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(marker, 'Dossier généré par scripts/content.mjs — ne pas modifier à la main.\n');

  const plan = new Map(); // destination → source
  for (const e of entries) {
    for (const f of e.files) {
      const dest = path.join(root, e.slug, f.rel);
      if (!inside(dest)) throw new Error(`destination hors du dossier généré : ${dest}`);
      plan.set(dest, f.abs);
    }
  }

  let copied = 0;
  let kept = 0;
  for (const [dest, src] of plan) {
    const s = fs.statSync(src);
    const d = fs.existsSync(dest) ? fs.statSync(dest) : null;
    if (d && d.size === s.size && Math.abs(d.mtimeMs - s.mtimeMs) < 1000) {
      kept += 1;
      continue;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    fs.utimesSync(dest, s.atime, s.mtime);
    copied += 1;
  }

  let removed = 0;
  for (const file of walkFiles(root)) {
    if (file === marker || plan.has(file) || keep.has(file)) continue;
    if (!inside(file)) continue;
    fs.unlinkSync(file);
    removed += 1;
  }
  removeEmptyDirs(root, root);
  return { copied, kept, removed, total: plan.size };
}

/** Écrit un fichier généré seulement s'il change (pas de rechargement inutile en dev). */
function writeIfChanged(file, data) {
  const json = JSON.stringify(data, null, 2) + '\n';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== json) fs.writeFileSync(file, json);
}

/** Erreurs bloquantes : celles des entrées retenues (toutes en --check), et des dossiers illisibles. */
function blockingErrors(report, entries, all) {
  const retained = new Set(entries.map((e) => e.slug));
  const blocking = report.errors.filter(
    (i) => mode === 'check' || !i.slug || retained.has(i.slug) || !all.some((e) => e.slug === i.slug)
  );
  return { blocking, nonBlocking: report.errors.filter((i) => !blocking.includes(i)) };
}

/** Entrée de l'index transversal (champs communs aux deux collections). */
function projectIndexEntry(e) {
  const p = e.project;
  const blocks = p.projectFieldsFlexible?.contentBlocks ?? [];
  const cover = p.featuredImage?.node?.mediaItemUrl ?? null;
  return {
    id: `projects:${p.slug}`,
    collection: 'projects',
    slug: p.slug,
    href: `/projects/${p.slug}`,
    title: p.title,
    publishedAt: p.publishedAt ?? null,
    order: p.order ?? null,
    year: p.year ?? null,
    category: p.projectFields?.category ?? null,
    cover,
    thumb: p.thumbnail ?? cover,
    background: p.background ?? cover,
    audio: p.projectFields?.playerAudio ?? blocks.find((b) => b.fileUrl)?.fileUrl ?? null,
    draft: !e.published,
  };
}

function productIndexEntry(e) {
  const p = e.product;
  return {
    id: `simple:${p.slug}`,
    collection: 'simple',
    slug: p.slug,
    href: `/simple/${p.slug}`,
    title: p.title,
    publishedAt: p.publishedAt,
    order: null,
    year: p.year,
    category: p.category,
    cover: p.cover?.url ?? null,
    thumb: p.thumb?.url ?? p.cover?.url ?? null,
    background: p.cover?.url ?? null,
    audio: p.audio,
    draft: !e.published,
  };
}

/** Ordre de l'index : date décroissante ; sans date ensuite (projets historiques, puis produits). */
function compareIndex(a, b) {
  if (a.publishedAt && b.publishedAt && a.publishedAt !== b.publishedAt) return a.publishedAt < b.publishedAt ? 1 : -1;
  if (a.publishedAt && !b.publishedAt) return -1;
  if (!a.publishedAt && b.publishedAt) return 1;
  if (a.collection !== b.collection) return a.collection === 'projects' ? -1 : 1;
  if (a.order !== b.order) return (a.order ?? Infinity) - (b.order ?? Infinity);
  return a.slug.localeCompare(b.slug, 'en', { numeric: true });
}

/* ---------- Exécution ---------- */

try {
  const withDrafts = mode === 'check' ? true : includeDrafts;

  // --- Collection Projects (inchangée)
  const projects = loadContent({ includeDrafts: withDrafts });
  // --- Collection Simple
  const simpleReport = createReport();
  const simple = loadSimple({ includeDrafts: withDrafts, report: simpleReport });

  // Même slug dans les deux collections : autorisé (routes et médias séparés), signalé.
  const projectSlugs = new Set(projects.all.map((e) => e.slug));
  for (const e of simple.all) {
    if (projectSlugs.has(e.slug)) simpleReport.warn(e.slug, 'slug', 'slug identique à un projet (autorisé : /projects/… et /simple/… restent distincts)');
  }

  const p = blockingErrors(projects.report, projects.entries, projects.all);
  const sr = blockingErrors(simpleReport, simple.entries, simple.all);
  const tag = (i) => ({ ...i, slug: i.slug ? `simple/${i.slug}` : 'simple' });
  for (const w of projects.report.warnings) console.warn('[content]', formatIssue(w));
  for (const w of simpleReport.warnings) console.warn('[content]', formatIssue(tag(w)));
  for (const e of p.nonBlocking) console.warn('[content]', formatIssue(e), '(brouillon : non bloquant)');
  for (const e of sr.nonBlocking) console.warn('[content]', formatIssue(tag(e)), '(brouillon : non bloquant)');
  const blocking = [...p.blocking, ...sr.blocking.map(tag)];
  if (blocking.length) {
    for (const e of blocking) console.error('[content]', formatIssue(e));
    console.error(`[content] ✗ ${blocking.length} erreur(s) — corrigez content/ puis relancez.`);
    process.exit(1);
  }

  const count = (all) => ({ published: all.filter((e) => e.published).length, drafts: all.filter((e) => !e.published).length });
  const pc = count(projects.all);
  const sc = count(simple.all);

  if (mode === 'check') {
    log(`✓ projects : ${pc.published} publié(s), ${pc.drafts} brouillon(s) — simple : ${sc.published} publié(s), ${sc.drafts} brouillon(s) — ${projects.report.warnings.length + simpleReport.warnings.length} avertissement(s).`);
    process.exit(0);
  }

  if (mode === 'build' && wantDrafts) log('SHOW_DRAFTS ignoré : un build de production ne publie jamais les brouillons.');

  // --- Projects : données + médias (format inchangé)
  writeIfChanged(GENERATED_FILE, {
    note: 'Fichier généré par scripts/content.mjs à partir de content/projects/ — ne pas modifier.',
    includeDrafts,
    projects: projects.entries.map((e) => ({ ...e.project, draft: !e.published })),
  });
  const pm = syncMedia(PUBLIC_MEDIA_DIR, projects.entries, { source: 'content/projects/' });
  log(
    `✓ ${projects.entries.length} projet(s) prêt(s) [${mode}${includeDrafts ? ', brouillons inclus' : ''}] — ` +
      `médias : ${pm.total} publiés (${pm.copied} copiés, ${pm.kept} inchangés, ${pm.removed} obsolètes supprimés).`
  );

  // --- Simple : médias, miniatures, données
  const jobs = simple.entries
    .filter((e) => e.thumbSource)
    .map((e) => ({ key: e.slug, src: e.thumbSource.abs, ...thumbPaths(e.slug, e.thumbSource) }));
  const cacheFile = path.join(SIMPLE_PUBLIC_DIR, THUMBS_CACHE);
  const sm = syncMedia(SIMPLE_PUBLIC_DIR, simple.entries, {
    keep: new Set([...jobs.map((j) => j.dest), cacheFile]),
    source: 'content/simple/',
  });
  const thumbs = await generateThumbs(jobs, cacheFile);
  const thumbBySlug = new Map(jobs.map((j) => [j.key, j]));

  const products = simple.entries.map((e) => {
    const job = thumbBySlug.get(e.slug);
    const w = e.product.cover?.width;
    const h = e.product.cover?.height;
    const tw = w ? Math.min(w, 600) : null;
    return {
      ...e.product,
      thumb: job ? { url: job.url, width: tw, height: tw && w && h ? Math.round((h * tw) / w) : null } : null,
      blurDataURL: thumbs.blur.get(e.slug) ?? null,
      draft: !e.published,
      // Valeurs de démonstration non validées : prévisualisation locale uniquement
      ...(includeDrafts && e.provisional ? { provisional: e.provisional } : {}),
    };
  });
  writeIfChanged(SIMPLE_GENERATED_FILE, {
    note: 'Fichier généré par scripts/content.mjs à partir de content/simple/ — ne pas modifier.',
    includeDrafts,
    products,
  });
  log(
    `✓ ${products.length} produit(s) simple prêt(s) [${mode}${includeDrafts ? ', brouillons inclus' : ''}] — ` +
      `médias : ${sm.total} publiés (${sm.copied} copiés, ${sm.kept} inchangés, ${sm.removed} obsolètes supprimés) — ` +
      `miniatures : ${thumbs.made} générées, ${thumbs.kept} inchangées${thumbs.encoder ? ` (${thumbs.encoder})` : ''}.`
  );

  // --- Index transversal (future Bibliothéca globale ; non consommé à ce stade)
  const index = [
    ...projects.entries.map(projectIndexEntry),
    ...products.map((pr) => productIndexEntry({ product: pr, published: !pr.draft })),
  ].sort(compareIndex);
  writeIfChanged(INDEX_FILE, {
    note: 'Index transversal généré par scripts/content.mjs (projects + simple) — ne pas modifier.',
    includeDrafts,
    entries: index,
  });
  log(`✓ index transversal : ${index.length} entrée(s).`);
  process.exit(0);
} catch (e) {
  console.error('[content] ✗', e.message);
  process.exit(1);
}
