import { describe, expect, it } from "vitest";
import { configuredSocials, roleLine, sectionNumber, siteConfig } from "./site";

describe("site identity", () => {
  it("is POR$CHA, Founder • Artist • Builder", () => {
    expect(siteConfig.name).toBe("POR$CHA");
    expect(roleLine()).toBe("Founder • Artist • Builder");
  });

  it("navigates ART • APPS • HEADQUARTERS, in that order", () => {
    expect(siteConfig.nav.map((item) => item.href)).toEqual([
      "/art",
      "/apps",
      "/headquarters",
    ]);
  });

  it("keeps the rooms inside Headquarters out of the masthead", () => {
    const top = new Set<string>(siteConfig.nav.map((item) => item.href));
    for (const item of siteConfig.secondaryNav) {
      expect(top.has(item.href)).toBe(false);
    }
  });
});

describe("configuredSocials", () => {
  it("publishes only links that point somewhere", () => {
    const published = configuredSocials();
    expect(published.length).toBeGreaterThan(0);
    for (const link of published) {
      expect(link.href).toMatch(/^(https?:|mailto:)/);
    }
  });

  it("holds unset accounts back rather than linking nowhere", () => {
    const held = siteConfig.social.filter((link) => link.href === null);
    const published = new Set(configuredSocials().map((link) => link.id));
    for (const link of held) expect(published.has(link.id)).toBe(false);
  });
});

describe("sectionNumber", () => {
  it("sets section numerals two digits wide", () => {
    expect(sectionNumber(1)).toBe("01");
    expect(sectionNumber(3)).toBe("03");
    expect(sectionNumber(12)).toBe("12");
  });
});
