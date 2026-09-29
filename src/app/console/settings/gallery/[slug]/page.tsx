import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readItem } from "@/server/gallery/store";
import { getGalleryAdminView, withUsedCategories } from "@/server/gallery/service";
import { GalleryPieceForm } from "@/components/console/GalleryPieceForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit piece" };

export default async function EditGalleryPiecePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [row, view] = await Promise.all([readItem(slug), getGalleryAdminView()]);

  // Only console-authored pieces are editable here; a file-backed
  // piece's content belongs to its Markdown file.
  if (!row || row.origin !== "console") notFound();
  const settings = withUsedCategories(view.settings, [...view.pieces, ...view.removed]);

  return (
    <div>
      <h2 className="type-heading text-xl">{row.title}</h2>
      <div className="mt-8">
        <GalleryPieceForm
          mode="edit"
          initial={{
            slug: row.slug,
            title: row.title,
            category: row.category,
            year: row.year ?? "",
            alt: row.alt === row.title ? "" : (row.alt ?? ""),
            media: row.mediaPath ?? "",
            aspect: row.aspect ?? "4/5",
            note: row.note ?? "",
            body: row.body ?? "",
            forSale: row.forSale,
            // Cents in the database, whole units in the form.
            price: row.priceCents === null ? "" : (row.priceCents / 100).toFixed(2),
            currency: row.currency ?? "",
          }}
          categories={settings.categories.map((c) => ({ key: c.key, label: c.label }))}
        />
      </div>
    </div>
  );
}
