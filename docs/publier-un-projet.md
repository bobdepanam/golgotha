# Publier un projet sur GOLGOTHA

Chaque projet est **un dossier** dans `content/projects/`. Ce dossier contient tout :
le texte, les réglages et les médias. Le site se construit automatiquement à partir de
ces dossiers. On ne touche jamais au code.

```text
content/projects/
├── _template/            ← modèle à copier (jamais publié)
├── through-shadows/
│   ├── project.md        ← texte + réglages
│   ├── cover.png
│   ├── poster.png
│   └── video.mp4
└── …
```

Un projet publié apparaît automatiquement :

- dans la **grille** `/projects` (et dans son filtre de catégorie) ;
- sur **sa page** `/projects/<nom-du-dossier>` ;
- dans le **panneau INFO** de sa page (catégorie, texte, audio, liens) ;
- dans **Bibliothéca** `/archive` s'il fait partie des 10 derniers ;
- dans le **sitemap** et les informations de partage (Google, réseaux sociaux).

---

## 1. Créer un projet

1. Copier le dossier `content/projects/_template`.
2. Le renommer avec le **slug** du projet : minuscules, chiffres et tirets uniquement.
   `the-holy-swearer` donnera l'adresse `bastardz.fr/projects/the-holy-swearer`.
   Ne plus changer ce nom une fois le projet en ligne, car l'adresse changerait.
3. Déposer les médias dans ce dossier (voir § 3).
4. Ouvrir `project.md` et remplir les champs (voir § 2).

## 2. Le fichier `project.md`

Il se compose de deux parties :

- en haut, entre les deux lignes `---`, les **réglages** ;
- en dessous, le **texte** de présentation.

### Champs essentiels

| Champ | Rôle | Exemple |
|---|---|---|
| `title` | Titre du projet | `The Holy Swearer` |
| `published` | `false` = brouillon, `true` = publié | `true` |
| `publishedAt` | Date de mise en ligne sur le site (`AAAA-MM-JJ`) | `2026-11-24` |
| `year` | Année de création de l'œuvre | `2026` |
| `category` | Catégorie, utilisée par le filtre de la grille | `soundtrack` |
| `cover` | Image principale (grille, Bibliothéca, panneau, partage) | `cover.webp` |

`publishedAt` (date de mise en ligne) et `year` (année de création) sont deux informations différentes.

### Champs optionnels

| Champ | Rôle | S'il est absent |
|---|---|---|
| `subtitle` | Ligne « Index_ » du panneau INFO | rien |
| `excerpt` | Résumé pour Google et les partages | 1er paragraphe du texte |
| `thumbnail` | Vignette de la grille | `cover` |
| `background` | Visuel plein écran au survol dans Bibliothéca | `cover` |
| `audio` | Piste MP3 (lecteur dans INFO et dans Bibliothéca) | pas de lecteur |
| `media` | Images, vidéos, galeries de la page projet | page sans média |
| `links` | Liens du panneau INFO | rien |
| `seo` | Titre, description et image propres au partage | titre, résumé, cover |

Le texte sous les réglages s'écrit en **Markdown** : une ligne vide entre deux paragraphes,
`*italique*`, `**gras**` et `[texte du lien](https://…)`. Les crédits s'y écrivent simplement.

Les champs `legacyOrder` et `legacyText` ne servent qu'aux 10 projets historiques.
Ne pas les utiliser pour un nouveau projet.

## 3. Ajouter des médias

Tous les fichiers vont **dans le dossier du projet**, puis sont cités par leur nom dans `project.md`.
Les noms de fichiers ne doivent pas contenir `..`, et les sous-dossiers sont possibles
(par exemple `images/still.webp`).

### Images

```yaml
cover: cover.webp
thumbnail: thumbnail.webp     # optionnel
background: background.webp   # optionnel
```

### Un MP3

```yaml
audio: audio.mp3
```

Le lecteur apparaît alors automatiquement dans le panneau INFO de la page et dans Bibliothéca.
Si le fichier n'est pas encore là, le site reste fonctionnel : simplement, aucun lecteur ne s'affiche
(la vérification le signale par un avertissement).

