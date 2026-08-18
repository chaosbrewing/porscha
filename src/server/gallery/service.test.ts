import { beforeEach, describe, expect, it, vi } from "vitest";
import { GALLERY_DISPLAY_DEFAULTS } from "./validation";

/**
 * Gallery read-model tests.
 *
 * The important boundary here is hidden-vs-public: a piece the console
 * has hidden, or a category it has switched off, must not reach the
 * public view — including at the piece's own URL. Treat failures as
 * release blockers, same as the project visibility suite.
 */

const filePieces = vi.hoisted(() => [
  {
    slug: "reservoir-walk",
    title: "Reservoir walk",
    category: "digital" as const,
    year: "2026",
    media: "/gallery/reservoir-walk.svg",
    alt: "bands",
    aspect: "4/5",
    note: undefined,
    project: undefined,
    html: "<p>file</p>",
  },
  {
    slug: "density-study-03",
    title: "Density study 03",
    category: "experiments" as const,
    year: "2024",
    media: "/gallery/density-study-03.svg",
    alt: "grid",
    aspect: "3/2",
    note: undefined,
    project: undefined,
    html: "<p>file</p>",
  },
]);

vi.mock("@/server/content/loader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/content/loader")>();
  return {
    ...actual,
    getGalleryPieces: () => filePieces,
    renderMarkdown: (md: string) => `<p>${md}</p>`,
  };
});

const state = vi.hoisted(() => ({
  settings: null as unknown,
  rows: [] as unknown[],
}));

vi.mock("./store", () => ({
  readDisplaySettings: async () => state.settings,
  readItems: async () => state.rows,
}));

const { getGalleryAdminView, getPublicGalleryView, categoryLabel } = await import(
  "./service"
);

