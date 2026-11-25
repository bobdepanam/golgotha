// Coordonnées de TALK (7.0.9) — source unique, affichée dans le Contextual Widget.
//
// Instagram : compte officiel communiqué par l'équipe (7.0.10). Le lien n'apparaît que si
// `instagram.url` est renseignée. La vignette est un visuel existant du site, remplaçable
// ici sans toucher au code.

export const CONTACT = {
  /** Titre du contact dans le Contextual Widget */
  name: 'bastardz',
  email: 'hello@bastardz.fr',
  instagram: {
    url: 'https://www.instagram.com/bastardz.paris/' as string | null,
    label: 'Instagram',
    thumb: '/images/bstrdz/bastardz1.webp',
  },
} as const;
