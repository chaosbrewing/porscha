import type { NowContent } from "./schema";

/**
 * Currently — a living snapshot beside one picture: the "Becoming is
 * an art" poster. Bump `updated` when something changes.
 */
export const nowDefaults = {
  heading: "Currently.",
  annotation: "Always a work\nin progress.",
  updated: "September 2026",
  visual: {
    src: "/portrait/becoming.jpg",
    alt: "A poster of Porscha over brushstrokes and sketches, lettered “Becoming is an art”.",
    width: 1024,
    height: 1536,
  },
  entries: [
    { label: "Building", value: "Sulit", href: "/building" },
    { label: "Exploring", value: "Human-centred software", href: "" },
    { label: "Making", value: "New artwork", href: "/art" },
    {
      label: "Thinking about",
      value: "How technology can feel less transactional",
      href: "",
    },
    { label: "Based in", value: "Melbourne", href: "" },
  ],
} satisfies NowContent;
