import type { Metadata } from "next";
import {
  ArtPieceView,
  artPieceMetadata,
} from "@/components/public/art/ArtPieceView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ piece: string }> };

/* No generateStaticParams: which pieces exist — and which are hidden —
   is database state now, resolved per request. */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { piece } = await params;
  return artPieceMetadata(piece);
}

export default async function ArtPiecePage({ params }: Props) {
  const { piece } = await params;
  return <ArtPieceView slug={piece} />;
}
