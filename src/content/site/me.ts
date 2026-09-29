import type { MeContent } from "./schema";

/**
 * Who I am — A little about, Fragments, the Making interlude, Selected
 * chapters, The little things, and the ending. Placeholder images are
 * documented in public/placeholders/README.md; replace them from the
 * console.
 */
export const meDefaults = {
  about: {
    heading: ["A little about", "Porscha."],
    tagline: "Founder. Artist. Builder.",
    paragraphs: [
      "I tend to make things because I can’t find the version I want to exist.",
      "I’m interested in turning ideas into useful things, in how technology can feel more human, and in creating work that makes life feel a little more interesting.",
    ],
    image: {
      src: "/portrait/porscha.jpg",
      alt: "Porscha in a white tee and black jacket, against a pale wall with slanting light.",
      width: 941,
      height: 1672,
    },
    annotation: "Same person,\ndifferent mediums.",
  },
  fragments: {
    heading: "Fragments.",
    intro: "A few things about me, in no particular order.",
    items: [
      { kind: "text", text: "I paint.", size: "small", tone: "plain", tag: "Creative" },
      {
        kind: "image",
        image: { src: "/placeholders/fragment-paint.svg", alt: "", width: 800, height: 1000 },
        caption: "",
        size: "tall",
        tag: "Creative",
      },
      {
        kind: "text",
        text: "I build software despite software’s best efforts to prevent this.",
        size: "wide",
        tone: "plain",
        tag: "Thoughts",
      },
      {
        kind: "text",
        text: "I like turning strange ideas into real things.",
        size: "small",
        tone: "plain",
        tag: "Thoughts",
      },
      {
        kind: "text",
        text: "I care a lot about how things feel, not just whether they work.",
        size: "wide",
        tone: "plain",
        tag: "Thoughts",
      },
      { kind: "text", text: "I cook.", size: "small", tone: "plain", tag: "Daily" },
      {
        kind: "image",
        image: { src: "/placeholders/fragment-photo.svg", alt: "", width: 1200, height: 800 },
        caption: "",
        size: "wide",
        tag: "Creative",
      },
      { kind: "text", text: "I photograph things.", size: "small", tone: "plain", tag: "Creative" },
      { kind: "text", text: "I write songs.", size: "small", tone: "plain", tag: "Creative" },
      { kind: "text", text: "I change my mind.", size: "small", tone: "annotation", tag: "Random" },
      {
        kind: "text",
        text: "I make things when I don’t know how else to explain them.",
        size: "wide",
        tone: "plain",
        tag: "Thoughts",
      },
      {
        kind: "image",
        image: { src: "/placeholders/fragment-object.svg", alt: "", width: 800, height: 800 },
        caption: "",
        size: "small",
        tag: "Daily",
      },
      { kind: "text", text: "And a few other things.", size: "small", tone: "plain", tag: "Random" },
    ],
  },
  making: {
    image: { src: "/placeholders/making-studio.svg", alt: "", width: 2400, height: 1500 },
    overlay: ["Making", "is how I think."],
    annotation: "This is part of the process.",
    cta: { label: "View my art", href: "/art" },
  },
  chapters: {
    heading: "Selected chapters.",
    intro: "Not a complete history, just a few that matter.",
    annotation: "Different chapters,\nsame curiosity.",
    items: [
      { title: "Making", description: "Art, photography, songs, visual experiments.", image: null },
      { title: "Learning", description: "Hospitality, operations, design, technology.", image: null },
      { title: "Building", description: "Products and companies.", image: null },
      { title: "Now", description: "Sulit Co. and whatever comes next.", image: null },
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
    annotation: "On to\nwhat’s next.",
  },
} satisfies MeContent;
