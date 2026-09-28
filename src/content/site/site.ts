import type { SiteLink } from "./types";

/**
 * Site identity and the opening screen.
 *
 * The home page is deliberately sparse: a name, two lines, a question,
 * and four doors. Every string on it is here.
 */
export const site = {
  name: "Porscha",
  domain: "porscha.today",
  /** Used in <title> templates and social previews. */
  title: "Porscha",
  description:
    "Porscha makes things, starts things, and occasionally finishes them. Selected work, art, ideas and fragments — an introduction, not a biography.",
  /** Where the site lives when SITE_URL is not set. */
  fallbackUrl: "https://porscha.today",
} as const;

export const home = {
  /** Two lines; the break is intentional. */
  intro: ["I make things, start things,", "and occasionally finish them."],
  question: "What brings you here?",
  paths: [
    { label: "My work", href: "/work" },
    { label: "My art", href: "/art" },
    { label: "What I’m building", href: "/building" },
    { label: "Who I am", href: "/me" },
  ] satisfies SiteLink[],
  /**
   * The one visual beside the introduction. The approved portrait,
   * cropped tight so it reads as a detail rather than a headshot.
   */
  visual: {
    src: "/portrait/porscha.jpg",
    alt: "Porscha, photographed against a warm plain backdrop.",
    width: 1043,
    height: 1508,
  },
  annotation: "Different problems.\nSame curiosity.",
} as const;

/** Header navigation. Short words; the home page carries the long ones. */
export const navigation: SiteLink[] = [
  { label: "Work", href: "/work" },
  { label: "Art", href: "/art" },
  { label: "Building", href: "/building" },
  { label: "Now", href: "/now" },
  { label: "Me", href: "/me" },
];
