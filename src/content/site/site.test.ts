import { describe, expect, it } from "vitest";
import * as content from "./index";

/**
 * The content layer is data Porscha edits by hand. These checks catch
 * the mistakes that would otherwise only show up as a dead link or a
 * privacy slip on the live site.
 */

const INTERNAL_ROUTES = new Set([
  "/",
  "/work",
  "/work/experiments",
  "/building",
  "/now",
  "/art",
  "/me",
]);

function isValidHref(href: string): boolean {
  if (href.startsWith("/")) return INTERNAL_ROUTES.has(href) || href.startsWith("/art/");
  return href.startsWith("https://") || href.startsWith("mailto:");
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

describe("site content", () => {
  it("links only to routes that exist or to absolute outward URLs", () => {
    const hrefs = [
      ...content.home.paths.map((p) => p.href),
      ...content.navigation.map((p) => p.href),
      ...content.work.categories.map((c) => c.href),
      ...content.currently.entries.flatMap((e) => (e.href ? [e.href] : [])),
      ...content.ending.links.map((l) => l.href),
      content.contact.href,
      content.making.cta.href,
      ...content.experiments.items.flatMap((e) => (e.href ? [e.href] : [])),
      ...(content.sulit.link.url ? [content.sulit.link.url] : []),
    ];
    for (const href of hrefs) expect(isValidHref(href), href).toBe(true);
  });

  it("points every image at a file under public/", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const srcs = [
      content.home.visual.src,
      content.making.image.src,
      content.ending.image.src,
      ...content.fragments.items.flatMap((f) => (f.kind === "image" ? [f.src] : [])),
    ];
    for (const src of srcs) {
      expect(src.startsWith("/"), src).toBe(true);
      expect(fs.existsSync(path.join(process.cwd(), "public", src)), src).toBe(true);
    }
  });

  it("publishes no phone numbers, email addresses or street addresses", () => {
    const text = collectStrings(content).join("\n");
    expect(text).not.toMatch(/\+?\d[\d\s().-]{7,}\d/);
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    expect(text).not.toMatch(/\b\d{1,5}\s+\w+\s+(street|st|road|rd|avenue|ave|lane|ln)\b/i);
  });

  it("keeps the Currently snapshot short and dated", () => {
    expect(content.currently.updated).toMatch(/^[A-Z][a-z]+ \d{4}$/);
    for (const entry of content.currently.entries) {
      expect(entry.label.length).toBeLessThan(24);
      expect(entry.value.length).toBeLessThan(80);
    }
  });
});
