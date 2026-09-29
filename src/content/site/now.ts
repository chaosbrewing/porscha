import type { NowContent } from "./schema";

/**
 * Currently — a living snapshot beside one quiet picture. Bump
 * `updated` when something changes. The picture is a documented
 * placeholder until a real one is chosen from the console.
 */
export const nowDefaults = {
  heading: "Currently.",
  annotation: "Always a work\nin progress.",
  updated: "September 2026",
  visual: { src: "/placeholders/now-still.svg", alt: "", width: 1600, height: 2000 },
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
