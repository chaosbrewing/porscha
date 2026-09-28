import type { PageKey } from "@/content/site/schema";

/**
 * What the page editor shows for each page: an ordered list of field
 * specs pointing into the page's JSON by path. Adding a field here is
 * how a new piece of content becomes editable; the schema in
 * `src/content/site/schema.ts` is what validates it on save.
 */

export type ShowIf = { path: string; equals: string };

export type FieldSpec =
  | { kind: "text"; path: string; label: string; help?: string; maxLength?: number; showIf?: ShowIf }
  | { kind: "textarea"; path: string; label: string; help?: string; rows?: number; showIf?: ShowIf }
  | { kind: "lines"; path: string; label: string; help?: string; rows?: number; showIf?: ShowIf }
  | { kind: "image"; path: string; label: string; help?: string; showIf?: ShowIf }
  | {
      kind: "select";
      path: string;
      label: string;
      options: Array<{ value: string; label: string }>;
      help?: string;
      showIf?: ShowIf;
    }
  | {
      kind: "list";
      path: string;
      label: string;
      itemLabel: string;
      fields: FieldSpec[];
      blank: unknown;
      help?: string;
      /** A field on each item whose value names it in the list. */
      titleField?: string;
      showIf?: ShowIf;
    }
  | { kind: "section"; label: string; help?: string; fields: FieldSpec[] };

const link = (label = "Link"): FieldSpec[] => [
  { kind: "text", path: "label", label: `${label} text`, maxLength: 80 },
  { kind: "text", path: "href", label: "Goes to", help: "A path like /art, or an https:// address.", maxLength: 500 },
];

const IMAGE_HELP = "Uploaded images have their metadata (including location) removed.";

