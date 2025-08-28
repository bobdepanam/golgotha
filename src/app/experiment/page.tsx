// src/app/experiment/page.tsx
import type { Metadata } from "next";
import ExperimentClient from "./ExperimentClient";

export const metadata: Metadata = {
    title: "Black | Lab", // rendu comme "Black | Lab — Golgotha" via ton layout
    description: "Explorations visuelles et sonores en terrain infini.",
    alternates: { canonical: "/experiment" },
    openGraph: {
        type: "website",
        url: "/experiment",
        siteName: "Golgotha",
        title: "Black | Lab",
        description: "Explorations visuelles et sonores en terrain infini.",
        images: [{ url: "/images/og/cover.jpg", width: 1200, height: 630, alt: "Golgotha — Experiment" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Black | Lab",
        description: "Explorations visuelles et sonores en terrain infini.",
        images: ["/images/og/cover.jpg"],
    },
    robots: { index: true, follow: true },
};

export default function ExperimentPage() {
    const base = "https://www.bastardz.fr";
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Black | Lab",
        description: "Explorations visuelles et sonores en terrain infini.",
        url: `${base}/experiment`,
    };

    return (
        <>
            <script
                type="application/ld+json"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ExperimentClient />
        </>
    );
}
