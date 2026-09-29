import { z } from "zod";

/**
 * Shapes for everything a visitor reads on the public site.
 *
 * Each page is one JSON document. The defaults live beside this file
 * as typed data; the console stores an override per page in
 * `site_settings`, validated against these schemas on the way in and
 * on the way out, so a bad row can never reach a page. Shared by the
 * server and the console editor, so no server-only imports here.
 *
 * Fields added after a page was first saved carry a `.default()` (or
 * are filled from the defaults by `resolvePage`), so a stored row
 * written against an older shape keeps validating.
 */

/** Internal route, absolute https URL, or mailto. */
export const hrefSchema = z
  .string()
  .trim()
  .min(1, "A link needs a destination")
  .max(500)
  .regex(
    /^(\/[^\s]*|https:\/\/[^\s]+|mailto:[^\s]+)$/,
    "Use a path like /art, an https:// address, or mailto:",
  );

export const linkSchema = z.object({
  label: z.string().trim().min(1, "A link needs a label").max(80),
  href: hrefSchema,
});

export const externalLinkSchema = z.object({
  label: z.string().trim().min(1, "A link needs a label").max(80),
  url: z
    .string()
    .trim()
    .regex(/^(https:\/\/[^\s]+|mailto:[^\s]+)$/, "Use an https:// address or mailto:"),
});

/**
 * An image the site serves: a path under public/ or an upload under
 * /media/. Width and height come from the file so layouts hold their
 * shape before the picture arrives.
 */
export const imageSchema = z.object({
  src: z
    .string()
    .trim()
    .min(1, "Pick an image")
    .refine((v) => v.startsWith("/"), "Images must be a path on this site"),
  alt: z.string().trim().max(300),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

/** An image that may be left out; the layout closes up around it. */
const optionalImage = imageSchema.nullable().default(null);

const line = z.string().trim().max(200);
const lines = z.array(line).min(1).max(6);
const paragraph = z.string().trim().max(1200);
const heading = z.string().trim().min(1, "Needs a heading").max(120);
const intro = z.string().trim().max(400);
const note = z.string().trim().max(200);

/* ------------------------------ Global ---------------------------- */

export const globalSchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(300),
  navigation: z.array(linkSchema).min(1).max(8),
  social: z.array(externalLinkSchema).max(10),
  contact: linkSchema,
});

/* ------------------------------- Home ----------------------------- */

/**
 * The opening screen: the name, two lines, a handwritten question,
 * and a row of doors — each a photograph with a label.
 */
export const homeSchema = z.object({
  intro: lines,
  question: z.string().trim().min(1).max(120),
  paths: z.array(linkSchema.extend({ image: optionalImage })).min(1).max(6),
  annotation: note,
});

/* ------------------------------- Work ----------------------------- */

export const workSchema = z.object({
  heading,
  intro,
  annotation: note.default(""),
  categories: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        description: z.string().trim().max(300),
        cta: z.string().trim().min(1).max(60),
        href: hrefSchema,
        image: optionalImage,
      }),
    )
    .min(1)
    .max(8),
});

export const experimentsSchema = z.object({
  heading,
  intro,
  emptyNote: z.string().trim().max(400),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        description: z.string().trim().max(300),
        href: z.union([hrefSchema, z.literal("")]),
      }),
    )
    .max(30),
});

/* ----------------------------- Building --------------------------- */

/**
 * What I'm building: an eyebrow, a header, a sub-header, then the
 * projects. Each project is a logo, a name, a description, one piece
 * of media, a linked line and a few numbered sections. Logo and media
 * are optional; a blank link address shows no link.
 */
export const buildingSchema = z.object({
  eyebrow: z.string().trim().max(40),
  heading,
  subheading: z.string().trim().max(300),
  annotation: note.default(""),
  projectsLabel: z.string().trim().min(1).max(40),
  projects: z
    .array(
      z.object({
        name: z.string().trim().min(1, "A project needs a name").max(80),
        logo: optionalImage,
        description: z.string().trim().max(2000),
        media: optionalImage,
        link: z.object({
          label: z.string().trim().max(80),
          href: z.union([hrefSchema, z.literal("")]),
        }),
        sections: z
          .array(
            z.object({
              title: z.string().trim().min(1, "A section needs a title").max(80),
              paragraphs: z.array(paragraph).min(1).max(4),
            }),
          )
          .max(6)
          .default([]),
      }),
    )
    .max(12),
});

