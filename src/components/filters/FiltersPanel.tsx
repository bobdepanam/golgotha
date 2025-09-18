'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import CategoryChips, { type Chip } from './CategoryChips';

export default function FiltersPanel({
  chips,
  defaultOpen = false,
  inline = true,
  className = '',
}: {
  chips: Chip[];
  defaultOpen?: boolean;
  inline?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // écoute des événements globaux
  useEffect(() => {
    const onToggle = () => setOpen(v => !v);
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener('filters:toggle', onToggle);
    window.addEventListener('filters:open', onOpen);
    window.addEventListener('filters:close', onClose);
    return () => {
      window.removeEventListener('filters:toggle', onToggle);
      window.removeEventListener('filters:open', onOpen);
      window.removeEventListener('filters:close', onClose);
    };
  }, []);

  // annonce l’état au toggle
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('filters:state', { detail: { open } }));
  }, [open]);

  const wrapCls = `filtersBarWrap ${inline ? 'filtersBarWrap--inline' : ''} ${className}`;

  return (
    <div className={wrapCls}>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25, ease: [0.2, 0.6, 0.2, 1] }}
          >
            <CategoryChips chips={chips} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
