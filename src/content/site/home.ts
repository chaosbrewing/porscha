import type { HomeContent } from "./schema";

/** The opening screen. A name, two lines, a question, four doors, one image. */
export const homeDefaults = {
  intro: ["I make things, start things,", "and occasionally finish them."],
  question: "What brings you here?",
  paths: [
    { label: "My work", href: "/work" },
    { label: "My art", href: "/art" },
    { label: "What I’m building", href: "/building" },
    { label: "Who I am", href: "/me" },
  ],
  visual: {
    src: "/portrait/porscha.jpg",
    alt: "Porscha, photographed against a warm plain backdrop.",
    width: 1043,
    height: 1508,
  },
  annotation: "Different problems.\nSame curiosity.",
} satisfies HomeContent;
