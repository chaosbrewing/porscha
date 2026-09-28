import type { Chapter } from "./types";

/**
 * Selected chapters — not a timeline, and deliberately undated.
 */
export const chapters = {
  heading: "Selected chapters",
  intro: "Not a life story. Just a few chapters that shaped the path.",
  items: [
    { title: "Making", description: "Art, photography, visual experiments." },
    {
      title: "Learning",
      description: "Hospitality, operations, design, technology.",
    },
    { title: "Building", description: "Products and companies." },
    { title: "Now", description: "Sulit Co. and whatever comes next." },
  ] satisfies Chapter[],
} as const;
