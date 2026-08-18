import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/shared/EmptyState";
import { EditorialPhoto } from "@/components/public/editorial/EditorialPhoto";
import { SectionLabel } from "@/components/public/editorial/SectionLabel";
import { ObraMark } from "./ObraMark";
import { categoryLabel, getPublicGalleryView } from "@/server/gallery/service";
import { saleStatesBySlug } from "@/server/sales/service";
import { sectionNumber } from "@/config/site";

/**
 * ART — OBRA by Porscha.
 *
 * An art book, not a shop: the work runs down the page in an
 * asymmetric editorial sequence, titles are set small beside it, and
 * the sold mark is a line of metadata rather than a badge. Purchase
 * lives on the piece's own page, under the work.
 *
 * Rendered at `/art` and, for compatibility, at `/gallery` — see the
 * route files for which URL is canonical.
 */

/**
 * The rhythm of the wall. Four-beat pattern down a 12-column grid, so
 * no two consecutive pieces sit at the same size or edge. Static
 * classes: Tailwind cannot see interpolated names.
 */
const RHYTHM = [
  { frame: "lg:col-span-7", offset: "", scale: "" },
  { frame: "lg:col-span-4 lg:col-start-9", offset: "lg:-mt-24", scale: "" },
  { frame: "lg:col-span-5 lg:col-start-2", offset: "lg:mt-6", scale: "" },
  { frame: "lg:col-span-6 lg:col-start-7", offset: "lg:-mt-16", scale: "" },
];

export async function ArtIndexView() {
  const [{ settings, pieces }, sales] = await Promise.all([
    getPublicGalleryView(),
    saleStatesBySlug(),
  ]);

  return (
    <div className="mx-auto max-w-[88rem] px-5 sm:px-10">
      {/* Opening spread */}
      <header className="pt-12 lg:pt-20">
        <SectionLabel
          number={sectionNumber(1)}
          label="Art"
          aside={`${pieces.length} ${pieces.length === 1 ? "piece" : "pieces"}`}
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <ObraMark className="w-[150px] sm:w-[190px]" />
            {/* The mark carries the name; the heading stays in the DOM
                for screen readers and search. */}
            <h1 className="sr-only">{settings.heading}</h1>
            <p className="type-kicker mt-6 text-accent">OBRA by Porscha</p>
            {settings.intro ? (
              <p className="type-standfirst mt-6 max-w-lg">{settings.intro}</p>
            ) : null}
            <p className="type-caption mt-6 max-w-lg">
              Originals are one of one. When a piece sells it stays on the
              wall, marked — the record of the work matters more than the
              inventory.
            </p>
          </div>

          <EditorialPhoto
            slot="art-opening"
            sizes="(max-width: 1024px) 100vw, 44vw"
          />
        </div>
      </header>

      {/* The wall */}
      {pieces.length > 0 ? (
        <div className="mt-20 grid gap-x-10 gap-y-16 lg:grid-cols-12 lg:gap-y-8">
          {pieces.map((piece, index) => {
            const beat = RHYTHM[index % RHYTHM.length];
            const sale = sales.get(piece.slug);
            const sold = sale?.status === "sold";

            return (
              <article
                key={piece.slug}
                className={`${beat.frame} ${beat.offset} ${beat.scale}`}
              >
                <Link href={`/art/${piece.slug}`} className="group block">
                  <figure>
                    <div
                      className="photo"
                      style={{ aspectRatio: piece.aspect.replace("/", " / ") }}
                    >
                      <Image
                        src={piece.media}
                        alt={piece.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>

                    <figcaption className="mt-4">
                      <div className="rule" />
                      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                        <h2 className="type-heading text-xl transition-colors duration-[var(--duration-micro)] group-hover:text-accent-deep">
                          {piece.title}
                        </h2>
                        <p className="type-kicker text-ink-faint">
                          {categoryLabel(settings, piece.category)} ·{" "}
                          {piece.year}
                          {sold ? (
                            <span className="text-accent"> · Sold</span>
                          ) : null}
                        </p>
                      </div>
                      {piece.note ? (
                        <p className="type-caption mt-2 max-w-md line-clamp-2">
                          {piece.note}
                        </p>
                      ) : null}
                    </figcaption>
                  </figure>
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-20">
          <EmptyState title="The walls are bare">
            Pieces get hung as they&rsquo;re finished — or abandoned
            interestingly.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
