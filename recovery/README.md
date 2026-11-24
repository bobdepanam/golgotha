# GOLGOTHA — Récupération des contenus

**Date :** 2026-11-23
**Contexte :** le CMS WordPress `cms.bastardz.fr` est suspendu par OVH (HTTP 503 sur toutes les URLs, `wp-content/uploads` compris). Ce dossier sauvegarde tout ce qui pouvait être récupéré **sans WordPress**, à partir des caches de production Vercel et de l'historique git.

Ce dossier est une **archive en lecture seule**. Aucun composant Next.js ne l'importe et il ne modifie pas le site. Ne pas éditer les fichiers de `projects/` : ce sont les données brutes de référence.

---

## Contenu

```
recovery/
├── README.md          ← ce fichier
├── manifest.json      ← inventaire machine : provenance, poids, dimensions, SHA-256 de chaque élément
├── inventories/
│   ├── projects_inventory.json   ← synthèse des 10 projets (slug, titre, catégories, blocs, SEO)
│   └── media_inventory.json      ← les 24 médias CMS (URL, mime, dimensions, tailles dérivées, usages)
├── projects/                     ← 10 × <slug>.project.json : données GraphQL complètes, brutes
└── images/                       ← 7 images récupérées depuis le cache de l'optimiseur Vercel
```

---

## 1. Données projets — 10/10 récupérées ✅

**Source :** les pages `https://bastardz.fr/projects/<slug>` sont encore servies depuis le cache ISR de Vercel. Leur charge utile RSC (`self.__next_f.push(...)`) contient l'objet `project` renvoyé par la requête GraphQL `getProjectBySlugQuery`. Cet objet a été extrait avec `JSON.parse`, **sans aucune transformation**. Chaque fichier est un tableau JSON qui contient un seul objet.

Chaque fichier contient : `title`, `slug`, `excerpt` (HTML), `featuredImage`, `projectFields` (ancien groupe ACF : `subtitle`, `category`, `description`, `playerAudio`, `videoFullscreen`, `mainImage`, `gallery`), `projectFieldsFlexible` (catégorie et blocs vidéo, texte, image, audio, lien, galerie) et `seo` (Yoast). Pour chaque média : URL, mime, dimensions et toutes les tailles dérivées WordPress.

| Ordre (date ↓) | Slug | Titre | Catégorie |
|---|---|---|---|
| 1 | `through-shadows` | Through Shadows | soundtrack |
| 2 | `heroes-for-the-universe` | heroes for the universe | forges |
| 3 | `beware-of-the-wolf` | Beware of the wolf | cave canem |
| 4 | `silent-pulse` | Silent pulse | soundtrack |
| 5 | `tstxbstrdz` | TSTxBSTRDZ | Video |
| 6 | `hollow-sunlight` | Hollow sunlight | soft electro |
| 7 | `mouth-in-the-floor` | Mouth in the floor | Lo-fi |
| 8 | `currents` | Currents | Currents in void |
| 9 | `pulse-and-grain` | Pulse and grain | Ambiant |
| 10 | `ashes-on-arrival` | Ashes on arrival | soundtrack |

**Dates :** seuls l'année (2025), l'ordre ci-dessus et le mois d'upload des médias (2025/07 à 2025/09) sont connus. Les dates exactes de publication ❌ sont absentes et nécessitent la base WordPress.

**Anomalie relevée :** `silent-pulse` pointe vers `Hollow-Sunlight.mp3` pour son bloc audio. C'est probablement une erreur de saisie dans le CMS, à confirmer.

---

## 2. Médias — état des 24 fichiers du CMS

### 2a. Images récupérées depuis le cache Vercel (`images/`) — 7/7 ✅

Ces images ont été produites par l'optimiseur Next.js de Vercel (`/_next/image`, WebP, qualité 75). Ce sont **des dérivés ré-encodés, pas les fichiers originaux**. L'optimiseur n'agrandit jamais une image : quand la largeur demandée dépasse l'original, le fichier est **aux dimensions d'origine**.

