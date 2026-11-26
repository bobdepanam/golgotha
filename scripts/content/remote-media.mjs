#!/usr/bin/env node
// Métadonnées des médias distants (7.1) — `npm run content:remote`.
// Parcourt content/projects/*/project.md et content/simple/*/product.md, relève chaque URL
// https d'un hôte autorisé (src/config/media.json) et écrit content/remote-media.json :
// { url: { status, bytes, type, width?, height? } }. Requêtes HEAD, et pour les images une
// lecture partielle (Range : 64 Ko) pour leurs dimensions. Aucun fichier n'est téléchargé
// entièrement ni ajouté au dépôt. Incrémental : seules les URLs nouvelles sont interrogées
// (`--refresh` pour tout revérifier). Le build lit ce cache, sans accès réseau.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { imageSize } from './image-size.mjs';

const ROOT = process.cwd();
const CACHE = path.join(ROOT, 'content/remote-media.json');
const HOSTS = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/media.json'), 'utf8')).remoteHosts ?? []);
const refresh = process.argv.includes('--refresh');

function urlsIn(dir, file) {
  const out = new Set();
  if (!fs.existsSync(dir)) return out;
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, d.name, file);
    if (!d.isDirectory() || !fs.existsSync(f)) continue;
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/https:\/\/[^\s"'#)]+/g)) {
      try {
        if (HOSTS.has(new URL(m[0]).host)) out.add(m[0]);
      } catch {
        /* URL invalide : signalée par la vérification du contenu */
      }
    }
  }
  return out;
}

async function probe(url) {
  const res = await fetch(url, { method: 'HEAD' });
  const meta = { status: res.status, bytes: Number(res.headers.get('content-length')) || null, type: res.headers.get('content-type') };
  if (res.status === 200 && /^image\//.test(meta.type ?? '')) {
    const part = await fetch(url, { headers: { Range: 'bytes=0-65535' } });
    const tmp = path.join(os.tmpdir(), `remote-media-${process.pid}`);
    fs.writeFileSync(tmp, Buffer.from(await part.arrayBuffer()));
    try {
      const size = imageSize(tmp);
      if (size) Object.assign(meta, size);
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  }
  return meta;
}

const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
const urls = [...urlsIn(path.join(ROOT, 'content/projects'), 'project.md'), ...urlsIn(path.join(ROOT, 'content/simple'), 'product.md')];
const todo = urls.filter((u) => refresh || !cache[u]);
console.log(`[remote] ${urls.length} URL(s) distante(s), ${todo.length} à vérifier`);
let i = 0;
async function worker() {
  while (i < todo.length) {
    const u = todo[i++];
    try {
      cache[u] = await probe(u);
    } catch (e) {
      cache[u] = { status: 0, error: String(e.message || e) };
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
// Cache limité aux URLs encore citées ; ordre stable (diff lisible)
const next = Object.fromEntries(urls.sort().map((u) => [u, cache[u]]));
fs.writeFileSync(CACHE, `${JSON.stringify(next, null, 1)}\n`);
const missing = Object.entries(next).filter(([, m]) => m.status !== 200);
console.log(`[remote] ✓ cache écrit (${Object.keys(next).length}) — introuvables : ${missing.length}`);
for (const [u, m] of missing) console.log(`[remote]   ✗ HTTP ${m.status} ${u}`);
