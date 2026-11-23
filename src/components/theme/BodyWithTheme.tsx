'use client';

import Footer from '@/components/footer/Footer';
import Header from '@/components/header/Header';
import InterludeProvider from '@/components/interlude/InterludeProvider';
import LenisWrapper from '@/components/lenis/LenisWrapper';
import GlobalEdgeBlur from '@/components/overlays/GlobalEdgeBlur';
import SiteDock from '@/components/siteDock/SiteDock';
import { DockUIProvider } from '@/context/DockUIContext';
import '@/styles/main.scss';
import type { PropsWithChildren } from 'react';

export default function BodyWithTheme({ children }: PropsWithChildren) {
    return (
        <DockUIProvider>
            <InterludeProvider>
                {/* Header / Footer identifiés pour le calcul des offsets du blur */}
                <Header />
                <LenisWrapper />

                <div id="pageContent">
                    {children}
                </div>

                <Footer />
                <SiteDock />

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
        </DockUIProvider>
    );
}
