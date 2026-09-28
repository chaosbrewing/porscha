import type { Fragment } from "./types";

/**
 * Fragments — the alternative to an About page.
 *
 * Small pieces, deliberately unexplained. Mix text and images freely;
 * the grid takes care of itself. Image entries point at files under
 * `public/`; the placeholders in `public/placeholders/` are documented
 * in that folder's README and are meant to be replaced with real
 * photographs, artwork, sketches or objects.
 */
export const fragments = {
  heading: "Fragments",
  intro: "Small pieces of what makes me, well... me.",
  items: [
    { kind: "text", text: "I paint." },
    {
      kind: "image",
      src: "/placeholders/fragment-paint.svg",
      alt: "",
      aspect: "4/5",
      size: "tall",
    },
    {
      kind: "text",
      text: "I build software despite software’s best efforts to prevent this.",
      size: "wide",
    },
    { kind: "text", text: "I like turning strange ideas into real things." },
    {
      kind: "text",
      text: "I care a lot about how things feel, not just whether they work.",
      size: "wide",
    },
    { kind: "text", text: "I cook." },
    {
      kind: "image",
      src: "/placeholders/fragment-photo.svg",
      alt: "",
      aspect: "3/2",
      size: "wide",
    },
    { kind: "text", text: "I photograph things." },
    { kind: "text", text: "I change my mind.", tone: "annotation" },
    {
      kind: "text",
      text: "I make things when I don’t know how else to explain them.",
      size: "wide",
    },
    {
      kind: "image",
      src: "/placeholders/fragment-object.svg",
      alt: "",
      aspect: "1/1",
    },
    { kind: "text", text: "And a few other things." },
  ] satisfies Fragment[],
} as const;
