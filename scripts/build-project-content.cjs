#!/usr/bin/env node
/**
 * GOLGOTHA — build de la couche de contenu locale des projets (sans WordPress).
 *
 * Entrées  : recovery/projects/*.project.json (données GraphQL brutes, non modifiées)
 *            recovery/inventories/media_inventory.json
 *            médias sources : historique git, recovery/images/, public/ (copie)
 * Sorties  : public/media/projects/<slug>/<fichier>
 *            src/content/projects/<slug>.json      (URLs CMS réécrites en chemins locaux)
 *            src/content/projects/media-map.json   (ancienne URL WordPress → chemin local)
 *
 * Idempotent : un fichier média déjà présent n'est jamais écrasé ; s'il diffère
 * (SHA-256), le script s'arrête. Les sources (dont les assets /experiment) sont
 * uniquement lues, jamais déplacées ni modifiées.
 *
 * Usage : node scripts/build-project-content.cjs
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const RECOVERY = path.join(ROOT, "recovery");
const PUBLIC_MEDIA = path.join(ROOT, "public", "media", "projects");
const CONTENT = path.join(ROOT, "src", "content", "projects");
const CMS_HOST = "cms.bastardz.fr";
const UPLOADS = `https://${CMS_HOST}/wp-content/uploads/`;

/** Année confirmée par la page /archive en production (dates exactes inconnues). */
const CONFIRMED_YEAR = 2025;

/**
 * Table des médias : nom de fichier CMS → fichier local + source.
 * Priorité : original git (haute résolution) > copie locale > dérivé Vercel (recovery/images).
 * `null` = média introuvable (ne pas inventer de remplacement).
 */
const MEDIA = {
  // through-shadows
  "Through-Shadows_01_cover.png": { slug: "through-shadows", file: "Through-Shadows_01_cover.png", source: { type: "git", commit: "6bd617826a8c363f354a41670b02924442d4960c", path: "public/images/video/Through Shadows_01_cover.png" } },
  "Through-Shadows_01-scaled.png": { slug: "through-shadows", file: "Through-Shadows_01.png", source: { type: "git", commit: "da93972f32e21937d6768fb933e2f3017e1ab5d4", path: "public/images/video/Through Shadows_01.png" } },
  "Through-Shadows_01.mp4": { slug: "through-shadows", file: "Through-Shadows_01.mp4", source: { type: "copy", path: "public/images/img/Through Shadows_01.mp4" } },
  "Through-Shadows.mp3": null,
  // heroes-for-the-universe
  "golgotha_2-scaled.png": { slug: "heroes-for-the-universe", file: "golgotha_2.png", source: { type: "git", commit: "295765e1f68a31134e7fc4817c8f46f216fbdaf5", path: "public/images/video/golgotha_2.png" } },
  "golgotha_2.mp4": { slug: "heroes-for-the-universe", file: "golgotha_2.mp4", source: { type: "copy", path: "public/images/img/golgotha_2.mp4" } },
  "heroes-for-the-universe.mp3": null,
  // beware-of-the-wolf
  "new_6.jpg": { slug: "beware-of-the-wolf", file: "new_6.webp", source: { type: "recovery", path: "recovery/images/new_6__vercel-w1536.webp" } },
  "beware.mp4": null,
  // silent-pulse
  "echo-light.png": { slug: "silent-pulse", file: "echo-light.png", source: { type: "git", commit: "df841b9067f5d76daa18f92d9638c8719a25c6c6", path: "public/images/video/echo light.png" } },
  "echo.mp4": { slug: "silent-pulse", file: "echo.mp4", source: { type: "copy", path: "public/images/img/echo.mp4" } },
  "Hollow-Sunlight.mp3": null,
  // tstxbstrdz
  "tokyo_37.webp": { slug: "tstxbstrdz", file: "tokyo_37.webp", source: { type: "recovery", path: "recovery/images/tokyo_37__vercel-w1920.webp" } },
  "tokyo_16.webp": { slug: "tstxbstrdz", file: "tokyo_16.webp", source: { type: "recovery", path: "recovery/images/tokyo_16__vercel-w1920.webp" } },
  // Asset partagé avec /experiment : COPIE uniquement, la source reste intacte.
  "TTSxBSTRDZ.mp4": { slug: "tstxbstrdz", file: "TTSxBSTRDZ.mp4", source: { type: "copy", path: "public/images/bstrdz/TTSxBSTRDZ.mp4" } },
  // hollow-sunlight
  "dark.png": { slug: "hollow-sunlight", file: "dark.webp", source: { type: "recovery", path: "recovery/images/dark__vercel-w1920.webp" } },
  // mouth-in-the-floor
  "london_8.webp": { slug: "mouth-in-the-floor", file: "london_8.webp", source: { type: "recovery", path: "recovery/images/london_8__vercel-w1536.webp" } },
  "Mouths-in-the-Floor_-alternative.mp3": null,
  // currents (original git vérifié visuellement contre le dérivé Vercel : même image)
  "current.png": { slug: "currents", file: "current.png", source: { type: "git", commit: "99c592d5eae915eb70c67cb55fd73c29c316252f", path: "public/images/video/current.png" } },
  "current.mp4": { slug: "currents", file: "current.mp4", source: { type: "copy", path: "public/images/img/current.mp4" } },
  // Absent de media_inventory.json : URL saisie par erreur dans le champ `title` du bloc audio (fileUrl = null).
  "Hypnotic-Currents-Remix.mp3": null,
  // pulse-and-grain
  "intro_7.webp": { slug: "pulse-and-grain", file: "intro_7.webp", source: { type: "git", commit: "fc380851de46563e4a4a1c2750355835c2d19faf", path: "public/images/intro/intro_7.webp" } },
  "Pulse-and-Grain.mp3": null,
  // ashes-on-arrival
  "golgotha-cover.jpg": { slug: "ashes-on-arrival", file: "golgotha-cover.webp", source: { type: "recovery", path: "recovery/images/golgotha-cover__vercel-w1536.webp" } },
  "Ashes-On-Arrival.mp3": null,
};

