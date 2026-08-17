import type { Metadata } from "next";
import {
  GalleryPieceForm,
  emptyPieceDraft,
} from "@/components/console/GalleryPieceForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New piece" };

export default function NewGalleryPiecePage() {
  return (
    <div>
      <h2 className="type-heading text-xl">New piece</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Hung from the console. Pieces that want a longer story are better as
        Markdown in <code>src/content/gallery</code>.
      </p>
      <div className="mt-8">
        <GalleryPieceForm mode="create" initial={emptyPieceDraft} />
      </div>
    </div>
  );
}
