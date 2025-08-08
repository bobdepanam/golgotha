// src/components/theme/BodyWithTheme.tsx
'use client';

import Footer from '@/components/footer/Footer';
import Header from '@/components/header/Header';
import IntroLayoutWrapper from '@/components/LayoutWrapper/IntroLayoutWrapper';
import LenisWrapper from '@/components/lenis/LenisWrapper';
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
        </IntroLayoutWrapper>
    );
}
