/**
 * Making — the editorial interlude on the "Who I am" page.
 *
 * One large environmental image with a short overlay. The placeholder
 * should be replaced with a studio, workbench or in-progress artwork
 * photograph (landscape, at least 2000px wide). See
 * `public/placeholders/README.md`.
 */
export const making = {
  image: {
    src: "/placeholders/making-studio.svg",
    alt: "",
    width: 2400,
    height: 1500,
  },
  /** Two lines; the break is intentional. */
  overlay: ["Making", "is how I think."],
  annotation: "This is part of the process.",
  cta: { label: "View my art", href: "/art" },
} as const;
