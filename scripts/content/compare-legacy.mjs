#!/usr/bin/env node
// scripts/content/compare-legacy.mjs — non-régression de la migration
// Compare, pour chaque projet, ce que les interfaces affichent à partir des anciens JSON
// (recovery/legacy-content/*.json) et des nouvelles données (src/generated/projects.json) :
// grille, Bibliothéca, page projet (colonnes médias / infos), métadonnées SEO, ordre.
// Les règles reproduisent exactement celles des composants.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const legacyDir = path.join(ROOT, 'recovery', 'legacy-content');
const legacy = fs
  .readdirSync(legacyDir)
  .filter((f) => f.endsWith('.json') && f !== 'media-map.json')
  .map((f) => JSON.parse(fs.readFileSync(path.join(legacyDir, f), 'utf8')))
  .sort((a, b) => a.order - b.order);
const current = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'generated', 'projects.json'), 'utf8')).projects;

/** HTML → texte rendu (le navigateur fusionne les espaces ; <br> = saut de ligne). */
const rendered = (html) =>
  html == null
    ? null
    : html
        .replace(/\r\n/g, '\n')
        .replace(/<br\s*\/?>/g, '⏎')
        .replace(/<\/p>\s*<p>/g, '¶')
        .replace(/<[^>]+>/g, '')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .replace(/\s*([⏎¶])\s*/g, '$1')
        .trim();

const blocksOf = (p) => p.projectFieldsFlexible?.contentBlocks ?? [];
const isDirect = (u) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(u ?? '');

