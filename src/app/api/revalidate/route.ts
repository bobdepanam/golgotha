import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    if (secret !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });
    }

    let tag = "projects";
    try {
        const body = await req.json();
        if (typeof body?.tag === "string" && body.tag.trim()) tag = body.tag.trim();
    } catch {
        /* pas de body → tag par défaut */
    }

    try {
        revalidateTag(tag);
        return NextResponse.json({ ok: true, tag, now: Date.now() });
    } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}

// Optionnel: renvoyer 405 en GET pour être explicite
export function GET() {
    return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
