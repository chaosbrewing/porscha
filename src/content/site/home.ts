import type { HomeContent } from "./schema";

/**
 * The opening screen. A name, two lines, a handwritten question, and
 * four doors — each a photograph with a label. Two of the doors show
 * documented placeholders (see public/placeholders/README.md) until a
 * real picture is chosen from the console.
 */
export const homeDefaults = {
  intro: ["I make things, start things,", "and occasionally finish them."],
  question: "What brings you here?",
  paths: [
    {
      label: "My work",
      href: "/work",
      image: { src: "/placeholders/tile-work.svg", alt: "", width: 1600, height: 2000 },
    },
    {
      label: "My art",
      href: "/art",
      image: { src: "/art/amidst-chaos.jpg", alt: "", width: 2000, height: 1475 },
    },
    {
      label: "What I’m building",
      href: "/building",
      image: { src: "/placeholders/tile-building.svg", alt: "", width: 1600, height: 2000 },
    },
    {
      label: "Who I am",
      href: "/me",
      image: { src: "/portrait/porscha.jpg", alt: "", width: 941, height: 1672 },
    },
  ],
  annotation: "",
} satisfies HomeContent;
