'use client';

// Retour à la collection (Simple : product/BackControl.tsx) : historique de l'application
// s'il existe (la grille retrouve position, zoom et focus), sinon /simple. Échap = retour.
// La transition de page est celle d'Interlude (popstate / lien).
import styles from '@/styles/simple/SimpleProduct.module.scss';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

// Longueur de l'historique au premier chargement de l'application dans l'onglet
const initialHistoryLength = typeof window !== 'undefined' ? window.history.length : 0;

export function BackControl() {
  const router = useRouter();
  const goBack = useCallback(() => {
    if (window.history.length > initialHistoryLength) router.back();
    else router.push('/simple');
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Échap réservé au widget quand le focus clavier y est
      if (e.key === 'Escape' && !(document.activeElement as HTMLElement | null)?.closest?.('#site-dock-panel, #context-widget')) goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goBack]);

  return (
    <button type="button" onClick={goBack} className={styles.back} data-cursor="hover">
      ← Back <span className={styles.esc}>[esc]</span>
    </button>
  );
}
