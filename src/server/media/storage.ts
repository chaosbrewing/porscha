import "server-only";
import { isCloudflareWorkers, requireCloudflareContext } from "@/server/runtime";

/**
 * Gallery media storage, backed by the optional `MEDIA` R2 binding.
 *
 * Uploading is a production-only capability: R2 is a Workers binding,
 * so the Node runtime (dev, build, tests) has nowhere to put an object.
 * Rather than fake it, `mediaStorage()` returns null there and callers
 * degrade with a clear message — the same shape the webhook route uses
 * when its secret is absent.
 *
 * In development, reference an image already in `public/` instead;
 * every media value is just a path the site serves.
 */

export const MEDIA_PREFIX = "/media/";

const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export const ALLOWED_MEDIA_TYPES = Object.keys(ALLOWED);

/** 8 MB — comfortably above a large photo, well under Workers' limits. */
export const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

export function mediaStorage(): CloudflareEnv["MEDIA"] | null {
  if (!isCloudflareWorkers) return null;
  try {
    return requireCloudflareContext().env.MEDIA ?? null;
  } catch {
    return null;
  }
}

export function isMediaConfigured(): boolean {
  return mediaStorage() !== null;
}

export function extensionFor(contentType: string): string | undefined {
  return ALLOWED[contentType];
}

/** Folders inside the bucket, one per kind of upload. */
export type MediaFolder = "gallery" | "logos" | "photography";

/**
 * Object key for an upload. Grouped by folder and named after the
 * slug so the bucket stays legible, suffixed with a random token so
 * replacing an image never collides with a cached copy of the old one.
 */
export function mediaKey(
  folder: MediaFolder,
  slug: string,
  ext: string,
): string {
  const token = crypto.randomUUID().slice(0, 8);
  return `${folder}/${slug}-${token}.${ext}`;
}

/** Storage key → the public path stored on the piece. */
export function publicPathFor(key: string): string {
  return `${MEDIA_PREFIX}${key}`;
}

/** Public path → storage key, or null if it isn't a media path. */
export function keyFromPublicPath(path: string): string | null {
  if (!path.startsWith(MEDIA_PREFIX)) return null;
  const key = path.slice(MEDIA_PREFIX.length);
  // No traversal, no absolute keys — the path is attacker-influenced.
  if (!key || key.includes("..") || key.startsWith("/")) return null;
  return key;
}
