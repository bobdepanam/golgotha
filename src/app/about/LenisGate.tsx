'use client';

/** Stoppe Lenis sur cette page, le relance en sortie si présent. */
export default function LenisGate() {
    // @ts-ignore
    const w: any = typeof window !== 'undefined' ? window : null;

    // pas d'imports dynamiques : on touche juste l'instance globale éventuelle
    if (w && w.lenis && typeof w.lenis.stop === 'function') {
        w.lenis.stop();
    }

    // relance au démontage
    // NB: utiliser un layout effect éviterait un flash, ici on fait simple
    if (w && w.lenis && typeof w.lenis.start === 'function') {
        // on attache un cleanup
        const cleanup = () => w.lenis.start();
        // @ts-ignore
        if (!w.__lenisCleanupAttached) {
            w.__lenisCleanupAttached = true;
            window.addEventListener('pagehide', cleanup, { once: true });
            window.addEventListener('beforeunload', cleanup, { once: true });
        }
    }

    return null;
}
