// Miniatures WebP (galerie spatiale) et données de flou (placeholder des pages produit).
// Reprend la stratégie de Simple (scripts/generate-gallery-thumbs.mjs) : largeur 600 px,
// WebP qualité 75, sans agrandissement ; flou = JPEG 8 px de large, qualité 20, en base64.
//
// Encodeur : `sharp` (dépendance de développement, même version que Simple) ; repli
// provisoire sur l'encodeur Squoosh embarqué par Next 14 si sharp est indisponible.
// Incrémental : une miniature n'est recalculée que si sa source (taille, date) ou les
// réglages changent ; l'état est conservé dans un cache à côté des fichiers générés.

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

export const THUMB = { width: 600, quality: 75 };
export const BLUR = { width: 8, quality: 20 };
const SETTINGS_KEY = `w${THUMB.width}q${THUMB.quality}-b${BLUR.width}q${BLUR.quality}`;
const require = createRequire(import.meta.url);

let encoderPromise;
async function encoder() {
  encoderPromise ??= (async () => {
    try {
      const sharp = (await import('sharp')).default;
      return {
        name: 'sharp',
        thumb: (buf) => sharp(buf).resize(THUMB.width, null, { withoutEnlargement: true }).webp({ quality: THUMB.quality }).toBuffer(),
        blur: (buf) => sharp(buf).resize(BLUR.width, null).jpeg({ quality: BLUR.quality }).toBuffer(),
        close: () => {},
      };
    } catch {
      const sq = require('next/dist/server/lib/squoosh/main.js');
      const resizeOps = async (buf, width) => {
        const meta = await sq.getMetadata(buf);
        return meta.width && meta.width > width ? [{ type: 'resize', width }] : [];
      };
      return {
        name: 'squoosh (Next)',
        thumb: async (buf) => sq.processBuffer(buf, await resizeOps(buf, THUMB.width), 'webp', THUMB.quality),
        blur: async (buf) => sq.processBuffer(buf, [{ type: 'resize', width: BLUR.width }], 'jpeg', BLUR.quality),
        close: () => {},
      };
    }
  })();
  return encoderPromise;
}

/**
 * @param {{ src: string, dest: string, key: string }[]} jobs  dest : chemin absolu de la miniature
 * @param {string} cacheFile  cache JSON (dans le dossier généré)
 * @returns {Promise<{ blur: Map<string,string>, made: number, kept: number, encoder: string|null }>}
 *   blur : key → data URL du flou
 */
export async function generateThumbs(jobs, cacheFile) {
  const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
  const next = {};
  const blur = new Map();
  let made = 0;
  let kept = 0;
  // Encodeur chargé d'emblée : il fait partie de la signature (changer d'encodeur régénère)
  const enc = jobs.length ? await encoder() : null;

  const todo = [];
  for (const job of jobs) {
    const st = fs.statSync(job.src);
    const sig = `${st.size}:${Math.round(st.mtimeMs)}:${SETTINGS_KEY}:${enc.name}`;
    const prev = cache[job.dest];
    if (prev && prev.sig === sig && fs.existsSync(job.dest)) {
      next[job.dest] = prev;
      blur.set(job.key, prev.blur);
      kept += 1;
    } else todo.push({ ...job, sig });
  }

  // Concurrence limitée (l'encodeur répartit déjà le travail)
  const queue = [...todo];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const buf = fs.readFileSync(job.src);
      const [thumb, small] = await Promise.all([enc.thumb(buf), enc.blur(buf)]);
      fs.mkdirSync(path.dirname(job.dest), { recursive: true });
      fs.writeFileSync(job.dest, thumb);
      const dataUrl = `data:image/jpeg;base64,${Buffer.from(small).toString('base64')}`;
      next[job.dest] = { sig: job.sig, blur: dataUrl };
      blur.set(job.key, dataUrl);
      made += 1;
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, todo.length) }, worker));

  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(next, null, 2) + '\n');
  return { blur, made, kept, encoder: enc?.name ?? null };
}
