import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import {
  GALLERY_DISPLAY_DEFAULTS,
  priceToCents,
  galleryDisplaySchema,
  type GalleryDisplaySettings,
  type GalleryOverlayInput,
  type GalleryPieceInput,
  type GalleryPieceUpdateInput,
} from "./validation";

/**
 * Gallery persistence.
 *
 * Two shapes live in here: the page-level display settings (one JSON
 * row in `site_settings`) and the per-piece rows in `gallery_items`.
 *
 * Every read degrades rather than throws — a database that is down or
 * un-migrated must leave the public gallery rendering its file-backed
 * pieces, not 500. Writes propagate their errors; the console needs to
 * know a save failed.
 */

const DISPLAY_KEY = "gallery.display";

export type GalleryItemRow = typeof schema.galleryItems.$inferSelect;

/* --------------------------- Display settings --------------------- */

export async function readDisplaySettings(): Promise<GalleryDisplaySettings> {
  try {
    const [row] = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, DISPLAY_KEY))
      .limit(1);
    if (!row) return GALLERY_DISPLAY_DEFAULTS;

    // A hand-edited or half-migrated row must not take the page down;
    // fall back to defaults for anything that fails validation.
    const parsed = galleryDisplaySchema.safeParse(row.value);
    if (!parsed.success) {
      console.error("[gallery] stored display settings are invalid; using defaults");
      return GALLERY_DISPLAY_DEFAULTS;
    }
    return parsed.data;
  } catch (err) {
    console.error("[gallery] display settings read failed:", err);
    return GALLERY_DISPLAY_DEFAULTS;
  }
}

export async function writeDisplaySettings(
  settings: GalleryDisplaySettings,
): Promise<void> {
  await db
    .insert(schema.siteSettings)
    .values({ key: DISPLAY_KEY, value: settings })
    .onConflictDoUpdate({
      target: schema.siteSettings.key,
      set: { value: settings, updatedAt: new Date() },
    });
}

/* ------------------------------- Pieces --------------------------- */

export async function readItems(): Promise<GalleryItemRow[]> {
  try {
    return await db.select().from(schema.galleryItems);
  } catch (err) {
    console.error("[gallery] item read failed:", err);
    return [];
  }
}

export async function readItem(slug: string): Promise<GalleryItemRow | undefined> {
  try {
    const [row] = await db
      .select()
      .from(schema.galleryItems)
      .where(eq(schema.galleryItems.slug, slug))
      .limit(1);
    return row;
  } catch (err) {
    console.error("[gallery] item read failed:", err);
    return undefined;
  }
}

/**
 * Upsert the overlay flags for a slug. Used for file-backed pieces,
 * where the row exists only to carry console-owned state — hence the
 * `origin: "file"` default on insert.
 */
export async function upsertOverlay(
  slug: string,
  fallback: { title: string; category: string },
  overlay: GalleryOverlayInput,
): Promise<void> {
  await db
    .insert(schema.galleryItems)
    .values({
      slug,
      title: fallback.title,
      category: fallback.category,
      origin: "file",
      hidden: overlay.hidden,
      featured: overlay.featured,
      position: overlay.position,
    })
    .onConflictDoUpdate({
      target: schema.galleryItems.slug,
      set: {
        hidden: overlay.hidden,
        featured: overlay.featured,
        position: overlay.position,
        updatedAt: new Date(),
      },
    });
}

/** Returns false when the slug is taken — by a file or another row. */
export async function insertPiece(input: GalleryPieceInput): Promise<boolean> {
  const inserted = await db
    .insert(schema.galleryItems)
    .values({
      slug: input.slug,
      title: input.title,
      category: input.category,
      year: input.year,
      mediaPath: input.media,
      // Alt text is no longer asked for; the title is the honest
      // description of the piece, and an empty alt would be worse.
      alt: input.title,
      aspect: input.aspect || null,
      note: input.note || null,
      relatedProject: null,
      body: input.body || null,
      origin: "console",
      forSale: input.forSale,
      priceCents: priceToCents(input.price),
      currency: input.currency || null,
    })
    .onConflictDoNothing({ target: schema.galleryItems.slug })
    .returning({ slug: schema.galleryItems.slug });
  return inserted.length > 0;
}

export async function updatePiece(
  slug: string,
  input: GalleryPieceUpdateInput,
): Promise<void> {
  await db
    .update(schema.galleryItems)
    .set({
      title: input.title,
      category: input.category,
      year: input.year,
      mediaPath: input.media,
      // Alt text is no longer asked for; the title is the honest
      // description of the piece, and an empty alt would be worse.
      alt: input.title,
      aspect: input.aspect || null,
      note: input.note || null,
      relatedProject: null,
      body: input.body || null,
      forSale: input.forSale,
      priceCents: priceToCents(input.price),
      currency: input.currency || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.galleryItems.slug, slug));
}

export async function deleteItem(slug: string): Promise<void> {
  await db.delete(schema.galleryItems).where(eq(schema.galleryItems.slug, slug));
}

/**
 * Write manual sort seats in one statement. Slugs absent from `order`
 * keep whatever seat they had; file-backed pieces with no row yet are
 * skipped, since ordering them implies an overlay the caller creates.
 */
export async function writeOrder(order: string[]): Promise<void> {
  if (order.length === 0) return;
  const cases = order.map(
    (slug, i) => sql`when ${schema.galleryItems.slug} = ${slug} then ${i}`,
  );
  await db
    .update(schema.galleryItems)
    .set({
      position: sql`case ${sql.join(cases, sql` `)} else ${schema.galleryItems.position} end`,
      updatedAt: new Date(),
    })
    .where(
      sql`${schema.galleryItems.slug} in ${sql`(${sql.join(
        order.map((s) => sql`${s}`),
        sql`, `,
      )})`}`,
    );
}

/* ------------------------------ Removal --------------------------- */

/**
 * Tombstone a file-backed piece. The Markdown file still exists and
 * every build still ships it, so a row is the only way to keep the
 * piece off the site. Reversible via `restoreItem`.
 */
export async function tombstoneItem(
  slug: string,
  fallback: { title: string; category: string },
): Promise<void> {
  await db
    .insert(schema.galleryItems)
    .values({
      slug,
      title: fallback.title,
      category: fallback.category,
      origin: "file",
      hidden: true,
      deletedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.galleryItems.slug,
      set: { hidden: true, deletedAt: new Date(), updatedAt: new Date() },
    });
}

/** Clear a tombstone, returning the file-backed piece to the wall. */
export async function restoreItem(slug: string): Promise<void> {
  await db
    .update(schema.galleryItems)
    .set({ deletedAt: null, hidden: false, updatedAt: new Date() })
    .where(eq(schema.galleryItems.slug, slug));
}
