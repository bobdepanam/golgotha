# Publier un projet sur GOLGOTHA

> Le site compte deux collections indépendantes : les **projets** (ce guide) et les
> **produits Simple** (`docs/publier-un-produit.md`). Elles fonctionnent de la même façon.

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
- dans le **panneau INFO** de sa page (catégorie, texte, audio, liens), ouvert en haut à droite à chaque arrivée ;
- dans **Bibliothéca** `/archive` (index de toutes les créations publiées) ;
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
| `published` | `false` = brouillon, `preview` = aperçu (URL directe, `noindex`, hors grille, Bibliothéca et sitemap), `true` = publié | `true` |
| `publishedAt` | Date de mise en ligne sur le site (`AAAA-MM-JJ`) — obligatoire pour publier | `2026-11-24` |
| `year` | Année de création de l'œuvre — obligatoire pour publier | `2026` |
| `category` | Catégorie, utilisée par le filtre de la grille — obligatoire pour publier | `soundtrack` |
| `cover` | Image principale (grille, Bibliothéca, panneau, partage) — facultative pour `kind: audio` (visuel neutre du site) | `cover.webp` |

`publishedAt` (date de mise en ligne) et `year` (année de création) sont deux informations différentes.
Un **brouillon** peut laisser `publishedAt`, `year` et `category` vides en attendant les
informations définitives : la vérification ne les exige qu'au passage à `published: true`.

### Champs optionnels

| Champ | Rôle | S'il est absent |
|---|---|---|
| `kind` | Nature : `graphic`, `video` ou `audio` (filtres, Bibliothéca, INFO) — la catégorie reste l'univers (ex. `xprz`) | rien |
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
Un média peut aussi être une **URL publique d'un CDN autorisé** (ex. créations ALTAR) : voir `docs/medias.md`.
Les noms de fichiers ne doivent pas contenir `..`, et les sous-dossiers sont possibles
(par exemple `images/still.webp`).

### Images

```yaml
cover: cover.webp
thumbnail: thumbnail.webp     # optionnel
background: background.webp   # optionnel
```

- `cover` : image principale, utilisée partout (grille, Bibliothéca, partage).
- `thumbnail` : vignette propre à la grille, si elle doit différer de la cover.
- `background` : visuel plein écran affiché au survol dans Bibliothéca.

### Visuels plein écran de la page projet

Chaque image ou vidéo de `media` occupe **tout l'écran** : toute la largeur et toute
la hauteur visible. S'il y a plusieurs médias, ils se suivent et la page défile.

- **Format conseillé sur desktop : 16:9**, en 1920 × 1080 px, ou 2560 × 1440 px pour les grands écrans.
- **Par défaut (`cover`)**, le visuel remplit l'écran sans bordure. Si le ratio de l'écran
  diffère légèrement (écran 16:10, ultrawide…), les bords sont un peu recadrés, toujours
  depuis le centre.
- **`fit: contain`** (optionnel, sur un média) affiche la composition entière sur desktop,
  avec des marges de la couleur du fond si son ratio ne correspond pas à l'écran.
  À réserver aux compositions qui ne supportent aucun recadrage.
- **Sur mobile**, le visuel remplit toujours l'écran en hauteur (`cover`, même avec
  `fit: contain`). Un visuel horizontal est donc recadré autour de son centre : placer
  l'essentiel de la composition au centre de l'image.

```yaml
media:
  - image: still-01.webp
    fit: contain
```

### Un MP3

```yaml
audio: audio.mp3
```

Le lecteur apparaît alors automatiquement, sans rien coder, à deux endroits :

- dans le **panneau INFO** de la page projet (en haut à droite, ouvert à l'arrivée) ;
- dans **Bibliothéca**, sous la cover de l'entrée sélectionnée (aucun lecteur sans piste).

C'est le même lecteur dans les deux cas : lecture / pause, progression, durée. La lecture ne
démarre jamais seule. Depuis la 7.1, elle est **globale** : elle continue d'une page à l'autre et
à la fermeture du panneau INFO ; une commande lecture / pause apparaît alors à côté de la pastille
du menu (bas gauche). Une seule piste joue à la fois.

Si le fichier n'est pas encore là ou s'il ne se charge pas, le site reste fonctionnel :
aucun lecteur ne s'affiche (la vérification le signale par un avertissement).

**Tester le lecteur en local avec un fichier de travail** (jamais publié) : un fichier
rangé dans `_sources/` n'est jamais publié, même cité dans `project.md` (erreur). Pour
l'écouter en développement uniquement, sans toucher au Markdown ni au statut du projet :

```bash
DEV_TEST_AUDIO=ashes-on-arrival:_sources/BTH_TRPH.mp3 npm run content   # dev en cours
# plusieurs pistes : DEV_TEST_AUDIO="slug-a:_sources/a.mp3,slug-b:_sources/b.mp3"
```

Le test disparaît au prochain `npm run dev` (ou `npm run content`) lancé sans la variable ;
`npm run build` l'ignore toujours.

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

Les médias sont aussi vérifiés à chaque `npm run dev` et à chaque publication : formats
acceptés, fichiers présents, noms sans `..`. Seuls les fichiers cités dans `project.md`
sont publiés.

**Après avoir ajouté ou modifié un fichier** pendant que `npm run dev` tourne, lancer
`npm run content` dans un second terminal, ou relancer `npm run dev`. La page se met alors à jour.

### Prévisualiser un brouillon

En local, `npm run dev` affiche les brouillons (`published: false`) et leurs médias, partout.
Pour voir le site exactement tel qu'en ligne : `SHOW_DRAFTS=0 npm run dev`.
La version en ligne (`npm run build`) ne publie jamais un brouillon. Les deux modes ont leurs
propres données et médias générés : un build n'efface jamais le site local.

## 5. Publier, dépublier, retirer

- **Publier** : passer `published: true`, vérifier `publishedAt`, puis enregistrer sur GitHub
  (commit + push sur `main`). Vercel met le site à jour automatiquement.
- **Dépublier** : repasser `published: false`. La page, ses médias et sa présence dans la grille,
  Bibliothéca et le sitemap disparaissent à la publication suivante. Le dossier est conservé.
- **Retirer définitivement** : supprimer le dossier du projet.

## 6. Bibliothéca (automatique)

Bibliothéca (`/archive`) est l'**index de toutes les créations publiées** : les projets
Golgotha et les produits Simple, du plus récent au plus ancien (selon `publishedAt`).
Il n'y a rien à faire :

- un nouveau projet ou produit publié y apparaît automatiquement, en tête ;
- aucune limite de nombre : la page défile quand la liste dépasse l'écran ;
- cliquer une entrée l'affiche dans le panneau INFO (cover, univers, année, accroche, lecteur
  si une piste existe) ; le survol d'une autre entrée ne change ni la sélection ni la lecture ;
- les brouillons n'y apparaissent jamais en ligne (seulement en local, avec `npm run dev`).

Les 10 projets historiques, qui n'ont pas de date connue, sont classés après les entrées
datées, dans leur ordre d'origine.

## 7. En résumé

1. Copier `_template`, puis renommer le dossier avec le slug.
2. Déposer les médias optimisés (visuels 16:9, MP3 éventuel).
3. Remplir `project.md`.
4. Lancer `npm run content:check`, puis `npm run dev`, et vérifier le rendu.
5. Mettre `published: true`, faire le commit et le push.
