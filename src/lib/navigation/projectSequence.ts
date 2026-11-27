// Séquence de navigation entre créations (7.1, bouton Next des pages projet).
//
// Pas de second catalogue : chaque espace d'origine enregistre SA liste ordonnée de slugs, telle
// qu'il l'affiche (grille Projects filtrée ou non, index de Bibliothéca, Open World), au moment
// où le visiteur s'y trouve. La page projet l'utilise si elle contient la création courante ;
// sinon (accès direct, contexte périmé) : ordre général du catalogue, fourni par la page.
// Les slugs sont toujours recoupés avec le catalogue de l'environnement (aucun brouillon en
// production). Persistance : session (survit à un rechargement, pas à un nouvel onglet).

export type SequenceOrigin = 'projects' | 'archive' | 'world';
export type ProjectSequence = { origin: SequenceOrigin; slugs: string[] };

const KEY = 'bstrdz:project-sequence';
let current: ProjectSequence | null = null;

export function setProjectSequence(seq: ProjectSequence) {
  current = seq;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(seq));
  } catch {
    /* stockage indisponible : séquence en mémoire seulement */
  }
}

export function getProjectSequence(): ProjectSequence | null {
  if (current) return current;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    current = raw ? (JSON.parse(raw) as ProjectSequence) : null;
  } catch {
    current = null;
  }
  return current;
}

/**
 * Création suivante : séquence d'origine si elle contient `slug` (recoupée avec le catalogue),
 * sinon ordre général. Boucle en fin de séquence ; null s'il n'y a qu'une création.
 */
export function nextInSequence(slug: string, catalog: string[]): string | null {
  const known = new Set(catalog);
  const stored = getProjectSequence()?.slugs.filter((s) => known.has(s)) ?? [];
  const seq = stored.includes(slug) ? stored : catalog;
  const i = seq.indexOf(slug);
  if (i < 0 || seq.length < 2) return null;
  return seq[(i + 1) % seq.length];
}
