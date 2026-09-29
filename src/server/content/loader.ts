import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { z } from "zod";
import { isCloudflareWorkers } from "@/server/runtime";
import contentBundle from "./content-bundle.json";

/**
 * File-backed content system.
 *
 * Gallery pieces live as Markdown files under `src/content/gallery/`.
 * Frontmatter is validated with zod so a malformed file fails loudly at
 * build/dev time instead of rendering garbage. (Everything else a
 * visitor reads lives as typed data in `src/content/site/`.)
 *
 * In the Node runtime the files are read from disk. The Cloudflare
 * Workers runtime has no filesystem, so it reads the identical raw file
 * text from `content-bundle.json`, generated from `src/content` by
 * `scripts/generate-content-bundle.mjs` on every build (npm `prebuild`
 * hook). Parsing and validation are shared, so both runtimes see the
 * same content pipeline.
 */

const CONTENT_ROOT = path.join(process.cwd(), "src", "content");

const bundledFiles: Record<string, string> = contentBundle.files;

marked.setOptions({ gfm: true });

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false });
}

/** Raw `{relative path → file text}` for a content subdirectory. */
function readRawDir(dir: string): Record<string, string> {
  if (isCloudflareWorkers) {
    const out: Record<string, string> = {};
    const prefix = `${dir}/`;
    for (const [rel, raw] of Object.entries(bundledFiles)) {
      if (rel.startsWith(prefix)) out[rel.slice(prefix.length)] = raw;
    }
    return out;
  }
  const full = path.join(CONTENT_ROOT, dir);
  if (!fs.existsSync(full)) return {};
  const out: Record<string, string> = {};
  for (const file of fs.readdirSync(full)) {
    out[file] = fs.readFileSync(path.join(full, file), "utf8");
  }
  return out;
}

function readCollection(dir: string): Array<{
  slug: string;
  data: Record<string, unknown>;
  content: string;
}> {
  return Object.entries(readRawDir(dir))
    .filter(([file]) => file.endsWith(".md") || file.endsWith(".mdx"))
    .map(([file, raw]) => {
      const { data, content } = matter(raw);
      return { slug: file.replace(/\.mdx?$/, ""), data, content };
    });
}

/* --------------------------- Gallery ------------------------------ */

const galleryFrontmatter = z.object({
  title: z.string(),
  /** Free text, matching the console. Normalised so a file and a
   *  console piece never split one category into two. */
  category: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => v.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")),
  year: z.coerce.string(),
  media: z.string(),
  alt: z.string(),
  note: z.string().optional(),
  project: z.string().optional(),
  /** Aspect ratio hint for layout, e.g. "4/5", "3/2". */
  aspect: z.string().default("4/5"),
  /**
   * A stand-in that holds the wall until real work is hung. Placeholder
   * pieces are shown only while no real piece is visible; see
   * `src/server/gallery/service.ts`.
   */
  placeholder: z.boolean().default(false),
});

export type GalleryPiece = z.infer<typeof galleryFrontmatter> & {
  slug: string;
  html: string;
};

export function getGalleryPieces(): GalleryPiece[] {
  return readCollection("gallery")
    .map(({ slug, data, content }) => ({
      ...galleryFrontmatter.parse(data),
      slug,
      html: renderMarkdown(content.trim()),
    }))
    .sort((a, b) => b.year.localeCompare(a.year));
}

export function getGalleryPiece(slug: string): GalleryPiece | undefined {
  return getGalleryPieces().find((p) => p.slug === slug);
}