| Fichier | Original CMS | Dimensions récupérées | Résolution | Utilisé par |
|---|---|---|---|---|
| `new_6__vercel-w1536.webp` | new_6.jpg (1024²) | 1024×1024 | **pleine** | beware-of-the-wolf (cover + poster) |
| `tokyo_37__vercel-w1920.webp` | tokyo_37.webp (1440×1080) | 1440×1080 | **pleine** | tstxbstrdz (main) |
| `tokyo_16__vercel-w1920.webp` | tokyo_16.webp (1440×1041) | 1440×1041 | **pleine** | tstxbstrdz (galerie) |
| `london_8__vercel-w1536.webp` | london_8.webp (1500×1010) | 1500×1010 | **pleine** | mouth-in-the-floor (main) |
| `dark__vercel-w1920.webp` | dark.png (dimensions inconnues) | 1920×1076 | réduite (≥ 1920 px à l'origine) | hollow-sunlight (main) |
| `current__vercel-w1536.webp` | current.png (inconnues) | 1536×861 | réduite — voir l'original git en 2b | currents (cover + poster) |
| `golgotha-cover__vercel-w1536.webp` | golgotha-cover.jpg (2048²) | 1536×1536 | réduite | ashes-on-arrival (main) |

Chaque fichier a passé une validation structurelle (signature RIFF/WEBP, taille RIFF égale à la taille du fichier, en-tête VP8 / VP8L / VP8X valide, tous les chunks dans les bornes). Le décodage complet des pixels n'a pas été fait, faute de décodeur dans l'environnement. La provenance complète (URL de requête, `x-vercel-cache`, `age`, `last-modified`) et le SHA-256 sont dans `manifest.json`, section `images`.

> État du cache au moment du téléchargement : `dark.png` a été servie en `STALE` (entrée déjà expirée d'environ 26 h). Les autres étaient en `HIT`, avec environ 80 h (`tokyo_37`, `tokyo_16`) à 180 h de validité restante. Ce cache est éphémère : ces fichiers sont désormais **la seule copie connue** de `new_6`, `tokyo_37`, `tokyo_16`, `london_8` et `dark`.

### 2b. Originaux présents dans l'historique git — 6 identifiés, non extraits

Ces fichiers ont été supprimés de `public/` mais restent intacts dans l'historique. Ce sont les **fichiers sources** (en général de meilleure qualité que la version CMS). Ils n'ont **pas** été réintroduits dans `public/`.

| Fichier CMS | Commit | Chemin dans le commit | Dimensions | Confiance |
|---|---|---|---|---|
| Through-Shadows_01_cover.png | `6bd6178` | `public/images/video/Through Shadows_01_cover.png` | 1632×1632 | exacte (mêmes dimensions) |
| Through-Shadows_01-scaled.png | `da93972` | `public/images/video/Through Shadows_01.png` | 2944×1632 | haute (original avant réduction WP « -scaled ») |
| golgotha_2-scaled.png | `295765e` | `public/images/video/golgotha_2.png` | 3412×1898 | haute (idem) |
| echo-light.png | `df841b9` | `public/images/video/echo light.png` | 1456×816 | exacte |
| intro_7.webp | `fc38085` | `public/images/intro/intro_7.webp` | 2048×2048 | exacte (la version actuelle de `public/` a été réduite) |
| current.png | `99c592d` | `public/images/video/current.png` | 2912×1632 | probable |

Commande d'extraction (SHA complets, blob et SHA-256 dans `manifest.json`, section `git_originals`) :

```bash
git show 6bd617826a8c363f354a41670b02924442d4960c:"public/images/video/Through Shadows_01_cover.png" > <destination>
```

### 2c. Copies locales encore dans `public/` — non copiées

| Fichier CMS | Fichier local | Confiance |
|---|---|---|
| golgotha-cover.jpg | `public/images/og/cover.jpg` | partielle (recadrage 2048×1076 d'une source 2048²) |
| Through-Shadows_01.mp4 | `public/images/img/Through Shadows_01.mp4` | même nom |
| golgotha_2.mp4 | `public/images/img/golgotha_2.mp4` | même nom |
| current.mp4 | `public/images/img/current.mp4` | même nom |
| echo.mp4 | `public/images/img/echo.mp4` | même nom |
| TTSxBSTRDZ.mp4 | `public/images/bstrdz/TTSxBSTRDZ.mp4` | même nom — **asset de `/experiment` : copier, ne jamais déplacer** |

Pour les vidéos, l'identité octet par octet avec le CMS n'est pas vérifiable. Les SHA-256 sont relevés dans `manifest.json` pour une comparaison ultérieure.

### 2d. Manquants ❌ — nécessitent un accès OVH ou les fichiers sources

| Fichier | Utilisé par |
|---|---|
| beware.mp4 | beware-of-the-wolf (vidéo) |
| Through-Shadows.mp3 | through-shadows |
| heroes-for-the-universe.mp3 | heroes-for-the-universe |
| Hollow-Sunlight.mp3 | hollow-sunlight, silent-pulse |
| Mouths-in-the-Floor_-alternative.mp3 | mouth-in-the-floor |
| Pulse-and-Grain.mp3 | pulse-and-grain |
| Ashes-On-Arrival.mp3 | ashes-on-arrival |

Sources vérifiées sans succès : cache de l'optimiseur Vercel, cache CDN de `/api/proxy`, Wayback Machine (aucune capture de `cms.bastardz.fr`), toutes les branches, tags et PR GitHub, cache local `.next`.

---

## 3. Réutilisation prévue (phase suivante, non engagée)

1. **Données :** chaque `projects/<slug>.project.json` respecte déjà le type `Project` (`src/types/project.ts`). Un futur `getProjectBySlug()` local pourra lire ces fichiers (ou une copie normalisée, par exemple `src/content/projects/`) à la place de `fetchGraphQL`, sans modifier les composants.
2. **Médias :** pour chaque URL `cms.bastardz.fr/wp-content/uploads/...` de `media_inventory.json`, choisir dans cet ordre : original git (2b), puis copie locale (2c), puis dérivé Vercel (2a). Placer le fichier sous `public/media/projects/<slug>/` (ou sur un stockage objet pour les vidéos lourdes) et réécrire les URLs via une table de correspondance.
3. **Manquants :** à réintégrer quand l'accès OVH sera rétabli (`wp-content/uploads/2025/07` à `2025/09` et la base de données pour les dates), ou à partir des fichiers sources (exports audio).

## Intégrité

Pour vérifier qu'un fichier n'a pas été altéré, recalculer son SHA-256 et le comparer au `manifest.json` :

```bash
cd recovery && node -e 'const m=require("./manifest.json"),fs=require("fs"),c=require("crypto");for(const e of [...m.inventories,...m.projects,...m.images]){const h=c.createHash("sha256").update(fs.readFileSync(e.file)).digest("hex");console.log(h===e.sha256?"OK ":"KO ",e.file)}'
```

---

## Couche intermédiaire `legacy-content/` (archivée le 2026-11-24)

`legacy-content/<slug>.json` et `legacy-content/media-map.json` sont les fichiers JSON locaux qui ont alimenté le site entre le
retrait de WordPress et la phase 6.2. Ils ont été produits par `scripts/build-project-content.cjs` à partir de `projects/` (script retiré en phase 6.3, consultable dans l'historique git : commit `dbccfbc`).
Depuis la phase 6.2, le site est alimenté par `content/projects/<slug>/project.md` (voir `docs/publier-un-projet.md`).
Ces JSON restent la référence de non-régression : `node scripts/content/compare-legacy.mjs`.
