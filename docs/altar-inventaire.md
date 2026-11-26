# Inventaire ALTAR (7.1)

Source : `bobdepanam/altar@98d7691` (lecture seule) et ses manifestes publics sur `cdn.myrr.studio`.
Toutes les créations sont des **brouillons** (`published: false`), catégorie **`xprz`**, nature
`kind` (`graphic` / `video` / `audio`). La provenance ALTAR reste interne (`source`). Titres :
`docs/altar-naming-map.md`.

## Créations

| Nature | Nombre | Origine ALTAR |
|---|---|---|
| Video | 43 | 11 projets (`library/projects`), 6 séquences (`library/sequences`), 26 vidéos World (posters repris d'Archive) |
| Graphic | 54 | images World (`media/altar_*.webp`) |
| Audio | 17 | compositions de la Playlist (`library/sounds`) |
| **Total** | **114** | 119 après import, − 5 doublons consolidés (`docs/altar-deduplication-map.md`) |

Associations son / image conservées : `altar-003` → `altar-011` (même `main.mp3`, probablement
provisoire). La Playlist d'ALTAR tirait ses fonds **au hasard** parmi les visuels World : aucune
association réelle à reprendre. Aucune association inventée.

## À compléter

- **17 compositions sans pochette** : pochette neutre (`public/images/bstrdz/audio-cover.webp`, logo
  BASTARDZ existant sur fond sombre, lisible dans les deux thèmes) en attendant une vraie pochette
  (`cover:` dans leur `project.md`).
- **11 vidéos World sans poster** (non importées) : `altarvid_8, 9, 11, 22, 26, 27, 33, 34, 35, 38, 43`
  — un poster suffit pour les ajouter.
- **6 séquences en HEVC** (`altar-bonus-001` → `006`) : lecture garantie sous Safari seulement ;
  une version H.264 serait à produire (nouveau fichier, sans toucher à l'original).
- **4 vidéos sans « faststart »** (`altar-004`, `005`, `010`, `011`) : démarrage plus lent.
- `altar-001`, `altar-002` : `main.mp3` absent du CDN (404).

## Doublons

- Archive (28 vidéos) = vidéos World ; titres de remplissage (« HBO Max | Hacks ») ignorés.
- 9 MP3 de World = pistes de la Playlist (importées une seule fois, en Audio).
- 5 vidéos World = vidéos des projets ; `altar_58` = `altar_14` (fichiers identiques).
- Paires image fixe / vidéo d'une même œuvre (fichiers distincts, conservés) : voir la colonne
  « Remarque » de `docs/altar-naming-map.md`.
- Aucun doublon avec les créations Golgotha, CANEM ou SIMPLE.

## Exhaustivité

Les 4 manifestes publiés sur le CDN (World 111, Archive 28, Projets 11, Séquences 6) sont
identiques à ceux du dépôt, et la Playlist (17) est entièrement reprise. Le bucket `altar-media`
compte 403 objets : ≈ 278 sont référencés (médias, `meta.json`, manifestes). Les ≈ 125 restants
ne sont cités nulle part dans le code ALTAR ; les identifier demande un accès en lecture à
`altar-media` (le jeton actuel est limité à `bstrdz-media`).
