import "server-only";
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
  type MediaFolder,
} from "./storage";
import { aspectFrom, readDimensions } from "./dimensions";
import { stripImageMetadata } from "./strip";

/**
 * One upload handler for every console image, whatever it is for.
 *
 * Console-authorized and same-origin like every mutation. The file is
 * validated by declared type and size, stripped of embedded metadata
 * (EXIF, XMP, IPTC — including GPS), measured, and written to R2 under
 * the given folder. The response carries the public path to store and
 * the proportions read from the file itself.
 */
export async function handleImageUpload(
  req: NextRequest,
  folder: MediaFolder,
): Promise<NextResponse> {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const bucket = mediaStorage();
  if (!bucket) {
    return NextResponse.json(
      {
        error:
          "Media storage isn't configured. Bind an R2 bucket as MEDIA in " +
          "wrangler.jsonc, or point at an image already in public/.",
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
  const slug = String(form.get("slug") ?? "").trim();
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was attached" }, { status: 400 });
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json(
      { error: "A valid name is required before uploading" },
      { status: 400 },
    );
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
    const key = mediaKey(folder, slug, ext);
    // Nothing about where or how a picture was taken leaves the upload.
    const bytes = stripImageMetadata(file.type, await file.arrayBuffer());

    // The file knows its own proportions, so the console never asks.
    const dimensions = readDimensions(file.type, bytes);
    const aspect = aspectFrom(dimensions);

    await bucket.put(key, bytes, {
      httpMetadata: { contentType: file.type },
    });
    return NextResponse.json({
      ok: true,
      media: publicPathFor(key),
      aspect,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
    });
  } catch (err) {
    console.error("[media] upload failed:", err);
    return NextResponse.json({ error: "The upload didn't complete." }, { status: 500 });
  }
}
