import type { LenisOptions } from 'lenis'
import Lenis from 'lenis'

const options: Partial<LenisOptions> = {
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    gestureOrientation: 'vertical',
    wheelMultiplier: 1,
    touchMultiplier: 1,
}

export const initLenis = () => {
    const lenis = new Lenis(options as LenisOptions)

    const raf = (time: number) => {
        lenis.raf(time)
        requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return lenis
}
