'use client';

// La classe de thème de <html> est gérée par ThemeProvider (et posée avant le premier
// rendu par le script du layout) ; ce composant ne fait plus qu'envelopper le corps.
import BodyWithTheme from './BodyWithTheme';

export default function HtmlThemeWrapper({ children }: { children: React.ReactNode }) {
    return <BodyWithTheme>{children}</BodyWithTheme>;
}
