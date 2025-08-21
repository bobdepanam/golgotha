import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

export function useFadeInOnScroll<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        if (!ref.current) return;

        const anim = gsap.fromTo(
            ref.current,
            { autoAlpha: 0, y: 40 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 1.2,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: ref.current,
                    start: "top 80%",
                    toggleActions: "play none none reverse",
                },
            }
        );

        // ✅ clean up correctement
        return () => {
            anim.scrollTrigger?.kill();
            anim.kill();
        };
    }, []);

    return ref;
}
