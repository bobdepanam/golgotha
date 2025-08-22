'use client';

import Footer from '@/components/footer/Footer';
import Header from '@/components/header/Header';
import IntroLayoutWrapper from '@/components/LayoutWrapper/IntroLayoutWrapper';
import LenisWrapper from '@/components/lenis/LenisWrapper';
import GlobalEdgeBlur from '@/components/overlays/GlobalEdgeBlur'; // 👈 import
import '@/styles/main.scss';

export default function BodyWithTheme({ children }: { children: React.ReactNode }) {
    return (
        <IntroLayoutWrapper>
            <Header />
            <LenisWrapper />
            <div id="pageContent" className="page-visible">
                {children}
            </div>
            <Footer />

            {/* 👇 Blur global en haut/bas du contenu, mais pas sur header/footer */}
            <GlobalEdgeBlur
                blur={8}
                topHeight="10vh"
                bottomHeight="12vh"
                zIndex={9}
                desktopOnly
                headerSelector='header[data-site-header]'
                footerSelector='footer[data-site-footer]'
            />
        </IntroLayoutWrapper>
    );
}
