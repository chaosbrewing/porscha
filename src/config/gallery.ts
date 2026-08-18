/**
 * Gallery categories.
 *
 * Categories are free text, typed per piece — the wall should not need
 * a code change to hold a new kind of work. These two are only the
 * starting suggestions offered in the console; anything typed becomes a
 * category the moment a piece uses it.
 *
 * Lives in config rather than the content loader because the console
 * forms need it in the browser, and the loader is `server-only` — one
 * import of it from a client component drags the whole content
 * pipeline into the client bundle.
 */
export const SUGGESTED_CATEGORIES = ["digital", "canvas"] as const;

/** Categories still referenced by file-backed Markdown pieces. */
export const LEGACY_CATEGORIES = [
  "photography",
  "digital",
  "ui",
  "experiments",
  "sketches",
] as const;

/** Title Case for a typed key, used when no label has been set. */
export function defaultCategoryLabel(key: string): string {
  return key
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Normal form for a typed category: lowercase, single-hyphenated. */
export function normalizeCategory(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
