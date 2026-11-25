# Publier un produit SIMPLE

La collection Simple fonctionne comme les projets (voir `docs/publier-un-projet.md`) :
**un dossier par produit** dans `content/simple/`, avec son texte, ses réglages et ses médias.
On ne touche jamais au code.

```text
content/simple/
├── _template/            ← modèle à copier (jamais publié)
├── bad-seed/
│   ├── product.md        ← texte + réglages
│   ├── cover.webp        ← visuel principal
│   ├── detail-01.webp
│   └── _sources/         ← fichiers de travail (jamais publiés, ignorés par Git)
└── …
```

## 1. Créer un produit

1. Copier `content/simple/_template`.
2. Le renommer avec le **slug** : minuscules, chiffres, tirets (`bad-seed` → `/simple/bad-seed`).
   Ne plus le changer une fois en ligne.
3. Déposer les médias dans le dossier ; les fichiers de travail (PSD, TIFF, rushes…) dans `_sources/`.
4. Remplir `product.md`.

Le nombre de produits n'est jamais fixé : la collection s'adapte automatiquement aux dossiers présents.

## 2. Le fichier `product.md`

| Champ | Rôle | Obligatoire |
|---|---|---|
| `title` | Nom du produit | toujours |
| `published` | `false` = brouillon, `true` = publié | toujours |
| `cover` | Visuel principal (pages produit) ; sa miniature est générée automatiquement | toujours |
| `publishedAt` | Date de mise en ligne (`AAAA-MM-JJ`) | pour publier |
| `year` | Année de création | pour publier |
| `category` | Catégorie (filtres) — valeur libre, à confirmer | pour publier |
| `tagline`, `cut`, `material`, `edition` | Accroche, coupe, matière, édition | non |
| `media` | Images, vidéos, galeries de la fiche (même syntaxe que les projets, `fit: contain` possible) | non |
| `audio` | Piste MP3 | non |
| `thumbnail` | Autre image source pour la miniature de la galerie | non |
| `links`, `seo` | Liens, partage | non |

Le texte sous les réglages (Markdown) est la description du produit.

### Données provisoires

Le bloc `provisional:` contient des valeurs **non validées** (par exemple les données de
démonstration importées de l'ancien site Simple). Il n'est **jamais publié** : il sert
uniquement aux tests en local. Pour publier, recopier dans les vrais champs les seules
informations confirmées, puis supprimer le bloc.

## 3. Médias et miniatures

- Formats : images WebP / AVIF / JPG / PNG / GIF, vidéos MP4 / WebM, audio MP3.
- Les **ratios d'origine** sont conservés partout.
- Pour chaque produit, une **miniature WebP de 600 px** (galerie spatiale) et un
  **placeholder de flou** sont générés automatiquement à partir de la cover (ou de `thumbnail`).
  La génération est incrémentale : seule une image nouvelle ou modifiée est recalculée.
- Les dossiers commençant par `_` (`_sources/`…) ne sont jamais publiés.

## 4. Vérifier et prévisualiser

```bash
npm run content:check        # vérifie projets et produits (brouillons compris)
SHOW_DRAFTS=1 npm run dev    # site local avec les brouillons (produits non validés compris)
```

Les produits en brouillon n'existent qu'en local avec `SHOW_DRAFTS=1` ; la version en ligne
ne publie jamais un brouillon ni un bloc `provisional`.

## 5. Publier, dépublier, retirer

- **Publier** : renseigner `publishedAt`, `year`, `category`, passer `published: true`, commit + push.
- **Dépublier** : repasser `published: false` (le dossier est conservé).
- **Retirer** : supprimer le dossier.

## Commandes éditoriales (résumé)

| Commande | Effet |
|---|---|
| `npm run content:check` | Valide les deux collections, n'écrit rien |
| `npm run content` | Prépare les données et médias pour le développement |
| `SHOW_DRAFTS=1 npm run content` | Idem, brouillons compris (génère leurs miniatures) |
| `npm run dev` / `npm run build` | Préparent automatiquement le contenu avant de démarrer |
