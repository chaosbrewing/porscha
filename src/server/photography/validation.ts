import { z } from "zod";

/**
 * Validation for the photography console.
 *
 * Shared by the API route and the settings store, so a malformed
 * payload is rejected at the edge and a malformed `site_settings` row
 * can never reach a page.
 */

/** Fixed slots are hyphenated; per-project frames are `app:<slug>`. */
export const photoSlotKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:[-:][a-z0-9]+)*$/,
    "Slot keys are lowercase words separated by hyphens or one colon",
  );

/**
 * An image path the site can actually serve: an uploaded object under
 * `/media/`, or a file committed to `public/`. Remote URLs are refused
 * — `next/image` will not optimize a host that isn't configured, and a
 * console field is not the place to widen that.
 */
export const photoSrcSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .refine((src) => src.startsWith("/") && !src.includes(".."), {
    message: "Point at a path on this site, e.g. /media/photography/…",
  });

export const photoAspectSchema = z
  .string()
  .trim()
  .regex(/^\d{1,4}(?:\.\d+)?\/\d{1,4}(?:\.\d+)?$/, "Use a ratio like 4/5");

/**
 * One slot's override. Every field is optional and falls back to the
 * registry default in `src/config/photography.ts`; `src: null` is not
 * absence but a decision — hold this slot even though a default exists.
 */
export const photoOverrideSchema = z.object({
  src: photoSrcSchema.nullable().optional(),
  alt: z.string().trim().max(300).optional(),
  aspect: photoAspectSchema.optional(),
  focal: z.string().trim().max(40).optional(),
  caption: z.string().trim().max(160).optional(),
});

export type PhotoOverride = z.infer<typeof photoOverrideSchema>;

/**
 * The whole blob, stored under the `site.photography` key. Bounded so
 * a runaway client cannot grow the row without limit; the site has
 * seven fixed slots and one per app.
 */
export const photographySettingsSchema = z.object({
  slots: z
    .record(photoSlotKeySchema, photoOverrideSchema)
    .refine((slots) => Object.keys(slots).length <= 100, {
      message: "Too many photography slots",
    }),
});

export type PhotographySettings = z.infer<typeof photographySettingsSchema>;

export const PHOTOGRAPHY_DEFAULTS: PhotographySettings = { slots: {} };
