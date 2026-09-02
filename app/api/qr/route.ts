import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateQrPng } from "@/lib/qr";

export const dynamic = "force-dynamic";

/** توليد صورة QR Code PNG للرابط المختصر أو أي رابط http/https. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const target = url.searchParams.get("url") || "";

    const ip = getClientIp(req);
    const rl = rateLimit(`qr:${ip}`, 30, 60_000);
    if (!rl.ok) {
      return jsonError("طلبات كثيرة، حاول لاحقًا.", 429);
    }

    if (!target || target.length > 2048) {
      return jsonError("رابط غير صالح", 400);
    }

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return jsonError("رابط غير صالح", 400);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return jsonError("رابط غير صالح", 400);
    }

    const png = await generateQrPng(target);

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
        "Content-Disposition": `inline; filename="qr.png"`,
      },
    });
  } catch {
    return jsonError("تعذّر إنشاء رمز QR", 500);
  }
}