function row(over: Record<string, unknown>) {
  return {
    slug: "x",
    title: "X",
    category: "digital",
    year: "2026",
    note: null,
    mediaPath: "/m.svg",
    relatedProject: null,
    alt: null,
    aspect: null,
    body: null,
    origin: "file",
    hidden: false,
    featured: false,
    position: null,
    deletedAt: null,
    forSale: false,
    priceCents: null,
    currency: null,
    editionSize: null,
    soldAt: null,
    stripePriceId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

beforeEach(() => {
  state.settings = GALLERY_DISPLAY_DEFAULTS;
  state.rows = [];
});

describe("gallery read model", () => {
  it("returns file-backed pieces with default flags when no rows exist", async () => {
    const { pieces } = await getGalleryAdminView();
    expect(pieces.map((p) => p.slug)).toEqual([
      "reservoir-walk",
      "density-study-03",
    ]);
    expect(pieces.every((p) => p.origin === "file")).toBe(true);
    expect(pieces.every((p) => !p.hidden && !p.featured)).toBe(true);
  });

  it("sorts newest-first by default", async () => {
    const { pieces } = await getGalleryAdminView();
    expect(pieces[0].year).toBe("2026");
  });

  it("applies an overlay row to its file-backed piece", async () => {
    state.rows = [row({ slug: "reservoir-walk", hidden: true, featured: true })];
    const { pieces } = await getGalleryAdminView();
    const walk = pieces.find((p) => p.slug === "reservoir-walk")!;
    expect(walk.hidden).toBe(true);
    expect(walk.featured).toBe(true);
    // The file still owns the content.
    expect(walk.title).toBe("Reservoir walk");
    expect(walk.origin).toBe("file");
  });

  it("hides overlaid pieces from the public view but keeps them in the console", async () => {
    state.rows = [row({ slug: "reservoir-walk", hidden: true })];
    const admin = await getGalleryAdminView();
    const publicView = await getPublicGalleryView();
    expect(admin.pieces.map((p) => p.slug)).toContain("reservoir-walk");
    expect(publicView.pieces.map((p) => p.slug)).not.toContain("reservoir-walk");
  });

  it("surfaces console-authored rows as pieces", async () => {
    state.rows = [
      row({
        slug: "new-thing",
        title: "New thing",
        origin: "console",
        body: "hello",
        alt: "described",
      }),
    ];
    const { pieces } = await getGalleryAdminView();
    const created = pieces.find((p) => p.slug === "new-thing")!;
    expect(created.origin).toBe("console");
    expect(created.html).toBe("<p>hello</p>");
    expect(created.alt).toBe("described");
  });

  it("never lets a console row shadow a file-backed piece of the same slug", async () => {
    state.rows = [
      row({ slug: "reservoir-walk", title: "Impostor", origin: "console" }),
    ];
    const { pieces } = await getGalleryAdminView();
    const matches = pieces.filter((p) => p.slug === "reservoir-walk");
    expect(matches).toHaveLength(1);
    expect(matches[0].title).toBe("Reservoir walk");
  });

  it("drops pieces whose category has been switched off", async () => {
    // Categories are free text, so the defaults no longer enumerate
    // every one in use — the switched-off entry is stated outright.
    state.settings = {
      ...GALLERY_DISPLAY_DEFAULTS,
      categories: [
        { key: "digital", label: "Digital", visible: true },
        { key: "experiments", label: "Experiments", visible: false },
      ],
    };
    const { pieces } = await getPublicGalleryView();
    expect(pieces.map((p) => p.slug)).toEqual(["reservoir-walk"]);
  });

  it("pins featured pieces to the front when asked", async () => {
    state.rows = [row({ slug: "density-study-03", featured: true })];
    const { pieces } = await getGalleryAdminView();
    expect(pieces[0].slug).toBe("density-study-03");
  });

  it("leaves featured pieces in place when the pin is off", async () => {
    state.settings = { ...GALLERY_DISPLAY_DEFAULTS, featuredFirst: false };
    state.rows = [row({ slug: "density-study-03", featured: true })];
    const { pieces } = await getGalleryAdminView();
    expect(pieces[0].slug).toBe("reservoir-walk");
  });

  it("orders manually, with unplaced pieces behind placed ones", async () => {
    state.settings = {
      ...GALLERY_DISPLAY_DEFAULTS,
      sort: "manual",
      featuredFirst: false,
    };
    state.rows = [row({ slug: "density-study-03", position: 0 })];
    const { pieces } = await getGalleryAdminView();
    expect(pieces.map((p) => p.slug)).toEqual([
      "density-study-03",
      "reservoir-walk",
    ]);
  });

  it("falls back to the raw key for an unknown category label", async () => {
    expect(categoryLabel(GALLERY_DISPLAY_DEFAULTS, "digital")).toBe("Digital");
    expect(categoryLabel(GALLERY_DISPLAY_DEFAULTS, "nope")).toBe("nope");
  });
  it("moves a tombstoned file-backed piece out of the wall and into removed", async () => {
    state.rows = [row({ slug: "reservoir-walk", deletedAt: new Date() })];
    const { pieces, removed } = await getGalleryAdminView();
    expect(pieces.map((p) => p.slug)).not.toContain("reservoir-walk");
    expect(removed.map((p) => p.slug)).toEqual(["reservoir-walk"]);
  });

  it("keeps removed pieces off the public view entirely", async () => {
    state.rows = [row({ slug: "reservoir-walk", deletedAt: new Date() })];
    const { pieces, removed } = await getPublicGalleryView();
    expect(pieces.map((p) => p.slug)).toEqual(["density-study-03"]);
    // The public view never carries the removed pile at all.
    expect(removed).toEqual([]);
  });

  it("404s a removed piece at its own URL", async () => {
    state.rows = [row({ slug: "reservoir-walk", deletedAt: new Date() })];
    const { getPublicGalleryPiece } = await import("./service");
    await expect(getPublicGalleryPiece("reservoir-walk")).resolves.toBeUndefined();
  });

  it("restores a piece when the tombstone is cleared", async () => {
    state.rows = [row({ slug: "reservoir-walk", deletedAt: null, hidden: false })];
    const { pieces, removed } = await getGalleryAdminView();
    expect(pieces.map((p) => p.slug)).toContain("reservoir-walk");
    expect(removed).toEqual([]);
  });
});

describe("withUsedCategories", () => {
  it("adds categories a piece uses but settings has never seen", async () => {
    const { withUsedCategories } = await import("./service");
    const merged = withUsedCategories(GALLERY_DISPLAY_DEFAULTS, [
      { category: "linocut" },
      { category: "digital" },
    ]);
    const keys = merged.categories.map((c) => c.key);
    expect(keys).toContain("linocut");
    // Existing entries are not duplicated.
    expect(keys.filter((k) => k === "digital")).toHaveLength(1);
  });

  it("titles a discovered category and leaves it visible", async () => {
    const { withUsedCategories } = await import("./service");
    const merged = withUsedCategories(GALLERY_DISPLAY_DEFAULTS, [
      { category: "mixed-media" },
    ]);
    const found = merged.categories.find((c) => c.key === "mixed-media")!;
    // A piece must never vanish because its category was unconfigured.
    expect(found.visible).toBe(true);
    expect(found.label).toBe("Mixed Media");
  });

  it("preserves a configured label and visibility", async () => {
    const { withUsedCategories } = await import("./service");
    const settings = {
      ...GALLERY_DISPLAY_DEFAULTS,
      categories: [{ key: "canvas", label: "On Canvas", visible: false }],
    };
    const merged = withUsedCategories(settings, [{ category: "canvas" }]);
    expect(merged.categories).toEqual(settings.categories);
  });

  it("returns the same object when nothing is new", async () => {
    const { withUsedCategories } = await import("./service");
    const merged = withUsedCategories(GALLERY_DISPLAY_DEFAULTS, [
      { category: "digital" },
    ]);
    expect(merged).toBe(GALLERY_DISPLAY_DEFAULTS);
  });
});
