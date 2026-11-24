---
# ============================================================
#  MODÈLE DE PROJET — GOLGOTHA
#  1. Copier ce dossier `_template` et le renommer avec le slug du projet
#     (minuscules, chiffres, tirets : ex. `the-holy-swearer` → /projects/the-holy-swearer).
#  2. Déposer les médias dans le même dossier.
#  3. Remplir ce fichier. Les lignes commençant par # sont des commentaires.
#  Guide complet : docs/publier-un-projet.md
# ============================================================

# ---------- ESSENTIEL ----------
title: Titre du projet
published: false            # false = brouillon (invisible en ligne) · true = publié
publishedAt: 2026-01-01     # date de mise en ligne sur le site (AAAA-MM-JJ) — obligatoire pour publier
year: 2026                  # année de création de l'œuvre
category: soundtrack        # une catégorie (filtre de la grille)
cover: cover.webp           # image principale : grille, Bibliothéca, panneau INFO, partage

# ---------- OPTIONNEL ----------
# subtitle: Sous-titre      # ligne « Index_ » du panneau INFO
# excerpt: Une phrase.      # résumé pour les moteurs de recherche (sinon : 1er paragraphe du texte)
# thumbnail: thumbnail.webp # vignette de la grille (sinon : cover)
# background: background.webp # visuel plein écran au survol dans Bibliothéca (sinon : cover)
# audio: audio.mp3          # piste MP3 : lecteur automatique dans INFO et dans Bibliothéca

# Médias de la page projet, affichés dans cet ordre, chacun en plein écran.
# Visuel desktop conseillé : 16:9, 1920 × 1080 (ou 2560 × 1440).
# Sur mobile, le visuel remplit l'écran en hauteur (recadrage centré).
# media:
#   - video: preview.mp4    # vidéo MP4 du dossier
#     poster: poster.webp   # image affichée avant lecture (conseillée)
#     autoplay: true        # lecture automatique, toujours sans le son
#     loop: true
#     controls: false
#   - embed: https://vimeo.com/123456789   # ou un lien YouTube / Vimeo
#   - image: still-01.webp
#     alt: Description de l'image
#     caption: Légende affichée en bas du visuel
#     fit: contain          # optionnel : composition entière visible sur desktop
#                           # (défaut : cover = plein écran sans bordure)
#   - gallery: [still-02.webp, still-03.webp]

# Liens affichés dans le panneau INFO :
# links:
#   - label: Écouter sur Bandcamp ↗
#     url: https://...

# Partage / moteurs de recherche (sinon : titre, résumé et cover) :
# seo:
#   title: Titre pour Google
#   description: Description pour Google
#   image: og.jpg
---

Texte de présentation du projet, en Markdown : intentions, contexte, influences.

Une ligne vide sépare deux paragraphes. *Italique*, **gras**, [lien](https://exemple.com).

Crédits : musique — …, image — …
