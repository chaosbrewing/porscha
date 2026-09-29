import type { BuildingContent, ExperimentsContent, WorkContent } from "./schema";

/** Things I've made — three windows, intentionally selected. */
export const workDefaults = {
  heading: "Things I’ve made.",
  intro:
    "Selected projects, businesses and experiments that I’ve been part of (or started).",
  annotation: "Different problems,\nsame curiosity.",
  categories: [
    {
      name: "Sulit Co.",
      description: "Building infrastructure for independent service businesses.",
      cta: "View project",
      href: "/building",
      image: { src: "/placeholders/tile-building.svg", alt: "", width: 1600, height: 2000 },
    },
    {
      name: "Obra",
      description: "My artwork and visual practice.",
      cta: "View art",
      href: "/art",
      image: { src: "/art/amidst-chaos.jpg", alt: "", width: 2000, height: 1475 },
    },
    {
      name: "Experiments",
      description: "Selected products, ideas and things I’ve explored.",
      cta: "View experiments",
      href: "/work/experiments",
      image: { src: "/placeholders/tile-experiments.svg", alt: "", width: 1600, height: 2000 },
    },
  ],
} satisfies WorkContent;

/**
 * What I'm building. Sulit Co. is the one project so far. The numbered
 * sections read as the project's case: the problem, what's being
 * built, why it matters. Logo and media are added from the console.
 */
export const buildingDefaults = {
  eyebrow: "Building",
  heading: "What I’m building",
  subheading:
    "Infrastructure for independent service businesses, and whatever comes next.",
  annotation: "Better tools\nfor real people.",
  projectsLabel: "Projects",
  projects: [
    {
      name: "Sulit Co.",
      logo: null,
      description:
        "Most of the businesses people rely on every week are small, independent and run by one or two people who are good at the work itself: the cut, the clean, the repair, the class.\n\nSulit is an attempt to give those businesses the kind of operating infrastructure that larger companies take for granted, without asking them to become larger companies.",
      media: { src: "/placeholders/tile-building.svg", alt: "", width: 1600, height: 2000 },
      link: { label: "Visit Sulit", href: "https://sulit.today" },
      sections: [
        {
          title: "The problem",
          paragraphs: [
            "Independent service businesses run on a patchwork: a booking app here, a spreadsheet there, invoices from one tool, reminders from another, and a phone full of messages holding it all together.",
            "Each piece is fine on its own. Together they cost hours a week, leak money, and make the work feel more transactional than it needs to be.",
          ],
        },
        {
          title: "What we’re building",
          paragraphs: [
            "A calm operating layer for the whole business: scheduling, clients, payments and the follow-through in between, designed around how a small business actually runs rather than how software wishes it did.",
            "Boring where it should be boring. Careful where it matters. Quietly good to use.",
          ],
        },
        {
          title: "Why it matters",
          paragraphs: [
            "When the infrastructure works, people get their evenings back and their customers get a better experience. Independence stops being a trade-off.",
            "That is the part I care about: technology that makes a small business feel more personal, not less.",
          ],
        },
      ],
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
    "A few of these are still being written up. Until then, the snapshot on Today is the most honest answer.",
  items: [],
} satisfies ExperimentsContent;
