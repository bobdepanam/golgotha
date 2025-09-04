// scripts/generate-experiment-md.cjs
const fs = require("fs");
const path = require("path");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.split("=");
    return [k.replace(/^--/, ""), v ?? true];
  })
);

const DIR = path.resolve(process.cwd(), args.dir || "public/images/video");
const OUT = path.resolve(process.cwd(), args.out || "public/data/infinite-grid.md");
const MAX = Number(args.max ?? 250); // 👈 cap total (videos + images)

const IMG_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const VID_EXT = new Set([".mp4", ".webm", ".mov"]);

function kebab(s) {
  return s.toLowerCase().replace(/\.[a-z0-9]+$/, "")
    .replace(/[_\s]+/g, "-").replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function humanize(s) {
  return s.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ").trim().replace(/\b\w/g, (m) => m.toUpperCase());
}

// 10 lignes “William Blake-ish”
const POETIC = [
  "A spark walks softly through the void.",
  "Night folds its wings around a secret fire.",
  "Lines awaken, dreaming of their own geometry.",
  "Time opens like a hand of quiet thunder.",
  "An echo grazes the horizon, bright and brief.",
  "Matter sings, and light keeps the memory.",
  "A whisper breaks the shadow into constellations.",
  "Embers drift; the dark listens without end.",
  "A window of silence tilts toward dawn.",
  "Stillness moves—an angel made of static."
];

// choix stable par nom de fichier (FNV-1a)
function poeticLineFor(name) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return POETIC[h % POETIC.length];
}
function readDirSafe(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { console.error("❌ Cannot read directory:", dir, e.message); process.exit(1); }
}
function exists(p) {
  try { fs.accessSync(p, fs.constants.F_OK); return true; } catch { return false; }
}

// scan
const entries = readDirSafe(DIR).filter(d => d.isFile()).map(d => d.name)
  .sort((a,b)=>a.localeCompare(b, undefined, { numeric:true, sensitivity:"base"}));

const imgs = [], vids = [];
for (const name of entries) {
  const ext = path.extname(name).toLowerCase();
  if (IMG_EXT.has(ext)) imgs.push(name);
  if (VID_EXT.has(ext)) vids.push(name);
}

// associer posters par basename
const posterMap = new Map();
for (const img of imgs) {
  const base = path.basename(img, path.extname(img));
  posterMap.set(base.toLowerCase(), img);
}

const items = [];
const usedPosters = new Set(); // 👈 on remplira avec leurs chemins publics

// vidéos en premier
for (const v of vids) {
  const base = path.basename(v, path.extname(v));
  const key = base.toLowerCase();
  const posterName = posterMap.get(key) || posterMap.get(key.replace(/\s+/g, "-")) || undefined;
  const posterPath = posterName ? path.posix.join("/images/video", posterName) : undefined;
  if (posterPath) usedPosters.add(posterPath); // 👈 mémoriser pour ne pas re-lister côté images

  items.push({
    id: kebab(base),
    title: humanize(base),
    type: "video",
    poster: posterPath,
    full: path.posix.join("/images/video", v),
    categories: ["motion"],
    description: "Looped sequence.",
  });
}

// images (exclure celles déjà utilisées comme poster)
const imagePool = imgs
  .map(n => path.posix.join("/images/video", n))
  .filter(p => !usedPosters.has(p)); // 👈 exclusion

for (const imgPath of imagePool) {
  const base = path.basename(imgPath, path.extname(imgPath));
  items.push({
    id: kebab(base),
    title: humanize(base),
    type: "image",
    src: imgPath,
    categories: ["visual", "still"],
    description: poeticLineFor(base),
  });
}

// ordonner (vidéos d’abord), puis appliquer le CAP MAX
const ordered = [
  ...items.filter(i => i.type === "video"),
  ...items.filter(i => i.type === "image"),
].slice(0, MAX);

// YAML front-matter minimal
function yamlEscape(s) {
  if (s == null) return "";
  if (typeof s !== "string") return s;
  if (/[:#\-\?\[\]\{\},&*!|>'"%@`]/.test(s) || /\s/.test(s)) return JSON.stringify(s);
  return s;
}
function toYAML(items) {
  const lines = ["---", "items:"];
  for (const it of items) {
    lines.push(`  - id: "${it.id}"`);
    lines.push(`    title: ${yamlEscape(it.title)}`);
    lines.push(`    type: "${it.type}"`);
    if (it.type === "video") {
      if (it.poster) lines.push(`    poster: ${yamlEscape(it.poster)}`);
      lines.push(`    full: ${yamlEscape(it.full)}`);
      lines.push(`    categories: ["motion"]`);
      lines.push(`    description: ${yamlEscape(it.description)}`);
    } else {
      lines.push(`    src: ${yamlEscape(it.src)}`);
      lines.push(`    categories: ["visual", "still"]`);
      lines.push(`    description: ${yamlEscape(it.description)}`);
    }
    lines.push("");
  }
  lines.push("---", "");
  return lines.join("\n");
}

// write
const outDir = path.dirname(OUT);
if (!exists(outDir)) fs.mkdirSync(outDir, { recursive: true });
const yaml = toYAML(ordered);
fs.writeFileSync(OUT, yaml, "utf-8");

console.log(`CWD: ${process.cwd()}`);
console.log(`✅ MD generated: ${OUT}`);
console.log(`📦 scanned: ${vids.length} video(s), ${imgs.length} image(s). usedPosters: ${usedPosters.size}`);
console.log(`🔢 capped at MAX=${MAX} → written items: ${ordered.length}`);
