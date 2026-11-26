# Workflow média R2 (BSTRDZ 7.1)

Les médias lourds de BSTRDZ peuvent être stockés sur **Cloudflare R2**, dans le bucket
`bstrdz-media`. Les commandes ci-dessous s'utilisent depuis le terminal de VS Code (Codespaces).

## Mise en place (une fois par Codespace)

```bash
npm run media:setup    # installe rclone (binaire officiel, somme SHA-256 vérifiée, ~/.local/bin)
npm run media:status   # vérifie rclone, les secrets et l'accès au bucket
```

Les identifiants sont des **secrets GitHub Codespaces** : `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY` et `R2_ENDPOINT`, avec le jeton `BSTRDZ-Codespaces-R2` limité à
`bstrdz-media`. Ils ne sont jamais écrits dans un fichier ni affichés :

- `scripts/media/rclone.conf` décrit le remote `bstrdz-r2`, **sans aucun secret** ;
- `scripts/media/r2-env.sh` transmet les secrets à rclone par variables d'environnement.

Pour un nouveau Codespace, `npm run media:setup` suffit : les secrets suivent le compte.

## Commandes

| Commande | Effet |
|---|---|
| `npm run media:status` | État : rclone, secrets, nombre d'objets et volume par univers |
| `npm run media:list` | Contenu du bucket, premier niveau |
| `npm run media:list -- altar` | Contenu d'un univers (ou `altar/altar-003` pour un projet) |
| `npm run media:pull -- altar/altar-003` | Copie R2 → `.media/altar/altar-003/` (dossier local ignoré par Git et Vercel) |
| `npm run media:push -- golgotha/<slug>` | Copie le dossier `content/projects/<slug>/` → `golgotha/<slug>/` sur R2 |
| `npm run media:push -- simple/<slug>` | Copie `content/simple/<slug>/` → `simple/<slug>/` |
| `… --from <dossier>` | Envoie un autre dossier local (ex. exports finaux hors dépôt) |
| `… --dry-run` | Montre ce qui serait copié, sans rien transférer |

Univers acceptés : `golgotha`, `altar`, `myrr`, `simple`, `shared`. Un envoi cible toujours un
projet précis (`<univers>/<slug>`) : il n'existe aucun envoi massif.

## Garde-fous

- **`rclone copy` uniquement** : aucune synchronisation, rien n'est jamais supprimé.
- **Aucun écrasement** : un fichier déjà présent sur R2 est conservé. Pour remplacer
  volontairement, ajouter `--overwrite`.
- **Toujours exclus** : `_sources/` et tout dossier ou fichier commençant par `_` ou `.`, les WAV /
  AIFF / FLAC, PSD / AI / AE / Premiere / TIFF / MOV, les fichiers temporaires, le Markdown, les
  `.env` et les clés.
- Commencer par `--dry-run`.

## Public, preview, brouillons

`bstrdz-media` est **privé** : ses objets ne sont pas accessibles depuis un navigateur, donc pas
encore utilisables par le site. Stratégie proposée :

| Médias | Où | Visibilité |
|---|---|---|
| Brouillons, travail, non validés | `bstrdz-media` (privé) | jamais public |
| Publiés et aperçus (`preview`) | bucket public dédié, ex. `bstrdz-public` + domaine `media.bastardz.fr` | URL publique stable |

À la publication d'une création, ses médias seront copiés du bucket privé vers le bucket public,
puis l'URL publique sera inscrite dans `project.md`. Un `published: false` ne protège jamais un
fichier déjà public : un média non validé ne va pas sur le bucket public.

Prérequis côté Cloudflare, à décider plus tard : bucket public, domaine dédié (enregistrement DNS),
règles de cache et de CORS. Voir `docs/medias.md`. Rien de tout cela n'a été activé en 7.1.

## Compatibilité

- Les médias **locaux** des projets restent pris en charge sans changement.
- Les URLs **CDN d'ALTAR** (`cdn.myrr.studio`) restent utilisées par les brouillons ALTAR.
- Un nouvel hôte public (ex. `media.bastardz.fr`) s'ajoutera dans `src/config/media.json`.
