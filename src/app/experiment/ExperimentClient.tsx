"use client";

import InfiniteCanvasCodrops from "@/components/experiment/InfiniteCanvasCodrops";
import { projectsViewState } from "@/components/projects/projectsViewState";
import { setProjectSequence } from "@/lib/navigation/projectSequence";
import { useContextWidget } from "@/context/ContextWidgetContext";
import type { MediaItem } from "@/components/infinite-canvas/types";
import { type CollageItem } from "@/components/infinite/InfiniteCollage";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ---------- Catalogue transversal (7.1) ---------- */

/** Création du catalogue (content/projects) : dimensions connues, aucune précharge. */
export type WorldEntry = {
  slug: string;
  title: string;
  meta: string | null;
  cover: string;
  width: number;
  height: number;
  audio: string | null;
  /** Vidéo réelle de la création (aperçu dans le widget) */
  video: string | null;
  href: string;
};

/**
 * Texture servie par l'optimizer de Next (même origine, 640 px) : légère, et compatible avec
 * les médias distants dont le CDN n'envoie pas d'en-tête CORS (WebGL).
 */
const textureUrl = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=640&q=70`;

/* ---------- Types & parsing frontmatter ---------- */

type MdItem = {
  id: string;
  title: string;
  type: "image" | "video";
  src?: string; // images
  poster?: string; // vidéos
  full?: string; // vidéos
  categories?: string[];
  description?: string;
};
type MdData = { items: MdItem[] };

function getImageSize(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    img.onerror = reject;
    img.src = src;
  });
}

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
    else if (acc.length)
      acc[acc.length - 1] += "\n" + line.replace(/^ {4}/, "");
    return acc;
  }, []);

  for (const entry of rawEntries) {
    const o: any = {};
    entry.split("\n").forEach((l) => {
      const m = l.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (!m) return;
      const k = m[1];
      let v = l.slice(m[0].length - m[2].length);
      v = v
        .trim()
        .replace(/^"(.*)"$/, "$1")
        .replace(/^'(.*)'$/, "$1");
      if (k === "categories") {
        const inner = v.replace(/^\[|\]$/g, "");
        o[k] = inner
          .split(",")
          .map((s) =>
            s
              .trim()
              .replace(/^"(.*)"$/, "$1")
              .replace(/^'(.*)'$/, "$1"),
          )
          .filter(Boolean);
      } else if (
        [
          "id",
          "title",
          "type",
          "src",
          "poster",
          "full",
          "description",
        ].includes(k)
      ) {
        o[k] = v;
      }
    });
    if (o.id && o.title && o.type && (o.src || o.poster || o.full)) {
      if (o.type !== "image" && o.type !== "video") o.type = "image";
      items.push(o as MdItem);
    }
  }
  return { items };
}

/* ---------- Page (client) ---------- */

export default function ExperimentClient({ catalog = [] }: { catalog?: WorldEntry[] }) {
  const [collageItems, setCollageItems] = useState<CollageItem[]>([]);
  const [mdMedia, setMdMedia] = useState<MediaItem[]>([]);
  const { publish, retract } = useContextWidget();
  // Créations du catalogue (immédiates) + visuels propres à OPEN WORLD (infinite-grid.md)
  const catalogByTexture = useMemo(() => new Map(catalog.map((c) => [textureUrl(c.cover), c])), [catalog]);
  const media = useMemo<MediaItem[]>(() => {
    const seen = new Set<string>();
    return [
      ...catalog.map((c) => ({ url: textureUrl(c.cover), width: c.width, height: c.height })),
      ...mdMedia,
    ].filter((m) => (seen.has(m.url) ? false : (seen.add(m.url), true)));
  }, [catalog, mdMedia]);

  // Focus d'une création : Contextual Widget partagé (cover, méta, audio, Open → page projet)
  const selectCatalog = useCallback(
    (c: WorldEntry) => {
      projectsViewState.lastHref = "/experiment"; // Back de la page projet → retour à la galerie
      setProjectSequence({ origin: "world", slugs: catalog.map((x) => x.slug) }); // Next (7.1)
      shownKey.current = `world:${c.slug}`;
      publish(
        {
          key: `world:${c.slug}`,
          universe: "Open World",
          title: c.title,
          meta: c.meta,
          image: { src: c.cover, alt: "" },
          video: c.video ? { src: c.video, poster: c.cover } : null,
          audio: c.audio ? { src: c.audio, title: c.title, origin: c.href } : null,
          href: c.href,
          ctaLabel: "Open",
          closeMode: "dismiss",
        },
        { open: true, focus: true },
      );
    },
    [publish, catalog],
  );
  const shownKey = useRef<string | null>(null);
  // Sortie d'OPEN WORLD : le widget est retiré (le lecteur audio s'arrête avec lui)
  useEffect(() => () => void (shownKey.current && retract(shownKey.current)), [retract]);
  const [lightbox, setLightbox] = useState<{
    id: string;
    title?: string;
    type?: "image" | "video";
    fullSrc: string;
    description?: string;
  } | null>(null);

  // charge & mappe le MD (encodeURI pour espaces)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/data/infinite-grid.md?ts=${Date.now()}`, {
          cache: "no-store",
        });
        const md = await res.text();
        const data = parseFrontmatter(md);

        const mapped: CollageItem[] = (data.items || []).map((it) => {
          const label = it.categories?.length
            ? `${it.title} · ${it.categories.join(", ")}`
            : it.title;

          if (it.type === "video") {
            const poster = it.poster
              ? encodeURI(it.poster)
              : "/images/bstrdz/fallback.jpg";
            const fullSrc = it.full ? encodeURI(it.full) : "";
            return {
              id: it.id,
              title: label,
              type: "video",
              preview: poster,
              fullSrc,
              description: it.description,
            };
          }

          const src = it.src
            ? encodeURI(it.src)
            : "/images/bstrdz/fallback.jpg";
          return {
            id: it.id,
            title: label,
            type: "image",
            preview: src,
            fullSrc: src,
            description: it.description,
          };
        });

        setCollageItems(mapped);

        const results = await Promise.allSettled(
          mapped.map(async (m) => {
            try {
              // Mesure sur la vignette optimisée (même ratio), pas sur le fichier original
              const url = textureUrl(m.preview);
              const { width, height } = await getImageSize(url);
              return { url, width, height };
            } catch (err) {
              console.warn("Image failed to load:", m.preview);
              return { url: textureUrl(m.preview), width: 1200, height: 800 };
            }
          }),
        );

        const mediaWithSize = results
          .filter((r) => r.status === "fulfilled")
          .map((r) => (r as PromiseFulfilledResult<MediaItem>).value);

        setMdMedia(mediaWithSize);
      } catch (e) {
        console.error("[experiment] failed to load md:", e);
      }
    })();
  }, []);

  // ESC pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll pendant l'overlay
  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  const handleItemClick = useCallback(
    (id: string) => {
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
    },
    [collageItems],
  );

  return (
    <>
      <div style={{ position: "relative", width: "100%", height: "100vh" }}>
        <InfiniteCanvasCodrops
          media={media}
          enabled={!lightbox}
          onSelect={(item) => {
            const creation = catalogByTexture.get(item.url);
            if (creation) return selectCatalog(creation);
            const found = collageItems.find(
              (it) => textureUrl(it.preview) === item.url || it.preview === item.url || it.fullSrc === item.url,
            );
            if (found) handleItemClick(found.id);
          }}
        />
        {/* DOM overlay conservée si besoin */}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            key="lb"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "grid",
              placeItems: "center",
              padding: "4vw",
              background: "rgba(8,8,8,.6)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
            onClick={() => setLightbox(null)}
            data-nopan="true"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                maxWidth: "min(92vw, 1400px)",
                maxHeight: "88vh",
                display: "grid",
                gridTemplateRows: "1fr auto",
                gap: 10,
                borderRadius: 0,
                // background: "rgba(18,18,18,.8)",
                // boxShadow: "0 10px 40px rgba(0,0,0,.6)",
                padding: 16,
              }}
            >
              {/* MEDIA */}
              {lightbox.type === "video" ? (
                <div
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: "100%",
                    height: "72vh",
                    borderRadius: 0,
                    background: "#000",
                    overflow: "hidden",
                  }}
                >
                  <LightboxVideo
                    src={lightbox.fullSrc}
                    objectFit="contain"
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 0,
                      background: "#000",
                    }}
                  />
                </div>
              ) : (
                <img
                  src={lightbox.fullSrc}
                  alt={lightbox.title}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    maxHeight: "72vh",
                    objectFit: "contain",
                    borderRadius: 0,
                    background: "#0a0a0a",
                  }}
                  draggable={false}
                />
              )}

              {/* CAPTION courte */}
              <div
                style={{
                  color: "rgba(255,255,255,.9)",
                  fontSize: 14,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  padding: "2px 6px",
                }}
                title={
                  lightbox.description && lightbox.description.trim()
                    ? lightbox.description
                    : (lightbox.title ?? "")
                }
              >
                {lightbox.description && lightbox.description.trim()
                  ? lightbox.description
                  : (lightbox.title ?? "")}
              </div>

              {/* CLOSE */}
              {/* <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="Fermer"
                style={{
                  position: "inherit",
                  top: 40,
                  right: 10,
                  height: 36,
                  width: 36,
                  borderRadius: 999,
                  border: 0,
                  background: "rgba(0,0,0,.55)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                ✕
              </button> */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- LightboxVideo : flexible (overlay contain) ---------- */

function LightboxVideo({
  src,
  poster,
  autoFullscreenOnTap = true,
  objectFit = "cover",
  style,
}: {
  src: string;
  poster?: string;
  autoFullscreenOnTap?: boolean;
  objectFit?: React.CSSProperties["objectFit"];
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [needsUserPlay, setNeedsUserPlay] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onCanPlay = async () => {
      try {
        v.muted = true; // requis pour autoplay iOS
        const p = v.play();
        if (p && typeof p.then === "function") await p;
        setNeedsUserPlay(false);
      } catch {
        setNeedsUserPlay(true);
      }
    };
    if (v.readyState >= 2) onCanPlay();
    else v.addEventListener("canplay", onCanPlay, { once: true });
    return () => v.removeEventListener("canplay", onCanPlay);
  }, [src]);

  const handleUserPlay = async () => {
    const v = ref.current;
    if (!v) return;
    try {
      v.muted = false; // son après geste user si voulu
      await v.play();
      setNeedsUserPlay(false);
    } catch {
      /* noop */
    }
  };

  const handleTap = async () => {
    const v = ref.current;
    if (!v) return;

    if (autoFullscreenOnTap) {
      const anyVideo = v as any;

      // iOS Safari
      if (typeof anyVideo.webkitEnterFullscreen === "function") {
        anyVideo.webkitEnterFullscreen();
        return;
      }

      // autres navigateurs
      if (v.requestFullscreen) {
        await v.requestFullscreen().catch(() => {});
      }
    }

    if (v.paused) await v.play().catch(() => setNeedsUserPlay(true));
    else v.pause();
  };

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        // @ts-ignore
        webkit-playsinline="true"
        preload="metadata"
        controls
        style={{
          width: "100%",
          height: "100%",
          objectFit,
          background: "#000",
          ...style,
        }}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate"
        onClick={handleTap}
      />
      {needsUserPlay && (
        <button
          type="button"
          onClick={handleUserPlay}
          aria-label="Lire la vidéo"
          style={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            width: 64,
            height: 64,
            borderRadius: "0%",
            border: "none",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            zIndex: 1,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          ▶
        </button>
      )}
    </>
  );
}
