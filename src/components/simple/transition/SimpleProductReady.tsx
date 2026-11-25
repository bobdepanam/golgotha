'use client';

// Fiche produit prête pour la transition interne (7.0.10) : signale son montage, après le
// décodage du grand visuel (borné à 500 ms), pour que le morphing arrive sur l'image nette.

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { markSimpleReady } from './simpleMorph';

export default function SimpleProductReady() {
  const pathname = usePathname();
  useEffect(() => {
    let done = false;
    const ready = () => {
      if (done) return;
      done = true;
      markSimpleReady(pathname);
    };
    const img = document.querySelector<HTMLImageElement>('[data-simple-stage] img');
    const timer = window.setTimeout(ready, 500);
    if (img && !img.complete) img.decode().then(ready, ready);
    else ready();
    return () => window.clearTimeout(timer);
  }, [pathname]);
  return null;
}
