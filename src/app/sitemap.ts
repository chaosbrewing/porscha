import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { getPublicGalleryView } from "@/server/gallery/service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? site.fallbackUrl;
  const statics = ["", "/work", "/work/experiments", "/building", "/now", "/art", "/me"];
  const { pieces } = await getPublicGalleryView();
  return [
    ...statics.map((path) => ({ url: `${base}${path}` })),
    ...pieces.map((p) => ({ url: `${base}/art/${p.slug}` })),
  ];
}
