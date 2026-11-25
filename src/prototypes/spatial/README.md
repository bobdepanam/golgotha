# Prototype technique — galerie spatiale (BSTRDZ 7.0.1)

Portage isolé de la galerie spatiale de Simple (`simple-bastardz@f975918`,
`src/components/spatial/`) sur la stack de Golgotha (Next 14, React 18, three 0.160,
R3F 8, drei 9, maath 0.10.8). Objectif : prouver la compatibilité, rien de plus.

- Route : `/dev/spatial` (`src/app/dev/spatial/page.dev.tsx`), **développement uniquement** :
  l'extension `dev.tsx` n'est reconnue qu'en `next dev` (`pageExtensions`, `next.config.js`),
  la route et ses chunks sont donc absents du build de production.
- Fixtures : miniatures copiées localement dans `public/_local-test/spatial/`
  (exclu de Git par `.git/info/exclude`, jamais publié).
- Non branché sur la navigation, Bibliothéca, les contenus ou les routes existantes.
- Écarts volontaires avec Simple : focus identifié par slug (et non par index),
  état propre à chaque instance (pas de singletons de module), nombre de rangées
  calculé depuis le nombre d'éléments, pas de filtres / minimap / overlay produit /
  ViewTransition (hors périmètre 7.0.1).

À supprimer ou à remplacer par l'intégration définitive (phase 7.0.3).
