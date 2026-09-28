import type { Metadata } from "next";
import {
  GalleryPieceForm,
  emptyPieceDraft,
} from "@/components/console/GalleryPieceForm";
import { getGalleryAdminView, withUsedCategories } from "@/server/gallery/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New piece" };

export default async function NewGalleryPiecePage() {
  const view = await getGalleryAdminView();
  const settings = withUsedCategories(view.settings, [...view.pieces, ...view.removed]);
  const categories = settings.categories.map((c) => ({ key: c.key, label: c.label }));
  const draft = { ...emptyPieceDraft, category: categories[0]?.key ?? "canvas" };
  return (
    <div>
      <h2 className="type-heading text-xl">New piece</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Upload the image, give it a title and a category, and it is on the
        wall the moment you save. Photo metadata (including location) is
        removed on upload.
      </p>
      <div className="mt-8">
        <GalleryPieceForm mode="create" initial={draft} categories={categories} />
      </div>
    </div>
  );
}
