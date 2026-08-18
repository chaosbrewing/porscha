import type { Metadata } from "next";
import { ArtIndexView } from "@/components/public/art/ArtIndexView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Art — OBRA by Porscha",
  description:
    "OBRA by Porscha — originals, studies and sketches from the studio. One of one, sold once if sold at all.",
  alternates: { canonical: "/art" },
};

/** ART is the public home of the gallery; `/gallery` redirects here. */
export default function ArtPage() {
  return <ArtIndexView />;
}
