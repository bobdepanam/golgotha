import { Transition, Variants } from 'framer-motion'

const transition: Transition = {
    duration: 1,
    ease: [0.76, 0, 0.24, 1]
}

export const opacity: Variants = {
    initial: { opacity: 0 },
    open: {
        opacity: 1,
        transition: { duration: 0.35 }
    },
    closed: {
        opacity: 0,
        transition: { duration: 0.35 }
    }
}

export const height: Variants = {
    initial: { height: 0 },
    enter: {
        height: 'auto',
        transition
    },
    exit: {
        height: 0,
        transition
    }
}

export const background: Variants = {
    initial: { height: 0 },
    open: {
        height: '100vh',
        transition
    },
    closed: {
        height: 0,
        transition
    }
}

export const blur: Variants = {
    initial: {
        filter: 'blur(0px)',
        opacity: 1
    },
    open: {
        filter: 'blur(4px)',
        opacity: 0.6,
        transition: { duration: 0.3 }
    },
    closed: {
        filter: 'blur(0px)',
        opacity: 1,
        transition: { duration: 0.3 }
    }
}

// Variante avec custom (donc typage dynamique)
type CustomTranslate = (i: [number, number]) => {
    y: string | number
    opacity: number
    transition: Transition
}

export const translate: {
    initial: { y: string; opacity: number }
    enter: CustomTranslate
    exit: CustomTranslate
} = {
    initial: {
        y: '100%',
        opacity: 0
    },
    enter: (i) => ({
        y: 0,
        opacity: 1,
        transition: {
            duration: 1,
            ease: [0.76, 0, 0.24, 1],
            delay: i[0]
        }
    }),
    exit: (i) => ({
        y: '100%',
        opacity: 0,
        transition: {
            duration: 0.7,
            ease: [0.76, 0, 0.24, 1],
            delay: i[1]
        }
    })
}
export const gridItemVariants: Variants = {
    initial: {
        opacity: 0,
        scale: 0.95,
        y: 30
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.76, 0, 0.24, 1]
        }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: -20,
        transition: {
            duration: 0.5,
            ease: [0.76, 0, 0.24, 1]
        }
    }
}
