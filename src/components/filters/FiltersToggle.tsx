'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = {
  className?: string;
  onIconSrc?: string;  // icône quand OUVERT
  offIconSrc?: string; // icône quand FERMÉ
  size?: number;
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
  const reduce = useReducedMotion();

  // sync bouton <-> panneau
  useEffect(() => {
    const onState = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d && typeof d.open === 'boolean') setOpen(d.open);
    };
    window.addEventListener('filters:state', onState as EventListener);
    return () => window.removeEventListener('filters:state', onState as EventListener);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('filters:toggle'))}
      aria-pressed={open}
      aria-label={open ? altOpen : altClose}
      className={`filtersToggle hoverFade ${className} ${open ? 'is-open' : ''}`}
    >
      <motion.span
        className="filtersToggle__icon"
        aria-hidden
        animate={reduce ? {} : { rotate: open ? 180 : 0, scale: open ? 1.05 : 1 }}
        transition={{ duration: 0.25, ease: [0.2, 0.6, 0.2, 1] }}
      >
        <img
          src={open ? onIconSrc : offIconSrc}
          width={size}
          height={size}
          alt=""
          draggable={false}
        />
      </motion.span>
    </button>
  );
}
