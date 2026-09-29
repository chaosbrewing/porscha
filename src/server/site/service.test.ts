import { describe, expect, it } from "vitest";
import { SITE_DEFAULTS } from "@/content/site";
import { resolvePage } from "./service";

describe("resolvePage", () => {
  it("returns the defaults when nothing is stored", () => {
    expect(resolvePage("now", undefined)).toBe(SITE_DEFAULTS.now);
  });

  it("returns a valid override in full", () => {
    const override = { ...SITE_DEFAULTS.now, updated: "October 2026" };
    expect(resolvePage("now", override)).toEqual(override);
  });

  it("falls back to the defaults when the stored row is invalid", () => {
    const broken = { ...SITE_DEFAULTS.now, entries: "not a list" };
    expect(resolvePage("now", broken)).toBe(SITE_DEFAULTS.now);
  });

  it("fills a section the row predates from the defaults", () => {
    // A row saved before "about" existed on the page.
    const { about: _dropped, ...older } = SITE_DEFAULTS.me;
    void _dropped;
    const resolved = resolvePage("me", { ...older, fragments: { ...older.fragments, heading: "CHAOS" } });
    expect(resolved.about).toEqual(SITE_DEFAULTS.me.about);
    expect(resolved.fragments.heading).toBe("CHAOS");
  });

  it("fills fields added inside a list from their defaults", () => {
    const older = {
      ...SITE_DEFAULTS.me,
      chapters: {
        heading: "Chapters",
        intro: "",
        items: [{ title: "Making", description: "Art." }],
      },
    };
    const resolved = resolvePage("me", older);
    expect(resolved.chapters.items[0]).toEqual({ title: "Making", description: "Art.", image: null });
    expect(resolved.chapters.annotation).toBe("");
  });

  it("refuses links that could leave the site by a non-https scheme", () => {
    const sneaky = {
      ...SITE_DEFAULTS.home,
      paths: [{ label: "x", href: "javascript:alert(1)" }],
    };
    expect(resolvePage("home", sneaky)).toBe(SITE_DEFAULTS.home);
  });
});
