'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export type Chip = { slug: string; label: string };

export default function CategoryChips({
  chips,
  className = '',
}: {
  chips: Chip[];
  className?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get('cat') ?? '';
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);

  if (!chips?.length) return null;

  const go = (slug: string) => {
    const sp = new URLSearchParams(params.toString());
    if (slug === active) sp.delete('cat');
    else sp.set('cat', slug);
    router.push(`?${sp.toString()}`);
    // pas d’autoclose : on laisse le panneau ouvert
  };

  const dimOthers = !!hovered && hovered !== active;

  return (
    <motion.nav
      aria-label="Filtres catégories"
      className={`filtersBar ${dimOthers ? 'filtersBar--dimOthers' : ''} ${className}`}
      initial={reduce ? undefined : { opacity: 0 }}
      animate={reduce ? undefined : { opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.2, 0.6, 0.2, 1] }}
    >
      {chips.map((c, i) => {
        const isActive = c.slug === active;
        const isHovered = hovered === c.slug;

        return (
          <motion.button
            key={c.slug}
            onClick={() => go(c.slug)}
            onMouseEnter={() => setHovered(c.slug)}
            onMouseLeave={() => setHovered(null)}
            aria-pressed={isActive}
            className={`filtersBar__chip ${isActive ? 'is-active' : ''} ${isHovered ? 'is-hovered' : ''}`}
            whileHover={reduce ? {} : { y: -1 }}
            whileTap={{ scale: 0.98 }}
            initial={
              reduce ? undefined : { opacity: 0, x: -8, filter: 'blur(6px)' }
            }
            animate={
              reduce ? undefined : { opacity: 1, x: 0, filter: 'blur(0px)' }
            }
            transition={{
              delay: i * 0.05,
              duration: 0.28,
              ease: [0.2, 0.6, 0.2, 1],
              filter: { duration: 0.28 },
            }}
          >
            #{c.label}
          </motion.button>
        );
      })}
    </motion.nav>
  );
}
