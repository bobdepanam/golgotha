#!/usr/bin/env node
// Import ponctuel des créations ALTAR (7.1) — `node scripts/content/import-altar.mjs <dossier ALTAR>`.
// Lit, en lecture seule, les manifestes générés d'ALTAR (src/lib/*.generated.ts) et crée un
// dossier content/projects/<slug>/project.md par création, en BROUILLON, catégorie `altar`.
// Médias : URLs publiques du CDN d'ALTAR (cdn.myrr.studio), réutilisées telles quelles —
// aucun fichier copié dans le dépôt. Titres, années et tags d'origine conservés ; aucun texte,
// aucune date, aucune association son / image inventés. Dossier existant : jamais écrasé.
// Ensuite : `npm run content:remote` (métadonnées), puis `npm run content:check`.
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.argv[2] ?? '/workspaces/altar');
const DEST = path.join(process.cwd(), 'content/projects');
const HEADS = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : null; // statuts HTTP (facultatif)

function manifest(file) {
  const s = fs.readFileSync(path.join(SRC, 'src/lib', file), 'utf8');
  const i = s.indexOf('[', s.indexOf('=', s.indexOf('export const')));
  return JSON.parse(s.slice(i, s.lastIndexOf(']') + 1));
}
const enc = (u) => encodeURI(decodeURI(u)); // espaces des noms de fichiers → %20
const ok = (u) => !HEADS || [HEADS[u], HEADS[enc(u)]].some((h) => h?.code === '200');
const yaml = (v) => JSON.stringify(v);

const created = [];
const skipped = [];
function write(slug, fm, comment) {
  const dir = path.join(DEST, slug);
  if (fs.existsSync(dir)) return skipped.push(slug);
  const lines = ['---', ...comment.map((c) => `# ${c}`)];
  for (const [k, v] of Object.entries(fm)) {
    if (v === undefined || v === null) continue;
    if (k === 'media') {
      lines.push('media:');
      for (const m of v) {
        const [first, ...rest] = Object.entries(m);
        lines.push(`  - ${first[0]}: ${yaml(first[1])}`);
        for (const [mk, mv] of rest) lines.push(`    ${mk}: ${typeof mv === 'string' ? yaml(mv) : mv}`);
      }
    } else lines.push(`${k}: ${typeof v === 'string' ? yaml(v) : v}`);
  }
  lines.push('---', '');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'project.md'), lines.join('\n'));
  created.push(slug);
}
const NOTE = 'Brouillon importé d\'ALTAR (bobdepanam/altar@98d7691, 7.1) — à sélectionner, renommer, compléter.';
const video = (src, poster) => ({ video: enc(src), ...(poster ? { poster: enc(poster) } : {}), autoplay: true, loop: true, muted: true, controls: false });

// 1. Projets ALTAR (library/projects) : vidéo + pochette (+ piste principale si présente)
for (const p of manifest('projectItems.generated.ts')) {
  const audio = p.paths?.audioMain && ok(p.paths.audioMain) ? enc(p.paths.audioMain) : undefined;
  write(p.slug, {
    title: p.title, published: false, year: Number.isInteger(p.year) ? p.year : undefined, category: 'altar',
    source: `ALTAR — library/projects/${p.slug}`, cover: enc(p.cover), audio, media: [video(p.video.src, p.video.poster)],
  }, [NOTE, `Tags ALTAR d'origine : ${(p.tags ?? []).join(', ') || '—'}${audio ? '' : ' · piste principale absente du CDN'}`]);
}

// 2. Séquences (library/sequences) : vidéo + vignette
for (const q of manifest('sequenceItems.generated.ts')) {
  write(`altar-${q.slug}`, {
    title: q.title, published: false, category: 'altar', source: `ALTAR — library/sequences/${q.slug}`,
    cover: enc(q.thumbSrc), media: [video(q.previewSrc, q.thumbSrc)],
  }, [NOTE, 'Séquence audiovisuelle (section Sequences)']);
}

// 3. World : images (création visuelle seule) et vidéos (poster repris de l'archive identique)
const world = manifest('worldItems.generated.ts');
const archive = manifest('archiveItems.generated.ts');
const sizeOf = (u) => HEADS?.[enc(u)]?.len ?? HEADS?.[u]?.len ?? null;
const used = new Set(); // médias déjà importés (projets, séquences) : aucun doublon
for (const f of ['projectItems.generated.ts', 'sequenceItems.generated.ts']) {
  for (const it of manifest(f)) for (const u of JSON.stringify(it).match(/https:[^"]+/g) ?? []) if (sizeOf(u)) used.add(sizeOf(u));
}
const posterBySize = new Map(archive.map((a) => [sizeOf(a.src), a.cover]));
const pending = { audio: [], videoNoPoster: [], duplicates: [] };
for (const w of world) {
  const n = (w.id.match(/(\d+)/) ?? [])[1];
  const size = sizeOf(w.src);
  if (size && used.has(size)) { pending.duplicates.push(w.title); continue; }
  if (w.kind === 'audio') { pending.audio.push(w.title); continue; }
  if (w.kind === 'image') {
    write(`altar-image-${n}`, { title: w.title, published: false, category: 'altar', source: `ALTAR — world/${w.id}`, cover: enc(w.src), media: [{ image: enc(w.src), fit: 'contain' }] }, [NOTE, 'Création visuelle sans piste audio associée (World)']);
  } else {
    const poster = posterBySize.get(size);
    if (!poster) { pending.videoNoPoster.push(w.title); continue; }
    write(`altar-video-${n}`, { title: w.title, published: false, category: 'altar', source: `ALTAR — world/${w.id} (poster : archive)`, cover: enc(poster), media: [video(w.src, poster)] }, [NOTE, 'Vidéo (World) ; poster repris de l\'entrée Archive identique ; bande-son d\'origine conservée dans le fichier']);
  }
}

console.log(`[altar] ${created.length} dossier(s) créé(s), ${skipped.length} existant(s) conservé(s)`);
console.log(JSON.stringify(pending, null, 1));
