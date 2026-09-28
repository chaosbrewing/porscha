import type { ExternalLink, SiteLink } from "./types";

/**
 * Outward links. Social accounts are linked, never embedded.
 */
export const social: ExternalLink[] = [
  { label: "GitHub", url: "https://github.com/chaosbrewing" },
];

/**
 * "Get in touch". No private address is published here. Until a public
 * contact address or form exists, this points at the first social link
 * so the ending never dead-ends.
 */
export const contact: SiteLink = {
  label: "Get in touch",
  href: social[0].url,
};

/** The ending. */
export const ending = {
  /** Two lines; the break is intentional. */
  heading: ["That’s probably", "enough about me."],
  links: [
    { label: "See what I’m building", href: "/building" },
    { label: "See what I’m making", href: "/art" },
    contact,
  ] satisfies SiteLink[],
  image: {
    src: "/placeholders/ending-landscape.svg",
    alt: "",
    width: 2400,
    height: 1200,
  },
} as const;
