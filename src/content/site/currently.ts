import type { CurrentlyEntry } from "./types";

/**
 * Currently — a living snapshot.
 *
 * Edit the entries and bump `updated` when something changes. Rows
 * render in this order. Keep values short; this is a table, not prose.
 */
export const currently = {
  heading: "Currently.",
  annotation: "A snapshot, not the whole picture.",
  updated: "September 2026",
  entries: [
    { label: "Building", value: "Sulit", href: "/building" },
    { label: "Exploring", value: "Human-centred software" },
    { label: "Making", value: "New artwork", href: "/art" },
    {
      label: "Thinking about",
      value: "How technology can feel less transactional",
    },
    { label: "Based in", value: "Melbourne" },
  ] satisfies CurrentlyEntry[],
} as const;
