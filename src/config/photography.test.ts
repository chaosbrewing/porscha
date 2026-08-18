import { describe, expect, it } from "vitest";
import {
  aspectRatio,
  photography,
  resolvePhoto,
  type PhotoSlotKey,
} from "./photography";

const keys = Object.keys(photography) as PhotoSlotKey[];

describe("photography registry", () => {
  it("declares every slot with an aspect ratio and a real alt text", () => {
    for (const key of keys) {
      const slot = photography[key];
      expect(slot.aspect, key).toMatch(/^\d+(\.\d+)?\/\d+(\.\d+)?$/);
      expect(slot.alt.trim().length, key).toBeGreaterThan(0);
      expect(slot.brief.trim().length, key).toBeGreaterThan(0);
    }
  });

  it("points every filled slot at a public path", () => {
    for (const key of keys) {
      const { src } = photography[key];
      if (src !== null) expect(src, key).toMatch(/^\//);
    }
  });

  it("keeps the cover slot filled — the homepage leads with a photograph", () => {
    expect(resolvePhoto("home-cover").held).toBe(false);
  });
});

describe("resolvePhoto", () => {
  it("returns the photograph when the slot is filled", () => {
    const photo = resolvePhoto("home-cover");
    expect(photo.held).toBe(false);
    expect(photo.src).toBe(photography["home-cover"].src);
    expect(photo.aspect).toBe(photography["home-cover"].aspect);
  });

  it("holds the slot — same aspect, no src — when no photograph is set", () => {
    const photo = resolvePhoto("home-wide");
    expect(photo.held).toBe(true);
    expect(photo.src).toBeNull();
    // The layout must not reflow when the real frame arrives.
    expect(photo.aspect).toBe(photography["home-wide"].aspect);
  });
});

describe("aspectRatio", () => {
  it("spaces the ratio the way the CSS property wants it", () => {
    expect(aspectRatio("4/5")).toBe("4 / 5");
    expect(aspectRatio("16/9")).toBe("16 / 9");
  });
});
