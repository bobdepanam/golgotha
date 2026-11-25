---
# ============================================================
#  MODÈLE DE PRODUIT — SIMPLE / BSTRDZ
#  1. Copier ce dossier `_template` et le renommer avec le slug du produit
#     (minuscules, chiffres, tirets : ex. `bad-seed` → /simple/bad-seed).
#  2. Déposer les médias dans le même dossier (fichiers de travail : dans _sources/).
#  3. Remplir ce fichier. Les lignes commençant par # sont des commentaires.
#  Guide complet : docs/publier-un-produit.md
# ============================================================

# ---------- ESSENTIEL ----------
title: Nom du produit
published: false            # false = brouillon (invisible en ligne) · true = publié
cover: cover.webp           # visuel principal (pages produit) — sa miniature est générée automatiquement

# ---------- OBLIGATOIRE POUR PUBLIER ----------
# publishedAt: 2026-01-01   # date de mise en ligne (AAAA-MM-JJ)
# year: 2026                # année de création
# category: t-shirt         # catégorie (filtres de la collection) — valeur libre, confirmée

# ---------- OPTIONNEL ----------
# tagline: Une phrase.      # accroche
# cut: Oversize             # coupe
# material: Coton 400 g     # matière
# edition: 60 exemplaires   # édition
# excerpt: Une phrase.      # résumé pour les moteurs de recherche (sinon : 1er paragraphe du texte)
# thumbnail: vignette.webp  # source de la miniature de la galerie (sinon : cover)
# audio: audio.mp3          # piste MP3

# Médias de la fiche produit, dans cet ordre (ratios d'origine conservés) :
# media:
#   - image: detail-01.webp
#     alt: Description de l'image
#     fit: contain          # optionnel : composition entière visible (défaut : cover)
#   - video: porte.mp4
#     poster: porte.webp
#     autoplay: true
#     loop: true
#   - gallery: [detail-02.webp, detail-03.webp]

# links:
#   - label: Contact ↗
#     url: https://...

# seo:
#   title: Titre pour Google
#   description: Description pour Google
#   image: og.jpg
---

Description du produit, en Markdown. Une ligne vide sépare deux paragraphes.
