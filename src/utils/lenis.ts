import type { LenisOptions } from 'lenis'
import Lenis from 'lenis'

const options: Partial<LenisOptions> = {
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    gestureOrientation: 'vertical',
    wheelMultiplier: 1,
    touchMultiplier: 1,
}

// Instance courante (lecture seule pour les autres modules, ex. boucle de Bibliothéca)
let current: Lenis | null = null
export const getLenis = () => current

export const initLenis = () => {
    const lenis = new Lenis(options as LenisOptions)
    current = lenis

    const raf = (time: number) => {
        lenis.raf(time)
        requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    const destroy = lenis.destroy.bind(lenis)
    lenis.destroy = () => {
        if (current === lenis) current = null
        destroy()
    }
    return lenis
}
