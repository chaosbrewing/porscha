/**
 * Site-level settings. Configuration-backed in v1; a private editing
 * interface can replace this file later without changing consumers
 * (read these through `src/server/settings.ts`).
 */

export type WorkshopState = "open" | "working" | "quiet";

export type SocialId =
  | "instagram"
  | "github"
  | "linkedin"
  | "snapchat"
  | "mail";

export type SocialLink = {
  id: SocialId;
  label: string;
  /** The handle as it is written — printed where there is room for it. */
  handle: string;
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
   * footer, in this order.
   *
   * An entry with `href: null` is a slot, not an account: it renders
   * nowhere until the real handle is filled in here. Nothing on this
   * site links to an account that does not exist.
   *
   * Handles are kept beside the URL because the footer prints them and
   * a bare "Instagram" is worth less than the name someone can search
   * for. LinkedIn URLs are stored without the share tracking that the
   * mobile app appends.
   */
  social: [
    {
      id: "instagram",
      label: "Instagram",
      handle: "@porscha.Ryder",
      href: "https://www.instagram.com/porscha.ryder/",
    },
    {
      id: "github",
      label: "GitHub",
      handle: "chaosbrewing",
      href: "https://github.com/chaosbrewing",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      handle: "Porscha Gamil",
      href: "https://www.linkedin.com/in/porscha-gamil-8a9344408",
    },
    {
      id: "snapchat",
      label: "Snapchat",
      handle: "@ryder.porscha",
      href: "https://www.snapchat.com/add/ryder.porscha",
    },
    {
      id: "mail",
      label: "Mail",
      handle: "hello@porscha.today",
      href: "mailto:hello@porscha.today",
    },
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
