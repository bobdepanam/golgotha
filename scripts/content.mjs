#!/usr/bin/env node
// scripts/content.mjs — préparation du contenu GOLGOTHA
//
//   node scripts/content.mjs --check   valide tous les projets (brouillons compris), n'écrit rien
//   node scripts/content.mjs --dev     prépare pour `npm run dev` (brouillons si SHOW_DRAFTS=1)
//   node scripts/content.mjs --build   prépare pour le build de production (jamais de brouillons)
//
// Préparer = valider, écrire src/generated/projects.json (lu par le site) et synchroniser
// public/media/projects/ (dossier GÉNÉRÉ : copie des médias des projets retenus uniquement ;
// les fichiers obsolètes y sont supprimés ; content/projects/ n'est jamais modifié).

import fs from 'node:fs';
import path from 'node:path';
import {
  GENERATED_FILE,
  GENERATED_MARKER,
  PUBLIC_MEDIA_DIR,
  formatIssue,
  loadContent,
} from './content/engine.mjs';

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

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (d.isDirectory()) removeEmptyDirs(path.join(dir, d.name));
  }
  if (dir !== PUBLIC_MEDIA_DIR && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}

function syncMedia(entries) {
  const root = PUBLIC_MEDIA_DIR;
  const inside = (p) => p.startsWith(root + path.sep);
  const marker = path.join(root, GENERATED_MARKER);

  // Sécurité : ne jamais nettoyer un dossier qui n'a pas été généré par ce script.
  if (fs.existsSync(root) && !fs.existsSync(marker)) {
    const foreign = walkFiles(root);
    if (foreign.length) {
      throw new Error(
        `${path.relative(process.cwd(), root)} contient des fichiers non générés (${foreign.length}). ` +
          'Ce dossier est produit automatiquement à partir de content/projects/ : déplacez ces fichiers dans le dossier du projet concerné.'
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
    if (file === marker || plan.has(file)) continue;
    if (!inside(file)) continue;
    fs.unlinkSync(file);
    removed += 1;
  }
  removeEmptyDirs(root);
  return { copied, kept, removed, total: plan.size };
}

/* ---------- Exécution ---------- */

try {
  const { entries, all, report } = loadContent({ includeDrafts: mode === 'check' ? true : includeDrafts });

  // Bloquant : erreurs des projets publiés (et de tous les projets en --check / avec brouillons).
  const retained = new Set(entries.map((e) => e.slug));
  const blocking = report.errors.filter((i) => mode === 'check' || !i.slug || retained.has(i.slug) || !all.some((e) => e.slug === i.slug));
  const nonBlocking = report.errors.filter((i) => !blocking.includes(i));

  for (const w of report.warnings) console.warn('[content]', formatIssue(w));
  for (const e of nonBlocking) console.warn('[content]', formatIssue(e), '(brouillon : non bloquant)');
  if (blocking.length) {
    for (const e of blocking) console.error('[content]', formatIssue(e));
    console.error(`[content] ✗ ${blocking.length} erreur(s) — corrigez content/projects/ puis relancez.`);
    process.exit(1);
  }

  const published = all.filter((e) => e.published).length;
  const drafts = all.length - published;

  if (mode === 'check') {
    log(`✓ contenu valide : ${published} publié(s), ${drafts} brouillon(s), ${report.warnings.length} avertissement(s).`);
    process.exit(0);
  }

  if (mode === 'build' && wantDrafts) log('SHOW_DRAFTS ignoré : un build de production ne publie jamais les brouillons.');

  // Données lues par le site (écrites seulement si elles changent : pas de rechargement inutile)
  const data = {
    note: 'Fichier généré par scripts/content.mjs à partir de content/projects/ — ne pas modifier.',
    includeDrafts,
    projects: entries.map((e) => ({ ...e.project, draft: !e.published })),
  };
  const json = JSON.stringify(data, null, 2) + '\n';
  fs.mkdirSync(path.dirname(GENERATED_FILE), { recursive: true });
  if (!fs.existsSync(GENERATED_FILE) || fs.readFileSync(GENERATED_FILE, 'utf8') !== json) {
    fs.writeFileSync(GENERATED_FILE, json);
  }

  const media = syncMedia(entries);
  log(
    `✓ ${entries.length} projet(s) prêt(s) [${mode}${includeDrafts ? ', brouillons inclus' : ''}] — ` +
      `médias : ${media.total} publiés (${media.copied} copiés, ${media.kept} inchangés, ${media.removed} obsolètes supprimés).`
  );
} catch (e) {
  console.error('[content] ✗', e.message);
  process.exit(1);
}
