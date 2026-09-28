/**
 * Shapes for the editable site content under `src/content/site/`.
 *
 * Everything a visitor reads on the public site that is likely to
 * change — the Currently snapshot, fragments, chapters, the little
 * things, links — lives in these files as plain data. Presentation
 * lives in `src/components/public` and `src/app/(public)`.
 */

/** Internal route (starts with "/") or absolute external URL. */
export type Href = `/${string}` | `https://${string}` | `mailto:${string}`;

export type SiteLink = {
  label: string;
  href: Href;
};

export type ExternalLink = {
  label: string;
  url: `https://${string}` | `mailto:${string}`;
};

export type CurrentlyEntry = {
  label: string;
  value: string;
  /** Optional link for the value. */
  href?: Href;
};

/**
 * A fragment card. Text-only cards carry a single line; image cards
 * carry a picture and, optionally, a short line beneath it.
 *
 * `size` shapes the editorial grid: "small" is one cell, "wide" spans
 * two columns, "tall" spans two rows. Mobile ignores it and stacks.
 */
export type Fragment =
  | { kind: "text"; text: string; size?: "small" | "wide"; tone?: "plain" | "annotation" }
  | {
      kind: "image";
      src: string;
      alt: string;
      /** Intrinsic ratio, e.g. "4/5". Keeps layout stable while loading. */
      aspect: `${number}/${number}`;
      caption?: string;
      size?: "small" | "wide" | "tall";
    };

export type Chapter = {
  title: string;
  description: string;
};

export type WorkCategory = {
  name: string;
  description: string;
  cta: string;
  href: Href;
};

export type Experiment = {
  name: string;
  description: string;
  /** Optional outward link; internal links work too. */
  href?: Href;
};

export type EditorialSection = {
  number: string;
  title: string;
  paragraphs: string[];
};
