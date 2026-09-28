import type { EditorialSection, Experiment, WorkCategory } from "./types";

/**
 * My work — three windows, intentionally selected.
 */
export const work = {
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
  ] satisfies WorkCategory[],
} as const;

/**
 * Sulit Co. — an editorial project page, not a landing page.
 *
 * `link.url` is the outward Sulit property. It is intentionally unset
 * until the right URL is confirmed; while it is null the page simply
 * shows no outward link rather than a guessed one.
 */
export const sulit = {
  label: "Building",
  name: "Sulit Co.",
  tagline: "Infrastructure for independent service businesses.",
  summary: [
    "Most of the businesses people rely on every week are small, independent and run by one or two people who are good at the work itself: the cut, the clean, the repair, the class.",
    "Sulit is an attempt to give those businesses the kind of operating infrastructure that larger companies take for granted, without asking them to become larger companies.",
  ],
  sections: [
    {
      number: "01",
      title: "The problem",
      paragraphs: [
        "Independent service businesses run on a patchwork: a booking app here, a spreadsheet there, invoices from one tool, reminders from another, and a phone full of messages holding it all together.",
        "Each piece is fine on its own. Together they cost hours a week, leak money, and make the work feel more transactional than it needs to be.",
      ],
    },
    {
      number: "02",
      title: "What we’re building",
      paragraphs: [
        "A calm operating layer for the whole business: scheduling, clients, payments and the follow-through in between, designed around how a small business actually runs rather than how software wishes it did.",
        "Boring where it should be boring. Careful where it matters. Quietly good to use.",
      ],
    },
    {
      number: "03",
      title: "Why it matters",
      paragraphs: [
        "When the infrastructure works, people get their evenings back and their customers get a better experience. Independence stops being a trade-off.",
        "That is the part I care about: technology that makes a small business feel more personal, not less.",
      ],
    },
  ] satisfies EditorialSection[],
  link: {
    label: "Visit Sulit",
    url: null as `https://${string}` | null,
  },
} as const;

/**
 * Experiments — selected products, ideas and things explored.
 *
 * Only intentionally selected work belongs here. The list ships empty
 * on purpose: nothing is published because it happens to exist in a
 * repository. Add entries like:
 *
 *   { name: "Name", description: "One honest line.", href: "https://…" }
 */
export const experiments = {
  heading: "Experiments",
  intro: "Selected products, ideas and things I’ve explored.",
  emptyNote:
    "A few of these are still being written up. Until then, the snapshot on Currently is the most honest answer.",
  items: [] as Experiment[],
} as const;
