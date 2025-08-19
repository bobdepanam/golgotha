// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
    return (
        <main
            style={{
                minHeight: "100svh",
                display: "grid",
                placeItems: "center",
                padding: "2rem",
            }}
        >
            <div style={{ textAlign: "center", maxWidth: 680 }}>
                <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", margin: 0 }}>
                    404 — Page introuvable
                </h1>
                <p style={{ opacity: 0.75, lineHeight: 1.6, marginTop: "0.75rem" }}>
                    Le lien a changé ou n’existe plus. Retournez à l’accueil ou explorez nos projets.
                </p>

                <div style={{ display: "inline-flex", gap: "1rem", marginTop: "1.25rem" }}>
                    <Link href="/" style={{ textDecoration: "underline" }}>
                        Accueil
                    </Link>
                    <Link href="/projects" style={{ textDecoration: "underline" }}>
                        Projets
                    </Link>
                </div>
            </div>
        </main>
    );
}
