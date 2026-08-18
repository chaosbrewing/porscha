import {
  asResolved,
  photography,
  type PhotoSlot,
  type ResolvedPhoto,
} from "@/config/photography";
import type { PhotographySettings, PhotoOverride } from "./validation";

/**
 * Laying the console's overrides over the registry defaults.
 *
 * Pure and dependency-free so both the public pages and the console
 * preview agree about what a slot currently shows, and so the merge
 * rules can be tested without a database.
 *
 * The rules, in one place:
 *   - a field the console never set falls back to the default;
 *   - `src: null` is a decision, not absence — it holds the slot even
 *     when the default has a photograph;
 *   - the aspect ratio always resolves to something, so a layout never
 *     reserves a box of unknown size.
 */

/** The default record for a slot key, or `undefined` for an unknown key. */
export function defaultSlot(key: string): PhotoSlot | undefined {
  return photography[key as keyof typeof photography];
}

export function mergeSlot(
  base: PhotoSlot,
  override: PhotoOverride | undefined,
): PhotoSlot {
  if (!override) return base;
  return {
    // `undefined` means "not set"; `null` means "held on purpose".
    src: override.src === undefined ? base.src : override.src,
    alt: override.alt?.trim() ? override.alt : base.alt,
    aspect: override.aspect ?? base.aspect,
    focal: override.focal?.trim() ? override.focal : base.focal,
    caption: override.caption?.trim() ? override.caption : base.caption,
    brief: base.brief,
  };
}

/**
 * What a slot shows right now.
 *
 * `fallback` supplies the default for keys that are not in the registry
 * — the per-project APPS frames, whose default may come from the
 * project's own content.
 */
export function resolveSlot(
  settings: PhotographySettings,
  key: string,
  fallback?: PhotoSlot,
): ResolvedPhoto {
  const base = defaultSlot(key) ??
    fallback ?? {
      src: null,
      alt: "",
      aspect: "4/3",
      brief: "This slot has no default; set a photograph in the console.",
    };
  return asResolved(mergeSlot(base, settings.slots[key]));
}
