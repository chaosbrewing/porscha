/**
 * Gallery categories.
 *
 * Lives in config rather than the content loader because the console
 * forms need it in the browser, and the loader is `server-only` — one
 * import of it from a client component drags the whole content
 * pipeline into the client bundle.
 */
export const GALLERY_CATEGORIES = [
  "photography",
  "digital",
  "ui",
  "experiments",
  "sketches",
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];
