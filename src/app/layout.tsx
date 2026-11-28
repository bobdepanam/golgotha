// src/app/layout.tsx
import Cursor from '@/components/customCursor/Cursor'
import ViewportVh from '@/components/system/ViewportVh'
import HtmlThemeWrapper from '@/components/theme/HtmlThemeWrapper'
import { ProjectTitlesProvider } from '@/context/ProjectTitlesContext'
import { THEME_INIT_SCRIPT } from '@/config/theme'
import { ThemeProvider } from '@/context/ThemeContext'
import { getAllProjects } from '@/lib/content/projects'
import { getAllProducts, getCatalogIndex } from '@/lib/content/simple'
import { AudioCatalogProvider, type CatalogTrack } from '@/context/AudioEngineContext'
import { audioIdentity, isUsableAudio } from '@/lib/content/audio'
import type { Metadata, Viewport } from 'next'

import '@/styles/globals.scss'
import '@/styles/main.scss'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.bastardz.fr'),
  title: { default: 'Golgotha', template: '%s — Golgotha' },
  description: 'Entrez dans le vide. Expériences visuelles & sonores par Golgotha.',
  alternates: { canonical: '/', languages: { 'fr-FR': '/', 'en-US': '/en' } },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Golgotha',
    title: 'Golgotha — Enter the Void',
    description: 'Immersive audiovisual works by Golgotha.',
    locale: 'fr_FR',
    alternateLocale: ['en_US'],
    images: [{ url: '/images/og/cover.jpg', width: 1200, height: 630, alt: 'Golgotha — Enter the Void' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Golgotha — Enter the Void',
    description: 'Immersive Bastardz Ready to be shot into space',
    images: ['/images/og/cover.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
}

/** Repère de localisation des pages projet et produit : titres réels issus des données
 *  (produits Simple : clé `simple/<slug>` ; aucun produit publié en production pour l'instant). */
const PROJECT_TITLES: Record<string, string> = {
  ...Object.fromEntries(getAllProjects().map((p) => [p.slug, p.title])),
  ...Object.fromEntries(getAllProducts().map((p) => [`simple/${p.slug}`, p.title])),
}

/** Découverte sonore (7.1) : pistes du catalogue de l'environnement (publiées ; brouillons en
 *  développement ; aperçus exclus — index transversal), une entrée par fichier ; aucun fichier
 *  de travail ou de test (dossiers « _ », ex. _sources/). */
const AUDIO_TRACKS: CatalogTrack[] = (() => {
  // Même fichier publié sous plusieurs URLs : une seule entrée (lib/content/audio)
  const seen = new Set<string>()
  return getCatalogIndex().flatMap((e) => {
    const src = e.audio
    if (!isUsableAudio(src)) return []
    const key = audioIdentity(src)
    if (seen.has(key)) return []
    seen.add(key)
    return [{ src, title: e.title, origin: e.href }]
  })
})()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        {/* Thème enregistré appliqué avant le premier affichage (dark par défaut) */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ViewportVh />
        <Cursor />
        <ProjectTitlesProvider titles={PROJECT_TITLES}>
          <AudioCatalogProvider tracks={AUDIO_TRACKS}>
            <ThemeProvider>
              <HtmlThemeWrapper>{children}</HtmlThemeWrapper>
            </ThemeProvider>
          </AudioCatalogProvider>
        </ProjectTitlesProvider>
      </body>
    </html>
  )
}
