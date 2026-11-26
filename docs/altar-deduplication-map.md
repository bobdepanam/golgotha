# ALTAR → BSTRDZ : consolidation des doublons (7.1)

Principe : **une œuvre = un projet**. Les médias de l'entrée retirée sont rattachés au projet conservé
(slug, vidéo, cover et audio inchangés). Aucun média supprimé : les fichiers restent sur `cdn.myrr.studio`,
le `project.md` retiré est archivé localement dans `.media/_archive/altar-dedup-7.1/<slug>/` (hors Git,
Vercel et moteur) et reste dans l'historique Git (commit `95fc659`).

Méthode : écart moyen de luminance sur 32 × 32 px (0 = identique) et comparaison visuelle côte à côte.

## Consolidations (5)

### Cold Radiance

| | |
|---|---|
| Titre conservé | Cold Radiance |
| Slug conservé | `altar-001` |
| Entrée retirée | Cold Radiance, Still |
| Ancien slug | `altar-image-10` (world/altar_10.webp) |
| Image principale (cover) | https://cdn.myrr.studio/library/projects/altar-001/images/cover.png |
| Vidéo principale | https://cdn.myrr.studio/library/projects/altar-001/video/preview.mp4 |
| Média complémentaire | — (identique à la cover) |
| Audio | — |
| Justification | image fixe identique à la cover du projet (écart mesuré 0,8/255) : non répétée, URL notée dans `project.md` |

### Held Breath

| | |
|---|---|
| Titre conservé | Held Breath |
| Slug conservé | `altar-008` |
| Entrée retirée | Held Breath, Still |
| Ancien slug | `altar-image-6` (world/altar_6.webp) |
| Image principale (cover) | https://cdn.myrr.studio/library/projects/altar-008/images/cover.png |
| Vidéo principale | https://cdn.myrr.studio/library/projects/altar-008/video/preview.mp4 |
| Média complémentaire | https://cdn.myrr.studio/media/altar_6.webp |
| Audio | https://cdn.myrr.studio/library/projects/altar-008/audio/main.mp3 (piste partagée altar-003 → 011, à confirmer) |
| Justification | même photographie, autre cadrage : l'image fixe devient un média complémentaire de l'œuvre |

### Inner Weather

| | |
|---|---|
| Titre conservé | Inner Weather |
| Slug conservé | `altar-002` |
| Entrée retirée | Inner Weather, Variant |
| Ancien slug | `altar-video-4` (world/altarvid_4.mp4 (poster : archive)) |
| Image principale (cover) | https://cdn.myrr.studio/library/projects/altar-002/images/cover.png |
| Vidéo principale | https://cdn.myrr.studio/library/projects/altar-002/video/preview.mp4 |
| Média complémentaire | https://cdn.myrr.studio/media/altarvid_4.mp4 (poster https://cdn.myrr.studio/library/archive/archive_4/cover.webp) |
| Audio | — |
| Justification | même œuvre, autre montage vidéo : la variante devient une seconde vidéo du projet |

### Neon Vigil

| | |
|---|---|
| Titre conservé | Neon Vigil |
| Slug conservé | `altar-004` |
| Entrée retirée | Neon Vigil, Still |
| Ancien slug | `altar-image-52` (world/altar_52.webp) |
| Image principale (cover) | https://cdn.myrr.studio/library/projects/altar-004/images/cover.png |
| Vidéo principale | https://cdn.myrr.studio/library/projects/altar-004/video/preview.mp4 |
| Média complémentaire | https://cdn.myrr.studio/media/altar_52.webp |
| Audio | https://cdn.myrr.studio/library/projects/altar-004/audio/main.mp3 (piste partagée altar-003 → 011, à confirmer) |
| Justification | même photographie, autre cadrage : l'image fixe devient un média complémentaire de l'œuvre |

### Unfinished Self

| | |
|---|---|
| Titre conservé | Unfinished Self |
| Slug conservé | `altar-003` |
| Entrée retirée | Unfinished Self, Variant |
| Ancien slug | `altar-video-10` (world/altarvid_10.mp4 (poster : archive)) |
| Image principale (cover) | https://cdn.myrr.studio/library/projects/altar-003/images/cover.png |
| Vidéo principale | https://cdn.myrr.studio/library/projects/altar-003/video/preview.mp4 |
| Média complémentaire | https://cdn.myrr.studio/media/altarvid_10.mp4 (poster https://cdn.myrr.studio/library/archive/archive_8/cover.webp) |
| Audio | https://cdn.myrr.studio/library/projects/altar-003/audio/main.mp3 (piste partagée altar-003 → 011, à confirmer) |
| Justification | même œuvre, autre montage vidéo : la variante devient une seconde vidéo du projet |

## Variantes conservées (validation artistique)

Œuvres proches mais distinctes, ou paires que tu as demandé de garder :

| Œuvre | Œuvre | Constat |
|---|---|---|
| Gold Laughter (`altar-image-11`) | Glitched Laughter (`altar-video-1`) | **doublon technique probable** : poster quasi identique (écart 2,4) — conservé à ta demande |
| Amber Fog (`altar-007`) | Amber Fog, Still (`altar-image-12`) | autre prise de vue (pose, cadrage, lumière) : œuvres distinctes d'une même série ; le suffixe « Still » est trompeur |
| Red Profile (`altar-image-4`) | Turning Away (`altar-video-14`) | profil / face : distinctes |
| Blue Meanders (`altar-image-34`) | Ink Drift (`altar-video-36`) | motifs différents : distinctes |
| Resonance (`altar-image-35`) | Pulse Rings (`altar-video-37`) | même série, compositions différentes |
| Liquid Spectrum (`altar-image-5`) | Oil Light (`altar-video-15`) | conservées (à ta demande) |
| Shattered Prism (`altar-image-14`) | Crystal Fall (`altar-video-24`) | conservées (à ta demande) |
| Red Threshold (`altar-image-56`) | Through Red Glass (`altar-video-28`) | conservées (à ta demande) |
| Smoke Walker (`altar-image-8`) | Orange Coat (`altar-video-19`) | conservées (à ta demande) |
| Planet Edge (`altar-image-41`) | Ember Line (`altar-image-37`) | conservées (à ta demande) |
| Coral Bloom (`altar-image-19`) | Peach Tide (`altar-video-25`) | conservées (à ta demande) |
| Cold Radiance (`altar-001`) | Test Pattern (`altar-video-2`) | conservées (à ta demande) |
