import { describe, expect, it } from "vitest";
import {
  photoOverrideSchema,
  photoSlotKeySchema,
  photographySettingsSchema,
} from "./validation";

/**
 * The console field validation. The image path is the interesting one:
 * it is typed by hand, reaches `next/image`, and must stay inside this
 * site.
 */

describe("photoSlotKeySchema", () => {
  it("accepts fixed slots and per-project app frames", () => {
    expect(photoSlotKeySchema.safeParse("home-cover").success).toBe(true);
    expect(photoSlotKeySchema.safeParse("app:kubli").success).toBe(true);
  });

  it("refuses keys that could escape the settings blob or an object key", () => {
    for (const bad of ["../etc", "Home-Cover", "app:", "a b", ""]) {
      expect(photoSlotKeySchema.safeParse(bad).success, bad).toBe(false);
    }
  });
});

describe("photoOverrideSchema", () => {
  it("takes a path on this site", () => {
    const parsed = photoOverrideSchema.safeParse({
      src: "/media/photography/home-cover-ab12cd34.jpg",
    });
    expect(parsed.success).toBe(true);
  });

  it("refuses remote URLs — next/image will not serve an unconfigured host", () => {
    expect(
      photoOverrideSchema.safeParse({ src: "https://example.com/a.jpg" }).success,
    ).toBe(false);
  });

  it("refuses traversal in the path", () => {
    expect(
      photoOverrideSchema.safeParse({ src: "/media/../../secret.jpg" }).success,
    ).toBe(false);
  });

  it("allows null — a slot held on purpose", () => {
    const parsed = photoOverrideSchema.safeParse({ src: null });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.src).toBeNull();
  });

  it("checks the aspect ratio is a ratio", () => {
    expect(photoOverrideSchema.safeParse({ aspect: "4/5" }).success).toBe(true);
    expect(photoOverrideSchema.safeParse({ aspect: "4:5" }).success).toBe(false);
    expect(photoOverrideSchema.safeParse({ aspect: "wide" }).success).toBe(false);
  });
});

describe("photographySettingsSchema", () => {
  it("accepts an empty blob — every slot on its default", () => {
    expect(photographySettingsSchema.safeParse({ slots: {} }).success).toBe(true);
  });

  it("rejects a blob with an invalid slot key", () => {
    const parsed = photographySettingsSchema.safeParse({
      slots: { "../x": { src: "/a.jpg" } },
    });
    expect(parsed.success).toBe(false);
  });
});