### Une vidéo

```yaml
media:
  - video: preview.mp4
    poster: poster.webp   # image affichée avant la lecture (conseillée)
    autoplay: true        # lecture automatique, toujours sans le son
    loop: true
    controls: false
```

Pour une vidéo lourde, préférer un lien YouTube ou Vimeo :

```yaml
media:
  - embed: https://vimeo.com/123456789
```

### Une image ou une galerie

```yaml
media:
  - image: still-01.webp
    alt: Description de l'image
    caption: Légende affichée sous l'image
  - gallery: [still-02.webp, still-03.webp, still-04.webp]
```

Les médias s'affichent sur la page **dans l'ordre de la liste**.

### Formats et poids conseillés

| Type | Formats acceptés | Poids conseillé |
|---|---|---|
| Image | WebP (conseillé), AVIF, JPG, PNG, GIF | ≤ 3 Mo (environ 2000 px suffisent) |
| Audio | MP3 | ≤ 15 Mo |
| Vidéo | MP4 (H.264), WebM | ≤ 30 Mo, sinon YouTube / Vimeo |

GitHub refuse les fichiers de plus de **100 Mo**.

**Ne jamais déposer** de fichiers de travail dans le dossier d'un projet : WAV masters, PSD,
After Effects, Premiere, rushes, TIFF. Ils restent dans votre stockage personnel. Ces formats sont
de toute façon ignorés par Git, et seuls les fichiers cités dans `project.md` sont publiés.

## 4. Vérifier et prévisualiser

Dans un terminal, à la racine du projet :

```bash
npm run content:check   # vérifie tous les projets (brouillons compris)
npm run dev             # site local sur http://localhost:3000
```

La vérification indique, pour chaque problème, le projet, le champ et le fichier concernés :

```text
✗ the-holy-swearer › cover : fichier introuvable (« cover.webp »)
⚠ the-holy-swearer › audio : fichier introuvable — ignoré en attendant son ajout (« audio.mp3 »)
```

- **✗ erreur** : à corriger, sinon la publication est bloquée.
- **⚠ avertissement** : le site fonctionne ; le média concerné est simplement ignoré, ou le fichier est lourd.

**Après avoir ajouté ou modifié un fichier** pendant que `npm run dev` tourne, lancer
`npm run content` dans un second terminal, ou relancer `npm run dev`. La page se met alors à jour.

### Prévisualiser un brouillon

```bash
SHOW_DRAFTS=1 npm run dev
```

Les brouillons (`published: false`) et leurs médias apparaissent alors en local, partout.
Cette option ne fonctionne qu'en local : la version en ligne ne publie jamais un brouillon.

## 5. Publier, dépublier, retirer

- **Publier** : passer `published: true`, vérifier `publishedAt`, puis enregistrer sur GitHub
  (commit + push sur `main`). Vercel met le site à jour automatiquement.
- **Dépublier** : repasser `published: false`. La page, ses médias et sa présence dans la grille,
  Bibliothéca et le sitemap disparaissent à la publication suivante. Le dossier est conservé.
- **Retirer définitivement** : supprimer le dossier du projet.

## 6. Bibliothéca (automatique)

Bibliothéca affiche **les 10 derniers projets publiés**, du plus récent au plus ancien
(selon `publishedAt`). Il n'y a rien à faire :

- un nouveau projet publié y entre en tête ;
- quand il y en a plus de 10, le plus ancien en sort, mais il reste dans la grille et sur sa page ;
- les brouillons n'y apparaissent jamais.

Les 10 projets historiques, qui n'ont pas de date connue, sont classés après les projets datés,
dans leur ordre d'origine. Le nombre d'entrées se règle dans `src/config/content.ts` (`ARCHIVE_LIMIT`).

## 7. En résumé

1. Copier `_template`, puis renommer le dossier avec le slug.
2. Déposer les médias optimisés.
3. Remplir `project.md`.
4. Lancer `npm run content:check`, puis `npm run dev`, et vérifier le rendu.
5. Mettre `published: true`, faire le commit et le push.
