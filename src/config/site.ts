/**
 * Site-level settings. Configuration-backed in v1; a private editing
 * interface can replace this file later without changing consumers
 * (read these through `src/server/settings.ts`).
 */

export type WorkshopState = "open" | "working" | "quiet";

export type SocialId = "instagram" | "github" | "linkedin" | "mail";

export type SocialLink = {
  id: SocialId;
  label: string;
  /** `null` until the real account/address is filled in. */
  href: string | null;
};

export const siteConfig = {
  /** The masthead, written the way it is set: POR$CHA. */
  name: "POR$CHA",
  domain: "porscha.today",
  /** Founder • Artist • Builder — the line under the masthead. */
  roles: ["Founder", "Artist", "Builder"] as const,

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

  /**
   * The three worlds. This is the public information architecture:
   * ART • APPS • HEADQUARTERS, in that order, numbered like sections
   * of an issue.
   */
  nav: [
    { label: "Art", href: "/art" },
    { label: "Apps", href: "/apps" },
    { label: "Headquarters", href: "/headquarters" },
  ],

  /**
   * The rooms inside Headquarters. Not in the masthead — they are
   * reached from the Headquarters landing page and the footer, so the
   * top-level navigation stays at three words.
   */
  secondaryNav: [
    { label: "Workshop", href: "/workshop" },
    { label: "Notes", href: "/notes" },
    { label: "Lab", href: "/lab" },
    { label: "Porscha", href: "/porscha" },
  ],

  /**
   * Social links, shown beside the identity on the homepage and in the
   * footer.
   *
   * An entry with `href: null` is a slot, not an account: it renders
   * nowhere until the real handle is filled in here. Nothing on this
   * site links to an account that does not exist, and no personal email
   * address is published until it is deliberately put in this file.
   */
  social: [
    { id: "instagram", label: "Instagram", href: null },
    { id: "github", label: "GitHub", href: "https://github.com/chaosbrewing" },
    { id: "linkedin", label: "LinkedIn", href: null },
    { id: "mail", label: "Mail", href: null },
  ] as SocialLink[],
} as const;

/** The social links that actually point somewhere, in masthead order. */
export function configuredSocials(): Array<SocialLink & { href: string }> {
  return siteConfig.social.filter(
    (link): link is SocialLink & { href: string } =>
      typeof link.href === "string" && link.href.trim().length > 0,
  );
}

/** "Founder • Artist • Builder" */
export function roleLine(separator = " • "): string {
  return siteConfig.roles.join(separator);
}

/** Section numerals: 1 → "01". Sections never run past 99. */
export function sectionNumber(index: number): string {
  return String(index).padStart(2, "0");
}

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
