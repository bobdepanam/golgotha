# Galerie spatiale SIMPLE — état (BSTRDZ 7.0.3a)

Portage de la grille de Simple (`simple-bastardz@f975918`, `src/components/spatial/`) sur la
stack de Golgotha, branché sur la collection `content/simple/` (miniatures générées).

## Validé visuellement (Chrome, Mac, trackpad)

Identité de la grille Simple, densité et proportions, zoom / dézoom (plage 10 → 22),
pincement, focus produit (zoom 8, atténuation), flou et vignette périphériques, thèmes
Dark / Light, cohabitation avec la navigation Golgotha.

## Navigation infinie — NON validée, reportée à la phase 7.0.8 (Creative Refinement)

Le moteur infini est en place et stable :
- pool fixe de tuiles couvrant la zone visible au dézoom maximal (+ 2 cellules de marge) ;
- chaque tuile occupe une cellule logique (i, j) et est recyclée hors champ au bord opposé ;
- produit d'une cellule : `(i + K·j) mod N`, K calculé depuis N pour espacer les répétitions ;
- mêmes 58 textures et slugs (aucun duplicata éditorial) ;
- vérifié par simulation : écran couvert à chaque frame, aucune discontinuité.

**Point restant** : au test réel, la navigation ne procure pas encore l'expérience attendue
(référence : grille infinie Codrops, mécanique de navigation uniquement) ; le rendu reste très
proche de Simple original. À reprendre en 7.0.8, sans retoucher la direction artistique validée.

### Modifications expérimentales (7.0.3a.1), conservées car stables

Par rapport à Simple (`Rig.tsx`, `config.ts`) :
- le drag suit le curseur 1:1 au zoom courant (Simple : 0.005 u/px, ≈ 37 % de la vitesse) ;
- inertie calculée sur une vitesse lissée (`throwTime`) ;
- molette / trackpad à deux doigts : déplacement dans les deux axes (Simple : zoom) ;
- pincement ou Ctrl + molette : zoom de navigation ;
- relevé de diagnostic en développement : `/simple?debug=1`.

Pistes pour 7.0.8 : vitesse et inertie du défilement, sensation de « glisse » continue,
éventuel retour de la molette souris au zoom (choix d'interaction à arbitrer).
