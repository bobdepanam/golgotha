# Projets multimédias et Bibliothéca (V8)

Ce guide complète `docs/publier-un-projet.md`. Un projet reste **un dossier**
`content/projects/<slug>/` avec un fichier `project.md` et ses médias. Aucun composant
React n'est à modifier pour créer un projet.

## 1. Un ou plusieurs médias : c'est le contenu qui décide

| Nombre de médias dans `media:` | Page plein écran |
|---|---|
| 1 | Inchangée : le média occupe l'écran |
| 2 ou plus | Navigation horizontale entre les médias : chevrons latéraux, glisser, balayage, touches ← → |

Il n'y a pas de mode à déclarer. La navigation horizontale ne boucle pas et ne défile jamais
toute seule. Elle n'a aucun rapport avec le bouton **Next**, qui passe au projet suivant.

## 2. Champs du `project.md`

| Champ | Obligatoire | Rôle |
|---|---|---|
| `title` | oui | Titre |
| `published` | oui | `false` = brouillon (dev uniquement), `true` = publié |
| `publishedAt` | pour publier | Date de mise en ligne (`AAAA-MM-JJ`), qui sert aussi à la sélection de Bibliothéca |
| `year` | pour publier | Année de création |
| `category` | pour publier | Catégorie éditoriale (provisoire, libre) |
| `cover` | oui, sauf `kind: audio` | Visuel principal : grilles, miniature de Bibliothéca, partage |
| `kind` | non | Nature : `graphic`, `video` ou `audio`, indépendante de la catégorie |
| `audio` | non | Bande-son globale du projet (MP3) |
| `bibliotheca` | non | `true` = inclure dans Bibliothéca, `false` = exclure (voir § 4) |
| `media` | non | Liste **ordonnée** des médias affichés |
| `thumbnail` | non | Miniature propre aux grilles (sinon `cover`) |

Un média est un fichier du dossier (sous-dossiers permis, ex. `media/01.webp`) ou une URL
publique d'un hôte autorisé (voir `docs/medias.md`).

## 3. Exemples

### Projet à image unique

```yaml
---
title: "Glass Moon"
published: true
publishedAt: 2026-12-01
year: 2026
category: "xprz"
kind: "graphic"
cover: "cover.webp"
media:
  - image: "cover.webp"
---
```

### Série d'images avec une bande-son globale

```yaml
---
title: "Sacred Studies"
published: true
publishedAt: 2026-12-01
year: 2026
category: "illustration"
kind: "graphic"
cover: "cover.webp"
audio: "soundtrack.mp3"     # continue pendant toute la série
bibliotheca: true           # facultatif ici : la présence d'un audio suffit
media:                      # l'ordre de la liste = l'ordre d'affichage
  - image: "media/01.webp"
  - image: "media/02.webp"
    fit: contain            # composition entière visible (desktop)
  - video: "media/03.mp4"
    poster: "media/03.webp" # conseillé : affiché pendant le chargement
    autoplay: true
    loop: true
  - image: "media/04.webp"
    caption: "Légende facultative"
---
```

Dossier correspondant :

```text
content/projects/sacred-studies/
  project.md
  cover.webp
  soundtrack.mp3
  media/01.webp  media/02.webp  media/03.mp4  media/03.webp  media/04.webp
```

### Composition musicale

```yaml
---
title: "Starless Voyage"
published: true
publishedAt: 2026-12-01
year: 2026
category: "xprz"
kind: "audio"
audio: "starless-voyage.mp3"
cover: "pochette.webp"      # facultatif : sinon pochette neutre BSTRDZ
---
```

Il existe aussi `gallery: [a.webp, b.webp]` : chaque image d'une galerie devient un écran de
la navigation horizontale.

## 4. Bibliothéca : la bibliothèque sonore

Bibliothéca et Projects lisent **les mêmes données**.

- **Éligible** : un projet publié qui a une vraie source audio dans `audio:`. Une vidéo ne
  devient jamais une entrée sonore à cause de sa propre piste. Les fichiers de travail
  (`_sources/`…) ne comptent pas.
- **Exclu** : `bibliotheca: false`, même si le projet a un audio.
- **Rétrocompatibilité** : sans le champ `bibliotheca`, la présence d'un audio suffit. Aucun
  ancien projet n'est à modifier.
- **Une piste = une entrée** : un même fichier audio publié par plusieurs projets n'apparaît
  qu'une fois, pour le projet le plus récent.
- **Sélection** : les **40** projets éligibles les plus récents (`publishedAt`), puis
  mélangés. L'ordre change à chaque nouvelle entrée dans Bibliothéca, et reste stable pendant
  la consultation (widget, lecteur, redimensionnement).
- **Défilement** : en boucle infinie quand la liste est assez haute. Les entrées ne sont pas
  dupliquées dans les données : 3 copies légères de la liste suffisent.
- **Miniature** : carrée, tirée de `thumbnail`, sinon de `cover`, à la place de l'année.
- **Clic** : ouvre le widget d'aperçu, comme avant.

## 5. Son et vidéo dans une page projet

- La bande-son globale ne dépend pas du média affiché. Changer d'image ou de vidéo n'arrête, ne
  relance et ne coupe jamais la lecture.
- Les vidéos sont **muettes** par défaut. Si le visiteur active le son d'une vidéo, la bande-son
  globale se met en pause, pour éviter toute superposition involontaire.
- Seuls le média affiché et ses voisins sont chargés. Une vidéo qui n'est pas à l'écran est en
  pause.
