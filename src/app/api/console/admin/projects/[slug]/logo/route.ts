import { NextRequest, NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin } from "@/server/auth/http";
import {
  ALLOWED_MEDIA_TYPES,
  extensionFor,
  MAX_MEDIA_BYTES,
  mediaKey,
  mediaStorage,
  publicPathFor,
} from "@/server/media/storage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Upload a project logo. Returns the public path; the form stores it
 * with the rest of the project configuration, so an upload alone
 * changes nothing until the project is saved.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "Invalid project slug" }, { status: 400 });
  }

  const bucket = mediaStorage();
  if (!bucket) {
    return NextResponse.json(
      {
        error:
          "Media storage isn't configured. Bind an R2 bucket as MEDIA in " +
          "wrangler.jsonc, or point the logo at an image already in public/.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was attached" }, { status: 400 });
  }

  const ext = extensionFor(file.type);
  if (!ext) {
    return NextResponse.json(
      { error: `Unsupported image type. Allowed: ${ALLOWED_MEDIA_TYPES.join(", ")}` },
      { status: 415 },
    );
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return NextResponse.json(
      { error: `That image is over ${MAX_MEDIA_BYTES / (1024 * 1024)} MB` },
      { status: 413 },
    );
  }

  try {
    const key = mediaKey("logos", slug, ext);
    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    return NextResponse.json({ ok: true, logo: publicPathFor(key) });
  } catch (err) {
    console.error("[projects] logo upload failed:", err);
    return NextResponse.json({ error: "The upload didn't complete." }, { status: 500 });
  }
}
