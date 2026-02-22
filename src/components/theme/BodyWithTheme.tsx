'use client';

import Footer from '@/components/footer/Footer';
import Header from '@/components/header/Header';
import IntroLayoutWrapper from '@/components/LayoutWrapper/IntroLayoutWrapper';
import LenisWrapper from '@/components/lenis/LenisWrapper';
import GlobalEdgeBlur from '@/components/overlays/GlobalEdgeBlur';
import { DockToggleOverlay, DockUIProvider } from '@/context/DockUIContext';
import '@/styles/main.scss';
import type { PropsWithChildren } from 'react';

export default function BodyWithTheme({ children }: PropsWithChildren) {
    return (
        <DockUIProvider>
            <IntroLayoutWrapper>
                {/* Header / Footer identifiés pour le calcul des offsets du blur */}
                <Header />
                <LenisWrapper />

                <div id="pageContent" className="page-visible">
                    {children}
                </div>

                <Footer />
                <DockToggleOverlay />

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
            </IntroLayoutWrapper>
        </DockUIProvider>
    );
}