function view(p) {
  const pf = p.projectFields ?? {};
  const blocks = blocksOf(p);
  const mediaUrl = (n) => n?.mediaItemUrl || n?.sourceUrl || null;

  // Grille (src/app/projects/page.tsx → getProjectThumb, puis vignette éventuelle)
  let thumb = mediaUrl(p.featuredImage?.node) || mediaUrl(pf.mainImage?.node) || mediaUrl(pf.gallery?.nodes?.[0]);
  if (!thumb) {
    for (const b of blocks) {
      thumb = mediaUrl(b.poster?.node) || mediaUrl(b.image?.node) || mediaUrl(b.images?.nodes?.[0]);
      if (thumb) break;
    }
  }
  thumb = p.thumbnail ?? thumb;

  // Bibliothéca (src/app/archive/page.tsx → pickCover / pickAudio, fond = background ?? cover)
  const archiveCover =
    p.featuredImage?.node?.mediaItemUrl ??
    blocks.find((b) => /Video/.test(b.__typename) && b.poster?.node?.mediaItemUrl)?.poster.node.mediaItemUrl ??
    blocks.find((b) => /Image/.test(b.__typename) && b.image?.node?.mediaItemUrl)?.image.node.mediaItemUrl ??
    pf.mainImage?.node?.mediaItemUrl ??
    null;
  const archiveAudio = pf.playerAudio || blocks.find((b) => /Audio/.test(b.__typename) && b.fileUrl)?.fileUrl || null;

  // Page projet — colonne médias (ProjectPageSlugWrapper)
  const mediaCol = [];
  if (pf.videoFullscreen && isDirect(pf.videoFullscreen)) {
    mediaCol.push({ k: 'video', src: pf.videoFullscreen, poster: null, autoplay: true, loop: false, controls: true });
  }
  if (pf.mainImage?.node?.mediaItemUrl) mediaCol.push({ k: 'image', src: pf.mainImage.node.mediaItemUrl, alt: pf.mainImage.node.title ?? 'Visuel projet', caption: null });
  for (const n of pf.gallery?.nodes ?? []) if (n?.mediaItemUrl) mediaCol.push({ k: 'image', src: n.mediaItemUrl, alt: n.title ?? 'Visuel projet', caption: null });
  for (const b of blocks) {
    if (/Video/.test(b.__typename)) {
      if (!b.providerUrl && b.poster?.node?.mediaItemUrl) mediaCol.push({ k: 'poster', src: b.poster.node.mediaItemUrl });
      else if (b.providerUrl && isDirect(b.providerUrl)) {
        mediaCol.push({ k: 'video', src: b.providerUrl, poster: b.poster?.node?.mediaItemUrl ?? null, autoplay: !!b.autoplay, loop: !!b.loop, controls: !!b.controls });
      } else if (b.providerUrl) mediaCol.push({ k: 'embed', src: b.providerUrl, autoplay: !!b.autoplay, loop: !!b.loop, controls: !!b.controls });
    } else if (/Image/.test(b.__typename) && b.image?.node?.mediaItemUrl) {
      mediaCol.push({ k: 'image', src: b.image.node.mediaItemUrl, alt: b.image.node.title ?? '', caption: b.caption || null });
    } else if (/Gallery/.test(b.__typename) && b.images?.nodes?.length) {
      mediaCol.push({ k: 'gallery', srcs: b.images.nodes.filter((n) => n?.mediaItemUrl).map((n) => n.mediaItemUrl) });
    }
  }
  // Légendes d'images : le nouveau format reprend le titre comme texte alternatif
  for (const m of mediaCol) if (m.k === 'image') m.alt = m.alt?.trim();

  // Page projet — colonne infos (SiteDock INFO)
  const infoCol = [];
  if (pf.category) infoCol.push({ k: 'category', v: pf.category });
  if (pf.subtitle) infoCol.push({ k: 'subtitle', v: pf.subtitle });
  if (pf.description) infoCol.push({ k: 'description', v: rendered(pf.description) });
  if (pf.playerAudio) infoCol.push({ k: 'audio', v: pf.playerAudio });
  for (const b of blocks) {
    if (/Text/.test(b.__typename) && b.content) infoCol.push({ k: 'text', v: rendered(b.content) });
    else if (/Audio/.test(b.__typename) && b.fileUrl) infoCol.push({ k: 'audio', v: b.fileUrl });
    else if (/ExternalLink/.test(b.__typename) && b.url) infoCol.push({ k: 'link', label: b.label || b.url, url: b.url });
  }

  // Métadonnées (src/app/projects/[slug]/page.tsx → generateMetadata)
  const seo = p.seo ?? {};
  const cleanExcerpt = typeof p.excerpt === 'string' ? p.excerpt.replace(/<[^>]+>/g, '').trim() : '';
  const meta = {
    title: seo.title || seo.opengraphTitle || p.title || 'Golgotha',
    description: seo.metaDesc || seo.opengraphDescription || (pf.subtitle ?? cleanExcerpt) || 'Projet — Golgotha',
    ogImage: seo.opengraphImage?.mediaItemUrl || p.featuredImage?.node?.mediaItemUrl || '/images/og/cover.jpg',
    canonical: seo.canonical || `/projects/${p.slug}`,
  };

  return {
    slug: p.slug,
    title: p.title,
    year: p.year,
    grid: { thumb, category: pf.category?.trim() || p.projectFieldsFlexible?.category?.trim() || '' },
    filters: [pf.category, p.projectFieldsFlexible?.category].filter(Boolean),
    archive: { cover: archiveCover, background: p.background ?? archiveCover, audio: archiveAudio },
    mediaCol,
    infoCol,
    meta,
  };
}

let failures = 0;
const order = (list) => list.map((p) => p.slug).join(', ');
if (order(legacy) !== order(current.filter((p) => !p.draft))) {
  failures += 1;
  console.log('✗ ordre différent\n  ancien :', order(legacy), '\n  nouveau:', order(current));
} else console.log(`✓ ordre identique (${legacy.length} projets)`);

for (const old of legacy) {
  const neu = current.find((p) => p.slug === old.slug);
  if (!neu) {
    failures += 1;
    console.log(`✗ ${old.slug} : absent des nouvelles données`);
    continue;
  }
  const a = view(old);
  const b = view(neu);
  const diffs = Object.keys(a).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
  if (diffs.length) {
    failures += 1;
    console.log(`✗ ${old.slug}`);
    for (const k of diffs) console.log(`   ${k}\n     ancien : ${JSON.stringify(a[k])}\n     nouveau: ${JSON.stringify(b[k])}`);
  } else console.log(`✓ ${old.slug} — grille, Bibliothéca, médias (${a.mediaCol.length}), infos (${a.infoCol.length}), SEO identiques`);
}

console.log(failures ? `\n${failures} écart(s).` : '\nAucun écart : migration fidèle.');
process.exit(failures ? 1 : 0);
