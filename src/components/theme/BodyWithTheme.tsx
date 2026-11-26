'use client';

import ContextWidget from '@/components/contextWidget/ContextWidget';
import Header from '@/components/header/Header';
import ThemeToggle from '@/components/header/ThemeToggle';
import InterludeProvider from '@/components/interlude/InterludeProvider';
import LenisWrapper from '@/components/lenis/LenisWrapper';
import GlobalEdgeBlur from '@/components/overlays/GlobalEdgeBlur';
import SiteDock from '@/components/siteDock/SiteDock';
import { AudioEngineProvider } from '@/context/AudioEngineContext';
import { ContextWidgetProvider } from '@/context/ContextWidgetContext';
import { DockUIProvider } from '@/context/DockUIContext';
import '@/styles/main.scss';
import type { PropsWithChildren } from 'react';

export default function BodyWithTheme({ children }: PropsWithChildren) {
    return (
        <DockUIProvider>
          <AudioEngineProvider>
          <ContextWidgetProvider>
            <InterludeProvider>
                {/* Header identifié pour le calcul des offsets du blur */}
                <Header />
                <LenisWrapper />

                <div id="pageContent">
                    {children}
                </div>

                {/* Contexte (haut droite), navigation (bas gauche), thème (bas droite) : autonomes */}
                <ContextWidget />
                <SiteDock />
                <ThemeToggle />

                {/* Blur global uniquement sur desktop “réel” */}
                <GlobalEdgeBlur
                    blur={8}
                    topHeight="10vh"
                    bottomHeight="12vh"
                    zIndex={9}                         // < header/footer
                    desktopOnly                        // nécessite pointer: fine + hover
                    minWidth={1024}                    // coupe < 1024px (tablette/mobile)
                    headerSelector='header[data-site-header]'
                    footerSelector='footer[data-site-footer]'
                />
            </InterludeProvider>
          </ContextWidgetProvider>
          </AudioEngineProvider>
        </DockUIProvider>
    );
}
