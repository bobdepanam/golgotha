'use client'

import IntroReveal from '@/components/introReveal/IntroReveal'
import { useEffect, useState } from 'react'

export default function IntroLayoutWrapper({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false)
    const [shouldMount, setShouldMount] = useState(false)

    useEffect(() => {
        requestAnimationFrame(() => setShouldMount(true))
    }, [])

    return (
        <>
            {!ready && shouldMount && <IntroReveal onComplete={() => setReady(true)} />}
            {ready && children}
        </>
    )
}
