# Inventaire ALTAR (7.1)

Source : `bobdepanam/altar@98d7691` (lecture seule) et ses manifestes publics sur `cdn.myrr.studio`.
Toutes les créations sont des **brouillons** (`published: false`), catégorie **`xprz`**, nature
`kind` (`graphic` / `video` / `audio`). La provenance ALTAR reste interne (`source`). Titres :
`docs/altar-naming-map.md`.

## Créations

| Nature | Nombre | Origine ALTAR |
|---|---|---|
| Video | 52 | 11 projets (`library/projects`), 6 séquences (`library/sequences`), 26 vidéos World (posters repris d'Archive), 9 vidéos World (posters extraits, 7.1.0) |
| Graphic | 54 | images World (`media/altar_*.webp`) |
| Audio | 17 | compositions de la Playlist (`library/sounds`) |
| **Total** | **123** | 119 après import, − 5 doublons consolidés, + 9 vidéos World (7.1.0) |

Associations son / image conservées : `altar-003` → `altar-011` (même `main.mp3`, probablement
provisoire). La Playlist d'ALTAR tirait ses fonds **au hasard** parmi les visuels World : aucune
association réelle à reprendre. Aucune association inventée.

## Médias (7.1.0)

- **6 séquences HEVC → H.264** (`altar-bonus-001` → `006`) : versions dérivées, Fast Start, dimensions
  d'origine, servies depuis le dossier du projet ; originaux HEVC inchangés sur le CDN.
- **4 vidéos « Fast Start »** (`altar-004`, `005`, `010`, `011`) : remux sans réencodage, servies
  depuis le dossier du projet ; originaux inchangés sur le CDN.
- **11 vidéos World sans poster** : 9 importées (poster extrait) ; `altarvid_11` et `altarvid_22`
  correspondent à *Red Horizon* (non importées, voir `docs/altar-naming-map.md`).
- Restent : `main.mp3` d'`altar-001` / `altar-002` (404, aucun lecteur affiché) ; 17 compositions
  avec la pochette neutre provisoire.
- Copies de travail (originaux téléchargés, dérivés, posters) : `.media/altar/` (hors Git).

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
