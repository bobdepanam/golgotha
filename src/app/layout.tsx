// app/layout.tsx ou app/(whatever)/layout.tsx
import Cursor from '@/components/customCursor/Cursor'
import HtmlThemeWrapper from '@/components/theme/HtmlThemeWrapper'
import { ThemeProvider } from '@/context/ThemeContext'

import '@/styles/globals.scss'
import '@/styles/main.scss'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Golgotha',
  description: 'Enter the Void',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head />
      <body>
        {/* Inject the cursor elements at the root */}
        <Cursor />
        <ThemeProvider>
          <HtmlThemeWrapper>{children}</HtmlThemeWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
