import "server-only";
import {
  getGalleryPieces,
  renderMarkdown,
  type GalleryCategory,
  type GalleryPiece,
} from "@/server/content/loader";
import { readDisplaySettings, readItems, type GalleryItemRow } from "./store";
import type { GalleryDisplaySettings } from "./validation";

/**
 * The gallery's read model.
 *
 * Pieces come from two places and are reconciled here:
 *
 *   - Markdown under `src/content/gallery`, baked into the content
 *     bundle at build time. The file owns the content.
 *   - `gallery_items` rows with `origin = "console"`. The row *is* the
 *     piece.
 *
 * Rows with `origin = "file"` are overlays: they carry only the
 * console-owned flags (hidden / featured / position) for a piece whose
 * content still lives in its file. Keyed by the file's slug, so an
 * overlay can never shadow a different piece.
 *
 * Every consumer goes through here — the public page must never see a
 * hidden piece, and the console must see everything.
 */

export type PieceOrigin = "file" | "console";

export type ResolvedPiece = GalleryPiece & {
  origin: PieceOrigin;
  hidden: boolean;
  featured: boolean;
  position: number | null;
};

export type GalleryView = {
  settings: GalleryDisplaySettings;
  pieces: ResolvedPiece[];
};

function pieceFromRow(row: GalleryItemRow): ResolvedPiece {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category as GalleryCategory,
    year: row.year ?? "",
    media: row.mediaPath ?? "",
    alt: row.alt ?? row.title,
    aspect: row.aspect ?? "4/5",
    note: row.note ?? undefined,
    project: row.relatedProject ?? undefined,
    html: row.body ? renderMarkdown(row.body.trim()) : "",
    origin: "console",
    hidden: row.hidden,
    featured: row.featured,
    position: row.position,
  };
}

function applyOverlay(piece: GalleryPiece, row?: GalleryItemRow): ResolvedPiece {
  return {
    ...piece,
    origin: "file",
    hidden: row?.hidden ?? false,
    featured: row?.featured ?? false,
    position: row?.position ?? null,
  };
}

function sortPieces(
  pieces: ResolvedPiece[],
  settings: GalleryDisplaySettings,
): ResolvedPiece[] {
  const ordered = [...pieces].sort((a, b) => {
    switch (settings.sort) {
      case "year-asc":
        return a.year.localeCompare(b.year) || a.title.localeCompare(b.title);
      case "title":
        return a.title.localeCompare(b.title);
      case "manual": {
        // Unplaced pieces sit behind every placed one, then fall back to
        // newest-first so a fresh piece is never buried at the bottom.
        const ap = a.position ?? Number.MAX_SAFE_INTEGER;
        const bp = b.position ?? Number.MAX_SAFE_INTEGER;
        return ap - bp || b.year.localeCompare(a.year);
      }
      case "year-desc":
      default:
        return b.year.localeCompare(a.year) || a.title.localeCompare(b.title);
    }
  });

  if (!settings.featuredFirst) return ordered;
  // Stable partition keeps the chosen sort intact inside each group.
  return [...ordered.filter((p) => p.featured), ...ordered.filter((p) => !p.featured)];
}

/** Everything, hidden included, in console order. For the console only. */
export async function getGalleryAdminView(): Promise<GalleryView> {
  const [settings, rows] = await Promise.all([readDisplaySettings(), readItems()]);
  const byslug = new Map(rows.map((r) => [r.slug, r]));

  const filePieces = getGalleryPieces().map((p) => applyOverlay(p, byslug.get(p.slug)));
  const fileSlugs = new Set(filePieces.map((p) => p.slug));

  const authored = rows
    .filter((r) => r.origin === "console" && !fileSlugs.has(r.slug))
    .map(pieceFromRow);

  return { settings, pieces: sortPieces([...filePieces, ...authored], settings) };
}

/** Visible pieces in visible categories. For the public gallery. */
export async function getPublicGalleryView(): Promise<GalleryView> {
  const { settings, pieces } = await getGalleryAdminView();
  const hiddenCategories = new Set(
    settings.categories.filter((c) => !c.visible).map((c) => c.key),
  );
  return {
    settings,
    pieces: pieces.filter((p) => !p.hidden && !hiddenCategories.has(p.category)),
  };
}

export async function getPublicGalleryPiece(
  slug: string,
): Promise<ResolvedPiece | undefined> {
  const { pieces } = await getPublicGalleryView();
  return pieces.find((p) => p.slug === slug);
}

/** Label for a category, honoring the console's renaming. */
export function categoryLabel(
  settings: GalleryDisplaySettings,
  key: string,
): string {
  return settings.categories.find((c) => c.key === key)?.label ?? key;
}
