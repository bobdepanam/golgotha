'use client'

import { initLenis } from '@/utils/lenis'
import { useEffect } from 'react'

export default function LenisWrapper() {
    useEffect(() => {
        const lenisInstance = initLenis()

        return () => lenisInstance.destroy()
    }, [])

    return null
}
