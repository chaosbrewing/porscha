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
 * Notes, lab experiments, gallery items, project stories, and the
 * biography live as Markdown files under `src/content/`. Frontmatter is
 * validated with zod so a malformed file fails loudly at build/dev time
 * instead of rendering garbage.
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

/** Raw file text for a single top-level content file, if present. */
function readRawFile(rel: string): string | undefined {
  if (isCloudflareWorkers) return bundledFiles[rel];
  const file = path.join(CONTENT_ROOT, rel);
  if (!fs.existsSync(file)) return undefined;
  return fs.readFileSync(file, "utf8");
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

/* ----------------------------- Notes ----------------------------- */

const noteFrontmatter = z.object({
  title: z.string(),
  date: z.coerce.date(),
  kind: z
    .enum(["observation", "devlog", "discovery", "design", "essay", "reflection"])
    .default("observation"),
  project: z.string().optional(),
  draft: z.boolean().default(false),
});

export type Note = z.infer<typeof noteFrontmatter> & {
  slug: string;
  html: string;
  excerpt: string;
};

export function getNotes(): Note[] {
  return readCollection("notes")
    .map(({ slug, data, content }) => {
      const fm = noteFrontmatter.parse(data);
      const text = content.trim();
      return {
        ...fm,
        slug,
        html: renderMarkdown(text),
        excerpt: text.split(/\n\s*\n/)[0]?.replace(/[#*_`>]/g, "").trim() ?? "",
      };
    })
    .filter((n) => !n.draft)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getNote(slug: string): Note | undefined {
  return getNotes().find((n) => n.slug === slug);
}

/* ------------------------- Lab experiments ------------------------ */

const labFrontmatter = z.object({
  number: z.number().int(),
  name: z.string(),
  hypothesis: z.string(),
  result: z.string().optional(),
  status: z.enum(["running", "concluded", "abandoned", "resting"]).default("running"),
  project: z.string().optional(),
  link: z.string().url().optional(),
  date: z.coerce.date(),
});

export type LabExperiment = z.infer<typeof labFrontmatter> & {
  slug: string;
  html: string;
};

export function getLabExperiments(): LabExperiment[] {
  return readCollection("lab")
    .map(({ slug, data, content }) => ({
      ...labFrontmatter.parse(data),
      slug,
      html: renderMarkdown(content.trim()),
    }))
    .sort((a, b) => b.number - a.number);
}

export function getLabExperiment(slug: string): LabExperiment | undefined {
  return getLabExperiments().find((e) => e.slug === slug);
}

/* --------------------------- Gallery ------------------------------ */

export const GALLERY_CATEGORIES = [
  "photography",
  "digital",
  "ui",
  "experiments",
  "sketches",
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

const galleryFrontmatter = z.object({
  title: z.string(),
  category: z.enum(GALLERY_CATEGORIES),
  year: z.coerce.string(),
  media: z.string(),
  alt: z.string(),
  note: z.string().optional(),
  project: z.string().optional(),
  /** Aspect ratio hint for layout, e.g. "4/5", "3/2". */
  aspect: z.string().default("4/5"),
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

/* ------------------------ Project stories ------------------------- */

const projectStoryFrontmatter = z.object({
  project: z.string(),
  why: z.string().optional(),
  lessons: z.array(z.string()).default([]),
  screenshots: z
    .array(z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() }))
    .default([]),
});

export type ProjectStory = z.infer<typeof projectStoryFrontmatter> & {
  slug: string;
  html: string;
};

export function getProjectStory(slug: string): ProjectStory | undefined {
  const entry = readCollection("projects").find((e) => e.slug === slug);
  if (!entry) return undefined;
  return {
    ...projectStoryFrontmatter.parse(entry.data),
    slug: entry.slug,
    html: renderMarkdown(entry.content.trim()),
  };
}

/* --------------------------- Biography ---------------------------- */

export function getBiography(): { html: string } | undefined {
  const raw = readRawFile("porscha.md");
  if (raw === undefined) return undefined;
  const { content } = matter(raw);
  return { html: renderMarkdown(content.trim()) };
}
