'use client';

// Thème du site. Source de vérité au chargement : la classe de <html>, posée avant
// le premier rendu par le script de src/app/layout.tsx (aucun flash, aucune erreur
// d'hydratation). Dark par défaut ; seul un choix explicite (bouton du header) est
// enregistré et reste prioritaire ensuite. Indépendant de la largeur d'écran.

import { THEME_STORAGE_KEY } from '@/config/theme';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextProps {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const initialTheme = (): Theme =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('light') ? 'light' : 'dark';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(initialTheme);

    useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('light', 'dark');
        html.classList.add(theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next: Theme = prev === 'light' ? 'dark' : 'light';
            try {
                localStorage.setItem(THEME_STORAGE_KEY, next);
            } catch {
                /* stockage indisponible : choix limité à la session */
            }
            return next;
        });
    }, []);

    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextProps {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
