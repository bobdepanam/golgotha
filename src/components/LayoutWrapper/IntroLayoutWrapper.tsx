
'use client'

import IntroReveal from '@/components/introReveal/IntroReveal'
import { useState } from 'react'

export default function IntroLayoutWrapper({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false)

    return (
        <>
            {!ready && <IntroReveal onComplete={() => setReady(true)} />}
            {ready && children}
        </>
    )
}
