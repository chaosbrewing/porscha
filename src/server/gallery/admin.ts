import "server-only";
import { randomUUID } from "node:crypto";
import { desc } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { getGalleryPieces } from "@/server/content/loader";
import {
  deleteItem,
  insertPiece,
  readItem,
  updatePiece,
  upsertOverlay,
  writeDisplaySettings,
  writeOrder,
} from "./store";
import type {
  GalleryDisplaySettings,
  GalleryOverlayInput,
  GalleryPieceInput,
  GalleryPieceUpdateInput,
} from "./validation";

/**
 * Gallery administration.
 *
 * Every mutation here runs behind a two_factor_verified session — the
 * API routes enforce it — and records an audit event. Mirrors the
 * shape of `src/server/projects/admin.ts` so the two admin surfaces
 * behave the same way under failure.
 */

export type AdminResult =
  | { ok: true }
  | { ok: false; error: string; status?: number };

async function record(
  actorId: string,
  action: string,
  slug: string | null,
  detail?: Record<string, unknown>,
): Promise<void> {
  await db
    .insert(schema.galleryAdminEvents)
    .values({ id: randomUUID(), slug, actorId, action, detail: detail ?? null })
    .catch((err) => {
      // An audit write must never fail the mutation it describes; the
      // console would report a failure that already took effect.
      console.error("[gallery] failed to record admin event %s:", action, err);
    });
}

export async function listAdminEvents(limit = 20) {
  try {
    return await db
      .select()
      .from(schema.galleryAdminEvents)
      .orderBy(desc(schema.galleryAdminEvents.createdAt))
      .limit(limit);
  } catch (err) {
    console.error("[gallery] admin event read failed:", err);
    return [];
  }
}

/* --------------------------- Display settings --------------------- */

export async function saveDisplaySettings(
  actorId: string,
  settings: GalleryDisplaySettings,
): Promise<AdminResult> {
  await writeDisplaySettings(settings);
  await record(actorId, "display_settings_saved", null, {
    sort: settings.sort,
    columns: settings.columns,
    hiddenCategories: settings.categories.filter((c) => !c.visible).map((c) => c.key),
  });
  return { ok: true };
}

/* ------------------------------ Overlays -------------------------- */

export async function savePieceOverlay(
  actorId: string,
  slug: string,
  overlay: GalleryOverlayInput,
): Promise<AdminResult> {
  const filePiece = getGalleryPieces().find((p) => p.slug === slug);
  const existing = await readItem(slug);

  if (!filePiece && !existing) {
    return { ok: false, status: 404, error: `No piece named “${slug}”.` };
  }

  await upsertOverlay(
    slug,
    {
      title: filePiece?.title ?? existing?.title ?? slug,
      category: filePiece?.category ?? existing?.category ?? "digital",
    },
    overlay,
  );
  await record(actorId, "piece_overlay_saved", slug, {
    hidden: overlay.hidden,
    featured: overlay.featured,
  });
  return { ok: true };
}

export async function saveOrder(
  actorId: string,
  order: string[],
): Promise<AdminResult> {
  // Ordering a file-backed piece implies an overlay row to hold the
  // seat, so materialize any that are missing before writing.
  const filePieces = getGalleryPieces();
  for (const slug of order) {
    if (await readItem(slug)) continue;
    const file = filePieces.find((p) => p.slug === slug);
    if (!file) continue;
    await upsertOverlay(
      slug,
      { title: file.title, category: file.category },
      { hidden: false, featured: false, position: null },
    );
  }
  await writeOrder(order);
  await record(actorId, "order_saved", null, { count: order.length });
  return { ok: true };
}

/* ------------------------------- Pieces --------------------------- */

export async function createPiece(
  actorId: string,
  input: GalleryPieceInput,
): Promise<AdminResult> {
  // A console piece may not take a slug the content bundle already
  // owns — the file would silently win in the merge.
  if (getGalleryPieces().some((p) => p.slug === input.slug)) {
    return {
      ok: false,
      status: 409,
      error: `“${input.slug}” is already a file-backed piece — pick another slug.`,
    };
  }
  const created = await insertPiece(input);
  if (!created) {
    return {
      ok: false,
      status: 409,
      error: `The slug “${input.slug}” is already taken — pick another.`,
    };
  }
  await record(actorId, "piece_created", input.slug, { title: input.title });
  return { ok: true };
}

export async function editPiece(
  actorId: string,
  slug: string,
  input: GalleryPieceUpdateInput,
): Promise<AdminResult> {
  const existing = await readItem(slug);
  if (!existing) {
    return { ok: false, status: 404, error: `No piece named “${slug}”.` };
  }
  if (existing.origin !== "console") {
    return {
      ok: false,
      status: 409,
      error:
        "This piece is file-backed — edit its Markdown in src/content/gallery. " +
        "Visibility and ordering are still yours to set here.",
    };
  }
  await updatePiece(slug, input);
  await record(actorId, "piece_edited", slug, { title: input.title });
  return { ok: true };
}

export async function removePiece(
  actorId: string,
  slug: string,
): Promise<AdminResult> {
  const existing = await readItem(slug);
  if (!existing) {
    return { ok: false, status: 404, error: `No piece named “${slug}”.` };
  }
  if (existing.origin !== "console") {
    return {
      ok: false,
      status: 409,
      error:
        "File-backed pieces can't be deleted here — remove the Markdown file. " +
        "Hide it instead if you want it off the wall now.",
    };
  }
  await deleteItem(slug);
  await record(actorId, "piece_deleted", slug, { title: existing.title });
  return { ok: true };
}
