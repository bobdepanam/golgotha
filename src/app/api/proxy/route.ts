// src/app/api/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // rapide pour le proxy d’assets

// --- Réglages --- //
const ONE_YEAR = 60 * 60 * 24 * 365;
const ALLOWED_HOSTS = new Set(["cms.bastardz.fr"]); // ← ajoute d’autres hôtes si besoin
const ALLOWED_PATH_PREFIX = "/wp-content/uploads/"; // on ne proxifie que les fichiers d’upload

export async function GET(req: NextRequest) {
  // 1) Lecture & validation du paramètre
  const src = req.nextUrl.searchParams.get("src");
  if (!src) {
    return NextResponse.json({ error: "Missing src param" }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // 2) Filtrage de sécurité (hôte + chemin)
  const isHttps = url.protocol === "https:"; // on force https
  const isAllowedHost = ALLOWED_HOSTS.has(url.hostname);
  const isAllowedPath = url.pathname.startsWith(ALLOWED_PATH_PREFIX);

  if (!isHttps || !isAllowedHost || !isAllowedPath) {
    return NextResponse.json({ error: "Forbidden host or path" }, { status: 403 });
  }

  // 3) Fetch upstream
  //    - 'next.revalidate' : caching côté CDN/edge (utile en prod sur Vercel)
  //    - 'Accept' : autorise formats modernes si un CDN amont négocie
  const upstream = await fetch(url.toString(), {
    // Edge/Next peut revalider et garder un cache partagé
    next: { revalidate: ONE_YEAR },
    headers: {
      Accept: "image/avif,image/webp,image/*;q=0.8,*/*;q=0.5",
    },
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: `Upstream ${upstream.status}` }, { status: 502 });
  }

  // 4) Entêtes à propager / ajuster
  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const contentLength = upstream.headers.get("content-length") ?? undefined;
  const etag = upstream.headers.get("etag") ?? undefined;
  const lastModified = upstream.headers.get("last-modified") ?? undefined;

  // 5) Réponse :
  //    - Cache agressif (immutable) car l’URL d’upload WP change quand le fichier change
  //    - Vary: Accept → pour que le CDN stocke une version par format négocié
  //    - Accept-Ranges → lecture partielle (utile pour gros fichiers)
  const res = new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      ...(contentLength ? { "Content-Length": contentLength } : {}),
      ...(etag ? { ETag: etag } : {}),
      ...(lastModified ? { "Last-Modified": lastModified } : {}),
      "Cache-Control": `public, max-age=${ONE_YEAR}, s-maxage=${ONE_YEAR}, immutable`,
      "Accept-Ranges": "bytes",
      Vary: "Accept",
      // CORS facultatif : en général inutile si tu consommes ces URLs côté Next/Image
      // mais on le laisse permissif pour éviter les surprises dans des tests out-of-origin
      "Access-Control-Allow-Origin": "*",
    },
  });

  return res;
}
