"use client";

import InfiniteCollage, { type CollageItem } from "@/components/infinite/InfiniteCollage";
import InfinitePlane from "@/components/infinite/InfinitePlane";
import { useCallback, useEffect, useMemo, useState } from "react";

type MdItem = {
    id: string;
    title: string;
    type: "image" | "video";
    src: string;
    poster?: string;
    full?: string;
    categories?: string[];
    description?: string;
};
type MdData = { items: MdItem[] };

function parseFrontmatter(md: string): MdData {
    const start = md.indexOf("---");
    if (start !== 0) return { items: [] };
    const end = md.indexOf("---", 3);
    if (end === -1) return { items: [] };
    const yaml = md.slice(3, end).trim();
    const items: MdItem[] = [];
    const itemsBlockMatch = yaml.match(/items:\s*([\s\S]*)$/);
    if (!itemsBlockMatch) return { items: [] };
    const block = itemsBlockMatch[1];
    const rawEntries = block.split("\n").reduce<string[]>((acc, line) => {
        if (line.startsWith("  - ")) acc.push(line.replace("  - ", ""));
        else if (acc.length) acc[acc.length - 1] += "\n" + line.replace(/^ {4}/, "");
        return acc;
    }, []);
    for (const entry of rawEntries) {
        const o: any = {};
        entry.split("\n").forEach((l) => {
            const m = l.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
            if (!m) return;
            const k = m[1];
            let v = m[2];
            v = v.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
            if (k === "categories") {
                const inner = v.trim().replace(/^\[|\]$/g, "");
                o[k] = inner
                    .split(",")
                    .map((s) => s.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1"))
                    .filter(Boolean);
            } else if (["id", "title", "type", "src", "poster", "full", "description"].includes(k)) {
                o[k] = v;
            }
        });
        if (o.id && o.title && o.type && o.src) {
            if (o.type !== "image" && o.type !== "video") o.type = "image";
            items.push(o as MdItem);
        }
    }
    return { items };
}

export default function Page() {
    const [collageItems, setCollageItems] = useState<CollageItem[]>([]);
    const [lightbox, setLightbox] = useState<{
        id: string;
        title?: string;
        type?: "image" | "video";
        fullSrc: string;
        description?: string;
    } | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/data/infinite-grid.md?ts=${Date.now()}`, { cache: "no-store" });
                const md = await res.text();
                const data = parseFrontmatter(md);

                const mapped: CollageItem[] = (data.items || []).map((it) => {
                    // helper: titre + catégories
                    const label = it.categories?.length ? `${it.title} · ${it.categories.join(", ")}` : it.title;

                    if (it.type === "video") {
                        const poster = it.poster
                            || (it.src.endsWith(".mp4") ? it.src.replace(/\.mp4$/i, ".jpg") : undefined)
                            || it.src.replace(/\.mp4$/i, ".png");
                        const fullSrc = it.full || it.src;
                        return {
                            id: it.id,
                            title: label,
                            type: "video",
                            preview: encodeURI(poster),
                            fullSrc,
                            description: it.description,
                        };
                    }

                    // image
                    return {
                        id: it.id,
                        title: label,
                        type: "image",
                        preview: encodeURI(it.src),
                        fullSrc: it.src,
                        description: it.description,
                    };
                });

                setCollageItems(mapped);
            } catch (e) {
                console.error("[experiment] failed to load md:", e);
            }
        })();
    }, []);

    // ESC pour fermer
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const tile = useMemo(() => {
        const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
        const vh = typeof window !== "undefined" ? window.innerHeight : 900;
        return { w: Math.round(vw * 1.6), h: Math.round(vh * 1.6) };
    }, []);

    const handleItemClick = useCallback((id: string) => {
        const item = collageItems.find((it) => it.id === id);
        if (item) {
            setLightbox({
                id: item.id,
                title: item.title,
                type: item.type,
                fullSrc: item.fullSrc,
                description: item.description,
            });
        }
    }, [collageItems]);

    return (
        <>
            <InfinitePlane
                tileWidth={tile.w}
                tileHeight={tile.h}
                wheelScale={1}
                padding={0}
                renderTile={() => (
                    <div style={{ position: "relative", width: tile.w, height: tile.h }}>
                        <InfiniteCollage
                            items={collageItems}
                            tileWidth={tile.w}
                            tileHeight={tile.h}
                            maxPerTile={14}
                            margin={32}
                            onItemClick={handleItemClick}
                        />
                    </div>
                )}
            />

            {lightbox && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.96)",
                        zIndex: 9999,
                    }}
                >
                    {/* Média en cover pleine page (z-index 0) */}
                    {lightbox.type === "video" ? (
                        <video
                            src={lightbox.fullSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                            controls
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                zIndex: 0,
                            }}
                        />
                    ) : (
                        <img
                            src={lightbox.fullSrc}
                            alt={lightbox.title}
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                zIndex: 0,
                            }}
                        />
                    )}

                    {/* Bandeau gradient + description (z-index 2) */}
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            padding: "28px 24px 24px",
                            zIndex: 2,
                            display: "flex",
                            justifyContent: "center",
                            pointerEvents: "none",
                            background:
                                "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0) 100%)",
                        }}
                    >
                        <div
                            style={{
                                maxWidth: "80ch",
                                textAlign: "center",
                                color: "rgba(255,255,255,0.9)",
                                fontSize: "0.95rem",
                                lineHeight: 1.5,
                                fontStyle: "italic",
                                pointerEvents: "none",
                            }}
                        >
                            {lightbox.description && lightbox.description.trim().length > 0
                                ? lightbox.description
                                : (lightbox.title ?? "")}
                        </div>
                    </div>

                    {/* Bouton fermer centré (z-index 3) */}
                    <button
                        type="button"
                        data-nopan="true"
                        onClick={() => setLightbox(null)}
                        aria-label="Fermer"
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            border: "none",
                            background: "rgba(255,255,255,0.08)",
                            color: "var(--text-color,#eaeaea)",
                            cursor: "pointer",
                            zIndex: 3,
                            display: "grid",
                            placeItems: "center",
                            opacity: 0.5,
                            transition: "opacity 0.25s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                    >
                        {/* même pictogramme que l’ouverture, réutilisé pour fermer */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor" width="28" height="28" aria-hidden="true">
                            <path fillRule="evenodd"
                                d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                                clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}
        </>
    );
}
