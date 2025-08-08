'use client';

import { useTheme } from '@/context/ThemeContext';
import { useEffect } from 'react';
import BodyWithTheme from './BodyWithTheme';

export default function HtmlThemeWrapper({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();

    useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('light', 'dark');
        html.classList.add(theme || 'dark'); // fallback si jamais theme est undefined
    }, [theme]);

    return <BodyWithTheme>{children}</BodyWithTheme>;
}
