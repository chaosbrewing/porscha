import type { GlobalContent } from "./schema";

/**
 * Site-wide defaults: identity, navigation, outward links.
 *
 * Social accounts are linked, never embedded. "Get in touch" points at
 * the first social link until a public contact address exists, so the
 * ending never dead-ends. Edit in the console under Settings → Pages
 * → Site-wide; this file is what the console starts from.
 */
export const globalDefaults = {
  name: "Porscha",
  description:
    "Porscha makes things, starts things, and occasionally finishes them. Selected work, art, ideas and fragments — an introduction, not a biography.",
  navigation: [
    { label: "Today", href: "/now" },
    { label: "Work", href: "/work" },
    { label: "Art", href: "/art" },
    { label: "Building", href: "/building" },
    { label: "Me", href: "/me" },
  ],
  social: [{ label: "GitHub", url: "https://github.com/chaosbrewing" }],
  contact: { label: "Get in touch", href: "https://github.com/chaosbrewing" },
} satisfies GlobalContent;

/**
 * Fixed identity of the website itself: the wordmark, browser tabs,
 * the footer and the social preview. The person is `globalDefaults.name`.
 */
export const site = {
  name: "iPorscha",
  domain: "porscha.today",
  title: "iPorscha",
  fallbackUrl: "https://porscha.today",
} as const;
