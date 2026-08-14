/**
 * Site-level settings. Configuration-backed in v1; a private editing
 * interface can replace this file later without changing consumers
 * (read these through `src/server/settings.ts`).
 */

export type WorkshopState = "open" | "working" | "quiet";

export const siteConfig = {
  name: "porscha.today",
  owner: {
    name: "Porscha",
    /** Shown in the console greeting. */
    shortName: "Porscha",
  },

  /**
   * Workshop state — the signature interaction. Changes the small
   * status line in the header and the tone of the homepage signal.
   */
  workshopState: "working" as WorkshopState,

  /**
   * The homepage "currently" line. Kept as configuration so it reads
   * like a human wrote it (because one did), not like telemetry.
   */
  currently: "Deep in Kubli's capture flow",

  nav: [
    { label: "Porscha", href: "/porscha" },
    { label: "Workshop", href: "/workshop" },
    { label: "Lab", href: "/lab" },
    { label: "Gallery", href: "/gallery" },
    { label: "Apps", href: "/apps" },
    { label: "Notes", href: "/notes" },
  ],

  elsewhere: [{ label: "GitHub", url: "https://github.com/chaosbrewing" }],
} as const;

export const workshopStateCopy: Record<
  WorkshopState,
  { label: string; description: string }
> = {
  open: {
    label: "Workshop open",
    description: "Around and puttering. Say hi.",
  },
  working: {
    label: "Workshop working",
    description: "Heads-down on something right now.",
  },
  quiet: {
    label: "Workshop quiet",
    description: "Stepped away for a bit. Things are resting.",
  },
};
