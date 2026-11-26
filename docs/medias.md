# Médias : local et CDN (BSTRDZ 7.1)

Un projet reste **un dossier** `content/projects/<slug>/` avec son `project.md`. Chaque média
peut être :

- **local** : un fichier du dossier (`cover.webp`, `video.mp4`…), copié automatiquement vers le
  site par `npm run dev` / `npm run build` (fonctionnement inchangé) ;
- **distant** : une URL `https://` publique et stable d'un hôte autorisé, par exemple
  `cover: https://cdn.myrr.studio/library/projects/altar-001/images/cover.png`.

Les deux se mélangent librement dans un même projet. Le développement n'a jamais besoin du CDN
pour les médias locaux.

## Médias distants

1. L'hôte doit figurer dans `src/config/media.json` (`remoteHosts`). C'est la même liste qui est
   autorisée pour l'optimisation d'images de Next.
2. Après avoir ajouté ou modifié une URL :

   ```bash
   npm run content:remote   # vérifie les URLs, relève poids / type / dimensions
   npm run content:check
   ```

   Les métadonnées vont dans `content/remote-media.json` (à commiter). Le build lit ce fichier
   **sans accès réseau**. URL introuvable : erreur pour une cover, avertissement sinon.
3. Les URLs avec paramètres (`?…`) sont refusées : ce sont des URLs signées ou temporaires, qui
   expireraient.

Les images distantes passent par l'optimiseur de Next, en dev comme en prod : vignettes à la bonne
taille dans les grilles, et textures servies en même origine pour OPEN WORLD.

## Visibilité : attention

`published: false` empêche une création d'apparaître sur bastardz.fr, mais **ne protège pas le
fichier** : un média posé sur un bucket public reste accessible à qui connaît son URL. Règles :

- `_sources/`, WAV de travail, exports temporaires : jamais sur un espace public, ni synchronisés
  automatiquement ;
- un média qui doit rester privé ne va pas sur un bucket public.

## Architecture actuelle (audit 7.1)

| | ALTAR |
|---|---|
| Domaine média | `cdn.myrr.studio` (Cloudflare, R2) |
| Bucket (scripts) | `altar-media` via rclone (`r2:altar-media`), `npm run r2:push` / `r2:pull` |
| Organisation | `library/{projects,sequences,archive,sounds}/…`, `media/` (World, à plat) |
| Volume référencé | ≈ 1,1 Go dans ALTAR, dont ≈ 550 Mo utilisés par les 102 brouillons importés |
| HTTP Range | oui (lecture et avance rapide audio/vidéo) |
| Cache-Control | absent (cache par défaut de Cloudflare) |
| CORS | absent : sans incidence pour `<img>`, `<audio>`, `<video>` ; contourné pour WebGL par l'optimiseur |

Golgotha : médias locaux dans `content/`, publiés sous `/media/…` par Vercel.

## Cible proposée (progressive et réversible)

- **Vercel** : l'application. **GitHub** : code et Markdown. **R2 + CDN Cloudflare** : médias lourds.
- `bstrdz-media` (**privé**, créé) : travail, brouillons, organisé par univers (`golgotha/`,
  `altar/`, `myrr/`, `simple/`, `shared/`).
- Un bucket **public** séparé pour les médias publiés, servi par un domaine dédié
  (`media.bastardz.fr`) — à créer le moment venu.
- Les mêmes URLs servent le site et une future application native.

Étapes, chacune validée avant d'agir :

1. **Fait (7.1)** : le moteur accepte des URLs distantes ; les médias ALTAR sont réutilisés tels
   quels, sans copie ni migration.
2. **Dashboard Cloudflare (par toi)** : bucket privé `bstrdz-media` ✓ (7.1) ; plus tard, bucket public et domaine dédié.
   Ajouter `media.bastardz.fr` crée un enregistrement DNS : décision à prendre au moment voulu.
   Règles conseillées : `Cache-Control: public, max-age=31536000, immutable` (fichiers versionnés
   par leur nom), CORS `GET, HEAD` pour `https://bastardz.fr`, `https://www.bastardz.fr`,
   `http://localhost:3000`.
3. **Copie** (sans suppression) des médias ALTAR retenus vers `bstrdz-media/altar/<slug>/`, puis
   remplacement des URLs dans les `project.md` concernés. Retour arrière : remettre les anciennes
   URLs.
4. Nouveaux projets lourds : médias directement sur R2, le dossier ne contient que le Markdown.
   Les médias locaux existants restent locaux tant qu'aucune migration n'est décidée.

**Mise à jour 7.1** : le bucket privé `bstrdz-media` et le jeton `BSTRDZ-Codespaces-R2`
(lecture / écriture, limité à ce bucket) sont en place. Commandes : `docs/media-workflow.md`.
Une copie depuis `altar-media` demanderait en plus un accès en lecture à ce bucket (non accordé ;
les médias ALTAR restent servis par `cdn.myrr.studio`). La publication de médias depuis R2 attend
le bucket public et son domaine.
