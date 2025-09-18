'use client';

import { useEffect, useState } from 'react';

type Props = {
  className?: string;
  /** chemin vers l’icône quand OUVERT (par défaut: /icons/bloc_on.svg) */
  onIconSrc?: string;
  /** chemin vers l’icône quand FERMÉ (par défaut: /icons/bloc_off.svg) */
  offIconSrc?: string;
  /** taille en px de l’icône */
  size?: number;
  /** labels accessibilité */
  altOpen?: string;
  altClose?: string;
};

export default function FiltersToggle({
  className = '',
  onIconSrc = '/icons/bloc_on.svg',
  offIconSrc = '/icons/bloc_off.svg',
  size = 28,
  altOpen = 'Fermer les filtres',
  altClose = 'Ouvrir les filtres',
}: Props) {
  const [open, setOpen] = useState(false);

  // se synchronise avec le panneau (FiltersPanel) via l’event personnalisé
  useEffect(() => {
    const onState = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.open === 'boolean') setOpen(detail.open);
    };
    window.addEventListener('filters:state', onState as EventListener);
    return () => window.removeEventListener('filters:state', onState as EventListener);
  }, []);

  const handleClick = () => {
    window.dispatchEvent(new Event('filters:toggle'));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={open}
      aria-label={open ? altOpen : altClose}
      className={`filtersToggle hoverFade ${className} ${open ? 'is-open' : ''}`}
    >
      <span className="filtersToggle__icon" aria-hidden>
        <img
          src={open ? onIconSrc : offIconSrc}
          width={size}
          height={size}
          alt=""
          draggable={false}
        />
      </span>
    </button>
  );
}
