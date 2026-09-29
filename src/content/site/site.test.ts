import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PAGE_KEYS, PAGE_SCHEMAS, SITE_DEFAULTS } from "./index";

/**
 * The defaults are data Porscha edits by hand, and the console's
 * starting point. These checks catch what would otherwise show up as
 * a dead link, a missing image or a privacy slip on the live site.
 */

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

function collectImages(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => collectImages(v, out));
  else if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.src === "string" && typeof o.width === "number") out.push(o.src);
    Object.values(o).forEach((v) => collectImages(v, out));
  }
  return out;
}

const INTERNAL_ROUTES = new Set(["/", "/work", "/work/experiments", "/building", "/now", "/art", "/me"]);

describe("site content defaults", () => {
  it("every page's defaults satisfy its own schema", () => {
    for (const key of PAGE_KEYS) {
      const result = PAGE_SCHEMAS[key].safeParse(SITE_DEFAULTS[key]);
      expect(result.success, `${key}: ${result.success ? "" : result.error.message}`).toBe(true);
    }
  });

  it("internal links point at routes that exist", () => {
    const hrefs = collectStrings(SITE_DEFAULTS).filter((s) => s.startsWith("/"));
    for (const href of hrefs) {
      if (href.includes(".")) continue; // an image path, checked below
      expect(INTERNAL_ROUTES.has(href) || href.startsWith("/art/"), href).toBe(true);
    }
  });

  it("points every image at a file under public/", () => {
    for (const src of collectImages(SITE_DEFAULTS)) {
      expect(fs.existsSync(path.join(process.cwd(), "public", src)), src).toBe(true);
    }
  });

  it("publishes no phone numbers, email addresses or street addresses", () => {
    const text = collectStrings(SITE_DEFAULTS).join("\n");
    expect(text).not.toMatch(/\+?\d[\d\s().-]{7,}\d/);
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    expect(text).not.toMatch(/\b\d{1,5}\s+\w+\s+(street|st|road|rd|avenue|ave|lane|ln)\b/i);
  });

  it("keeps the Currently snapshot short and dated", () => {
    expect(SITE_DEFAULTS.now.updated).toMatch(/^[A-Z][a-z]+ \d{4}$/);
    for (const entry of SITE_DEFAULTS.now.entries) {
      expect(entry.label.length).toBeLessThan(24);
      expect(entry.value.length).toBeLessThan(80);
    }
  });
});
