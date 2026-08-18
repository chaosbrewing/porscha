import { describe, expect, it } from "vitest";
import { photography, appFrameDefault } from "@/config/photography";
import { mergeSlot, resolveSlot } from "./resolve";
import type { PhotographySettings } from "./validation";

/**
 * The console's overrides laid over the registry defaults. The rules
 * that matter: an unset field falls back, `src: null` is a decision
 * rather than absence, and every slot resolves to a usable aspect ratio
 * so a layout never reserves a box of unknown size.
 */

const empty: PhotographySettings = { slots: {} };

describe("resolveSlot", () => {
  it("falls back to the registry when the console has said nothing", () => {
    const photo = resolveSlot(empty, "home-cover");
    expect(photo.held).toBe(false);
    expect(photo.src).toBe(photography["home-cover"].src);
    expect(photo.alt).toBe(photography["home-cover"].alt);
  });

  it("shows the console's photograph over the default", () => {
    const settings: PhotographySettings = {
      slots: {
        "home-cover": {
          src: "/media/photography/home-cover-abc123.jpg",
          alt: "A new cover frame",
          aspect: "3/4",
          focal: "50% 10%",
        },
      },
    };
    const photo = resolveSlot(settings, "home-cover");
    expect(photo.held).toBe(false);
    expect(photo.src).toBe("/media/photography/home-cover-abc123.jpg");
    expect(photo.alt).toBe("A new cover frame");
    expect(photo.aspect).toBe("3/4");
    expect(photo.focal).toBe("50% 10%");
  });

  it("keeps unset fields on the default when only the image changes", () => {
    const settings: PhotographySettings = {
      slots: { "home-cover": { src: "/media/photography/x.jpg" } },
    };
    const photo = resolveSlot(settings, "home-cover");
    expect(photo.alt).toBe(photography["home-cover"].alt);
    expect(photo.aspect).toBe(photography["home-cover"].aspect);
    expect(photo.caption).toBe(photography["home-cover"].caption);
  });

  it("holds a slot on purpose — null is a decision, not absence", () => {
    const settings: PhotographySettings = {
      slots: { "home-cover": { src: null } },
    };
    const photo = resolveSlot(settings, "home-cover");
    expect(photo.held).toBe(true);
    expect(photo.src).toBeNull();
    // The reserved plate must still hold the layout's box.
    expect(photo.aspect).toBe(photography["home-cover"].aspect);
    // And the brief survives, so the console still says what to shoot.
    expect(photo.brief).toBe(photography["home-cover"].brief);
  });

  it("uses the caller's fallback for slots outside the registry", () => {
    const fallback = appFrameDefault("Kubli", {
      src: "/shots/kubli.png",
      alt: "Kubli's capture screen",
    });
    const photo = resolveSlot(empty, "app:kubli", fallback);
    expect(photo.held).toBe(false);
    expect(photo.src).toBe("/shots/kubli.png");
    expect(photo.alt).toBe("Kubli's capture screen");
  });

  it("lets the console override a project's own screenshot", () => {
    const fallback = appFrameDefault("Kubli", {
      src: "/shots/kubli.png",
      alt: "Kubli's capture screen",
    });
    const settings: PhotographySettings = {
      slots: { "app:kubli": { src: "/media/photography/app-kubli-99.jpg" } },
    };
    const photo = resolveSlot(settings, "app:kubli", fallback);
    expect(photo.src).toBe("/media/photography/app-kubli-99.jpg");
  });

  it("still resolves an unknown slot with no fallback, rather than throwing", () => {
    const photo = resolveSlot(empty, "app:not-registered");
    expect(photo.held).toBe(true);
    expect(photo.aspect).toMatch(/^\d+\/\d+$/);
  });
});

describe("mergeSlot", () => {
  it("treats a blank string as nothing said", () => {
    const merged = mergeSlot(photography["home-wide"], {
      alt: "   ",
      caption: "",
    });
    expect(merged.alt).toBe(photography["home-wide"].alt);
    expect(merged.caption).toBe(photography["home-wide"].caption);
  });
});
