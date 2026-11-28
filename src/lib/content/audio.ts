// Identité d'une piste audio (V8) — un même fichier peut être publié sous plusieurs URLs (ex. une
// piste partagée par plusieurs projets) : il est reconnu par son poids, relevé dans les
// métadonnées des médias distants (content/remote-media.json). Fichiers de travail ou de test
// (dossiers « _ », ex. _sources/) : jamais retenus. Lecture serveur uniquement (build).
import remoteMedia from '../../../content/remote-media.json';

const META = remoteMedia as Record<string, { bytes?: number | null; status?: number }>;

/** Source audio utilisable (pas un fichier de travail ni de test) */
export function isUsableAudio(src: string | null | undefined): src is string {
  return !!src && !/\/_[^/]*\//.test(src);
}

/** Clé d'identité : poids du fichier distant s'il est connu, sinon l'URL */
export function audioIdentity(src: string): string {
  const bytes = META[src]?.bytes;
  return bytes ? `bytes:${bytes}` : src;
}
