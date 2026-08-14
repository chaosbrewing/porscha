import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/console", "/console/", "/api/", "/login"],
      },
    ],
    sitemap: `${process.env.SITE_URL ?? "https://porscha.today"}/sitemap.xml`,
  };
}
