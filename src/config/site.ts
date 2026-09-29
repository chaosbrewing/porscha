/**
 * Site-level settings shared by the public site and the console.
 * Visitor-facing copy lives in `src/content/site/`, not here.
 */
export const siteConfig = {
  name: "porscha.today",
  owner: {
    name: "Porscha",
    /** Shown in the console greeting. */
    shortName: "Porscha",
  },
} as const;
