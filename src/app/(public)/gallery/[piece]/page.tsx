import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  categoryLabel,
  getPublicGalleryPiece,
  getPublicGalleryView,
} from "@/server/gallery/service";
import { getPublicProject } from "@/server/projects/service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ piece: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { piece: slug } = await params;
  const piece = await getPublicGalleryPiece(slug);
  if (!piece) return { title: "Not found" };
  return {
    title: piece.title,
    description: piece.note ?? `${piece.title} — from Porscha's gallery.`,
    alternates: { canonical: `/gallery/${piece.slug}` },
  };
}

/* No generateStaticParams: which pieces exist — and which are hidden —
   is database state now, resolved per request. */

export default async function GalleryPiecePage({ params }: Props) {
  const { piece: slug } = await params;
  // Goes through the public view, so a hidden piece 404s at its own
  // URL rather than merely vanishing from the index.
  const { settings, pieces } = await getPublicGalleryView();
  const piece = pieces.find((p) => p.slug === slug);
  if (!piece) notFound();

  const related = piece.project ? await getPublicProject(piece.project) : null;

  return (
    <article className="mx-auto max-w-5xl px-5 sm:px-8">
      <p className="pt-10">
        <Link
          href="/gallery"
          className="text-sm text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
        >
          ← Gallery
        </Link>
      </p>

      <figure className="mt-8">
        <div className="overflow-hidden rounded-[4px] border border-line bg-paper-raised">
          <Image
            src={piece.media}
            alt={piece.alt}
            width={1600}
            height={1600}
            priority
            sizes="(max-width: 1024px) 100vw, 960px"
            className="w-full h-auto"
          />
        </div>
        <figcaption className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="type-heading text-2xl">{piece.title}</h1>
          <p className="type-meta text-ink-faint">
            {categoryLabel(settings, piece.category)} · {piece.year}
          </p>
        </figcaption>
      </figure>

      {piece.note ? (
        <p className="mt-4 max-w-xl text-ink-soft leading-relaxed">{piece.note}</p>
      ) : null}

      {piece.html ? (
        <div
          className="prose-workshop mt-6"
          dangerouslySetInnerHTML={{ __html: piece.html }}
        />
      ) : null}

      {related ? (
        <p className="mt-8 border-t border-line pt-6 text-sm">
          <span className="type-meta text-ink-faint mr-2">From the project</span>
          <Link
            href={`/workshop/${related.slug}`}
            className="underline underline-offset-4 decoration-line-strong hover:decoration-accent"
          >
            {related.name}
          </Link>
        </p>
      ) : null}
    </article>
  );
}
