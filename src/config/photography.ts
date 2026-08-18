/**
 * The photography registry.
 *
 * The editorial direction is photography-led, so every image slot in
 * the magazine layer is declared here rather than hard-coded into a
 * page. Swapping a photograph is a one-line change in this file; the
 * layout never knows which face or frame it is holding.
 *
 * A slot with `src: null` is reserved, not broken: the layout renders a
 * held plate at the declared aspect ratio (see `.photo-plate` in
 * globals.css) so the composition is identical before and after the
 * real photograph lands. Placeholders are typographic on purpose —
 * never stock photography, never a generated person.
 *
 * Plain data with a pure resolver, so it is safe to import from client
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
  /** What to shoot for this slot, shown on the held plate. */
  brief: string;
};

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

export type ResolvedPhoto =
  | ({ held: false; src: string } & Omit<PhotoSlot, "src">)
  | ({ held: true; src: null } & Omit<PhotoSlot, "src">);

/**
 * Reads a slot. `held` is what the layout branches on — there is no
 * "missing image" state, only a photograph or a reserved plate.
 */
export function resolvePhoto(key: PhotoSlotKey): ResolvedPhoto {
  const slot = photography[key];
  const { src, ...rest } = slot;
  return src ? { ...rest, held: false, src } : { ...rest, held: true, src: null };
}

/** `"4/5"` → `"4 / 5"`, the form the CSS `aspect-ratio` property wants. */
export function aspectRatio(aspect: string): string {
  return aspect.replace("/", " / ");
}
