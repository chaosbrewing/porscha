import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/shared/EmptyState";
import { categoryLabel, getPublicGalleryView } from "@/server/gallery/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "OBRA",
  description:
    "OBRA by Porscha — original pieces, studies, and sketches from around the workbench.",
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
      <header className="py-14 md:py-20 flex flex-col items-center text-center">
        {/*
          The mark is gold leaf photographed on black, so it carries its
          own ground rather than being knocked out — it needs the dark
          plate to read as metal in either theme. The heading stays in
          the DOM as the h1 and is visually hidden, so the page keeps a
          real outline for screen readers and search.
        */}
        <span className="inline-flex items-center justify-center rounded-[6px] bg-[#0d0b09] p-3">
          <Image
            src="/brand/obra-mark.jpg"
            alt=""
            width={220}
            height={220}
            priority
            className="h-auto w-[150px] sm:w-[190px]"
          />
        </span>
        <h1 className="sr-only">{settings.heading}</h1>
        <p className="mt-6 type-meta text-ink-faint">by Porscha</p>
        {settings.intro ? (
          <p className="mt-5 max-w-2xl text-lg text-ink-soft leading-relaxed">
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
