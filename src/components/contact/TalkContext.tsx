'use client';

// TALK (7.0.9) : le contact est porté par le Contextual Widget partagé (aucun widget dédié),
// ouvert par défaut en haut à droite à chaque arrivée, refermable. Contenu minimal :
// adresse mail (mailto) et, une fois son URL renseignée, Instagram avec sa vignette.

import { CONTACT } from '@/config/contact';
import { useContextWidget } from '@/context/ContextWidgetContext';
import { useEffect } from 'react';

const KEY = 'talk';

export default function TalkContext() {
  const { publish, retract } = useContextWidget();

  useEffect(() => {
    const links: { label: string; url: string; thumb?: string | null }[] = [
      { label: CONTACT.email, url: `mailto:${CONTACT.email}` },
    ];
    if (CONTACT.instagram.url) {
      links.push({ label: CONTACT.instagram.label, url: CONTACT.instagram.url, thumb: CONTACT.instagram.thumb });
    }
    publish({ key: KEY, title: 'Talk', links, closeMode: 'collapse' }, { open: true });
    return () => retract(KEY);
  }, [publish, retract]);

  return null;
}
