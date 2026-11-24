#!/usr/bin/env node
// scripts/content/migrate-legacy.mjs — migration ponctuelle des 10 projets historiques
// recovery/legacy-content/<slug>.json (+ media-map.json) → content/projects/<slug>/project.md
// Les médias sont déplacés (git mv) de public/media/projects/<slug>/ vers content/projects/<slug>/,
// sans conversion ni suppression. Les références aux fichiers manquants (MP3, beware.mp4) sont
// conservées. Aucune date n'est inventée : l'ordre historique devient `legacyOrder`.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const LEGACY = path.join(ROOT, 'recovery', 'legacy-content');
const OUT = path.join(ROOT, 'content', 'projects');
const PUBLIC = path.join(ROOT, 'public', 'media', 'projects');

const mediaMap = JSON.parse(fs.readFileSync(path.join(LEGACY, 'media-map.json'), 'utf8')).media;
const fileOf = (url) => (url ? decodeURIComponent(url.split('/').pop()) : null);
const local = (url, slug) => (url && url.startsWith(`/media/projects/${slug}/`) ? fileOf(url) : null);

/** Références historiques manquantes par projet et par usage (d'après media-map.json). */
function missingRefs(slug) {
  const out = {};
  for (const [cmsUrl, e] of Object.entries(mediaMap)) {
    if (e.local) continue;
    for (const use of e.used_by ?? []) {
      const [s, role] = use.split(':');
      if (s === slug) out[role] = fileOf(cmsUrl);
    }
  }
  return out;
}

/** HTML historique d'un bloc texte (<p>, <br />) → Markdown équivalent. */
function htmlToMarkdown(html) {
  return html
    .replace(/\r\n/g, '\n')
    .split(/<\/p>\s*/)
    .map((p) => p.replace(/^\s*<p>/, '').trim())
    .filter(Boolean)
    .map((p) => p.replace(/<br\s*\/?>\s*\n?/g, '\\\n').replace(/<[^>]+>/g, ''))
    .join('\n\n');
}

const stripTags = (html) => (html ?? '').replace(/<[^>]+>/g, '').trim();

const files = fs.readdirSync(LEGACY).filter((f) => f.endsWith('.json') && f !== 'media-map.json');
const moved = [];

for (const f of files) {
  const p = JSON.parse(fs.readFileSync(path.join(LEGACY, f), 'utf8'));
  const slug = p.slug;
  const pf = p.projectFields ?? {};
  const blocks = p.projectFieldsFlexible?.contentBlocks ?? [];
  const missing = missingRefs(slug);
  const dir = path.join(OUT, slug);
  fs.mkdirSync(dir, { recursive: true });

  const fm = {};
  fm.title = p.title;
  fm.published = true;
  fm.legacyOrder = p.order; // ordre historique (aucune date de publication connue)
  fm.year = p.year;
  fm.category = pf.category ?? p.projectFieldsFlexible?.category;
  if (pf.subtitle) fm.subtitle = pf.subtitle;
  fm.excerpt = stripTags(p.excerpt); // "" conservé : pas de repli sur le corps
  fm.cover = local(p.featuredImage?.node?.mediaItemUrl, slug) ?? local(pf.mainImage?.node?.mediaItemUrl, slug);

  // Audio : piste existante, sinon référence historique manquante (conservée)
  const audioUrl = pf.playerAudio ?? blocks.find((b) => /Audio/.test(b.__typename))?.fileUrl ?? null;
  const audioRef = local(audioUrl, slug) ?? missing.playerAudio ?? missing.audio ?? missing['audio(title)'] ?? null;
  if (audioRef) fm.audio = audioRef;

  // Médias de la page, dans l'ordre de rendu historique :
  // vidéo plein écran → image principale → galerie → blocs flexibles (vidéo / image / galerie)
  const media = [];
  if (pf.videoFullscreen) {
    media.push({ video: local(pf.videoFullscreen, slug), autoplay: true, loop: false, muted: true, controls: true });
  }
  if (pf.mainImage?.node?.mediaItemUrl) {
    media.push({ image: local(pf.mainImage.node.mediaItemUrl, slug), alt: pf.mainImage.node.title ?? 'Visuel projet' });
  }
  for (const n of pf.gallery?.nodes ?? []) {
    if (n?.mediaItemUrl) media.push({ image: local(n.mediaItemUrl, slug), alt: n.title ?? 'Visuel projet' });
  }
  for (const b of blocks) {
    if (/VideoBlock/.test(b.__typename)) {
      const item = {};
      const v = local(b.providerUrl, slug);
      if (v) item.video = v;
      else if (b.providerUrl) item.embed = b.providerUrl;
      else if (missing.video) item.video = missing.video; // fichier manquant : référence conservée
      const poster = local(b.poster?.node?.mediaItemUrl, slug);
      if (poster) item.poster = poster;
      Object.assign(item, { autoplay: !!b.autoplay, loop: !!b.loop, muted: b.muted !== false, controls: !!b.controls });
      media.push(item);
    } else if (/ImageBlock/.test(b.__typename) && b.image?.node?.mediaItemUrl) {
      const item = { image: local(b.image.node.mediaItemUrl, slug), alt: b.image.node.title ?? '' };
      if (b.caption) item.caption = b.caption;
      media.push(item);
    } else if (/GalleryBlock/.test(b.__typename)) {
      const imgs = (b.images?.nodes ?? []).map((n) => local(n?.mediaItemUrl, slug)).filter(Boolean);
      if (imgs.length) media.push({ gallery: imgs });
    }
  }
  if (media.length) fm.media = media;

  // Texte : rendu historique conservé
  let body = '';
  const textBlock = blocks.find((b) => /TextBlock/.test(b.__typename));
  if (pf.description) {
    fm.legacyText = 'raw'; // description brute, affichée telle quelle
    body = pf.description.replace(/\r\n/g, '\n').trim();
  } else if (textBlock?.content) {
    fm.legacyText = 'block'; // bloc texte (mise en forme d'origine)
    body = htmlToMarkdown(textBlock.content);
  }

  const links = blocks
    .filter((b) => /ExternalLinkBlock/.test(b.__typename) && b.url)
    .map((b) => (b.label ? { label: b.label, url: b.url } : { url: b.url }));
  if (links.length) fm.links = links;

  // SEO : valeurs effectives historiques
  const seo = {};
  if (p.seo?.title) seo.title = p.seo.title;
  const desc = p.seo?.metaDesc || p.seo?.opengraphDescription;
  if (desc) seo.description = desc;
  const og = local(p.seo?.opengraphImage?.mediaItemUrl, slug);
  if (!og && !p.featuredImage?.node?.mediaItemUrl) seo.image = false; // image de partage du site (historique)
  else if (og && og !== fm.cover) seo.image = og;
  if (Object.keys(seo).length) fm.seo = seo;

  fs.writeFileSync(path.join(dir, 'project.md'), matter.stringify(body ? `\n${body}\n` : '\n', fm));

  // Déplacement des médias (historique Git conservé)
  const srcDir = path.join(PUBLIC, slug);
  if (fs.existsSync(srcDir)) {
    for (const m of fs.readdirSync(srcDir)) {
      const from = path.join(srcDir, m);
      const to = path.join(dir, m);
      if (fs.existsSync(to)) throw new Error(`existe déjà : ${to}`);
      execFileSync('git', ['mv', path.relative(ROOT, from), path.relative(ROOT, to)], { cwd: ROOT });
      moved.push(path.relative(ROOT, to));
    }
  }
  console.log(`✓ ${slug}`);
}
console.log(`${files.length} projets migrés, ${moved.length} médias déplacés.`);
