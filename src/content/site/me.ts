import type { MeContent } from "./schema";

/**
 * Who I am — Fragments, the Making interlude, Selected chapters, The
 * little things, and the ending. Placeholder images are documented in
 * public/placeholders/README.md; replace them from the console.
 */
export const meDefaults = {
  fragments: {
    heading: "Fragments",
    intro: "Small pieces of what makes me, well... me.",
    items: [
      { kind: "text", text: "I paint.", size: "small", tone: "plain" },
      {
        kind: "image",
        image: { src: "/placeholders/fragment-paint.svg", alt: "", width: 800, height: 1000 },
        caption: "",
        size: "tall",
      },
      {
        kind: "text",
        text: "I build software despite software’s best efforts to prevent this.",
        size: "wide",
        tone: "plain",
      },
      { kind: "text", text: "I like turning strange ideas into real things.", size: "small", tone: "plain" },
      {
        kind: "text",
        text: "I care a lot about how things feel, not just whether they work.",
        size: "wide",
        tone: "plain",
      },
      { kind: "text", text: "I cook.", size: "small", tone: "plain" },
      {
        kind: "image",
        image: { src: "/placeholders/fragment-photo.svg", alt: "", width: 1200, height: 800 },
        caption: "",
        size: "wide",
      },
      { kind: "text", text: "I photograph things.", size: "small", tone: "plain" },
      { kind: "text", text: "I write songs.", size: "small", tone: "plain" },
      { kind: "text", text: "I change my mind.", size: "small", tone: "annotation" },
      {
        kind: "text",
        text: "I make things when I don’t know how else to explain them.",
        size: "wide",
        tone: "plain",
      },
      {
        kind: "image",
        image: { src: "/placeholders/fragment-object.svg", alt: "", width: 800, height: 800 },
        caption: "",
        size: "small",
      },
      { kind: "text", text: "And a few other things.", size: "small", tone: "plain" },
    ],
  },
  making: {
    image: { src: "/placeholders/making-studio.svg", alt: "", width: 2400, height: 1500 },
    overlay: ["Making", "is how I think."],
    annotation: "This is part of the process.",
    cta: { label: "View my art", href: "/art" },
  },
  chapters: {
    heading: "Selected chapters",
    intro: "Not a life story. Just a few chapters that shaped the path.",
    items: [
      { title: "Making", description: "Art, photography, songs, visual experiments." },
      { title: "Learning", description: "Hospitality, operations, design, technology." },
      { title: "Building", description: "Products and companies." },
      { title: "Now", description: "Sulit Co. and whatever comes next." },
    ],
  },
  littleThings: {
    heading: "The little things",
    intro: "Some of the small details that make up a big part of how I see the world.",
    annotation: "Not everything needs to be serious.",
    items: [
      "Good coffee.",
      "Long walks.",
      "Great food.",
      "Analog things.",
      "Music that moves me.",
      "Fremantle / Melbourne.",
      "The ocean.",
      "A full calendar (and a messy desk).",
    ],
  },
  ending: {
    heading: ["That’s probably", "enough about me."],
    links: [
      { label: "See what I’m building", href: "/building" },
      { label: "See what I’m making", href: "/art" },
      { label: "Get in touch", href: "https://github.com/chaosbrewing" },
    ],
    image: { src: "/placeholders/ending-landscape.svg", alt: "", width: 2400, height: 1200 },
  },
} satisfies MeContent;
