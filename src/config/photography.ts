/**
 * The photography registry — the defaults.
 *
 * The editorial direction is photography-led, so every image slot in
 * the magazine layer is declared here rather than hard-coded into a
 * page. Every slot is also editable from the private console, which
 * stores overrides in `site_settings`; this file is what a slot falls
 * back to when the console has said nothing about it.
 *
 * A slot that resolves with no image is reserved, not broken: the
 * layout renders a held plate at the declared aspect ratio (see
 * `.photo-plate` in globals.css) so the composition is identical
 * before and after the real photograph lands. Placeholders are
 * typographic on purpose — never stock photography, never a generated
 * person.
 *
 * Plain data with pure helpers, so it is safe to import from client
 * and server components alike.
 */

export type PhotoSlotKey =
  | "home-cover"
  | "home-portrait-second"
  | "home-wide"
  | "porscha-portrait"
  | "art-opening"
  | "apps-opening"
  | "headquarters-opening";

export type PhotoSlot = {
  /** Public path to the photograph, or `null` while the slot is held. */
  src: string | null;
  /** Written for the photograph that belongs here, not the placeholder. */
  alt: string;
  /** `w/h`, e.g. `"4/5"`. Held plates use it too, so nothing reflows. */
  aspect: string;
  /** CSS `object-position` for the crop. */
  focal?: string;
  /** Editorial caption printed beside or beneath the frame. */
  caption?: string;
  /** What to shoot for this slot, shown on the held plate and in the console. */
  brief: string;
};

/** How a slot is introduced in the console: where it appears, and its name. */
export type PhotoSlotMeta = { key: string; where: string; label: string };

export const photography: Record<PhotoSlotKey, PhotoSlot> = {
  "home-cover": {
    src: "/portrait/porscha.jpg",
    alt: "Porscha, photographed straight-on in a deep burgundy turtleneck",
    aspect: "4/5",
    focal: "50% 22%",
    caption: "Cover — Porscha",
    brief: "Cover portrait. Full-bleed, direct gaze, head in the upper third.",
  },
  "home-portrait-second": {
    src: null,
    alt: "Porscha in profile, a second editorial frame from the same sitting",
    aspect: "3/4",
    focal: "50% 30%",
    caption: "Plate II",
    brief: "Second sitting frame — profile or three-quarter, cropped tight.",
  },
  "home-wide": {
    src: null,
    alt: "A wide editorial frame — the studio, mid-work",
    aspect: "16/9",
    focal: "50% 45%",
    caption: "The studio",
    brief: "Wide full-bleed. Environment over face; room to run type across.",
  },
  "porscha-portrait": {
    src: "/portrait/porscha.jpg",
    alt: "Porscha, photographed straight-on in a deep burgundy turtleneck",
    aspect: "4/5",
    focal: "50% 20%",
    caption: "Porscha",
    brief: "Bio portrait. The same sitting as the cover, cropped closer.",
  },
  "art-opening": {
    src: null,
    alt: "An OBRA original photographed on the studio wall",
    aspect: "3/2",
    focal: "50% 50%",
    caption: "OBRA — the wall",
    brief: "Opening spread for ART. A piece in situ, raking light, no props.",
  },
  "apps-opening": {
    src: null,
    alt: "Chaos Origins apps running on a handset and a laptop",
    aspect: "4/3",
    focal: "50% 50%",
    caption: "Chaos Origins — in hand",
    brief: "Device still-life. Real screens, one light source, black ground.",
  },
  "headquarters-opening": {
    src: null,
    alt: "The desk at Headquarters — notes, screens, work in progress",
    aspect: "16/10",
    focal: "50% 50%",
    caption: "Headquarters",
    brief: "The operating layer as a place: desk, notebook, terminal, mid-day.",
  },
};

/** Where each fixed slot appears, in the order the console lists them. */
export const PHOTO_SLOT_META: Array<PhotoSlotMeta & { key: PhotoSlotKey }> = [
  { key: "home-cover", where: "Home", label: "Cover portrait" },
  { key: "home-portrait-second", where: "Home", label: "Second plate" },
  { key: "home-wide", where: "Home", label: "Closing wide frame" },
  { key: "art-opening", where: "Art", label: "Opening spread" },
  { key: "apps-opening", where: "Apps", label: "Opening spread" },
  { key: "headquarters-opening", where: "Headquarters", label: "Opening spread" },
  { key: "porscha-portrait", where: "Porscha", label: "Bio portrait" },
];

/**
 * The frame beside a product on APPS.
 *
 * These slots are per project rather than fixed, so they are keyed
 * rather than declared: adding an app to the registry adds its frame to
 * the console without a code change here.
 */
export function appFrameSlot(projectSlug: string): string {
  return `app:${projectSlug}`;
}

/** The default frame for a product with no console-set photograph. */
export function appFrameDefault(name: string, shot?: {
  src: string;
  alt: string;
  caption?: string;
}): PhotoSlot {
  return {
    src: shot?.src ?? null,
    alt: shot?.alt ?? `${name} running on a device`,
    aspect: "4/3",
    focal: "50% 50%",
    caption: shot?.caption ?? `${name} — in use`,
    brief: `Product photography for ${name} drops in here.`,
  };
}

export type ResolvedPhoto =
  | ({ held: false; src: string } & Omit<PhotoSlot, "src">)
  | ({ held: true; src: null } & Omit<PhotoSlot, "src">);

/**
 * Reads a slot's default. `held` is what the layout branches on — there
 * is no "missing image" state, only a photograph or a reserved plate.
 *
 * This is the file-only view; pages go through
 * `src/server/photography/service.ts`, which lays the console's
 * overrides on top of these.
 */
export function resolvePhoto(key: PhotoSlotKey): ResolvedPhoto {
  return asResolved(photography[key]);
}

/** A slot record — from this file or from the console — as the layout sees it. */
export function asResolved(slot: PhotoSlot): ResolvedPhoto {
  const { src, ...rest } = slot;
  return src ? { ...rest, held: false, src } : { ...rest, held: true, src: null };
}

/** `"4/5"` → `"4 / 5"`, the form the CSS `aspect-ratio` property wants. */
export function aspectRatio(aspect: string): string {
  return aspect.replace("/", " / ");
}
