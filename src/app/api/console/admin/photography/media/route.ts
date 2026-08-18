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
import { aspectFrom, readDimensions } from "@/server/media/dimensions";
import { photoSlotKeySchema } from "@/server/photography/validation";

export const dynamic = "force-dynamic";

/**
 * Upload a photograph for one editorial slot. Returns the public path
 * and the file's own aspect ratio, so the console never asks for
 * proportions it can measure. Console-authorized and same-origin, like
 * every mutation.
 */
export async function POST(req: NextRequest) {
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
          "wrangler.jsonc, or point the slot at an image already in public/.",
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
  const slot = photoSlotKeySchema.safeParse(form.get("slot"));
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was attached" }, { status: 400 });
  }
  if (!slot.success) {
    return NextResponse.json(
      { error: "A valid photography slot is required before uploading" },
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
    // Colons are legal in a slot key and awkward in an object key.
    const name = slot.data.replace(/:/g, "-");
    const key = mediaKey("photography", name, ext);
    const bytes = await file.arrayBuffer();

    // The file knows its own proportions, so the console never asks.
    const aspect = aspectFrom(readDimensions(file.type, bytes));

    await bucket.put(key, bytes, { httpMetadata: { contentType: file.type } });
    return NextResponse.json({ ok: true, src: publicPathFor(key), aspect });
  } catch (err) {
    console.error("[photography] media upload failed:", err);
    return NextResponse.json({ error: "The upload didn't complete." }, { status: 500 });
  }
}
