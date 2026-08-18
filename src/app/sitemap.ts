import type { MetadataRoute } from "next";
import { projectRegistry } from "@/config/registry";
import {
  getGalleryPieces,
  getLabExperiments,
  getNotes,
} from "@/server/content/loader";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL ?? "https://porscha.today";
  const statics = [
    "",
    "/art",
    "/apps",
    "/headquarters",
    "/porscha",
    "/workshop",
    "/lab",
    "/notes",
  ];
  return [
    ...statics.map((path) => ({ url: `${base}${path}` })),
    ...projectRegistry.map((p) => ({ url: `${base}/workshop/${p.slug}` })),
    ...getLabExperiments().map((e) => ({ url: `${base}/lab/${e.slug}` })),
    // `/gallery/<slug>` still answers for Stripe returns and old links,
    // but `/art/<slug>` is the canonical address and the only one listed.
    ...getGalleryPieces().map((g) => ({ url: `${base}/art/${g.slug}` })),
    ...getNotes().map((n) => ({ url: `${base}/notes/${n.slug}` })),
  ];
}