/* ---------------- utilitaires ---------------- */
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

function readSource(src) {
  if (src.type === "git") {
    return execFileSync("git", ["show", `${src.commit}:${src.path}`], { cwd: ROOT, maxBuffer: 512 * 1024 * 1024 });
  }
  return fs.readFileSync(path.join(ROOT, src.path));
}

function imageInfo(b) {
  if (b.length > 24 && b.toString("ascii", 1, 4) === "PNG") {
    return { mime: "image/png", width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }
  if (b.length > 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const c = b.toString("ascii", 12, 16);
    if (c === "VP8 ") return { mime: "image/webp", width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (c === "VP8L") { const n = b.readUInt32LE(21); return { mime: "image/webp", width: (n & 0x3fff) + 1, height: ((n >> 14) & 0x3fff) + 1 }; }
    if (c === "VP8X") return { mime: "image/webp", width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  }
  return null;
}

const mimeFromExt = (f) => ({ ".mp4": "video/mp4", ".mp3": "audio/mpeg" }[path.extname(f).toLowerCase()] || null);

/* ---------------- 1. médias ---------------- */
/** URLs d'upload présentes dans les données brutes mais absentes de l'inventaire (voir MEDIA). */
const EXTRA_UPLOADS = [
  { url: `${UPLOADS}2025/07/Hypnotic-Currents-Remix.mp3`, mime: "audio", sizes: [], uses: ["currents:audio(title)"] },
];

const inventory = [...readJson(path.join(RECOVERY, "inventories", "media_inventory.json")), ...EXTRA_UPLOADS];
const basename = (u) => decodeURIComponent(u.split("/").pop());

// URL dérivée WordPress (-300x300, etc.) → URL originale
const derivedToOriginal = new Map();
for (const m of inventory) {
  derivedToOriginal.set(m.url, m.url);
  for (const s of m.sizes || []) derivedToOriginal.set(s, m.url);
}

const mediaMap = {};
const resolved = new Map(); // URL originale → entrée locale | null

for (const m of inventory) {
  const name = basename(m.url);
  if (!(name in MEDIA)) throw new Error(`Média CMS non référencé dans la table MEDIA : ${name}`);
  const def = MEDIA[name];
  if (!def) {
    mediaMap[m.url] = { local: null, status: "missing", reason: "Introuvable hors CMS (accès OVH ou fichier source requis)", used_by: m.uses };
    resolved.set(m.url, null);
    continue;
  }
  const buf = readSource(def.source);
  const dir = path.join(PUBLIC_MEDIA, def.slug);
  const dest = path.join(dir, def.file);
  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(dest)) {
    if (sha256(fs.readFileSync(dest)) !== sha256(buf)) throw new Error(`Fichier existant différent, arrêt (pas d'écrasement) : ${dest}`);
  } else {
    fs.writeFileSync(dest, buf, { flag: "wx" });
  }
  const img = imageInfo(buf);
  const entry = {
    local: `/media/projects/${def.slug}/${def.file}`,
    status: def.source.type === "recovery" ? "derivative" : def.source.type === "git" ? "original" : "local-copy",
    source: def.source.type === "git" ? `git:${def.source.commit.slice(0, 7)}:${def.source.path}` : def.source.path,
    mime: img ? img.mime : mimeFromExt(def.file),
    ...(img ? { width: img.width, height: img.height } : {}),
    bytes: buf.length,
    sha256: sha256(buf),
    used_by: m.uses,
  };
  mediaMap[m.url] = entry;
  resolved.set(m.url, entry);
}

/* ---------------- 2. contenus ---------------- */
function rewriteUrl(u) {
  if (typeof u !== "string" || !u.includes(CMS_HOST)) return u;
  if (u.startsWith(UPLOADS)) {
    const original = derivedToOriginal.get(u);
    if (!original) throw new Error(`URL d'upload inconnue : ${u}`);
    const e = resolved.get(original);
    return e ? e.local : null;
  }
  // ex. canonical Yoast "https://cms.bastardz.fr/projects/<slug>/" → "/projects/<slug>"
  const p = new URL(u).pathname.replace(/\/+$/, "");
  return p || "/";
}

function transform(v) {
  if (Array.isArray(v)) return v.map(transform);
  if (v && typeof v === "object") {
    if (typeof v.mediaItemUrl === "string" && v.mediaItemUrl.startsWith(UPLOADS)) {
      const e = resolved.get(derivedToOriginal.get(v.mediaItemUrl));
      if (!e) return null; // média manquant → nœud absent
      const out = {};
      for (const [k, val] of Object.entries(v)) out[k] = transform(val);
      if (v.mimeType !== undefined) out.mimeType = e.mime;
      if (v.mediaDetails !== undefined) {
        out.mediaDetails = { width: e.width ?? null, height: e.height ?? null, sizes: [] }; // tailles dérivées WP inexistantes en local
      }
      return out;
    }
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = transform(val);
    return out;
  }
  return rewriteUrl(v);
}

const projectsInventory = readJson(path.join(RECOVERY, "inventories", "projects_inventory.json"));
fs.mkdirSync(CONTENT, { recursive: true });
const written = [];
projectsInventory.forEach(({ slug }, index) => {
  const raw = readJson(path.join(RECOVERY, "projects", `${slug}.project.json`));
  if (!Array.isArray(raw) || raw.length !== 1 || raw[0].slug !== slug) throw new Error(`Données brutes inattendues : ${slug}`);
  const project = transform(raw[0]);
  project.year = CONFIRMED_YEAR;
  project.order = index + 1; // ordre de production (date décroissante), dates exactes inconnues
  const json = JSON.stringify(project, null, 2) + "\n";
  if (json.includes(CMS_HOST)) throw new Error(`URL CMS résiduelle dans ${slug}`);
  fs.writeFileSync(path.join(CONTENT, `${slug}.json`), json);
  written.push(slug);
});

fs.writeFileSync(
  path.join(CONTENT, "media-map.json"),
  JSON.stringify(
    {
      description: "Correspondance anciennes URLs WordPress (cms.bastardz.fr) → chemins locaux. Généré par scripts/build-project-content.cjs. local=null : média manquant.",
      derived_sizes_note: "Les URLs de tailles dérivées WordPress (-300x300, -1024x…, etc.) pointent vers le même fichier local que leur original.",
      media: mediaMap,
    },
    null,
    2
  ) + "\n"
);

const entries = Object.values(mediaMap);
console.log(`Projets écrits : ${written.length} → ${written.join(", ")}`);
console.log(`Médias : ${entries.filter((e) => e.local).length} locaux, ${entries.filter((e) => !e.local).length} manquants`);
for (const [u, e] of Object.entries(mediaMap)) console.log(`  ${e.local ? e.status.padEnd(10) : "MISSING   "} ${basename(u).padEnd(38)} → ${e.local ?? "—"}`);
