import type { Metadata } from "next";
import {
  ArtPieceView,
  artPieceMetadata,
} from "@/components/public/art/ArtPieceView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ piece: string }> };

/**
 * Compatibility alias for `/art/<slug>`.
 *
 * Deliberately an alias and not a redirect: Stripe's success and cancel
 * URLs return the buyer to a `/gallery/<slug>?purchase=…` address, and
 * a redirect would drop the query string on the way through. The page
 * is identical to the canonical one and declares `/art/<slug>` as its
 * canonical URL, so only one of the two is ever indexed.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { piece } = await params;
  return artPieceMetadata(piece);
}

export default async function GalleryPieceAliasPage({ params }: Props) {
  const { piece } = await params;
  return <ArtPieceView slug={piece} />;
}
