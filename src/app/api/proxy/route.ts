// src/app/api/proxy/route.ts
import type { NextRequest } from "next/server";

export const runtime = "edge"; // rapide & simple pour du proxy fichier

export async function GET(req: NextRequest) {
    const src = req.nextUrl.searchParams.get("src");
    if (!src) return new Response("Missing src", { status: 400 });
    if (!/^https?:\/\//i.test(src)) return new Response("Invalid URL", { status: 400 });

    try {
        const upstream = await fetch(src, { cache: "no-store" });
        if (!upstream.ok || !upstream.body) return new Response("Upstream error", { status: 502 });

        return new Response(upstream.body, {
            status: 200,
            headers: {
                "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
                "Cache-Control": "public, max-age=86400, immutable",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch {
        return new Response("Proxy failure", { status: 500 });
    }
}
