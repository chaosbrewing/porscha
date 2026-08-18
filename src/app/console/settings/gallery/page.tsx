import type { Metadata } from "next";
import { getGalleryAdminView, categoryLabel } from "@/server/gallery/service";
import { GalleryDisplayForm } from "@/components/console/GalleryDisplayForm";
import { GalleryPieceList } from "@/components/console/GalleryPieceList";
import { GalleryRemovedList } from "@/components/console/GalleryRemovedList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Gallery" };

export default async function GallerySettingsPage() {
  const { settings, pieces, removed } = await getGalleryAdminView();

  return (
    <div className="space-y-14">
      <GalleryDisplayForm initial={settings} />

      <GalleryPieceList
        manualOrder={settings.sort === "manual"}
        pieces={pieces.map((p) => ({
          slug: p.slug,
          title: p.title,
          category: p.category,
          categoryLabel: categoryLabel(settings, p.category),
          year: p.year,
          media: p.media,
          alt: p.alt,
          origin: p.origin,
          hidden: p.hidden,
          featured: p.featured,
        }))}
      />

      <GalleryRemovedList
        pieces={removed.map((p) => ({
          slug: p.slug,
          title: p.title,
          categoryLabel: categoryLabel(settings, p.category),
          year: p.year,
          media: p.media,
        }))}
      />
    </div>
  );
}
