import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SectionLabel } from "@/components/public/editorial/SectionLabel";
import { BuyOriginal, type SaleView } from "@/components/public/BuyOriginal";
import {
  categoryLabel,
  getPublicGalleryPiece,
  getPublicGalleryView,
} from "@/server/gallery/service";
import { getPublicProject } from "@/server/projects/service";
import { saleStateFor } from "@/server/sales/service";
import { formatMoney } from "@/lib/money";

/**
 * One piece, given a page of its own: the work large and uninterrupted,
 * the title and metadata set quietly beneath it, and the purchase
 * control last — below the work, never over it.
 *
 * Rendered at `/art/[piece]` and at the compatibility URL
 * `/gallery/[piece]`, which Stripe's return trip still uses.
 */
export async function ArtPieceView({ slug }: { slug: string }) {
  // Goes through the public view, so a hidden piece 404s at its own
  // URL rather than merely vanishing from the index.
  const { settings, pieces } = await getPublicGalleryView();
  const index = pieces.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();
  const piece = pieces[index];

  const related = piece.project ? await getPublicProject(piece.project) : null;
  const next = pieces[(index + 1) % pieces.length];

  const sale = await saleStateFor(slug);
  const saleView: SaleView | null =
    sale.status === "sold"
      ? {
          status: "sold",
          price:
            sale.priceCents === null
              ? null
              : formatMoney(sale.priceCents, sale.currency),
        }
      : sale.status === "not_for_sale"
        ? null
        : {
            status: sale.status,
            price: formatMoney(sale.priceCents, sale.currency),
          };

  return (
    <article className="mx-auto max-w-[88rem] px-5 sm:px-10">
      <div className="pt-10">
        <SectionLabel
          label="OBRA by Porscha"
          aside={`Plate ${String(index + 1).padStart(2, "0")}`}
        />
      </div>

      <figure className="mt-10">
        <div className="photo mx-auto max-w-5xl">
          <Image
            src={piece.media}
            alt={piece.alt}
            width={1600}
            height={1600}
            preload
            sizes="(max-width: 1024px) 100vw, 960px"
            className="w-full h-auto"
          />
        </div>
      </figure>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:gap-16">
        <div>
          <h1 className="type-feature text-[clamp(2.25rem,5vw,3.5rem)]">
            {piece.title}
          </h1>
          <p className="type-kicker mt-4 text-ink-faint">
            {categoryLabel(settings, piece.category)} · {piece.year}
          </p>

          {piece.note ? (
            <p className="type-standfirst mt-6 max-w-xl">{piece.note}</p>
          ) : null}

          {piece.html ? (
            <div
              className="prose-workshop mt-8"
              dangerouslySetInnerHTML={{ __html: piece.html }}
            />
          ) : null}

          {related ? (
            <p className="mt-10 border-t border-line pt-6 text-sm">
              <span className="type-kicker text-ink-faint mr-3">
                From the project
              </span>
              <Link
                href={`/workshop/${related.slug}`}
                className="underline underline-offset-4 decoration-line-strong hover:decoration-accent"
              >
                {related.name}
              </Link>
            </p>
          ) : null}
        </div>

        <aside className="lg:border-l lg:border-line lg:pl-10">
          {saleView ? (
            <BuyOriginal slug={piece.slug} sale={saleView} />
          ) : (
            <p className="type-caption">
              Not for sale. Some pieces stay in the studio.
            </p>
          )}

          <nav className="mt-12 border-t border-line pt-6" aria-label="Wall">
            <Link
              href="/art"
              className="type-kicker text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
            >
              ← All work
            </Link>
            {next && next.slug !== piece.slug ? (
              <p className="mt-4">
                <span className="type-kicker text-ink-faint">Next</span>
                <Link
                  href={`/art/${next.slug}`}
                  className="type-heading mt-1 block text-lg hover:text-accent-deep transition-colors duration-[var(--duration-micro)]"
                >
                  {next.title}
                </Link>
              </p>
            ) : null}
          </nav>
        </aside>
      </div>
    </article>
  );
}

/**
 * Metadata for a piece, shared by both URLs it answers on.
 *
 * The canonical is always `/art/<slug>` — `/gallery/<slug>` stays live
 * for Stripe's return trip and for links already in the world, but it
 * points search engines at the piece's editorial home.
 */
export async function artPieceMetadata(slug: string): Promise<Metadata> {
  const piece = await getPublicGalleryPiece(slug);
  if (!piece) return { title: "Not found" };
  return {
    title: piece.title,
    description: piece.note ?? `${piece.title} — an original from OBRA by Porscha.`,
    alternates: { canonical: `/art/${piece.slug}` },
  };
}
