// Coordonnées de TALK (7.0.9) — source unique, affichée dans le Contextual Widget.
//
// Instagram : aucun compte officiel n'a été trouvé dans les données existantes (seul un
// lien générique « instagram.com » figurait dans l'historique). L'URL n'est donc PAS
// inventée : renseigner `instagram.url` pour faire apparaître le lien (avec sa vignette).
// La vignette est un visuel existant du site, remplaçable ici sans toucher au code.

export const CONTACT = {
  email: 'hello@bastardz.fr',
  instagram: {
    /** URL du compte officiel, ex. 'https://www.instagram.com/<compte>/' — à confirmer */
    url: null as string | null,
    label: 'Instagram',
    thumb: '/images/bstrdz/bastardz1.webp',
  },
} as const;
