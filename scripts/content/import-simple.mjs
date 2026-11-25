#!/usr/bin/env node
// scripts/content/import-simple.mjs — import ponctuel des visuels ORIGINAUX de Simple (BSTRDZ 7.0.2)
//
// Source (lecture seule) : /workspaces/simple-bastardz @ f975918
//   public/images/gallery/simple_N.webp     → content/simple/simple-N/simple_N.webp (copie, octets identiques)
//   src/content/projects/simple-N.md         → content/simple/simple-N/product.md
//
// Règles :
// - Uniquement les 58 visuels uniques : simple-1 … simple-58 (vérifié par empreinte SHA-256).
//   Les entrées 59 à 126 de Simple sont des copies exactes de visuels déjà importés : non importées.
// - Médias secondaires de Simple (public/images/projects/simple-N/0X.webp) : images de
//   remplissage « REPLACE MEDIA » → non importées.
// - Aucune métadonnée considérée comme définitive : catégorie, année, textes, coupe, matière,
//   édition… vont dans `provisional` (jamais publié). Statut : brouillon.
// - Ne remplace jamais un dossier produit existant (relancer est sans effet sur l'existant).
//
// Usage : node scripts/content/import-simple.mjs [chemin du dépôt Simple]

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const SIMPLE_REPO = path.resolve(process.argv[2] ?? '/workspaces/simple-bastardz');
const SOURCE_REF = 'simple-bastardz@f975918';
const DEST = path.join(process.cwd(), 'content', 'simple');
const ORIGINALS = Array.from({ length: 58 }, (_, i) => i + 1);

const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const yamlStr = (v) => JSON.stringify(String(v)); // chaîne YAML sûre (JSON ⊂ YAML)

let created = 0;
let skipped = 0;
for (const n of ORIGINALS) {
  const slug = `simple-${n}`;
  const dir = path.join(DEST, slug);
  if (fs.existsSync(dir)) {
    skipped += 1;
    continue;
  }
  const image = path.join(SIMPLE_REPO, 'public', 'images', 'gallery', `simple_${n}.webp`);
  const mdSrc = path.join(SIMPLE_REPO, 'src', 'content', 'projects', `${slug}.md`);
  if (!fs.existsSync(image)) throw new Error(`visuel introuvable : ${image}`);

  const src = fs.existsSync(mdSrc) ? matter(fs.readFileSync(mdSrc, 'utf8')) : { data: {}, content: '' };
  const d = src.data;
  const body = (src.content ?? '').trim();

  // Valeurs de démonstration héritées de Simple : toutes provisoires
  const provisional = {};
  const put = (key, value) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') provisional[key] = String(value).trim();
  };
  put('category', d.category);
  put('year', d.year);
  put('tier', d.tier);
  put('tagline', d.tagline);
  put('summary', d.summary);
  put('cut', d.fit); // « fit » de Simple = coupe du vêtement (≠ cadrage `fit` des médias)
  put('material', d.material);
  put('edition', d.edition);
  put('client', d.client);
  put('role', d.role);
  put('credits', d.credits);
  if (body && body !== provisional.summary) put('body', body);

  const provisionalYaml = Object.keys(provisional).length
    ? matter.stringify('', { provisional }).replace(/^---\n/, '').replace(/\n---\n*$/, '\n')
    : '';

  const md = `---
# Importé de ${SOURCE_REF} (${slug}). Visuel d'origine conservé tel quel.
# Tout le reste est À VALIDER : les valeurs de démonstration de Simple sont rangées
# dans « provisional » (jamais publié). Pour publier : renseigner les champs ci-dessous
# avec des informations confirmées, puis passer published à true.
title: ${yamlStr(d.title ?? slug)}   # titre repris de Simple — à confirmer
published: false
# publishedAt: AAAA-MM-JJ   # obligatoire pour publier
# year: 2026                # obligatoire pour publier
# category:                 # obligatoire pour publier (catégorie définitive)
# tagline:
# cut:                      # coupe
# material:                 # matière
# edition:                  # édition
cover: simple_${n}.webp
${provisionalYaml}---
`;

  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, `simple_${n}.webp`);
  fs.copyFileSync(image, dest);
  if (sha(dest) !== sha(image)) throw new Error(`copie altérée : ${dest}`);
  fs.writeFileSync(path.join(dir, 'product.md'), md);
  created += 1;
}

console.log(`[import-simple] ${created} produit(s) créé(s), ${skipped} déjà présent(s) — source ${SOURCE_REF} (lecture seule).`);
