import type { NowContent } from "./schema";

/** Currently — a living snapshot. Bump `updated` when something changes. */
export const nowDefaults = {
  heading: "Currently.",
  annotation: "A snapshot, not the whole picture.",
  updated: "September 2026",
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
