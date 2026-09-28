import type { BuildingContent, ExperimentsContent, WorkContent } from "./schema";

/** My work — three windows, intentionally selected. */
export const workDefaults = {
  heading: "My work",
  intro:
    "Selected projects, businesses and experiments that I’ve been part of (or started).",
  categories: [
    {
      name: "Sulit Co.",
      description: "Building infrastructure for independent service businesses.",
      cta: "View project",
      href: "/building",
    },
    {
      name: "Obra",
      description: "My artwork and visual practice.",
      cta: "View art",
      href: "/art",
    },
    {
      name: "Experiments",
      description: "Selected products, ideas and things I’ve explored.",
      cta: "View experiments",
      href: "/work/experiments",
    },
  ],
} satisfies WorkContent;

/**
 * What I'm building. Sulit Co. is the one project so far; its outward
 * link is blank until the right URL is confirmed, and while blank the
 * page shows no link rather than a guessed one. Logo and media are
 * added from the console.
 */
export const buildingDefaults = {
  eyebrow: "Building",
  heading: "What I’m building",
  subheading:
    "Infrastructure for independent service businesses, and whatever comes next.",
  projectsLabel: "Projects",
  projects: [
    {
      name: "Sulit Co.",
      logo: null,
      description:
        "Most of the businesses people rely on every week are small, independent and run by one or two people who are good at the work itself: the cut, the clean, the repair, the class.\n\nSulit is an attempt to give those businesses the kind of operating infrastructure that larger companies take for granted, without asking them to become larger companies: scheduling, clients, payments and the follow-through in between, designed around how a small business actually runs.",
      media: null,
      link: { label: "Visit Sulit", href: "" },
    },
  ],
} satisfies BuildingContent;

/**
 * Experiments — only intentionally selected work belongs here. The
 * list ships empty on purpose; add entries from the console.
 */
export const experimentsDefaults = {
  heading: "Experiments",
  intro: "Selected products, ideas and things I’ve explored.",
  emptyNote:
    "A few of these are still being written up. Until then, the snapshot on Currently is the most honest answer.",
  items: [],
} satisfies ExperimentsContent;
