import { z } from "zod";
import { GALLERY_CATEGORIES } from "@/config/gallery";

/**
 * Validation for the gallery console. Shared by the API routes and the
 * settings store, so a malformed payload is rejected at the edge and a
 * malformed `site_settings` row can never reach a page.
 */

export const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
  photography: "Photography",
  digital: "Digital",
  ui: "UI",
  experiments: "Experiments",
  sketches: "Sketches",
};

export const galleryCategorySettingSchema = z.object({
  key: z.enum(GALLERY_CATEGORIES),
  label: z.string().trim().min(1, "A category needs a label").max(40),
  visible: z.boolean(),
});

/**
 * Page-level display settings, stored as one JSON blob under the
 * `gallery.display` key in `site_settings`.
 */
export const galleryDisplaySchema = z.object({
  heading: z.string().trim().min(1, "The gallery needs a heading").max(80),
  intro: z.string().trim().max(400),
  columns: z.coerce.number().int().min(1).max(4),
  sort: z.enum(["year-desc", "year-asc", "title", "manual"]),
  /** Featured pieces pin to the front regardless of the sort order. */
  featuredFirst: z.boolean(),
  categories: z
    .array(galleryCategorySettingSchema)
    .max(GALLERY_CATEGORIES.length)
    .superRefine((cats, ctx) => {
      const seen = new Set<string>();
      for (const c of cats) {
        if (seen.has(c.key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Category “${c.key}” is listed twice`,
          });
        }
        seen.add(c.key);
      }
    }),
});

export type GalleryDisplaySettings = z.infer<typeof galleryDisplaySchema>;

export const GALLERY_DISPLAY_DEFAULTS: GalleryDisplaySettings = {
  heading: "Gallery",
  intro:
    "Not everything made here compiles. Studies, sketches, and pictures — mostly siblings of the software.",
  columns: 3,
  sort: "year-desc",
  featuredFirst: true,
  categories: GALLERY_CATEGORIES.map((key) => ({
    key,
    label: DEFAULT_CATEGORY_LABELS[key] ?? key,
    visible: true,
  })),
};

/**
 * Per-piece overlay flags. Applies to file-backed and console-authored
 * pieces alike — everything here is state the console owns.
 */
export const galleryOverlaySchema = z.object({
  hidden: z.boolean(),
  featured: z.boolean(),
  position: z.number().int().min(0).max(9999).nullable(),
});

export type GalleryOverlayInput = z.infer<typeof galleryOverlaySchema>;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * A console-authored piece. `media` is a path the site can serve —
 * either an uploaded object under /media/ or a file already in
 * /public. Remote URLs are refused: the gallery must keep working
 * without third-party hosts.
 */
const galleryPieceBase = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(SLUG_RE, "Use lowercase words separated by single hyphens"),
  title: z.string().trim().min(1, "A piece needs a title").max(120),
  category: z.enum(GALLERY_CATEGORIES),
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Year should be four digits"),
  media: z
    .string()
    .trim()
    .min(1, "A piece needs an image")
    .refine((v) => v.startsWith("/"), "Media must be a path on this site"),
  alt: z
    .string()
    .trim()
    .min(1, "Alt text is required — describe the image")
    .max(300),
  aspect: z
    .string()
    .trim()
    .regex(/^\d{1,2}\/\d{1,2}$/, 'Use a ratio like "4/5"'),
  note: z.string().trim().max(300).optional().or(z.literal("")),
  project: z.string().trim().max(80).optional().or(z.literal("")),
  body: z.string().max(8000).optional().or(z.literal("")),

  /* Selling. Originals are one-offs: available or not, one price. */
  forSale: z.boolean().default(false),
  /** Whole currency units in the form; stored as cents. */
  price: z
    .string()
    .trim()
    .regex(/^\d{1,7}(\.\d{1,2})?$/, "Use a price like 850 or 850.00")
    .optional()
    .or(z.literal("")),
  /**
   * ISO 4217 alphabetic code. Uppercase is enforced rather than
   * coerced, so a stored value always matches what was reviewed —
   * Stripe is sent the lowercase form it expects at call time.
   */
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter uppercase currency code, e.g. AUD")
    .optional()
    .or(z.literal("")),
});

/**
 * Shared rule, applied to both create and edit. It lives outside the
 * object schema because zod refuses `.omit()` on a refined schema —
 * refining the base once and deriving from it keeps the edit variant
 * possible.
 */
function forSaleNeedsPrice(
  v: { forSale?: boolean; price?: string },
  ctx: z.RefinementCtx,
) {
  if (v.forSale && !v.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: "A piece for sale needs a price",
    });
  }
}

export const galleryPieceSchema =
  galleryPieceBase.superRefine(forSaleNeedsPrice);

export type GalleryPieceInput = z.infer<typeof galleryPieceSchema>;

/** Cents from the form value, or null when not priced. */
export function priceToCents(price?: string): number | null {
  if (!price) return null;
  return Math.round(Number(price) * 100);
}

/** Editing an existing piece never moves it to a different slug. */
export const galleryPieceUpdateSchema = galleryPieceBase
  .omit({ slug: true })
  .superRefine(forSaleNeedsPrice);

export type GalleryPieceUpdateInput = z.infer<typeof galleryPieceUpdateSchema>;

/** Bulk reorder payload from the drag-free "move up/down" controls. */
export const galleryReorderSchema = z.object({
  order: z.array(z.string().trim().min(1)).max(500),
});