export const PAGE_FIELDS: Record<PageKey, FieldSpec[]> = {
  global: [
    { kind: "text", path: "name", label: "Name", help: "Shown in the opening screen, the footer and browser tabs.", maxLength: 60 },
    { kind: "textarea", path: "description", label: "Site description", help: "What search engines and link previews show.", rows: 3 },
    {
      kind: "list",
      path: "navigation",
      label: "Navigation",
      itemLabel: "link",
      titleField: "label",
      help: "The words in the header and footer. Keep them short.",
      fields: link(),
      blank: { label: "", href: "/" },
    },
    {
      kind: "list",
      path: "social",
      label: "Social links",
      itemLabel: "link",
      titleField: "label",
      help: "Linked outward from the footer, never embedded.",
      fields: [
        { kind: "text", path: "label", label: "Label", maxLength: 80 },
        { kind: "text", path: "url", label: "Address", help: "https:// or mailto:", maxLength: 500 },
      ],
      blank: { label: "", url: "https://" },
    },
    {
      kind: "section",
      label: "Get in touch",
      help: "Where the ending's last link goes.",
      fields: [
        { kind: "text", path: "contact.label", label: "Link text", maxLength: 80 },
        { kind: "text", path: "contact.href", label: "Goes to", help: "An https:// address, or mailto:you@example.com once a public address exists.", maxLength: 500 },
      ],
    },
  ],

  home: [
    { kind: "lines", path: "intro", label: "Opening lines", help: "One line per row. The break between them is deliberate.", rows: 3 },
    { kind: "text", path: "question", label: "The question", maxLength: 120 },
    {
      kind: "list",
      path: "paths",
      label: "The doors",
      itemLabel: "door",
      titleField: "label",
      fields: link("Door"),
      blank: { label: "", href: "/" },
    },
    { kind: "image", path: "visual", label: "The one image", help: `Portrait orientation reads best. ${IMAGE_HELP}` },
    { kind: "textarea", path: "annotation", label: "Handwritten note", help: "Beneath the image. Leave blank for none.", rows: 2 },
  ],

  work: [
    { kind: "text", path: "heading", label: "Heading", maxLength: 120 },
    { kind: "textarea", path: "intro", label: "Introduction", rows: 2 },
    {
      kind: "list",
      path: "categories",
      label: "The windows",
      itemLabel: "window",
      titleField: "name",
      fields: [
        { kind: "text", path: "name", label: "Name", maxLength: 80 },
        { kind: "textarea", path: "description", label: "One line", rows: 2 },
        { kind: "text", path: "cta", label: "Link text", maxLength: 60 },
        { kind: "text", path: "href", label: "Goes to", maxLength: 500 },
      ],
      blank: { name: "", description: "", cta: "Have a look", href: "/" },
    },
  ],

  experiments: [
    { kind: "text", path: "heading", label: "Heading", maxLength: 120 },
    { kind: "textarea", path: "intro", label: "Introduction", rows: 2 },
    { kind: "textarea", path: "emptyNote", label: "When the list is empty", help: "Shown until the first experiment is added.", rows: 2 },
    {
      kind: "list",
      path: "items",
      label: "Experiments",
      itemLabel: "experiment",
      titleField: "name",
      help: "Only intentionally selected work belongs here.",
      fields: [
        { kind: "text", path: "name", label: "Name", maxLength: 80 },
        { kind: "textarea", path: "description", label: "One honest line", rows: 2 },
        { kind: "text", path: "href", label: "Link (optional)", help: "Leave blank for no link.", maxLength: 500 },
      ],
      blank: { name: "", description: "", href: "" },
    },
  ],

  building: [
    { kind: "text", path: "label", label: "Eyebrow", help: "The small word above the name.", maxLength: 40 },
    { kind: "text", path: "name", label: "Name", maxLength: 120 },
    { kind: "text", path: "tagline", label: "Tagline", maxLength: 200 },
    { kind: "lines", path: "summary", label: "Summary paragraphs", help: "One paragraph per row.", rows: 6 },
    {
      kind: "list",
      path: "sections",
      label: "Sections",
      itemLabel: "section",
      titleField: "title",
      fields: [
        { kind: "text", path: "number", label: "Number", help: "e.g. 01. Leave blank for none.", maxLength: 4 },
        { kind: "text", path: "title", label: "Title", maxLength: 80 },
        { kind: "lines", path: "paragraphs", label: "Paragraphs", help: "One paragraph per row.", rows: 5 },
      ],
      blank: { number: "", title: "", paragraphs: [""] },
    },
    {
      kind: "section",
      label: "Outward link",
      help: "Where visitors go to see the real thing. Leave the address blank to show no link.",
      fields: [
        { kind: "text", path: "link.label", label: "Link text", maxLength: 60 },
        { kind: "text", path: "link.url", label: "Address", help: "https:// only.", maxLength: 500 },
      ],
    },
  ],

  now: [
    { kind: "text", path: "heading", label: "Heading", maxLength: 120 },
    {
      kind: "list",
      path: "entries",
      label: "The snapshot",
      itemLabel: "row",
      titleField: "label",
      fields: [
        { kind: "text", path: "label", label: "Label", help: "e.g. Building", maxLength: 40 },
        { kind: "text", path: "value", label: "Value", maxLength: 120 },
        { kind: "text", path: "href", label: "Link (optional)", maxLength: 500 },
      ],
      blank: { label: "", value: "", href: "" },
    },
    { kind: "text", path: "updated", label: "Updated", help: "e.g. October 2026. Bump it when you change a row.", maxLength: 40 },
    { kind: "text", path: "annotation", label: "Handwritten note", maxLength: 200 },
  ],

  me: [
    {
      kind: "section",
      label: "Fragments",
      fields: [
        { kind: "text", path: "fragments.heading", label: "Heading", maxLength: 120 },
        { kind: "textarea", path: "fragments.intro", label: "Introduction", rows: 2 },
        {
          kind: "list",
          path: "fragments.items",
          label: "Cards",
          itemLabel: "card",
          titleField: "text",
          help: "Tiny lines and pictures. Mystery is part of the design.",
          fields: [
            {
              kind: "select",
              path: "kind",
              label: "Type",
              options: [
                { value: "text", label: "A line of text" },
                { value: "image", label: "A picture" },
              ],
            },
            { kind: "text", path: "text", label: "The line", maxLength: 200, showIf: { path: "kind", equals: "text" } },
            {
              kind: "select",
              path: "tone",
              label: "Tone",
              options: [
                { value: "plain", label: "Plain" },
                { value: "annotation", label: "Handwritten" },
              ],
              showIf: { path: "kind", equals: "text" },
            },
            { kind: "image", path: "image", label: "Picture", help: IMAGE_HELP, showIf: { path: "kind", equals: "image" } },
            { kind: "text", path: "caption", label: "Caption (optional)", maxLength: 120, showIf: { path: "kind", equals: "image" } },
            {
              kind: "select",
              path: "size",
              label: "Size",
              options: [
                { value: "small", label: "Small" },
                { value: "wide", label: "Wide" },
                { value: "tall", label: "Tall (pictures only)" },
              ],
            },
          ],
          blank: { kind: "text", text: "", size: "small", tone: "plain" },
        },
      ],
    },
    {
      kind: "section",
      label: "Making",
      help: "The full-width pause between the fragments and the chapters.",
      fields: [
        { kind: "image", path: "making.image", label: "Background image", help: `Landscape, at least 2400 px wide. Text sits lower-left. ${IMAGE_HELP}` },
        { kind: "lines", path: "making.overlay", label: "Overlay lines", rows: 2 },
        { kind: "text", path: "making.annotation", label: "Handwritten note", maxLength: 200 },
        { kind: "text", path: "making.cta.label", label: "Link text", maxLength: 80 },
        { kind: "text", path: "making.cta.href", label: "Link goes to", maxLength: 500 },
      ],
    },
    {
      kind: "section",
      label: "Selected chapters",
      fields: [
        { kind: "text", path: "chapters.heading", label: "Heading", maxLength: 120 },
        { kind: "textarea", path: "chapters.intro", label: "Introduction", rows: 2 },
        {
          kind: "list",
          path: "chapters.items",
          label: "Chapters",
          itemLabel: "chapter",
          titleField: "title",
          fields: [
            { kind: "text", path: "title", label: "Title", maxLength: 40 },
            { kind: "text", path: "description", label: "One line", maxLength: 200 },
          ],
          blank: { title: "", description: "" },
        },
      ],
    },
    {
      kind: "section",
      label: "The little things",
      fields: [
        { kind: "text", path: "littleThings.heading", label: "Heading", maxLength: 120 },
        { kind: "textarea", path: "littleThings.intro", label: "Introduction", rows: 2 },
        { kind: "text", path: "littleThings.annotation", label: "Handwritten note", maxLength: 200 },
        { kind: "lines", path: "littleThings.items", label: "The things", help: "One per row.", rows: 10 },
      ],
    },
    {
      kind: "section",
      label: "The ending",
      fields: [
        { kind: "image", path: "ending.image", label: "Landscape image", help: `Wide and restrained. ${IMAGE_HELP}` },
        { kind: "lines", path: "ending.heading", label: "Big text", rows: 2 },
        {
          kind: "list",
          path: "ending.links",
          label: "Where to next",
          itemLabel: "link",
          titleField: "label",
          fields: link(),
          blank: { label: "", href: "/" },
        },
      ],
    },
  ],
};
