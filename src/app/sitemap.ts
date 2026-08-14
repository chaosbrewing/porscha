import type { MetadataRoute } from "next";
import { projectRegistry } from "@/config/registry";
import {
  getGalleryPieces,
  getLabExperiments,
  getNotes,
} from "@/server/content/loader";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL ?? "https://porscha.today";
  const statics = ["", "/porscha", "/workshop", "/apps", "/lab", "/gallery", "/notes"];
  return [
    ...statics.map((path) => ({ url: `${base}${path}` })),
    ...projectRegistry.map((p) => ({ url: `${base}/workshop/${p.slug}` })),
    ...getLabExperiments().map((e) => ({ url: `${base}/lab/${e.slug}` })),
    ...getGalleryPieces().map((g) => ({ url: `${base}/gallery/${g.slug}` })),
    ...getNotes().map((n) => ({ url: `${base}/notes/${n.slug}` })),
  ];
}
