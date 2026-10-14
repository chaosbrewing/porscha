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

  it("gives a door saved without a picture the default picture for its destination", () => {
    // A home row saved when doors were label + link only, with the old
    // standalone image still on it.
    const older = {
      intro: ["a", "b"],
      question: "?",
      paths: [
        { label: "My art", href: "/art" },
        { label: "Who I am", href: "/me" },
        { label: "Notes", href: "/work/experiments" },
      ],
      visual: { src: "/media/site/chosen.jpg", alt: "", width: 10, height: 20 },
      annotation: "",
    };
    const resolved = resolvePage("home", older);
    expect(resolved.paths[0].image).toEqual(SITE_DEFAULTS.home.paths[1].image);
    expect(resolved.paths[1].image?.src).toBe("/media/site/chosen.jpg");
    expect(resolved.paths[2].image).toBeNull();
  });

  it("never replaces a picture the console chose", () => {
    const chosen = { src: "/media/site/mine.jpg", alt: "", width: 4, height: 5 };
    const row = { ...SITE_DEFAULTS.home, paths: [{ label: "My art", href: "/art", image: chosen }] };
    expect(resolvePage("home", row).paths[0].image).toEqual(chosen);
  });

  it("sends a stored 'Get in touch' that still points at the old placeholder to the public address", () => {
    const placeholder = "https://github.com/chaosbrewing";
    const me = resolvePage("me", {
      ...SITE_DEFAULTS.me,
      ending: { ...SITE_DEFAULTS.me.ending, links: [{ label: "Get in touch", href: placeholder }] },
    });
    expect(me.ending.links[0].href).toBe("mailto:hello@porscha.today");

    const global = resolvePage("global", {
      ...SITE_DEFAULTS.global,
      contact: { label: "Say hi", href: placeholder },
      social: [{ label: "GitHub", url: placeholder }],
    });
    expect(global.contact).toEqual({ label: "Say hi", href: "mailto:hello@porscha.today" });
    expect(global.social.map((s) => s.label)).toEqual(["GitHub", "Instagram", "Facebook", "Snapchat"]);
  });

  it("leaves a contact the console pointed somewhere else alone", () => {
    const chosen = { label: "Get in touch", href: "https://example.com/contact" };
    expect(resolvePage("global", { ...SITE_DEFAULTS.global, contact: chosen }).contact).toEqual(chosen);
  });

  it("refuses links that could leave the site by a non-https scheme", () => {
    const sneaky = {
      ...SITE_DEFAULTS.home,
      paths: [{ label: "x", href: "javascript:alert(1)" }],
    };
    expect(resolvePage("home", sneaky)).toBe(SITE_DEFAULTS.home);
  });
});
