import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/console", "/console/", "/api/", "/login"],
      },
    ],
    sitemap: `${process.env.SITE_URL ?? site.fallbackUrl}/sitemap.xml`,
  };
}
