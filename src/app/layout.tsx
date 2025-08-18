// src/app/layout.tsx
import Cursor from '@/components/customCursor/Cursor'
import ViewportVh from '@/components/system/ViewportVh'
import HtmlThemeWrapper from '@/components/theme/HtmlThemeWrapper'
import { ThemeProvider } from '@/context/ThemeContext'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ViewportVh />
        <Cursor />
        <ThemeProvider>
          <HtmlThemeWrapper>{children}</HtmlThemeWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
