import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/shared/EmptyState";
import { categoryLabel, getPublicGalleryView } from "@/server/gallery/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Pictures, sketches, and studies from around the workbench.",
  alternates: { canonical: "/gallery" },
};

/** Static column classes — Tailwind can't see interpolated names. */
const COLUMNS: Record<number, string> = {
  1: "columns-1",
  2: "columns-1 sm:columns-2",
  3: "columns-1 sm:columns-2 lg:columns-3",
  4: "columns-1 sm:columns-2 lg:columns-4",
};

export default async function GalleryPage() {
  const { settings, pieces } = await getPublicGalleryView();

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <header className="py-14 md:py-20 max-w-2xl">
        <h1 className="type-display text-5xl sm:text-6xl">{settings.heading}</h1>
        {settings.intro ? (
          <p className="mt-5 text-lg text-ink-soft leading-relaxed">
            {settings.intro}
          </p>
        ) : null}
      </header>

      {pieces.length > 0 ? (
        <div
          className={`${COLUMNS[settings.columns] ?? COLUMNS[3]} gap-8 [column-fill:balance]`}
        >
          {pieces.map((piece) => (
            <Link
              key={piece.slug}
              href={`/gallery/${piece.slug}`}
              className="group mb-10 block break-inside-avoid"
            >
              <figure>
                <div
                  className="overflow-hidden rounded-[4px] border border-line bg-paper-raised"
                  style={{ aspectRatio: piece.aspect.replace("/", " / ") }}
                >
                  <Image
                    src={piece.media}
                    alt={piece.alt}
                    width={900}
                    height={1100}
                    className="h-full w-full object-cover transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out-soft)] group-hover:scale-[1.015] motion-reduce:transform-none"
                  />
                </div>
                <figcaption className="mt-3 flex items-baseline justify-between gap-4">
                  <span className="type-heading text-base group-hover:text-accent-deep transition-colors duration-[var(--duration-micro)]">
                    {piece.title}
                  </span>
                  <span className="type-meta text-ink-faint shrink-0">
                    {categoryLabel(settings, piece.category)} · {piece.year}
                  </span>
                </figcaption>
              </figure>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="The walls are bare">
          Pieces get hung as they&rsquo;re finished — or abandoned
          interestingly.
        </EmptyState>
      )}
    </div>
  );
}
