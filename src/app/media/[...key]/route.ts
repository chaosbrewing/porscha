import { NextRequest, NextResponse } from "next/server";
import { keyFromPublicPath, mediaStorage, MEDIA_PREFIX } from "@/server/media/storage";

export const dynamic = "force-dynamic";

/**
 * Serves uploaded gallery media out of R2.
 *
 * Public by design — these are gallery images. Hiding a piece hides the
 * page, not the object; treat anything uploaded here as published.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const bucket = mediaStorage();
  if (!bucket) return new NextResponse("Not found", { status: 404 });

  const { key: segments } = await params;
  const key = keyFromPublicPath(`${MEDIA_PREFIX}${segments.join("/")}`);
  if (!key) return new NextResponse("Not found", { status: 404 });

  try {
    const object = await bucket.get(key);
    if (!object?.body) return new NextResponse("Not found", { status: 404 });

    return new NextResponse(object.body as unknown as BodyInit, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
        "Content-Length": String(object.size),
        ETag: object.httpEtag,
        // Keys carry a random token, so a stored object is immutable.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[media] read failed:", err);
    return new NextResponse("Not found", { status: 404 });
  }
}
