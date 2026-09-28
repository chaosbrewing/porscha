import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkFrame } from "@/components/public/ArtworkFrame";
import { BuyOriginal, type SaleView } from "@/components/public/BuyOriginal";
import { Container } from "@/components/public/Container";
import { formatMoney } from "@/lib/money";
import {
  categoryLabel,
  getPublicGalleryPiece,
  getPublicGalleryView,
} from "@/server/gallery/service";
import { saleStateFor } from "@/server/sales/service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ piece: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { piece: slug } = await params;
  const piece = await getPublicGalleryPiece(slug);
  if (!piece) return { title: "Not found" };
  return {
    title: `${piece.title} — Obra`,
    description: piece.note ?? `${piece.title}, from Obra — Porscha's artwork and visual practice.`,
    alternates: { canonical: `/art/${piece.slug}` },
    openGraph: { images: [{ url: piece.media, alt: piece.alt }] },
  };
}

/* No generateStaticParams: which pieces exist — and which are hidden —
   is database state, resolved per request. */

export default async function ArtPiecePage({ params }: Props) {
  const { piece: slug } = await params;
  // Goes through the public view, so a hidden piece 404s at its own
  // URL rather than merely vanishing from the index.
  const { settings, pieces } = await getPublicGalleryView();
  const piece = pieces.find((p) => p.slug === slug);
  if (!piece) notFound();

  const sale = piece.placeholder ? null : await saleStateFor(slug);
  const saleView: SaleView | null =
    !sale || sale.status === "not_for_sale"
      ? null
      : sale.status === "sold"
        ? {
            status: "sold",
            price:
              sale.priceCents === null
                ? null
                : formatMoney(sale.priceCents, sale.currency),
          }
        : {
            status: sale.status,
            price: formatMoney(sale.priceCents, sale.currency),
          };

  const isLandscape = (() => {
    const [w, h] = piece.aspect.split("/").map(Number);
    return Number.isFinite(w) && Number.isFinite(h) && w > h;
  })();

  return (
    <Container className="pb-20 pt-8 sm:pt-12 lg:pb-32">
      <p className="reveal">
        <Link
          href="/art"
          className="link-arrow min-h-11 text-sm text-ink-soft"
        >
          <span aria-hidden="true" className="arrow">
            ←
          </span>
          <span>Obra</span>
        </Link>
      </p>

      <article className="reveal mt-8" style={{ ["--reveal-step" as string]: 1 }}>
        <figure
          className={`mx-auto ${isLandscape ? "max-w-6xl" : "max-w-3xl"}`}
        >
          <ArtworkFrame
            src={piece.media}
            alt={piece.alt}
            aspect={piece.aspect}
            priority
            sizes="(max-width: 1024px) 100vw, 1100px"
          />
          <figcaption className="mx-auto mt-6 flex max-w-3xl flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h1 className="type-heading text-2xl sm:text-3xl">{piece.title}</h1>
            <p className="type-meta text-ink-faint">
              {categoryLabel(settings, piece.category)}
              {piece.year ? ` · ${piece.year}` : ""}
            </p>
          </figcaption>
        </figure>

        <div className="mx-auto max-w-3xl">
          {piece.note ? (
            <p className="mt-6 max-w-[34rem] leading-relaxed text-ink-soft">
              {piece.note}
            </p>
          ) : null}

          {piece.html ? (
            <div
              className="prose-workshop mt-6"
              dangerouslySetInnerHTML={{ __html: piece.html }}
            />
          ) : null}

          {saleView ? <BuyOriginal slug={piece.slug} sale={saleView} /> : null}
        </div>
      </article>
    </Container>
  );
}
