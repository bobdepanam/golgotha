import { useEffect, useRef, useState } from 'react';

export function useInView(options?: IntersectionObserverInit) {
    const ref = useRef<HTMLElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target); // une seule fois
                }
            },
            { threshold: 0.1, ...options }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [options]);

    return { ref, isVisible };
}