/* -------------------------------- Now ----------------------------- */

export const nowSchema = z.object({
  heading,
  annotation: note,
  updated: z.string().trim().min(1).max(40),
  visual: optionalImage,
  entries: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        value: z.string().trim().min(1).max(120),
        href: z.union([hrefSchema, z.literal("")]),
      }),
    )
    .max(12),
});

/* -------------------------------- Me ------------------------------ */

const sizeSchema = z.enum(["small", "wide", "tall"]);

/** A short word that groups fragments behind a filter; blank for none. */
const tag = z.string().trim().max(24).default("");

export const fragmentSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("text"),
    text: z.string().trim().min(1, "A fragment needs its line").max(200),
    size: z.enum(["small", "wide"]),
    tone: z.enum(["plain", "annotation"]),
    tag,
  }),
  z.object({
    kind: z.literal("image"),
    image: imageSchema,
    caption: z.string().trim().max(120),
    size: sizeSchema,
    tag,
  }),
]);

export const meSchema = z.object({
  about: z.object({
    heading: lines,
    tagline: z.string().trim().max(120),
    paragraphs: z.array(paragraph).min(1).max(4),
    image: imageSchema,
    annotation: note,
  }),
  fragments: z.object({
    heading,
    intro,
    items: z.array(fragmentSchema).max(30),
  }),
  making: z.object({
    image: imageSchema,
    overlay: lines,
    annotation: note,
    cta: linkSchema,
  }),
  chapters: z.object({
    heading,
    intro,
    annotation: note.default(""),
    items: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(40),
          description: z.string().trim().max(200),
          image: optionalImage,
        }),
      )
      .max(8),
  }),
  littleThings: z.object({
    heading,
    intro,
    annotation: note,
    items: z.array(line).max(20),
  }),
  ending: z.object({
    heading: lines,
    links: z.array(linkSchema).max(6),
    image: imageSchema,
    annotation: note.default(""),
  }),
});

/* ------------------------------ Registry -------------------------- */

export const PAGE_SCHEMAS = {
  global: globalSchema,
  home: homeSchema,
  work: workSchema,
  experiments: experimentsSchema,
  building: buildingSchema,
  now: nowSchema,
  me: meSchema,
} as const;

export type PageKey = keyof typeof PAGE_SCHEMAS;
export const PAGE_KEYS = Object.keys(PAGE_SCHEMAS) as PageKey[];

export type GlobalContent = z.infer<typeof globalSchema>;
export type HomeContent = z.infer<typeof homeSchema>;
export type WorkContent = z.infer<typeof workSchema>;
export type ExperimentsContent = z.infer<typeof experimentsSchema>;
export type BuildingContent = z.infer<typeof buildingSchema>;
export type NowContent = z.infer<typeof nowSchema>;
export type MeContent = z.infer<typeof meSchema>;
export type Fragment = z.infer<typeof fragmentSchema>;
export type SiteImage = z.infer<typeof imageSchema>;

export type SiteContent = {
  global: GlobalContent;
  home: HomeContent;
  work: WorkContent;
  experiments: ExperimentsContent;
  building: BuildingContent;
  now: NowContent;
  me: MeContent;
};

/** Where each page lives, for the editor's preview and "open" link. */
export const PAGE_META: Record<PageKey, { label: string; path: string; blurb: string }> = {
  home: { label: "Home", path: "/", blurb: "The opening screen: a name, two lines, a question, four doors." },
  work: { label: "My work", path: "/work", blurb: "Things I’ve made: Sulit, Obra, Experiments, each a window." },
  building: { label: "What I’m building", path: "/building", blurb: "Eyebrow, header, sub-header, then the projects: logo, name, description, media, a linked line, numbered sections." },
  experiments: { label: "Experiments", path: "/work/experiments", blurb: "Selected products, ideas and things explored." },
  now: { label: "Today", path: "/now", blurb: "The living snapshot. Bump the date when you change it." },
  me: { label: "Who I am", path: "/me", blurb: "A little about, Fragments, Making, Selected chapters, The little things, the ending." },
  global: { label: "Site-wide", path: "/", blurb: "Name, description, navigation, social links, how to get in touch." },
};
